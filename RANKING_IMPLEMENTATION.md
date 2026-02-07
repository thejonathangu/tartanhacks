# Location Ranking Implementation

## Overview

This document describes the implementation of rank-based ordering for extracted book locations in the Living Literary Map project.

## What Changed

### Backend Changes

#### 1. `pdf_processor.py`

- Modified `locations_to_geojson()` function to:
  - Sort locations by relevance score (highest to lowest)
  - Assign a `rank` property (1 = most important, N = least important)
  - Keep the original `relevance` score for reference

**Example:**
If 6 locations are extracted with relevance scores:

- Location A: relevance 9 → rank 1
- Location B: relevance 8 → rank 2
- Location C: relevance 7 → rank 3
- Location D: relevance 5 → rank 4
- Location E: relevance 4 → rank 5
- Location F: relevance 2 → rank 6

#### 2. `title_extractor.py`

- No changes needed - it already imports and uses `locations_to_geojson()` from `pdf_processor.py`

### Frontend Changes

#### 1. `MapComponent.jsx`

- Updated both map layers to display `rank` instead of `relevance`:
  - `literary-relevance` layer (for title search results)
  - `uploaded-relevance` layer (for PDF uploads)
- Numbers shown on map markers now represent rank (1, 2, 3, etc.) instead of relevance scores (1-10)

#### 2. `BookSearch.jsx`

- Added sorting logic to sort locations by rank before displaying
- Location list now shows rank number (1., 2., 3., etc.) instead of pin emoji
- Locations are ordered from most important (rank 1) to least important

#### 3. `BookUpload.jsx`

- Added sorting logic to sort locations by rank
- Location list now displays rank number prefix (e.g., "1. 📍 Location Name")
- Locations are ordered by importance

## User Experience

### Before

- Locations appeared in arbitrary order
- No clear indication of importance
- Numbers on map (if any) showed relevance score (1-10)

### After

- Locations are always ordered by narrative importance
- Rank 1 = most central to the story
- Rank N = least important mention
- Clear visual hierarchy in both:
  - Map markers (numbered 1, 2, 3...)
  - Sidebar location lists (ordered and numbered)

## Testing

To test the implementation:

1. **Upload a PDF book** or **search for a book title**
2. Check that locations in the sidebar are ordered 1, 2, 3, etc.
3. Check that map markers show the same numbers
4. Verify rank 1 appears first in the list (most important location)
5. Verify the numbers on the map match the sidebar order

## Technical Details

### Backend Sort Algorithm

```python
sorted_locations = sorted(
    locations,
    key=lambda x: x.get("relevance", 5),
    reverse=True  # Highest relevance first
)
```

### Frontend Sort Algorithm

```javascript
const sortedFeatures = [...features].sort((a, b) => {
  const rankA = a.properties.rank || 999;
  const rankB = b.properties.rank || 999;
  return rankA - rankB; // Lowest rank (most important) first
});
```

### Data Structure

Each location feature now has:

```json
{
  "properties": {
    "title": "Location Name",
    "relevance": 9,  // Original AI-assigned score (1-10)
    "rank": 1,       // Computed rank (1-N based on sorting)
    ...
  }
}
```

## Benefits

1. **Consistent ordering**: Locations always appear in order of narrative importance
2. **Clear hierarchy**: Users immediately see which locations matter most
3. **Better UX**: Easy to find the most significant locations
4. **Visual correlation**: Map numbers match sidebar numbers
5. **Scalability**: Works for any number of locations (3-10)
