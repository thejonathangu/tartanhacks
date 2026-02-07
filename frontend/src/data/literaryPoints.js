/**
 * GeoJSON FeatureCollection — Literary & historical landmarks across eras.
 */
export const literaryGeoJSON = {
  type: "FeatureCollection",
  features: [
    // ── 1940s — The Joy Luck Club ────────────────────────────────
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
      geometry: { type: "Point", coordinates: [-122.4083, 37.7956] },
      properties: {
        id: "jlc-chinatown",
        title: "Chinatown — Grant Avenue",
        book: "The Joy Luck Club",
        era: "1940s",
        year: 1949,
        quote: "We are not those kind of people—we are better.",
        historical_context:
          "SF Chinatown is the oldest in North America, established in the 1840s during the Gold Rush.",
      },
    },
    // ── 1920s — Harlem Renaissance ───────────────────────────────
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.9442, 40.8116] },
      properties: {
        id: "hr-harlem",
        title: "Harlem — The Cotton Club",
        book: "Harlem Renaissance Anthology",
        era: "1920s",
        year: 1925,
        quote: "I, too, sing America. I am the darker brother.",
        historical_context:
          "The Cotton Club on 142nd St was the epicenter of the Harlem Renaissance music scene.",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.9498, 40.8146] },
      properties: {
        id: "hr-apollo",
        title: "The Apollo Theater",
        book: "Harlem Renaissance Anthology",
        era: "1920s",
        year: 1934,
        quote:
          "Life is for the living. Death is for the dead. Let life be like music. And death a note unsaid.",
        historical_context:
          "The Apollo opened to all races in 1934. Its Amateur Night launched Ella Fitzgerald, James Brown, and more.",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.9585, 40.8044] },
      properties: {
        id: "hr-cathedral",
        title: "Cathedral of St. John the Divine",
        book: "Harlem Renaissance Anthology",
        era: "1920s",
        year: 1925,
        quote:
          "Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.",
        historical_context:
          "Langston Hughes and Countee Cullen both attended events at this massive cathedral on the edge of Harlem.",
      },
    },
    // ── 1960s — Civil Rights ─────────────────────────────────────
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
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-86.8025, 33.5207] },
      properties: {
        id: "cr-birmingham",
        title: "Birmingham — 16th Street Baptist Church",
        book: "Civil Rights Landmarks",
        era: "1960s",
        year: 1963,
        quote: "Injustice anywhere is a threat to justice everywhere.",
        historical_context:
          "The 1963 bombing killed four young girls and galvanized national support for the Civil Rights Act.",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-77.0502, 38.8893] },
      properties: {
        id: "cr-lincoln-memorial",
        title: "Lincoln Memorial — 'I Have a Dream'",
        book: "Civil Rights Landmarks",
        era: "1960s",
        year: 1963,
        quote:
          "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin.",
        historical_context:
          "On August 28, 1963, over 250,000 people gathered for the March on Washington.",
      },
    },
  ],
};
