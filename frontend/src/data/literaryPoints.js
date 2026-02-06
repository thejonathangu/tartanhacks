/**
 * Sample GeoJSON FeatureCollection — 3 literary landmarks (one per book/era).
 */
export const literaryGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.4194, 37.7749] },
      properties: {
        id: "jlc-san-francisco",
        title: "San Francisco — Immigration Landing",
        book: "The Joy Luck Club",
        era: "1940s",
        year: 1949,
        quote:
          "I wanted my children to have the best combination: American circumstances and Chinese character.",
        historical_context:
          "Post-WWII wave of Chinese immigration through Angel Island and San Francisco.",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.9442, 40.8116] },
      properties: {
        id: "hr-harlem",
        title: "Harlem — The Cotton Club",
        book: "Harlem Renaissance Anthology",
        era: "1920s",
        year: 1925,
        quote:
          "I, too, sing America. I am the darker brother.",
        historical_context:
          "The Cotton Club on 142nd St was the epicenter of the Harlem Renaissance music scene.",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-86.3077, 32.3792] },
      properties: {
        id: "cr-montgomery",
        title: "Montgomery — Bus Boycott",
        book: "Civil Rights Landmarks",
        era: "1960s",
        year: 1955,
        quote:
          "People always say that I didn't give up my seat because I was tired, but that isn't true. I was tired of giving in.",
        historical_context:
          "Rosa Parks' arrest on Dec 1, 1955 sparked the 381-day Montgomery Bus Boycott.",
      },
    },
  ],
};
