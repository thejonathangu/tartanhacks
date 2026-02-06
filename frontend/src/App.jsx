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
    const { id } = feature.properties;
    try {
      const deepContext = await fetchArchivistContext(id);
      setPopupContent({ ...feature, deepContext });
    } catch (err) {
      console.error("ArchivistAgent call failed:", err);
      setPopupContent({ ...feature, deepContext: null });
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
