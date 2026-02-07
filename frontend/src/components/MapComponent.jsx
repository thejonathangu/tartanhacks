import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { literaryGeoJSON } from "../data/literaryPoints";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

/**
 * Reusable MapComponent
 *  - Renders GeoJSON markers
 *  - Flies to clicked marker
 *  - Shows interactive popup with deep context from ArchivistAgent
 */
const MAP_STYLES = {
  Dark: "mapbox://styles/mapbox/dark-v11",
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
};

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export default function MapComponent({ onMarkerClick, popupContent, uploadedGeoJSON }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const [mapError, setMapError] = useState(null);
  const [activeStyle, setActiveStyle] = useState("Satellite");
  const initialStyleRef = useRef(true);

  // Keep the callback ref in sync so the map click handler always calls the latest version
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Helper: add GeoJSON source + markers + click handlers to the map
  function addLiteraryLayers(m) {
    if (m.getSource("literary-points")) return; // already added
    m.addSource("literary-points", {
      type: "geojson",
      data: literaryGeoJSON,
    });

    m.addLayer({
      id: "literary-markers",
      type: "circle",
      source: "literary-points",
      paint: {
        "circle-radius": 10,
        "circle-color": [
          "match",
          ["get", "era"],
          "1940s",
          "#e6b800",
          "1920s",
          "#ff6b6b",
          "1960s",
          "#4ecdc4",
          "#ffffff",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Click handler → triggers Archivist tool-call
    m.on("click", "literary-markers", (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates.slice();
      m.flyTo({ center: coords, zoom: 12, speed: 1.2 });
      if (onMarkerClickRef.current) {
        onMarkerClickRef.current(feature);
      }
    });

    m.on("mouseenter", "literary-markers", () => {
      m.getCanvas().style.cursor = "pointer";
    });
    m.on("mouseleave", "literary-markers", () => {
      m.getCanvas().style.cursor = "";
    });
  }

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;

    // Clean up any stale ref (React 18 StrictMode double-invokes effects)
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[activeStyle],
        center: [-95.7, 37.0],
        zoom: 3.5,
      });

      // Add zoom +/- buttons and compass
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      // Add fullscreen toggle
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      // Add geolocation button
      map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false }), "top-right");
      // Add scale bar
      map.addControl(new mapboxgl.ScaleControl(), "bottom-left");

      map.on("load", () => {
        addLiteraryLayers(map);
      });

      // Re-add layers after a style switch (Mapbox removes everything on setStyle)
      map.on("style.load", () => {
        addLiteraryLayers(map);
      });

      map.on("error", (e) => {
        console.error("Mapbox error:", e.error);
        setMapError(e.error?.message || "Map failed to load");
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError(err.message);
    }
  }, []);

  // Switch map style when activeStyle changes (skip initial render — map already has the right style)
  useEffect(() => {
    if (initialStyleRef.current) {
      initialStyleRef.current = false;
      return;
    }
    if (!mapRef.current) return;
    mapRef.current.setStyle(MAP_STYLES[activeStyle]);
  }, [activeStyle]);

  // Add uploaded book locations to the map
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !uploadedGeoJSON) return;

    const addUploadedLayer = () => {
      // Remove old uploaded layers if they exist
      if (m.getLayer("uploaded-markers")) m.removeLayer("uploaded-markers");
      if (m.getLayer("uploaded-labels")) m.removeLayer("uploaded-labels");
      if (m.getSource("uploaded-points")) m.removeSource("uploaded-points");

      m.addSource("uploaded-points", {
        type: "geojson",
        data: uploadedGeoJSON,
      });

      m.addLayer({
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

      m.addLayer({
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

      // Click handler for uploaded markers
      m.on("click", "uploaded-markers", (e) => {
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        m.flyTo({ center: coords, zoom: 12, speed: 1.2 });
        if (onMarkerClickRef.current) {
          onMarkerClickRef.current(feature);
        }
      });

      m.on("mouseenter", "uploaded-markers", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "uploaded-markers", () => {
        m.getCanvas().style.cursor = "";
      });

      // Fit map to show all uploaded points
      if (uploadedGeoJSON.features.length > 0) {
        const bounds = uploadedGeoJSON.features.reduce((b, f) => {
          return b.extend(f.geometry.coordinates);
        }, new mapboxgl.LngLatBounds(
          uploadedGeoJSON.features[0].geometry.coordinates,
          uploadedGeoJSON.features[0].geometry.coordinates
        ));
        m.fitBounds(bounds, { padding: 80, maxZoom: 12 });
      }
    };

    if (m.isStyleLoaded()) {
      addUploadedLayer();
    } else {
      m.on("style.load", addUploadedLayer);
    }
  }, [uploadedGeoJSON]);

  // Show popup when popupContent changes (after Archivist responds)
  useEffect(() => {
    if (!popupContent || !mapRef.current) return;

    if (popupRef.current) popupRef.current.remove();

    const { geometry, properties, deepContext } = popupContent;
    const coords = geometry.coordinates;
    const [lng, lat] = coords;

    // Era-based accent colors
    const accentColor =
      properties.era === "1940s"
        ? "#e6b800"
        : properties.era === "1920s"
          ? "#ff6b6b"
          : "#4ecdc4";

    // Google Street View static image
    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${googleApiKey}`;

    const html = `
      <div style="max-width:320px;font-family:system-ui,sans-serif;color:#1a1a2e;">
        <div style="position:relative;margin:-10px -10px 8px -10px;overflow:hidden;border-radius:8px 8px 0 0;">
          <img src="${streetViewUrl}" alt="Street View"
            style="width:100%;height:140px;object-fit:cover;display:block;"
            onerror="this.style.display='none'" />
          <div style="position:absolute;bottom:0;left:0;right:0;padding:6px 10px;
            background:linear-gradient(transparent,rgba(0,0,0,0.7));color:#fff;font-size:11px;">
            📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
        <h3 style="margin:0 0 4px;color:#1a1a2e;font-size:15px;">${properties.title}</h3>
        <p style="color:#666;margin:0 0 8px;font-size:12px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
            background:${accentColor};margin-right:4px;vertical-align:middle;"></span>
          ${properties.book} · ${properties.year}
        </p>
        <blockquote style="border-left:3px solid ${accentColor};padding-left:8px;margin:0 0 10px;
          font-style:italic;font-size:13px;color:#333;line-height:1.5;">
          "${properties.quote}"
        </blockquote>
        ${
          deepContext
            ? `
          <div style="background:#f5f5f5;border-radius:6px;padding:8px 10px;margin:0 0 6px;">
            <p style="font-size:12px;margin:0 0 4px;"><strong>🏛 Historical Context:</strong></p>
            <p style="font-size:12px;margin:0;color:#444;line-height:1.4;">${deepContext.historical_context}</p>
          </div>
          ${
            deepContext.ai_insight
              ? `
            <div style="background:#1a1a2e;border-radius:6px;padding:8px 10px;margin:0 0 6px;">
              <p style="font-size:11px;margin:0 0 4px;color:#e6b800;">✨ AI Deep Dive (via Dedalus)</p>
              <p style="font-size:12px;margin:0;color:#ddd;line-height:1.4;">${deepContext.ai_insight}</p>
            </div>
          `
              : ""
          }
          ${
            deepContext.dialect_note
              ? `
            <p style="font-size:12px;color:${accentColor};margin:0;">🗣 ${deepContext.dialect_note}</p>
          `
              : ""
          }
        `
            : `<p style="font-size:12px;color:#ff6b6b;">⚠ Could not reach ArchivistAgent</p>`
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

  // Show a helpful message if no token
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
        <h2 style={{ margin: 0 }}>Living Literary Map</h2>
        <p style={{ color: "#aaa", maxWidth: "400px", textAlign: "center", lineHeight: 1.6 }}>
          Mapbox token not set. Add your token to{" "}
          <code style={{ color: "#e6b800" }}>frontend/.env</code>:
        </p>
        <pre style={{ background: "#1a1a2e", padding: "12px 20px", borderRadius: "8px", color: "#4ecdc4", fontSize: "13px" }}>
          {`VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here`}
        </pre>
        <p style={{ color: "#666", fontSize: "12px" }}>Then restart the dev server.</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#0d0d0d", color: "#fff", flexDirection: "column", gap: "12px" }}>
        <h2>Map Error</h2>
        <p style={{ color: "#ff6b6b" }}>{mapError}</p>
        <p style={{ color: "#888", fontSize: "13px" }}>Check the browser console for details.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%" }}
      />
      {/* Style switcher */}
      <div style={{
        position: "absolute", top: "10px", left: "10px", zIndex: 10,
        display: "flex", gap: "4px", background: "rgba(26,26,46,0.85)",
        borderRadius: "8px", padding: "4px", backdropFilter: "blur(8px)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        {Object.keys(MAP_STYLES).map((name) => (
          <button
            key={name}
            onClick={() => setActiveStyle(name)}
            style={{
              background: activeStyle === name ? "#4ecdc4" : "transparent",
              color: activeStyle === name ? "#1a1a2e" : "#fff",
              border: "none", borderRadius: "6px",
              padding: "6px 12px", cursor: "pointer",
              fontSize: "12px", fontWeight: activeStyle === name ? 700 : 400,
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {name === "Satellite" ? "🛰️ " : name === "Dark" ? "🌙 " : name === "Streets" ? "🛣️ " : "☀️ "}
            {name}
          </button>
        ))}
      </div>
      {/* Reset view button */}
      <button
        onClick={() => {
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [-95.7, 37.0], zoom: 3.5, speed: 1.2 });
          }
          if (popupRef.current) popupRef.current.remove();
        }}
        style={{
          position: "absolute", bottom: "30px", right: "10px", zIndex: 10,
          background: "#1a1a2e", color: "#fff", border: "1px solid #444",
          borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
          fontSize: "13px", fontFamily: "system-ui, sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        🗺️ Reset View
      </button>
    </div>
  );
}
