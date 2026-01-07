# Hogwarts House Points - Sand Simulator

A photorealistic sand-pouring visualization featuring four magical gemstone tubes representing Hogwarts houses (Gryffindor, Slytherin, Hufflepuff, Ravenclaw). Click and hold above any tube to pour shimmering sand grains that fall and settle naturally with per-grain physics variation.

## Features

- **4 Independent Tubes**: Each tube represents a Hogwarts house with unique colors and ornate bronze frames
- **Per-Grain Physics**: Each sand grain has its own speed variation and acceleration cap
- **Photorealistic Glass**: Caustic light refractions and volumetric lighting effects
- **Data Persistence**: Fill levels are saved to browser localStorage and restored across tabs and sessions
- **Responsive Physics**: 2x accelerated falling speed with cellular automata simulation
- **Quick Reset**: Press `R` to clear all tubes and session storage

## Getting Started

Open `index.html` in a web browser. On Windows with PowerShell:

```powershell
Start-Process "c:\MK\house_points\index.html"
```

Or run a simple HTTP server (if Python is installed):

```powershell
cd "c:\MK\house_points"
python -m http.server 8000
# Visit: http://localhost:8000/
```

## Controls

- **Click and hold** above any tube (in the 50px pour zone) to pour sand
- **Release** to stop pouring
- **Press `R`** to reset all tubes and clear saved data

## Technical Details

### Simulation Engine
- Cellular automata on 2×2px grid (~60×300 cells per tube of 120×600px)
- Bottom-to-top update prevents multiple moves per frame
- Per-grain movement probability controls falling speed

### Physics Model
- **Per-grain speed variation**: Each grain has random initial speed (0.3–0.7)
- **Acceleration on movement**: +0.015 speed boost per successful downward move
- **Speed caps**: Each grain has unique max speed (0.85–0.98) preventing unrealistic acceleration
- **2x speed**: `BASE_STEP_ITERATIONS` doubled to 4 for faster falling

### Data Persistence
- Fill percentage saved to `localStorage` (not full grid)
- Sand restored from bottom-up in level formation
- Automatic save on each render frame
- Clear on page reload with `R` key

### Tunable Parameters (`script.js`)
- `WIDTH_PX` / `HEIGHT_PX`: Tube dimensions (120×600px)
- `CELL`: Cell size in pixels (2px)
- `POUR_RATE`: Grains per second when pouring (320)
- `POUR_SPREAD`: Horizontal spread radius (3 cells)
- `BASE_STEP_ITERATIONS`: Physics update cycles per frame (4)
- `SPEED_MIN` / `SPEED_MAX_INIT`: Initial speed range (0.3–0.7)
- `SPEED_CAP_MIN` / `SPEED_CAP_MAX`: Max speed per grain (0.85–0.98)
- `ACCEL_PER_MOVE`: Speed increase per successful move (0.015)

### Styling
- **Ornate Bronze Frames**: 8px bronze borders with accent highlights
- **House Colors**: Gryffindor (red), Slytherin (green), Hufflepuff (gold), Ravenclaw (blue)
- **Gemstone Glows**: 60px bloom effects with house-specific colors
- **Glass Effects**: Photorealistic caustic refractions and internal reflections
- **Typography**: Gold-leaf serif fonts (Cinzel for headers, Merriweather for body)
- **Volumetric Lighting**: Pseudo-3D atmospheric effects on tube wrappers

## Browser Support

Requires modern browser with:
- HTML5 Canvas
- CSS Backdrop Filter
- localStorage API
- ES6 JavaScript
