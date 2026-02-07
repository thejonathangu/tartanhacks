# 🎯 Location Relevance Ranking Feature

## Overview

Each extracted location now includes a **relevance score (1-10)** that appears as a numbered label on the map marker, similar to Yelp or Google Maps. This helps users quickly identify the most narratively important locations in a book.

---

## 📊 Relevance Scale

| Score   | Meaning                                          | Example                                |
| ------- | ------------------------------------------------ | -------------------------------------- |
| **10**  | Central to plot, major scene, protagonist's home | Gatsby's mansion in _The Great Gatsby_ |
| **7-9** | Significant location, important events           | Tom & Daisy's house, Plaza Hotel       |
| **4-6** | Supporting location, multiple mentions           | Wilson's garage, Valley of Ashes       |
| **1-3** | Minor mention, background detail                 | A passing street reference             |

---

## 🎨 Visual Design

### On the Map:

- **White number** displayed **inside** each circular marker
- **Bold font** for visibility
- **Always visible** (not dependent on zoom level)
- **Curated locations**: Colored circles (red/yellow/teal by era) + white number
- **Uploaded PDF locations**: Purple circles + white number

### Example Visual:

```
   ┌──────┐
   │  10  │  ← White number on colored/purple circle
   └──────┘
```

---

## 🔧 Technical Implementation

### Backend Changes

#### 1. PDF Processor (`pdf_processor.py`)

- Updated `LOCATION_EXTRACTION_PROMPT` to request relevance scoring
- Added scoring criteria to prompt
- Modified `locations_to_geojson()` to include `relevance` property (defaults to 5)

#### 2. Title Extractor (`title_extractor.py`)

- Updated `TITLE_EXTRACTION_PROMPT` with same relevance criteria
- Ensures consistency between PDF upload and title search pathways

### Frontend Changes

#### MapComponent.jsx

**New Layers Added:**

1. `literary-relevance` - Shows numbers on curated locations
2. `uploaded-relevance` - Shows numbers on user-uploaded locations

**Layer Stack (bottom to top):**

```
1. literary-glow (faint halo)
2. literary-markers (colored circles)
3. literary-relevance (WHITE NUMBERS) ← NEW
4. literary-labels (place names below)
```

**Filter Updates:**
All filter operations now include relevance layers:

- Era filtering
- Year range filtering
- Style switching

---

## 📝 AI Prompt Instructions

The AI is instructed to score based on **narrative importance**, not frequency:

> "Assign relevance scores based on narrative importance, not just frequency of mention"

### Scoring Criteria:

- **Plot centrality**: Does the climax happen here?
- **Character significance**: Is this the protagonist's home?
- **Emotional weight**: Are major decisions/revelations made here?
- **Narrative time**: How much of the story takes place here?

### Examples:

**The Great Gatsby:**

- Gatsby's mansion (West Egg) → **10** (central to entire plot)
- Plaza Hotel → **9** (climactic confrontation scene)
- Tom & Daisy's house → **8** (significant recurring location)
- Wilson's garage → **6** (murder scene but supporting)
- A random NYC street → **2** (passing mention)

**All the Light We Cannot See:**

- Saint-Malo → **10** (primary setting, siege, climax)
- Werner's orphanage → **8** (shapes his character)
- Von Rumpel's Paris apartment → **5** (antagonist's base)

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────┐
│  User uploads PDF or searches by title         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Dedalus AI (GPT-4o) analyzes text/recalls book│
│  • Identifies locations                        │
│  • Scores each location 1-10 for importance    │
│  • Returns JSON with "relevance" field         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend converts to GeoJSON                    │
│  • Each feature.properties.relevance = 1-10    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Frontend MapComponent renders                  │
│  • Circle marker (era-colored or purple)       │
│  • White number label overlaid on marker       │
│  • Title label below marker                    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 User Benefits

1. **Quick Scanning**: Users can immediately see which locations matter most
2. **Prioritization**: When zoomed out, focus on high-numbered locations first
3. **Narrative Context**: Understand the "weight" of each place in the story
4. **Comparison**: See how different locations rank within the same book
5. **Cross-Book Insights**: Compare relevance across different books in the same area

---

## 💡 Future Enhancements

- **Filter by relevance**: "Show only locations with relevance ≥ 7"
- **Size scaling**: Make circles larger for higher relevance scores
- **Heat mapping**: Gradient colors based on relevance
- **Sorting**: List locations in sidebar sorted by relevance
- **Analytics**: "This book has 3 high-importance locations"

---

## 🧪 Testing

### To Test Locally:

1. **Upload a PDF**:

   - Go to `http://localhost:3000`
   - Upload any literature PDF
   - Check that markers show white numbers 1-10

2. **Search by Title**:

   - Search for "The Great Gatsby"
   - Locations should appear with relevance scores
   - Gatsby's mansion should have 10, Plaza Hotel ~9

3. **Verify Filtering**:
   - Select an era filter
   - Relevance numbers should persist
   - Only relevant locations should show

---

## 📊 Example JSON Response

```json
{
  "book_title": "The Great Gatsby",
  "locations_found": 5,
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-73.6917, 40.8458]
        },
        "properties": {
          "id": "gatsby-mansion",
          "title": "Gatsby's Mansion — West Egg",
          "book": "The Great Gatsby",
          "era": "1920s",
          "year": 1922,
          "relevance": 10,
          "quote": "...a colossal affair by any standard...",
          "historical_context": "The fictional mansion symbolizes..."
        }
      }
    ]
  }
}
```

---

## 🚀 Deployment Notes

- **No database changes needed** (all in-memory/runtime)
- **No new API endpoints** (extends existing responses)
- **Backward compatible**: If AI doesn't provide relevance, defaults to 5
- **Works with existing data**: Old locations without relevance will show "5"

---

Built for **TartanHacks 2026** 🎉
