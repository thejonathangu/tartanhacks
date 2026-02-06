import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { literaryGeoJSON } from "../data/literaryPoints";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

/**
 * Reusable MapComponent
 *  - Renders GeoJSON markers
 *  - Flies to clicked marker
 *  - Shows interactive popup with deep context from ArchivistAgent
 */
export default function MapComponent({ onMarkerClick, popupContent }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-95.7, 37.0],
      zoom: 3.5,
    });

    map.on("load", () => {
      map.addSource("literary-points", {
        type: "geojson",
        data: literaryGeoJSON,
      });

      map.addLayer({
        id: "literary-markers",
        type: "circle",
        source: "literary-points",
        paint: {
          "circle-radius": 10,
          "circle-color": [
            "match",
            ["get", "era"],
            "1940s", "#e6b800",
            "1920s", "#ff6b6b",
            "1960s", "#4ecdc4",
            "#ffffff",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Click handler → triggers Archivist tool-call
      map.on("click", "literary-markers", (e) => {
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();

        map.flyTo({ center: coords, zoom: 12, speed: 1.2 });

        if (onMarkerClick) {
          onMarkerClick(feature);
        }
      });

      map.on("mouseenter", "literary-markers", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "literary-markers", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Show popup when popupContent changes (after Archivist responds)
  useEffect(() => {
    if (!popupContent || !mapRef.current) return;

    if (popupRef.current) popupRef.current.remove();

    const { geometry, properties, deepContext } = popupContent;
    const coords = geometry.coordinates;

    const html = `
      <div style="max-width:280px;font-family:system-ui,sans-serif;">
        <h3 style="margin:0 0 4px;">${properties.title}</h3>
        <p style="color:#aaa;margin:0 0 8px;font-size:12px;">${properties.book} · ${properties.year}</p>
        <blockquote style="border-left:3px solid #e6b800;padding-left:8px;margin:0 0 8px;font-style:italic;">
          "${properties.quote}"
        </blockquote>
        ${deepContext ? `
          <p style="font-size:13px;"><strong>Historical Context:</strong> ${deepContext.historical_context}</p>
          ${deepContext.dialect_note ? `<p style="font-size:12px;color:#4ecdc4;">🗣 ${deepContext.dialect_note}</p>` : ""}
        ` : `<p style="font-size:12px;color:#ff6b6b;">⚠ Could not reach ArchivistAgent</p>`}
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(mapRef.current);
  }, [popupContent]);

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "100%", position: "absolute" }}
    />
  );
}
