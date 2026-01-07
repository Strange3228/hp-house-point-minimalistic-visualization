(function () {
  const WIDTH_PX = 120;
  const HEIGHT_PX = 600;
  const CELL = 2;
  const W = Math.floor(WIDTH_PX / CELL);
  const H = Math.floor(HEIGHT_PX / CELL);
  const SAND = 1;
  const EMPTY = 0;
  const POUR_RATE = 320;
  const POUR_SPREAD = 3;
  const BASE_STEP_ITERATIONS = 4;
  const STEP_JITTER_PROB = 0.25;
  const SPEED_MIN = 0.3;
  const SPEED_MAX_INIT = 0.7;
  const SPEED_CAP_MIN = 0.85;
  const SPEED_CAP_MAX = 0.98;
  const ACCEL_PER_MOVE = 0.015;

  function hexToRgb(hex) {
    const m = hex.replace('#','');
    const r = parseInt(m.slice(0,2),16);
    const g = parseInt(m.slice(2,4),16);
    const b = parseInt(m.slice(4,6),16);
    return {r,g,b};
  }
  function rgbToHex({r,g,b}) {
    const h = (n)=> n.toString(16).padStart(2,'0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function mix(a,b,t){ return Math.round(a + (b - a) * t); }
  function makeShades(hex, count=5) {
    const base = hexToRgb(hex);
    const shades = [];
    for (let i=0;i<count;i++) {
      const t = (i)/(count*1.8);
      const r = mix(base.r, 255, t);
      const g = mix(base.g, 255, t);
      const b = mix(base.b, 255, t);
      shades.push(rgbToHex({r,g,b}));
    }
    return shades;
  }

  const houses = [
    { id: 0, name: 'Gryffindor', color: '#dc2626' },
    { id: 1, name: 'Slytherin',  color: '#16a34a' },
    { id: 2, name: 'Hufflepuff', color: '#f59e0b' },
    { id: 3, name: 'Ravenclaw',  color: '#2563eb' } 
  ];

  const tubes = houses.map((h, i) => {
    const container = document.getElementById(`tube-${i}`);
    const canvas = document.getElementById(`sand-canvas-${i}`);
    const fillDisplay = document.getElementById(`fill-${i}`);
    const ctx = canvas.getContext('2d', { alpha: false });
    const grid = new Uint8Array(W * H);
    const moveProb = new Float32Array(W * H);
    const speedCap = new Float32Array(W * H);
    const sandColors = makeShades(h.color, 5);
    let pouring = false;
    let pourXGrid = Math.floor(W / 2);
    let pourAccumulator = 0;

    canvas.width = WIDTH_PX;
    canvas.height = HEIGHT_PX;
    return { container, canvas, ctx, grid, moveProb, speedCap, sandColors, pouring, pourXGrid, pourAccumulator, fillDisplay, houseId: i };
  });


  function saveHouseState(houseId) {
    const tube = tubes[houseId];
    let sandCount = 0;
    for (let i = 0; i < W * H; i++) {
      if (tube.grid[i] === SAND) sandCount++;
    }
    const fillPercent = (sandCount / (W * H)) * 100;
    localStorage.setItem(`house_${houseId}`, JSON.stringify({ fillPercent }));
  }

  function loadHouseState(houseId) {
    const stored = localStorage.getItem(`house_${houseId}`);
    if (stored) {
      try {
        const { fillPercent } = JSON.parse(stored);
        const tube = tubes[houseId];

        const totalCells = W * H;
        const cellsToFill = Math.round((fillPercent / 100) * totalCells);

        let cellsAdded = 0;
        for (let y = H - 1; y >= 0 && cellsAdded < cellsToFill; y--) {
          for (let x = 0; x < W && cellsAdded < cellsToFill; x++) {
            const i = idx(x, y);
            tube.grid[i] = SAND;
            cellsAdded++;
          }
        }
      } catch (e) {
        console.error('Failed to load house state:', e);
      }
    }
  }

  function clearAllHouseStates() {
    for (let i = 0; i < houses.length; i++) {
      localStorage.removeItem(`house_${i}`);
    }
  }


  for (let i = 0; i < houses.length; i++) {
    loadHouseState(i);
  }

  function idx(x, y) { return y * W + x; }
  function inBounds(x, y) { return x >= 0 && x < W && y >= 0 && y < H; }

  function emitSandAtX(tube, xGrid, count) {
    const { grid, moveProb, speedCap } = tube;
    for (let i = 0; i < count; i++) {
      const dx = (Math.random() * (2 * POUR_SPREAD + 1) - POUR_SPREAD) | 0;
      const x = Math.max(0, Math.min(W - 1, xGrid + dx));
      const y = 0;
      const id = idx(x, y);
      if (grid[id] === EMPTY) {
        grid[id] = SAND;
        moveProb[id] = SPEED_MIN + Math.random() * (SPEED_MAX_INIT - SPEED_MIN);
        speedCap[id] = SPEED_CAP_MIN + Math.random() * (SPEED_CAP_MAX - SPEED_CAP_MIN);
      }
    }
  }

  function step(tube, dt) {
    const { grid, moveProb, speedCap } = tube;
    for (let y = H - 2; y >= 0; y--) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        if (grid[i] !== SAND) continue;
        if (Math.random() > moveProb[i]) continue;

        const yd = y + 1;
        const idDown = idx(x, yd);
        if (grid[idDown] === EMPTY) {
          const newProb = Math.min(speedCap[i], moveProb[i] + ACCEL_PER_MOVE);
          grid[idDown] = SAND;
          moveProb[idDown] = newProb;
          speedCap[idDown] = speedCap[i];
          grid[i] = EMPTY;
          moveProb[i] = 0;
          speedCap[i] = 0;
          continue;
        }

        const leftFirst = Math.random() < 0.5;
        const xl = x - 1;
        const xr = x + 1;
        const idDL = inBounds(xl, yd) ? idx(xl, yd) : -1;
        const idDR = inBounds(xr, yd) ? idx(xr, yd) : -1;

        if (leftFirst) {
          if (idDL >= 0 && grid[idDL] === EMPTY) {
            const newProb = Math.min(speedCap[i], moveProb[i] + ACCEL_PER_MOVE);
            grid[idDL] = SAND; moveProb[idDL] = newProb; speedCap[idDL] = speedCap[i]; grid[i] = EMPTY; moveProb[i] = 0; speedCap[i] = 0; continue;
          }
          if (idDR >= 0 && grid[idDR] === EMPTY) {
            const newProb = Math.min(speedCap[i], moveProb[i] + ACCEL_PER_MOVE);
            grid[idDR] = SAND; moveProb[idDR] = newProb; speedCap[idDR] = speedCap[i]; grid[i] = EMPTY; moveProb[i] = 0; speedCap[i] = 0; continue;
          }
        } else {
          if (idDR >= 0 && grid[idDR] === EMPTY) {
            const newProb = Math.min(speedCap[i], moveProb[i] + ACCEL_PER_MOVE);
            grid[idDR] = SAND; moveProb[idDR] = newProb; speedCap[idDR] = speedCap[i]; grid[i] = EMPTY; moveProb[i] = 0; speedCap[i] = 0; continue;
          }
          if (idDL >= 0 && grid[idDL] === EMPTY) {
            const newProb = Math.min(speedCap[i], moveProb[i] + ACCEL_PER_MOVE);
            grid[idDL] = SAND; moveProb[idDL] = newProb; speedCap[idDL] = speedCap[i]; grid[i] = EMPTY; moveProb[i] = 0; speedCap[i] = 0; continue;
          }
        }
      }
    }
  }

  function render(tube) {
    const { ctx, grid, sandColors, fillDisplay, houseId } = tube;
    ctx.fillStyle = '#0b1223';
    ctx.fillRect(0, 0, WIDTH_PX, HEIGHT_PX);
    let sandCount = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[idx(x, y)] === SAND) {
          sandCount++;
          ctx.fillStyle = sandColors[(x + y) % sandColors.length];
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    const fillPercent = ((sandCount / (W * H)) * 100).toFixed(2);
    fillDisplay.textContent = fillPercent + '%';

    saveHouseState(houseId);
  }

  function findTargetTubeAndUpdateX(e) {
    const x = e.clientX; const y = e.clientY;
    for (const tube of tubes) {
      const rect = tube.container.getBoundingClientRect();
      const insideX = x >= rect.left && x <= rect.right;
      const aboveTopZone = y >= (rect.top - 50) && y < rect.top;
      if (insideX && aboveTopZone) {
        const relX = x - rect.left;
        tube.pourXGrid = Math.max(0, Math.min(W - 1, Math.floor(relX / CELL)));
        return tube;
      }
    }
    return null;
  }

  document.addEventListener('mousedown', (e) => {
    const target = findTargetTubeAndUpdateX(e);
    tubes.forEach(t => t.pouring = (t === target));
  });
  document.addEventListener('mousemove', (e) => {
    findTargetTubeAndUpdateX(e);
  });
  document.addEventListener('mouseup', () => {
    tubes.forEach(t => t.pouring = false);
  });


  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
      tubes.forEach(t => { t.grid.fill(EMPTY); t.moveProb.fill(0); t.speedCap.fill(0); });
      clearAllHouseStates();
    }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    for (const t of tubes) {
      if (t.pouring) {
        t.pourAccumulator += POUR_RATE * dt;
        const toEmit = Math.floor(t.pourAccumulator);
        if (toEmit > 0) {
          emitSandAtX(t, t.pourXGrid, toEmit);
          t.pourAccumulator -= toEmit;
        }
      } else {
        t.pourAccumulator = 0;
      }

      let iterations = BASE_STEP_ITERATIONS + (Math.random() < STEP_JITTER_PROB ? 1 : 0);
      for (let s = 0; s < iterations; s++) step(t, dt);
      render(t);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
