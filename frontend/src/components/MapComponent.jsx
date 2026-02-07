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

export default function MapComponent({ onMarkerClick, popupContent, filterEra, stylistOverrides }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const filterEraRef = useRef(filterEra);
  const [activeStyle, setActiveStyle] = useState("Satellite");

  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { filterEraRef.current = filterEra; }, [filterEra]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", height: "100%", background: "#0d0d0d", color: "#fff",
        fontFamily: "system-ui, sans-serif", flexDirection: "column", gap: "16px",
      }}>
        <h1 style={{ fontSize: "48px", margin: 0 }}>🗺️</h1>
        <h2 style={{ margin: 0 }}>Mapbox token not set</h2>
        <pre style={{ background: "#1a1a2e", padding: "12px 20px", borderRadius: "8px", color: "#4ecdc4", fontSize: "13px" }}>
          {`VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here`}
        </pre>
      </div>
    );
  }

  mapboxgl.accessToken = MAPBOX_TOKEN;

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
            "match", ["get", "era"],
            "1940s", "#e6b800", "1920s", "#ff6b6b", "1960s", "#4ecdc4", "#888",
          ],
          "line-width": 2,
          "line-opacity": 0.4,
          "line-dasharray": [2, 3],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      // ── Point layers ──
      m.addSource("literary-points", { type: "geojson", data: literaryGeoJSON });

      m.addLayer({
        id: "literary-glow",
        type: "circle",
        source: "literary-points",
        paint: {
          "circle-radius": 20,
          "circle-color": [
            "match", ["get", "era"],
            "1940s", "#e6b800", "1920s", "#ff6b6b", "1960s", "#4ecdc4", "#fff",
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
            "match", ["get", "era"],
            "1940s", "#e6b800", "1920s", "#ff6b6b", "1960s", "#4ecdc4", "#fff",
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
      m.on("mouseenter", "literary-markers", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "literary-markers", () => { m.getCanvas().style.cursor = ""; });
    }

    map.on("load", () => addAllLayers(map));
    map.on("style.load", () => {
      addAllLayers(map);
      const era = filterEraRef.current;
      const filter = era ? ["==", ["get", "era"], era] : null;
      ["literary-markers", "literary-glow", "literary-labels", "route-lines"].forEach((id) => {
        if (map.getLayer(id)) map.setFilter(id, filter);
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // ── Style switching ──
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(MAP_STYLES[activeStyle]);
  }, [activeStyle]);

  // ── Era filtering ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const filter = filterEra ? ["==", ["get", "era"], filterEra] : null;
    ["literary-markers", "literary-glow", "literary-labels", "route-lines"].forEach((id) => {
      if (map.getLayer(id)) map.setFilter(id, filter);
    });

    // Fly to era bounding box
    if (filterEra) {
      const eraFeatures = literaryGeoJSON.features.filter(
        (f) => f.properties.era === filterEra
      );
      if (eraFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        eraFeatures.forEach((f) => bounds.extend(f.geometry.coordinates));
        map.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 1500 });
      }
    }
  }, [filterEra]);

  // ── Apply StylistAgent overrides ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stylistOverrides || !map.isStyleLoaded()) return;

    const po = stylistOverrides.paint_overrides;
    if (!po) return;

    if (map.getLayer("literary-markers")) {
      if (po["circle-color"]) map.setPaintProperty("literary-markers", "circle-color", po["circle-color"]);
      if (po["circle-radius"]) map.setPaintProperty("literary-markers", "circle-radius", po["circle-radius"]);
      if (po["circle-stroke-color"]) map.setPaintProperty("literary-markers", "circle-stroke-color", po["circle-stroke-color"]);
      if (po["circle-stroke-width"]) map.setPaintProperty("literary-markers", "circle-stroke-width", po["circle-stroke-width"]);
    }
  }, [stylistOverrides]);

  // ── Popup rendering ──
  useEffect(() => {
    if (!popupContent || !mapRef.current) return;
    if (popupRef.current) popupRef.current.remove();

    const { geometry, properties, deepContext } = popupContent;
    const coords = geometry.coordinates;
    const [lng, lat] = coords;

    const accentColor = properties.era === "1940s" ? "#e6b800"
      : properties.era === "1920s" ? "#ff6b6b" : "#4ecdc4";

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
        ${deepContext?.historical_context ? `
          <p style="font-size:11px;color:#555;margin:0;line-height:1.4;">
            <strong style="color:${accentColor};">🏛</strong> ${deepContext.historical_context}
          </p>
        ` : `<p style="font-size:11px;color:#999;margin:0;">Click explores this via MCP agents →</p>`}
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ closeOnClick: true, maxWidth: "340px" })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(mapRef.current);
  }, [popupContent]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Style switcher */}
      <div style={{
        position: "absolute", top: "10px", right: "50px", zIndex: 10,
        display: "flex", gap: "3px", background: "rgba(13,15,26,0.9)",
        borderRadius: "8px", padding: "3px", backdropFilter: "blur(8px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>
        {Object.keys(MAP_STYLES).map((name) => (
          <button key={name} onClick={() => setActiveStyle(name)} style={{
            background: activeStyle === name ? "#4ecdc4" : "transparent",
            color: activeStyle === name ? "#000" : "#aaa",
            border: "none", borderRadius: "5px",
            padding: "5px 10px", cursor: "pointer",
            fontSize: "11px", fontWeight: activeStyle === name ? 700 : 400,
            fontFamily: "system-ui, sans-serif", transition: "all 0.2s",
          }}>
            {name}
          </button>
        ))}
      </div>

      {/* Reset view */}
      <button
        onClick={() => {
          if (mapRef.current) mapRef.current.flyTo({ center: [-95.7, 37.0], zoom: 3.5, speed: 1.2, pitch: 15 });
          if (popupRef.current) popupRef.current.remove();
        }}
        style={{
          position: "absolute", bottom: "30px", right: "10px", zIndex: 10,
          background: "rgba(13,15,26,0.9)", color: "#fff",
          border: "1px solid #2a2d3e", borderRadius: "6px",
          padding: "8px 14px", cursor: "pointer",
          fontSize: "12px", fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        🗺️ Reset
      </button>
    </div>
  );
}
