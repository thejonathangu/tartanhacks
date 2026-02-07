# 🗺️ Living Literary Map

**An AI-powered interactive map that extracts and visualizes geographic locations from books using the Model Context Protocol.**

Upload any PDF book or search by title, and watch as AI extracts significant locations mentioned in the text, ranking them by narrative importance and displaying them on an interactive map. Perfect for literary analysis, travel planning based on books, or exploring the geography of your favorite stories.

> Built for TartanHacks 2026 · Powered by [Dedalus Labs](https://dedaluslabs.ai) AI & [Mapbox](https://mapbox.com)

---

## ✨ Features

### 📚 Two Ways to Discover Literary Locations

1. **📄 PDF Upload**

   - Upload any book as a PDF (up to 200 pages extracted)
   - AI analyzes the text and extracts 3-10 real-world locations
   - Each location includes coordinates, quotes, historical context, era, and mood

2. **🔍 Title Search**
   - Search for any book by title (powered by Open Library)
   - AI recalls well-known locations from its knowledge of world literature
   - No PDF needed—just search and map

### 🎯 Intelligent Location Ranking

- **Automatic Relevance Scoring**: AI assigns each location a 1-10 relevance score based on narrative importance
- **Smart Ranking**: Locations are sorted and numbered (1 = most important, N = least important)
- **Visual Markers**: Each location displays its rank number directly on the map
- **Ordered Lists**: Sidebar shows locations in importance order with numbered badges

### 🗺️ Interactive Map Features

- **Multiple Map Styles**: Switch between Satellite, Dark, Streets, and Light themes
- **Era Filtering**: Filter locations by decade (1920s, 1940s, 1960s, etc.)
- **Year Range Slider**: Fine-tune your view to specific time periods
- **Click for Details**: Click any marker to see quotes, historical context, and more
- **Multi-Book Support**: Upload or search multiple books to see location overlaps

### 🤖 MCP Architecture with Orchestration

Built on the **Model Context Protocol**, the backend uses modular specialist agents:

- **🏛 ArchivistAgent**: Searches book databases and enriches with historical context
- **🗣 LinguistAgent**: Analyzes era-specific dialect and cultural references
- **🎨 StylistAgent**: Generates dynamic map styling based on book themes
- **🎼 ConductorAgent**: Orchestrates parallel agent execution and synthesizes results

---

## 🎬 Quick Demo

**What you can do in 30 seconds:**

1. 📖 Search "On the Road" by Jack Kerouac
2. 🤖 Watch AI extract iconic locations across America
3. 🗺️ See numbered markers (1-6) showing journey importance
4. 📍 Click a marker to read quotes and historical context
5. 🎨 Switch map styles to match the book's vibe

**Or upload your own PDF book and discover its geography!**

---

## 🏗️ MCP Architecture & Workflows

### Architecture Overview

The Living Literary Map uses the **Model Context Protocol** to coordinate multiple AI agents working together. Instead of a single monolithic prompt, specialized agents handle specific tasks and coordinate through a central conductor.

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Mapbox GL JS)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Book Upload  │  │ Title Search │  │ Interactive Map        │ │
│  │ (PDF)        │  │ (Open Lib)   │  │ (Ranked Markers)       │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘ │
│         │                 │                   │                 │
│         └─────────┬───────┴──────────────┬────┘                 │
│                   ▼                      ▼                       │
│         POST /upload-pdf         POST /extract-from-title       │
│         POST /orchestrate        POST /chat-about-place         │
└───────────────────┬──────────────────────┬─────────────────────┘
                    │                      │
                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Django Backend (MCP Server)                                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PDF Processor / Title Extractor                           │ │
│  │  • Extracts text from PDFs (PyMuPDF)                       │ │
│  │  • Calls Dedalus AI to identify locations                  │ │
│  │  • Ranks locations by relevance (1-10 scoring)             │ │
│  │  • Sorts and assigns rank numbers (1 = most important)     │ │
│  │  • Returns GeoJSON FeatureCollection                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ConductorAgent (Orchestration)                            │ │
│  │  • Receives user queries about locations                   │ │
│  │  • Delegates to specialist agents in parallel              │ │
│  │  • Synthesizes responses into unified narrative            │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ 🏛 Archivist │  │ 🗣 Linguist  │  │ 🎨 Stylist   │    │ │
│  │  │ Historical   │  │ Dialect      │  │ Map Theme    │    │ │
│  │  │ Context      │  │ Analysis     │  │ Generation   │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         └────────────┬─────────────────────┬─┘            │ │
│  └──────────────────────┼─────────────────────┼──────────────┘ │
│                         ▼                     ▼                │
│                  Dedalus Labs API (GPT-4o)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow 1: Book Location Extraction

**User uploads PDF or searches by title** → **Text Analysis** → **AI Location Extraction** → **Ranking & Sorting** → **Map Display**

1. **Input**: User uploads a PDF book or enters a title
2. **Text Extraction**:
   - PDF: Extract up to 200 pages of text using PyMuPDF
   - Title: Use book metadata (title, author, year)
3. **AI Extraction**: Call Dedalus AI with specialized prompt:
   ```
   "You are an expert literary geographer. Extract 3-10 real-world
   locations from this book, with coordinates, quotes, historical
   context, and a relevance score (1-10) for each location."
   ```
4. **Ranking**: Sort locations by relevance score, assign ranks (1-N)
5. **GeoJSON Generation**: Convert to GeoJSON FeatureCollection with properties:
   - `rank`: 1 = most important, N = least important
   - `relevance`: Original AI score (1-10)
   - `title`, `coordinates`, `quote`, `historical_context`, `era`, `mood`
6. **Map Display**: Render numbered markers on map, sorted list in sidebar

### Workflow 2: MCP Agent Orchestration

**User clicks location** → **Conductor Reasoning** → **Parallel Agent Execution** → **Synthesis** → **Rich Narrative**

1. **User Action**: User clicks a map marker or selects an era
2. **POST /orchestrate**: Frontend sends request to ConductorAgent
3. **Conductor Reasoning**: Determines which agents are needed:
   - ArchivistAgent for historical facts
   - LinguistAgent for dialect analysis
   - StylistAgent for visual theming
4. **Parallel Execution**: All agents run simultaneously via `ThreadPoolExecutor`
5. **AI Enrichment**: Each agent calls Dedalus AI with specialized prompts
6. **Synthesis**: Conductor generates unified narrative combining all results
7. **Timeline**: Returns delegation timeline showing each agent's latency
8. **UI Update**: Display enriched information with orchestration visualization

### Key MCP Benefits

✅ **Modular Specialization**: Each agent has one focused responsibility  
✅ **Parallel Execution**: Agents run concurrently, not sequentially  
✅ **Observable Orchestration**: See exactly which agents were called and how long each took  
✅ **Composable Intelligence**: Conductor combines multiple AI perspectives  
✅ **Scalable Architecture**: Easy to add new specialist agents

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Dedalus Labs API key ([get one here](https://dedaluslabs.ai))
- Mapbox access token ([get one here](https://mapbox.com))
- Google Maps API key (optional, for Street View)

### Installation & Setup

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd living-literary-map
```

#### 2. Set up environment variables

Create `.env` file in the root directory:

```env
# Dedalus Labs API key (required for AI location extraction)
DEDALUS_API_KEY=dsk-live-your-key-here

# Mapbox access token (required for maps)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...your-token-here

# MCP server URL (use localhost for local development)
VITE_MCP_BASE_URL=http://localhost:8000

# Google Maps API key (optional, for Street View images)
VITE_GOOGLE_API_KEY=your-key-here
```

#### 3. Start the backend (Django MCP Server)

```bash
# Navigate to backend
cd mcp-servers

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

Backend will be running at `http://localhost:8000`

#### 4. Start the frontend (React + Vite)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:3000`

#### 5. Open in your browser

Navigate to `http://localhost:3000` and start exploring!

### Quick Test

1. **Search for a book**: Try searching "The Great Gatsby" or "On the Road"
2. **Upload a PDF**: Upload any book PDF (text-based, not scanned images)
3. **Explore the map**: Click markers to see details, use filters to explore by era

---

## 🛠 Tech Stack

| Layer              | Technology                               | Purpose                          |
| ------------------ | ---------------------------------------- | -------------------------------- |
| **Frontend**       | React 18 + Vite 5                        | Modern, fast web framework       |
| **Mapping**        | Mapbox GL JS 3.3                         | Interactive map rendering        |
| **Map Styles**     | Mapbox (Satellite, Dark, Streets, Light) | Multiple visual themes           |
| **PDF Processing** | PyMuPDF (fitz)                           | Text extraction from PDFs        |
| **Backend**        | Django 5.1 (Python)                      | RESTful API server               |
| **AI Provider**    | Dedalus Labs (GPT-4o)                    | Location extraction & enrichment |
| **Protocol**       | Model Context Protocol (MCP)             | Agent orchestration framework    |
| **Book Search**    | Open Library API                         | Book metadata and search         |
| **Street View**    | Google Static Street View API            | Location imagery                 |
| **Orchestration**  | Python `ThreadPoolExecutor`              | Parallel agent execution         |
| **Data Format**    | GeoJSON                                  | Geographic data interchange      |

---

## 📚 How It Works

### Location Extraction Process

1. **Text Input**: Book text is either extracted from PDF or retrieved from AI's knowledge
2. **AI Prompt**: A specialized prompt asks the AI to act as a "literary geographer"
3. **Extraction Criteria**:
   - 3-10 locations maximum
   - Real-world places with accurate coordinates
   - Relevance score (1-10) based on narrative importance:
     - **10**: Central to plot, major scene location
     - **7-9**: Significant location, important events
     - **4-6**: Supporting location, mentioned multiple times
     - **1-3**: Minor mention, background detail
4. **Ranking**: Locations sorted by relevance, assigned ranks (1 = most important)
5. **GeoJSON Output**: Structured data with coordinates, quotes, context, and metadata

### Relevance vs. Rank

- **Relevance Score (1-10)**: AI's assessment of narrative importance
- **Rank (1-N)**: Sequential ordering after sorting by relevance
  - Rank 1 = Highest relevance score (most important location)
  - Rank N = Lowest relevance score (least important location)

### Example

If a book has 6 locations with relevance scores: `[9, 8, 7, 5, 4, 2]`

| Location           | Relevance | Rank | Display  |
| ------------------ | --------- | ---- | -------- |
| Paris apartment    | 9         | 1    | ① on map |
| Café de Flore      | 8         | 2    | ② on map |
| Luxembourg Gardens | 7         | 3    | ③ on map |
| Notre-Dame         | 5         | 4    | ④ on map |
| Train station      | 4         | 5    | ⑤ on map |
| Hotel lobby        | 2         | 6    | ⑥ on map |

---

## 🎯 Use Cases

- **📖 Literary Analysis**: Study the geographic scope of novels and travel narratives
- **✈️ Literary Tourism**: Plan trips based on locations from your favorite books
- **🎓 Education**: Visualize historical events and settings in literature
- **📝 Book Clubs**: Explore locations discussed in book club selections
- **🗺️ Comparative Literature**: Compare geographic settings across multiple books
- **🔍 Research**: Analyze patterns in literary geography by era or author

---

## 🏆 Why This Project Stands Out

### Technical Innovation

1. **MCP Architecture**: Demonstrates proper agent orchestration, not just prompt chaining
2. **Intelligent Ranking**: Context-aware sorting based on narrative importance
3. **Dual Input Methods**: Supports both PDF upload and title-based search
4. **Real-time Extraction**: Processes books on-demand with AI
5. **Parallel Processing**: Multiple agents execute simultaneously for speed

### User Experience

1. **Intuitive Interface**: Clean, modern design with dark theme
2. **Visual Hierarchy**: Numbered markers match sidebar ordering
3. **Rich Context**: Every location includes quotes, history, and mood
4. **Flexible Filtering**: Filter by era, year range, or book
5. **Interactive Exploration**: Click, zoom, and explore dynamically

### MCP Implementation

1. **Observable Orchestration**: See which agents are called and their latency
2. **Specialist Agents**: Modular design with focused responsibilities
3. **Conductor Pattern**: Central orchestrator coordinates specialist agents
4. **Synthesis**: Multiple AI perspectives combined into unified narrative
5. **Extensible**: Easy to add new agents or capabilities

---

---

## 📁 Project Structure

```
living-literary-map/
├── frontend/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapComponent.jsx   # Main map with Mapbox GL
│   │   │   ├── BookSearch.jsx     # Title search + location list
│   │   │   └── BookUpload.jsx     # PDF upload interface
│   │   ├── api/
│   │   │   └── archivistClient.js # API client for backend
│   │   ├── data/
│   │   │   └── literaryPoints.js  # Pre-loaded landmark data
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   ├── vite.config.js             # Vite configuration
│   └── package.json
│
├── mcp-servers/                   # Django backend (MCP Server)
│   ├── core/
│   │   ├── pdf_processor.py       # PDF text extraction + AI location extraction
│   │   ├── title_extractor.py     # Title-based location extraction
│   │   ├── conductor.py           # ConductorAgent orchestration
│   │   ├── dedalus_client.py      # Dedalus AI API client
│   │   ├── upload_views.py        # PDF upload endpoint
│   │   ├── chat_views.py          # Chat endpoint
│   │   └── urls.py                # API routes
│   ├── archivist/                 # ArchivistAgent (historical context)
│   ├── linguist/                  # LinguistAgent (dialect analysis)
│   ├── stylist/                   # StylistAgent (map styling)
│   ├── librarian/                 # LibrarianAgent (book search)
│   ├── manage.py
│   └── requirements.txt
│
├── .env                           # Environment variables (create this)
├── README.md                      # This file
└── *.md                           # Documentation files
```

---

## 🤝 Contributing

This project was built for **TartanHacks 2026**. Contributions, issues, and feature requests are welcome!

### Future Enhancements

- [ ] Support for more book formats (EPUB, MOBI)
- [ ] Export location lists to Google Maps or Apple Maps
- [ ] User accounts and saved book collections
- [ ] Social features (share discoveries, collaborative annotations)
- [ ] Author/series exploration mode
- [ ] Enhanced visualizations (heatmaps, journey paths)
- [ ] Mobile app version

---

## 📄 License

MIT License - feel free to use this project for your own literary adventures!

---

## 🙏 Acknowledgments

- **TartanHacks 2026** for the hackathon opportunity
- **Dedalus Labs** for AI infrastructure and MCP hosting
- **Mapbox** for beautiful, interactive maps
- **Open Library** for book metadata
- **PyMuPDF** for PDF processing capabilities

---

## 📧 Contact & Demo

**Built for TartanHacks 2026**

For questions, feedback, or demo requests, please reach out!

---

_Map the stories. Explore the world. One book at a time._ 🗺️📚
