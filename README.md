# 🧊 HIMYANTRA — AI Antarctic Navigation & Sea-Ice Intelligence Platform

> **Intelligent Polar Voyage Optimization, PyTorch ConvLSTM Sea-Ice Forecasting, and IMO Polar Code Risk Assessment**

---

## 📌 Project Overview

**Himyantra** (हिम-यंत्र) is an advanced AI-powered Antarctic polar maritime intelligence platform designed to maximize vessel safety, optimize bunker fuel consumption, and prevent ice entrapment for research icebreakers and expedition ships navigating the Southern Ocean (`EPSG:3031` Antarctic Polar Stereographic projection).

By fusing satellite passive microwave observation data, hydrodynamic iceberg drift physics, and a deep learning **PyTorch ConvLSTM** neural network, Himyantra projects 5-day spatial sea-ice concentration fields and optimizes safe transit corridors under **IMO Polar Code guidelines (`PC1`–`PC7`)**.

---

## 🛰️ Datasets & Telemetry Integrations

Himyantra integrates multi-source polar telemetry and satellite datasets:

1. **NSIDC Sea Ice Concentration Climate Data Record (CDR)**: 
   - *Source*: National Snow and Ice Data Center / NOAA.
   - *Resolution*: 25 km passive microwave grid in Antarctic Polar Stereographic projection (`EPSG:3031`).
   - *Usage*: Spatiotemporal training sequences for the PyTorch ConvLSTM deep learning model.

2. **NASA GIBS AMSR2 Satellite WMS Imagery Layer**:
   - *Source*: NASA Global Imagery Browse Services (GIBS).
   - *Layer*: `AMSRU2_Sea_Ice_Concentration_25km` Web Map Service (WMS).
   - *Usage*: High-resolution real-time sea-ice concentration overlay on Leaflet polar maps.

3. **USNIC Antarctic Giant Iceberg Tracking Registry**:
   - *Source*: U.S. National Ice Center (USNIC).
   - *Data*: Tracked giant tabular icebergs (`A81`, `A76C`, `A83`, `A74`, `A68a`, `B22A`, `C19AM`, `A68B`).
   - *Parameters*: Spatial coordinates (Lat/Lon), surface area ($km^2$), drift velocity ($km/day$), and heading bearing.

4. **ECMWF ERA5 & GFS Polar Atmospheric Weather Reanalysis**:
   - *Source*: European Centre for Medium-Range Weather Forecasts (ECMWF) / NOAA GFS.
   - *Parameters*: Spatial surface wind vectors ($U$ & $V$), 2-meter air temperature (°C), and sea-level atmospheric pressure ($hPa$).

5. **IMO Polar Code Vessel Registry**:
   - *Source*: International Maritime Organization (IMO) Safety Guidelines.
   - *Classifications*: `PC1` (Year-round all polar waters) through `PC7` (Thin first-year ice) and `UNCLASSED` commercial vessels.

---

## 🧠 AI Engine & Technical Architecture

### 1. **PyTorch ConvLSTM Sea-Ice Forecasting Engine (`ml/`)**
- **Architecture**: 2-layer Spatiotemporal Convolutional LSTM (ConvLSTM2d) trained on multi-channel tensor blocks.
- **Input Tensor**: `[Batch, T_past=7, Height=64, Width=64, Channels=5]`
  - *Channels*: `0: Sea Ice Concentration`, `1: Wind U`, `2: Wind V`, `3: Air Temp`, `4: Pressure`
- **Output Tensor**: `[Batch, T_future=7, Height=64, Width=64, Channels=1]` (Predicted 5-to-7 day sea-ice maps).
- **Performance Benchmark**: Trained over 43M+ data points with Cosine Annealing Learning Rate; achieved **89.65% Accuracy (RMSE 0.1035)** against satellite observation benchmarks.

### 2. **Hydrodynamic Iceberg Drift Physics (`lib/trajectoryPrediction.js`)**
- Models wind drag velocity, ocean currents, Coriolis force, and spatiotemporal waypoint decay over a 7-day projection horizon.

### 3. **IMO Polar Code Navigation Risk Engine (`lib/riskEngine.js`)**
- Evaluates composite risk scores ($0–100$) using weighted inputs:
  $$\text{Risk} = 0.35(\text{Ice Density}) + 0.35(\text{Iceberg Proximity}) + 0.30(\text{Weather Severity}) - \text{Hull Mitigation Bonus}$$

---

## 🚀 Key Platform Features

- **🌐 Global Active Vessel Context (`VesselContext.js`)**: Real-time state synchronization across all pages with `localStorage` persistence.
- **🎯 Mission Control (`/dashboard`)**: Interactive `EPSG:3031` polar map displaying NASA GIBS AMSR2 sea-ice tiles, live ship positions, iceberg markers, and alert readouts.
- **❄️ Ice Intelligence (`/ice-intelligence`)**: 5-Day Sea-Ice Outlook Trend with dynamic hull threshold safety badges (`Safe Range` vs `Exceeds Limit`), Recharts spatiotemporal curve, and interactive 7-day iceberg drift trajectory waypoints.
- **🗺️ AI Route Planner (`/route-planner`)**: Generates optimized transit routes comparing distance, fuel burn, voyage duration, and risk ratings across 4 optimization objectives (*Balanced, Max Safety, Min Fuel, Min Time*).
- **📊 Voyage Analytics (`/analytics`)**: Dynamic vessel telemetry database recalculating distance travelled, distance remaining, bunker fuel tank usage, daily burn rates, and risk ratings for all 8 vessel profiles.
- **⚙️ Vessel Profile Settings (`/settings`)**: Configurable profile fields dynamically bound to active vessel specifications.

---

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Components & Styling**: React 18, Tailwind CSS, Lucide React Icons
- **Polar GIS & Mapping**: Leaflet, Proj4Leaflet, NASA GIBS WMS (`EPSG:3031`)
- **Data Visualization**: Recharts (`^3.10.1`)
- **Machine Learning**: PyTorch 2.0+, NumPy, SciPy (Python 3.10+)

---

## 💻 Getting Started

### 1. Install Dependencies & Launch Web Application

```bash
# Install node packages
npm install

# Launch Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Verify Production Build

```bash
# Clean production build
npm run build

# Start production server
npm start
```

### 3. Train PyTorch ConvLSTM AI Model (Optional)

```bash
# Navigate to ML directory and run training script
python ml/train.py
```

---

## 📂 Codebase Structure

```
app/
  page.js                  → Landing Page
  layout.js                → Root Layout (Google Fonts, Metadata)
  globals.css               → Custom Polar Tokens & Select Option Styling
  (app)/                    → Shared AppShell Route Group
    dashboard/page.js        → Mission Control (Leaflet EPSG:3031 Map)
    ice-intelligence/page.js → Ice Intelligence (5-Day Outlook & Drift Waypoints)
    route-planner/page.js    → AI Spatial Route Optimization
    analytics/page.js        → Dynamic Voyage Performance Analytics
    settings/page.js         → Vessel Profile & Preferences Configuration

components/
  AppShell.js, Sidebar.js, TopHeader.js, MobileNav.js
  DataTable.js, KpiCard.js, SectionCard.js, StatusBadge.js, FormField.js
  map/
    AntarcticMap.js → Leaflet EPSG:3031 Polar Map Component
    SeaIceLayer.js  → NASA GIBS AMSR2 WMS Tile Overlay
    SeaIceLegend.js → Concentration Scale Legend Bar
  ice/
    SeaIceForecastChart.js → Recharts Forecast Visualization

context/
  VesselContext.js → Global Active Vessel State & LocalStorage Persistence

data/
  vessels.js, icebergs.js, seaIce.js, weather.js, routes.js, alerts.js

lib/
  riskEngine.js           → IMO Polar Code Risk Assessment Engine
  routeOptimizer.js       → Spatial A* Route Optimization Engine
  trajectoryPrediction.js → Hydrodynamic Iceberg Drift Physics

ml/
  dataset.py  → Antarctic Multi-Channel Sequence Generator
  train.py    → PyTorch ConvLSTM Training & Benchmark Verification
  models/     → Metrics Output (`metrics.json`)
```

---

## 🏆 Hackathon & Enterprise Presentation Highlights

1. **89.65% Benchmark Accuracy**: ConvLSTM neural network trained on 43M+ Antarctic satellite points.
2. **IMO Polar Code Compliance**: Real-time risk evaluations for `PC1` heavy icebreakers down to `UNCLASSED` vessels.
3. **100% Dynamic Telemetry**: Global context synchronization across map overlays, route planner, and voyage analytics.
