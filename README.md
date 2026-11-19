# GreenRoute — Eco-Friendly Route Planner

GreenRoute is a browser-based multi-modal route planner and carbon-analysis dashboard built for
the **Environmental Studies (EVS) — Sustainable Development & Climate Action** curriculum.

Enter an origin and destination, and GreenRoute compares road/path routes for car, motorcycle,
cycling, and walking using live OpenStreetMap data. It calculates distance, travel time, CO₂
emissions, operating cost, and a practical recommendation, then saves verified calculations to a
local trip history.

## Features

- **Live geocoding** — OpenStreetMap Nominatim with debounced search, disambiguation, and the
  required one-request-per-second rate limit.
- **Mode-specific routing** — FOSSGIS OSRM graphs for car/motorcycle, bicycle, and foot. Walking
  and cycling use dedicated graphs, not car routes labelled as walking.
- **Authoritative emissions** — UK DESNZ/DEFRA 2024 combustion factors, CEA India grid intensity,
  EPA eGRID, EEA, IEA, and IPCC lifecycle sources.
- **EV Scope 2 modelling** — EVs are never treated as zero-emission; users select their regional
  electricity grid intensity.
- **Cost comparison** — real fuel prices and electricity tariffs. Transit fares are never invented.
- **Transparent recommendation** — weighted environmental (40%), practicality (35%), time (15%),
  and cost (10%) scoring.
- **Transit corridor estimate** — clearly labelled carbon-only bus/metro estimates using real
  corridor distance; no fake schedules, geometry, or fares.
- **Savings calculator** — per-trip and annual CO₂ avoided, tree-year equivalence, and operating
  cost savings.
- **Verified history** — localStorage-based trip log with search, filters, CSV/JSON export, and
  aggregate impact statistics. No seed or demo trips.
- **Methodology audit** — every factor, coefficient, formula, and source URL is inspectable in-app.
- **Persistent preferences** — vehicle, tariff, and grid selections survive a page reload.

## Tech stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Leaflet + standard OpenStreetMap tiles (no map API key)
- Recharts
- Lucide icons
- Vitest + jsdom for unit tests
- Oxlint

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

## Tests and verification

```bash
npm run test       # unit tests
npm run test:watch # watch mode
npm run typecheck  # TypeScript project build
npm run lint       # Oxlint
npm run verify     # lint + tests + production build
```

Tests cover emission factors, fuel/electricity cost math, EV grid intensity, vehicle-profile
separation, recommendations, savings, formatters, routing provider URLs/parsing, preferences, and
history aggregation/export.

## Project structure

```text
src/
  components/          UI: map, charts, comparison, recommendation, planner, common
  data/                Emission factors, grid intensities, vehicle presets, tariffs
  pages/               Home, Results, History, Impact, Methodology, Settings
  services/
    geocoding/         Nominatim search + reverse geocoding
    routing/           Provider interface + OSRM implementation
    history/           localStorage trip repository and CSV/JSON export
    storage/           Persisted planner preferences
  types/               Shared TypeScript models
  utils/               Emissions, cost, savings, recommendation, transit, vehicle, formatters
  App.tsx              Tab/session state and shared configuration
```

## Data flow

1. User selects two real Nominatim locations.
2. `RoutingService` requests all supported modes in parallel from the appropriate OSRM graph.
3. `calculateModeEmissions()` applies the correct Scope 1, Scope 2, or per-passenger factor.
4. `calculateModeCost()` applies the user's regional tariff.
5. `generatePracticalRecommendations()` scores every available mode.
6. The user can inspect the map, chart, audit trail, and save the calculation.

## Data-integrity limits

- **No GTFS transit feed is connected.** Bus/metro verified routing, schedules, and fares are
  unavailable. The app shows a carbon-only corridor estimate and explicitly says so.
- Public OSRM and Nominatim services are shared infrastructure and can be rate-limited or
  temporarily unavailable.
- Emissions are estimates based on average factors and user-entered vehicle efficiency; they are
  not a substitute for a certified carbon audit.
- All data stays in the browser. There is no backend or account system.

## Deployment

The app is a static SPA and deploys as-is to Vercel. `vercel.json` rewrites all routes to
`index.html`.
