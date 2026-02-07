# Location Ranking UI - Visual Design Guide

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
- **Size**: 24x24 pixels
- **Background**: Accent color (active) / 33% opacity (inactive)
- **Text**: Black (active) / White (inactive)
- **Font**: 14px bold
- **Border radius**: 6px

#### BookUpload Component (PDF Upload)
- **Size**: 22x22 pixels  
- **Background**: Teal 33% opacity (#4ecdc433)
- **Text**: Teal (#4ecdc4)
- **Font**: 12px bold
- **Border radius**: 5px

## Consistency Across Pathways

Both components now use:
- ✅ Same sorting algorithm (by rank)
- ✅ Same numbered badge style
- ✅ Same layout structure
- ✅ Numbers that match map markers

## User Benefits

1. **Clear hierarchy** - Instantly see most important locations
2. **Visual consistency** - Same UI regardless of entry method
3. **Map correlation** - Sidebar numbers match map numbers
4. **Professional appearance** - Polished, modern design
