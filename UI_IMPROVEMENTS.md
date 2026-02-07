# Location Ranking UI Improvements

## Numbered Badge Design

Both the **Title Search** and **PDF Upload** pathways now display locations with professional numbered badges showing their importance ranking.

### Badge Appearance

```
┌────────────────────────────────────────┐
│  ┌──┐                                  │
│  │1 │  Paris — City of Lights          │
│  └──┘  1920s · 1925                    │
│         "The streets were alive..."    │
└────────────────────────────────────────┘
```

### Badge Specifications

#### BookSearch Component (Title Search)

- **Badge size**: 24x24px
- **Badge background**:
  - Active: Accent color (solid)
  - Inactive: Accent color 33% opacity
- **Badge text color**:
  - Active: Black (#000)
  - Inactive: White (#fff)
- **Badge border radius**: 6px
- **Font**: 14px, bold

#### BookUpload Component (PDF Upload)

- **Badge size**: 22x22px
- **Badge background**: Teal 33% opacity (#4ecdc433)
- **Badge text color**: Teal (#4ecdc4)
- **Badge border radius**: 5px
- **Font**: 12px, bold

## User Experience Flow

### Title Search Pathway (BookSearch.jsx)

1. User searches for a book title
2. User clicks "Map It" on a search result
3. **AI extracts locations with relevance scores**
4. **Backend sorts by relevance and assigns ranks 1-N**
5. Sidebar shows:

   ```
   📍 6 locations extracted

   ┌──┐ London — Holmes' Headquarters
   │1 │ 1880s · 1887
   └──┘ "221B Baker Street..."

   ┌──┐ Switzerland — Reichenbach Falls
   │2 │ 1890s · 1891
   └──┘ "The terrible place..."

   ... (ranked 3-6)
   ```

### PDF Upload Pathway (BookUpload.jsx)

1. User uploads a PDF file
2. User clicks "Extract Locations"
3. **AI extracts locations with relevance scores**
4. **Backend sorts by relevance and assigns ranks 1-N**
5. Sidebar shows:

   ```
   ✅ 5 locations found

   ┌──┐ New York City — Jazz Age Capital
   │1 │ 1920s
   └──┘

   ┌──┐ West Egg — Gatsby's Mansion
   │2 │ 1920s
   └──┘

   ... (ranked 3-5)
   ```

## Map Integration

The numbered badges in the sidebar **match the numbers on the map markers**:

```
Map:        Sidebar:
  ①         ┌──┐
             │1 │ Most important location
             └──┘

  ②         ┌──┐
             │2 │ Second most important
             └──┘

  ③         ┌──┐
             │3 │ Third most important
             └──┘
```

## Sorting Logic

Both components use the same sorting algorithm:

```javascript
// Sort locations by rank (1 = most important)
const sortedFeatures = [...features].sort((a, b) => {
  const rankA = a.properties.rank || 999;
  const rankB = b.properties.rank || 999;
  return rankA - rankB; // Ascending order
});
```

## Benefits

1. **Visual Consistency**: Both pathways look and behave the same
2. **Clear Hierarchy**: Numbered badges immediately show importance
3. **Map Correlation**: Sidebar numbers match map marker numbers
4. **Professional Look**: Polished badge design instead of simple text
5. **Accessibility**: High contrast, readable font sizes

## Implementation Details

### BookSearch.jsx Changes

- Replaced pin emoji (📍) with numbered badge
- Added badge container with flexbox centering
- Dynamic background color based on active state
- Maintains existing interactive features (click, hover)

### BookUpload.jsx Changes

- Replaced text prefix ("1. 📍") with numbered badge
- Added flexbox layout for badge + content
- Consistent spacing and alignment
- Moved era display inside content wrapper

## Testing Checklist

- [ ] Upload a PDF and verify locations show ranks 1-N
- [ ] Search for a book title and verify locations show ranks 1-N
- [ ] Verify sidebar order matches map marker numbers
- [ ] Click location items and verify map flies to correct markers
- [ ] Verify active state highlighting works
- [ ] Check that rank 1 (most important) appears first in both pathways
- [ ] Verify badges are readable and properly aligned

## Color Scheme

| Component  | Badge Background  | Badge Text | State    |
| ---------- | ----------------- | ---------- | -------- |
| BookSearch | `#4ecdc4` (solid) | `#000`     | Active   |
| BookSearch | `#4ecdc433` (33%) | `#fff`     | Inactive |
| BookUpload | `#4ecdc433` (33%) | `#4ecdc4`  | Default  |
