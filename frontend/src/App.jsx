import React, { useState } from "react";
import MapComponent from "./components/MapComponent";
import { fetchArchivistContext } from "./api/archivistClient";

export default function App() {
  const [popupContent, setPopupContent] = useState(null);

  /**
   * Handoff logic: clicking a marker triggers a tool-call to the
   * ArchivistAgent, which fetches deeper literary/historical context
   * before we display anything to the user.
   */
  const handleMarkerClick = async (feature) => {
    // Extract plain data from the Mapbox feature (Mapbox feature objects
    // don't spread cleanly, so we pull geometry & properties explicitly).
    const geometry = feature.geometry ? { type: feature.geometry.type, coordinates: feature.geometry.coordinates.slice() } : null;
    const properties = { ...feature.properties };
    const { id } = properties;

    try {
      const deepContext = await fetchArchivistContext(id);
      setPopupContent({ geometry, properties, deepContext });
    } catch (err) {
      console.error("ArchivistAgent call failed:", err);
      setPopupContent({ geometry, properties, deepContext: null });
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MapComponent
        onMarkerClick={handleMarkerClick}
        popupContent={popupContent}
      />
    </div>
  );
}
