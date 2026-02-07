import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { literaryGeoJSON } from "../data/literaryPoints";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

const MAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
};

// Group features by era to draw connecting route lines
function buildRouteLines() {
  const byEra = {};
  for (const f of literaryGeoJSON.features) {
    const era = f.properties.era;
    if (!byEra[era]) byEra[era] = [];
    byEra[era].push(f.geometry.coordinates);
  }
  return {
    type: "FeatureCollection",
    features: Object.entries(byEra)
      .filter(([, coords]) => coords.length >= 2)
      .map(([era, coords]) => ({
        type: "Feature",
        properties: { era },
        geometry: { type: "LineString", coordinates: coords },
      })),
  };
}

const routeGeoJSON = buildRouteLines();

export default function MapComponent({
  onMarkerClick,
  popupContent,
  filterEra,
  yearRange,
  stylistOverrides,
  uploadedBookLocations,
  heatmapOn,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const filterEraRef = useRef(filterEra);
  const yearRangeRef = useRef(yearRange);
  const styleLoadedRef = useRef(false);
  const [activeStyle, setActiveStyle] = useState("Satellite");

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);
  useEffect(() => {
    filterEraRef.current = filterEra;
  }, [filterEra]);
  useEffect(() => {
    yearRangeRef.current = yearRange;
  }, [yearRange]);

  if (MAPBOX_TOKEN) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }

  // ── Initialize map ──────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.Satellite,
      center: [-95.7, 37.0],
      zoom: 3.5,
      pitch: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl(), "bottom-right");

    function addAllLayers(m) {
      if (m.getSource("literary-points")) return;

      // ── Route lines ──
      m.addSource("route-lines", { type: "geojson", data: routeGeoJSON });
      m.addLayer({
        id: "route-lines",
        type: "line",
        source: "route-lines",
        paint: {
          "line-color": [
            "match",
            ["get", "era"],
            "1940s",
            "#e6b800",
            "1920s",
            "#ff6b6b",
            "1960s",
            "#4ecdc4",
            "#888",
          ],
          "line-width": 2,
          "line-opacity": 0.4,
          "line-dasharray": [2, 3],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      // ── Point layers ──
      m.addSource("literary-points", {
        type: "geojson",
        data: literaryGeoJSON,
      });

      m.addLayer({
        id: "literary-glow",
        type: "circle",
        source: "literary-points",
        paint: {
          "circle-radius": 20,
          "circle-color": [
            "match",
            ["get", "era"],
            "1940s",
            "#e6b800",
            "1920s",
            "#ff6b6b",
            "1960s",
            "#4ecdc4",
            "#fff",
          ],
          "circle-opacity": 0.12,
          "circle-stroke-width": 0,
        },
      });

      m.addLayer({
        id: "literary-markers",
        type: "circle",
        source: "literary-points",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "era"],
            "1940s",
            "#e6b800",
            "1920s",
            "#ff6b6b",
            "1960s",
            "#4ecdc4",
            "#fff",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      m.addLayer({
        id: "literary-labels",
        type: "symbol",
        source: "literary-points",
        layout: {
          "text-field": ["get", "title"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-max-width": 12,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.5,
        },
      });

      m.on("click", "literary-markers", (e) => {
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        m.flyTo({ center: coords, zoom: 14, speed: 1.2, pitch: 45 });
        if (onMarkerClickRef.current) onMarkerClickRef.current(feature);
      });
      m.on("mouseenter", "literary-markers", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "literary-markers", () => {
        m.getCanvas().style.cursor = "";
      });
    }

    map.on("load", () => addAllLayers(map));
    map.on("style.load", () => {
      styleLoadedRef.current = true;
      addAllLayers(map);
      // Apply year range filter if active — only to curated layers
      // (uploaded layers are managed by their own effect)
      const yr = yearRangeRef.current;
      const era = filterEraRef.current;
      let filter = null;
      if (yr) {
        filter = [
          "all",
          [">=", ["get", "year"], yr[0]],
          ["<=", ["get", "year"], yr[1]],
        ];
      } else if (era) {
        filter = ["==", ["get", "era"], era];
      }
      [
        "literary-markers",
        "literary-glow",
        "literary-labels",
        "route-lines",
      ].forEach((id) => {
        if (map.getLayer(id)) map.setFilter(id, filter);
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // ── Style switching ──
  useEffect(() => {
    if (!mapRef.current) return;
    styleLoadedRef.current = false;
    mapRef.current.setStyle(MAP_STYLES[activeStyle]);
  }, [activeStyle]);

  // ── Year range / Era filtering ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current || !map.isStyleLoaded()) return;

    let filter = null;
    if (yearRange) {
      filter = [
        "all",
        [">=", ["get", "year"], yearRange[0]],
        ["<=", ["get", "year"], yearRange[1]],
      ];
    } else if (filterEra) {
      filter = ["==", ["get", "era"], filterEra];
    }

    // Apply to curated layers
    [
      "literary-markers",
      "literary-glow",
      "literary-labels",
      "route-lines",
    ].forEach((id) => {
      if (map.getLayer(id)) map.setFilter(id, filter);
    });

    // Apply to uploaded layers too
    ["uploaded-markers", "uploaded-labels"].forEach((id) => {
      if (map.getLayer(id)) map.setFilter(id, filter);
    });

    // Fly to filtered features bounding box
    if (yearRange || filterEra) {
      const uploadedFeatures =
        uploadedBookLocations && uploadedBookLocations.features
          ? uploadedBookLocations.features
          : [];
      const allFeatures = [...literaryGeoJSON.features, ...uploadedFeatures];
      const matchedFeatures = allFeatures.filter((f) => {
        if (yearRange) {
          const y = f.properties?.year;
          return y != null && y >= yearRange[0] && y <= yearRange[1];
        }
        return f.properties?.era === filterEra;
      });
      if (matchedFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        matchedFeatures.forEach((f) => {
          const coords = f.geometry?.coordinates;
          if (coords && coords[0] != null && coords[1] != null)
            bounds.extend(coords);
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 1500 });
        }
      }
    }
  }, [yearRange, filterEra]); // eslint-disable-line react-hooks/exhaustive-deps



  // ── Heatmap layer toggle ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current || !map.isStyleLoaded()) return;

    if (heatmapOn) {
      // Combine curated + uploaded features for heatmap
      const uploadedFeats = uploadedBookLocations?.features || [];
      const combinedGeoJSON = {
        type: "FeatureCollection",
        features: [...literaryGeoJSON.features, ...uploadedFeats],
      };
      if (!map.getSource("heatmap-source")) {
        map.addSource("heatmap-source", { type: "geojson", data: combinedGeoJSON });
      } else {
        map.getSource("heatmap-source").setData(combinedGeoJSON);
      }
      if (!map.getLayer("literary-heatmap")) {
        map.addLayer(
          {
            id: "literary-heatmap",
            type: "heatmap",
            source: "heatmap-source",
            paint: {
              "heatmap-weight": 1,
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 30, 9, 60],
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,0,0)",
                0.2,
                "#2c1654",
                0.4,
                "#4ecdc4",
                0.6,
                "#e6b800",
                0.8,
                "#ff6b6b",
                1,
                "#ffffff",
              ],
              "heatmap-opacity": 0.7,
            },
          },
          "literary-glow",
        ); // insert below marker layers
      }
    } else {
      if (map.getLayer("literary-heatmap")) map.removeLayer("literary-heatmap");
      if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");
    }
  }, [heatmapOn, uploadedBookLocations]);

  // ── Cross-book connection lines ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current || !map.isStyleLoaded()) return;

    // Combine all features
    const uploadedFeats = uploadedBookLocations?.features || [];
    const allFeats = [...literaryGeoJSON.features, ...uploadedFeats];

    // Find pairs of features from different books within ~0.5° (roughly same city)
    const THRESHOLD = 0.5;
    const connections = [];
    for (let i = 0; i < allFeats.length; i++) {
      for (let j = i + 1; j < allFeats.length; j++) {
        const a = allFeats[i],
          b = allFeats[j];
        const bookA = a.properties?.book,
          bookB = b.properties?.book;
        if (!bookA || !bookB || bookA === bookB) continue;
        const [lngA, latA] = a.geometry?.coordinates || [];
        const [lngB, latB] = b.geometry?.coordinates || [];
        if (lngA == null || lngB == null) continue;
        const dist = Math.sqrt((lngA - lngB) ** 2 + (latA - latB) ** 2);
        if (dist < THRESHOLD && dist > 0.001) {
          connections.push({
            type: "Feature",
            properties: { bookA, bookB, label: `${bookA} ↔ ${bookB}` },
            geometry: {
              type: "LineString",
              coordinates: [
                [lngA, latA],
                [lngB, latB],
              ],
            },
          });
        }
      }
    }

    const geojson = { type: "FeatureCollection", features: connections };

    if (connections.length > 0) {
      if (!map.getSource("cross-book-lines")) {
        map.addSource("cross-book-lines", { type: "geojson", data: geojson });
        map.addLayer({
          id: "cross-book-connections",
          type: "line",
          source: "cross-book-lines",
          paint: {
            "line-color": "#b388ff",
            "line-width": 2,
            "line-dasharray": [4, 4],
            "line-opacity": 0.6,
          },
        });
        // Label at midpoint
        map.addLayer({
          id: "cross-book-labels",
          type: "symbol",
          source: "cross-book-lines",
          layout: {
            "symbol-placement": "line-center",
            "text-field": "📚 Literary Intersection",
            "text-size": 10,
            "text-offset": [0, -1],
          },
          paint: {
            "text-color": "#b388ff",
            "text-halo-color": "#000",
            "text-halo-width": 1,
          },
        });
      } else {
        map.getSource("cross-book-lines").setData(geojson);
      }
    } else {
      if (map.getLayer("cross-book-labels"))
        map.removeLayer("cross-book-labels");
      if (map.getLayer("cross-book-connections"))
        map.removeLayer("cross-book-connections");
      if (map.getSource("cross-book-lines"))
        map.removeSource("cross-book-lines");
    }
  }, [uploadedBookLocations]);

  // ── Uploaded book locations from PDF ──
  const uploadedLocRef = useRef(uploadedBookLocations);
  uploadedLocRef.current = uploadedBookLocations;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !uploadedBookLocations) return;

    let cancelled = false;

    function doAdd() {
      if (cancelled) return;
      const data = uploadedLocRef.current;
      if (!data) return;

      // Remove old layers/source if they exist
      try { if (map.getLayer("uploaded-markers")) map.removeLayer("uploaded-markers"); } catch (_) {}
      try { if (map.getLayer("uploaded-labels")) map.removeLayer("uploaded-labels"); } catch (_) {}
      try { if (map.getSource("uploaded-points")) map.removeSource("uploaded-points"); } catch (_) {}

      map.addSource("uploaded-points", { type: "geojson", data });

      map.addLayer({
        id: "uploaded-markers",
        type: "circle",
        source: "uploaded-points",
        paint: {
          "circle-radius": 10,
          "circle-color": "#b388ff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "uploaded-labels",
        type: "symbol",
        source: "uploaded-points",
        layout: {
          "text-field": ["get", "title"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-max-width": 12,
        },
        paint: {
          "text-color": "#b388ff",
          "text-halo-color": "#000",
          "text-halo-width": 1,
        },
      });

      // Click handler
      map.on("click", "uploaded-markers", onClickUploaded);
      map.on("mouseenter", "uploaded-markers", onEnterUploaded);
      map.on("mouseleave", "uploaded-markers", onLeaveUploaded);

      // Fit bounds
      if (data.features && data.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        data.features.forEach((f) => {
          if (f.geometry?.coordinates) bounds.extend(f.geometry.coordinates);
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 12 });
        }
      }
    }

    function onClickUploaded(e) {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates.slice();
      map.flyTo({ center: coords, zoom: 14, speed: 1.2, pitch: 45 });
      if (onMarkerClickRef.current) onMarkerClickRef.current(feature);
    }
    function onEnterUploaded() { map.getCanvas().style.cursor = "pointer"; }
    function onLeaveUploaded() { map.getCanvas().style.cursor = ""; }

    // Robust approach: try immediately, retry every 200ms up to 3s,
    // and also listen for style.load
    function tryAdd() {
      if (cancelled) return;
      try {
        doAdd();
      } catch (err) {
        // Style not ready yet — retry shortly
        setTimeout(tryAdd, 200);
      }
    }

    tryAdd();
    map.on("style.load", tryAdd);

    return () => {
      cancelled = true;
      map.off("style.load", tryAdd);
      try { map.off("click", "uploaded-markers", onClickUploaded); } catch (_) {}
      try { map.off("mouseenter", "uploaded-markers", onEnterUploaded); } catch (_) {}
      try { map.off("mouseleave", "uploaded-markers", onLeaveUploaded); } catch (_) {}
    };
  }, [uploadedBookLocations]);

  // ── Popup rendering ──
  useEffect(() => {
    if (!popupContent || !mapRef.current) return;
    if (popupRef.current) popupRef.current.remove();

    const { geometry, properties, deepContext } = popupContent;
    const coords = geometry.coordinates;
    const [lng, lat] = coords;

    const accentColor =
      properties.era === "1940s"
        ? "#e6b800"
        : properties.era === "1920s"
          ? "#ff6b6b"
          : "#4ecdc4";

    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${GOOGLE_API_KEY}`;

    const html = `
      <div style="max-width:320px;font-family:system-ui,sans-serif;color:#1a1a2e;">
        <div style="position:relative;margin:-10px -10px 8px -10px;overflow:hidden;border-radius:8px 8px 0 0;">
          <img src="${streetViewUrl}" alt="Street View"
            style="width:100%;height:160px;object-fit:cover;display:block;"
            onerror="this.parentElement.style.display='none'" />
          <div style="position:absolute;top:8px;right:8px;background:${accentColor};
            padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;color:#000;">
            ${properties.era}
          </div>
        </div>
        <h3 style="margin:0 0 4px;font-size:14px;">${properties.title}</h3>
        <p style="color:#888;margin:0 0 8px;font-size:11px;">${properties.book} · ${properties.year}</p>
        <blockquote style="border-left:3px solid ${accentColor};padding-left:8px;margin:0 0 8px;
          font-style:italic;font-size:12px;color:#444;line-height:1.5;">
          "${properties.quote}"
        </blockquote>
        ${
          deepContext?.historical_context
            ? `
          <p style="font-size:11px;color:#555;margin:0;line-height:1.4;">
            <strong style="color:${accentColor};">🏛</strong> ${deepContext.historical_context}
          </p>
        `
            : `<p style="font-size:11px;color:#999;margin:0;">Click explores this via MCP agents →</p>`
        }
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({
      closeOnClick: true,
      maxWidth: "340px",
    })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(mapRef.current);
  }, [popupContent]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0d0d0d",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "48px", margin: 0 }}>🗺️</h1>
        <h2 style={{ margin: 0 }}>Mapbox token not set</h2>
        <pre
          style={{
            background: "#1a1a2e",
            padding: "12px 20px",
            borderRadius: "8px",
            color: "#4ecdc4",
            fontSize: "13px",
          }}
        >
          {`VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here`}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Style switcher */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "50px",
          zIndex: 10,
          display: "flex",
          gap: "3px",
          background: "rgba(13,15,26,0.9)",
          borderRadius: "8px",
          padding: "3px",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {Object.keys(MAP_STYLES).map((name) => (
          <button
            key={name}
            onClick={() => setActiveStyle(name)}
            style={{
              background: activeStyle === name ? "#4ecdc4" : "transparent",
              color: activeStyle === name ? "#000" : "#aaa",
              border: "none",
              borderRadius: "5px",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: activeStyle === name ? 700 : 400,
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Reset view */}
      <button
        onClick={() => {
          if (mapRef.current)
            mapRef.current.flyTo({
              center: [-95.7, 37.0],
              zoom: 3.5,
              speed: 1.2,
              pitch: 15,
            });
          if (popupRef.current) popupRef.current.remove();
        }}
        style={{
          position: "absolute",
          bottom: "30px",
          right: "10px",
          zIndex: 10,
          background: "rgba(13,15,26,0.9)",
          color: "#fff",
          border: "1px solid #2a2d3e",
          borderRadius: "6px",
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        🗺️ Reset
      </button>
    </div>
  );
}
