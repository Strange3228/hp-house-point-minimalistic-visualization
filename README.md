# Hogwarts House Points

## Features

- **4 Independent Tubes**: Each tube represents a Hogwarts house with unique colors and ornate bronze frames
- **Data Persistence**: Fill levels are saved to browser localStorage and restored across tabs and sessions
- **Quick Reset**: Press `R` to clear all tubes and session storage

## Getting Started

Open `index.html` in a web browser. On Windows with PowerShell:

```powershell
Start-Process "c:\MK\house_points\index.html"
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

### Data Persistence
- Fill percentage saved to `localStorage`
- Sand restored from bottom-up in level formation
- Automatic save on each render frame
- Clear on page reload with `R` key

## Browser Support

Requires modern browser with:
- HTML5 Canvas
- CSS Backdrop Filter
- localStorage API
- ES6 JavaScript
