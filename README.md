# 🎬 ListPeak (Oh Drama)

A modern, fast, and feature-rich entertainment discovery web application for exploring Asian dramas, TV series, movies, and actors. Built with **React 19**, **TypeScript**, **Vite**, **TanStack Router & Query**, and powered by the **TMDb (The Movie Database) API**.

---

## 🌟 Overview & Philosophy

**ListPeak** delivers a premium streaming-guide experience directly in your browser. It offers a privacy-first, serverless client architecture:
- **Bring Your Own Key (BYOK):** Users provide their own free TMDb API key.
- **100% Client-Side & Private:** API keys and query caches are stored strictly in your browser's `localStorage` and `IndexedDB`. No intermediate servers or user tracking.
- **Blazing Fast & Resilient:** Backed by persistent query caching and built-in sliding-window request throttling to avoid rate limits.

---

## 🚀 Key Features & How It Works

### 1. 🔑 Client-Side Setup & Privacy-First Architecture
- **Instant Validation:** When you enter your TMDb API key, the app verifies it directly against TMDb's `/authentication` endpoint.
- **Safe Persistence:** Keys are saved locally via Zustand state management with `localStorage`.
- **Zero Configuration Needed:** No build-time environment secrets or external backends required.

### 2. ⚡ Intelligent Caching & Rate Limiting
- **Offline & Instant Cache:** TanStack Query is paired with `idb-keyval` to persist API responses in **IndexedDB** for up to 7 days, enabling lightning-fast subsequent loads and minimizing API consumption.
- **Built-in Rate Limiting:** A custom sliding-window request throttler (`throttledFetch`) caps requests per window, gracefully handles HTTP 429 responses with exponential backoff/retry, and dispatches UI notifications.

### 3. 🎨 Fluid Motion & Modern UI Design
- **Sleek Dark Theme:** Carefully crafted dark color palette with glassmorphism, accent glows, and responsive typography.
- **Micro-Animations:** Fluid layout transitions, skeleton shimmer placeholders, and staggered animations powered by **Motion** (`motion/react`).

---

## 📄 Pages & Features Breakdown

### 🏠 1. Home Page (`/`)
- **Hero Spotlight:** Prominently highlights the #1 trending title of the week with high-resolution backdrops, rating indicators, overview summaries, and quick navigation buttons.
- **Ranked Trending Row:** Displays the Top 20 trending dramas and movies for the week with ranking badges (#1–#20).
- **Curated Media Rows:** Smooth horizontal carousels for **Popular Movies** and **Top Rated Series**.
- **Interactive Poster Cards:** Displays poster artwork, release year, star ratings, and type tags with animated hover states.

---

### 🔍 2. Search & Discovery Page (`/search`)
- **Instant Search Autocomplete:** Real-time search suggestions with keyboard navigation, debounce optimization, and direct jump-to-detail capabilities.
- **Multi-Category Results:** Unified search across Movies, TV Series, and People.
- **Filtering & Refinement:** Filter results by category (All, Movies, TV, People), genre selection, release year, and minimum rating thresholds.
- **Infinite Scrolling:** Smooth pagination with loading skeletons and empty result states.

---

### 🎥 3. Media Detail Page (`/detail/$id?type=movie|tv`)
- **Cinematic Header:** Immersive full-bleed backdrop with ambient gradient blending, poster art, title, original language, tagline, status, and MPAA / TV content ratings.
- **Comprehensive Metadata:** Release year, runtime (per episode or total movie length), country of origin, genres, keywords/tags, and production companies / network logos.
- **Watch Providers:** Live streaming, rent, and purchase availability powered by JustWatch via TMDb (with region preference fallback).
- **Tabbed Interface:**
  - **Overview:** Plot summary, director/creator details, latest/upcoming episode broadcast schedule, and related recommendations carousel.
  - **Seasons & Episodes (TV):** Interactive season selector with episode list containing episode still images, episode numbers, air dates, episode ratings, and individual episode synopses.
  - **Cast & Crew Preview:** Horizontal scrollbar of main actors with character names and headshots.
- **Trailer Player:** Embedded YouTube video modal for trailers and teasers.
- **Quick Share:** One-click URL copy with animated confirmation toast.

---

### 👥 4. Full Cast & Crew Page (`/detail/$id/cast?type=movie|tv`)
- **Complete Cast Grid:** Full list of actors with character roles, profile photos, and direct links to their filmography.
- **Deduplicated & Organized Crew:** Crew members organized systematically by department (*Directing, Writing, Production, Camera, Sound, Art, Editing, Visual Effects, etc.*).

---

### 👤 5. Person / Actor Profile Page (`/person/$id`)
- **Biography & Personal Details:** Actor biography, known department, gender, birth date, age calculation (or death date), place of birth, aliases (*also known as*), and IMDb profile link.
- **Photo Gallery:** Horizontal carousel of profile photography.
- **Full Filmography & Credits:** Chronological and filterable list of all movie and TV show appearances, roles, and crew credits.

---

### ⚙️ 6. Setup & Key Management Page (`/setup`)
- Clean, focused interface for configuring and testing TMDb API keys.
- Show/hide toggle, instant validation status, error shaking animations, and links to register for a free TMDb key.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework & Core** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 8](https://vitejs.dev/) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (type-safe file-based routing) |
| **Data Fetching & Cache** | [TanStack Query v5](https://tanstack.com/query) + `@tanstack/react-query-persist-client` |
| **Client Storage** | [IndexedDB (`idb-keyval`)](https://github.com/jakearchibald/idb-keyval) + `localStorage` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Animations** | [Motion (Framer Motion)](https://motion.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Linter** | [Oxlint](https://oxc.rs/) |

---

## 📁 Project Structure

```text
├── public/                # Static assets
├── src/
│   ├── api/               # TMDb API client & type definitions (tmdb.ts)
│   ├── components/        # Reusable UI components (Navbar, Footer, HeroSection, PosterCard, etc.)
│   ├── hooks/             # Custom React hooks (useSearch, useDebounce, etc.)
│   ├── lib/               # Utility functions, constants & rateLimiter.ts
│   ├── pages/             # Page components (HomePage, DetailPage, SearchPage, PersonPage, CastPage, SetupPage)
│   ├── routes/            # TanStack Router route definitions (__root.tsx, index.tsx, detail, search, person, etc.)
│   ├── store/             # Zustand persistent stores (keyStore.ts)
│   ├── App.tsx            # Application entry wrapper
│   ├── main.tsx           # React root with QueryClient & Persister
│   ├── index.css          # Tailwind CSS styles and theme custom variables
│   └── routeTree.gen.ts   # Automatically generated route tree
├── index.html             # Main HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration with plugins
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free API key from [The Movie Database (TMDb)](https://www.themoviedb.org/settings/api)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tapman104/ListPeak-TMDB-BASED.git
   cd "oh drama"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`.

5. **Enter your TMDb API Key:**
   On first visit, you will be directed to `/setup` to paste your free TMDb API Key. Once validated, you can begin exploring!

---

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles TypeScript and builds the production-optimized static bundle.
- `npm run preview`: Previews the locally built production bundle.
- `npm run lint`: Runs Oxlint for fast code analysis.

---

## 📝 License

This project is created for personal and educational use. Data and images are provided by [The Movie Database (TMDb)](https://www.themoviedb.org/), but the project is not endorsed or certified by TMDb.
