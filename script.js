/**
 * ============================================================================
 * MAZE SOLVER GAME USING DATA STRUCTURES AND ALGORITHMS (DSA)
 * Bachelor of Computer Applications (BCA) - 2nd Year College Project
 * 
 * Core DSA Concepts Demonstrated:
 * 1. 2D Array Matrix representation of a Maze Grid
 * 2. Stack Data Structure (LIFO) for Depth-First Search & Backtracking
 * 3. Queue Data Structure (FIFO) for Breadth-First Search (Shortest Path)
 * 4. Recursion & Iterative Backtracking
 * 5. 2D Visited Boolean Matrix for cycle prevention
 * 6. Web Audio API for interactive audio feedback
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. DATA STRUCTURE IMPLEMENTATIONS (STACK & QUEUE)
   ============================================================================ */

/**
 * Stack Data Structure (LIFO - Last In, First Out)
 * Used extensively in Depth-First Search (DFS) and Maze Backtracking.
 */
class Stack {
  constructor() {
    this.items = [];
  }

  // Push element onto the top of the stack - O(1)
  push(element) {
    this.items.push(element);
  }

  // Pop and return the top element from the stack - O(1)
  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop();
  }

  // View top element without removing it - O(1)
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }

  // Check if stack has no elements - O(1)
  isEmpty() {
    return this.items.length === 0;
  }

  // Return total count of elements - O(1)
  size() {
    return this.items.length;
  }

  // Empty the stack - O(1)
  clear() {
    this.items = [];
  }
}

/**
 * Queue Data Structure (FIFO - First In, First Out)
 * Used in Breadth-First Search (BFS) to guarantee the shortest path.
 */
class Queue {
  constructor() {
    this.items = [];
    this.head = 0; // Pointer optimization for O(1) amortized dequeue
  }

  // Insert element at the rear of the queue - O(1)
  enqueue(element) {
    this.items.push(element);
  }

  // Remove and return element from the front of the queue - O(1) amortized
  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.items[this.head];
    this.head++;
    // Compact array periodically to prevent memory bloat
    if (this.head > 100 && this.head > this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  // View front element without removing - O(1)
  front() {
    if (this.isEmpty()) return null;
    return this.items[this.head];
  }

  // Check if queue has no elements - O(1)
  isEmpty() {
    return this.head >= this.items.length;
  }

  // Return count of active elements - O(1)
  size() {
    return this.items.length - this.head;
  }

  // Empty the queue - O(1)
  clear() {
    this.items = [];
    this.head = 0;
  }
}

/* ============================================================================
   2. CONSTANTS & GRID STATE CODES
   ============================================================================ */
const CELL = {
  PATH: 0,     // Open movable corridor
  WALL: 1,     // Solid impassable barrier ('#')
  START: 2,    // Origin cell ('S')
  EXIT: 3,     // Target destination cell ('E')
  VISITED: 4,  // Cell explored during search
  SOLUTION: 5  // Final resolved path from Start to Exit
};

const DIFFICULTY_CONFIG = {
  easy:   { rows: 11, cols: 11, label: 'Easy (11×11)',   baseScore: 500 },
  medium: { rows: 19, cols: 19, label: 'Medium (19×19)', baseScore: 1000 },
  hard:   { rows: 27, cols: 27, label: 'Hard (27×27)',   baseScore: 2000 },
  expert: { rows: 33, cols: 33, label: 'Expert (33×33)', baseScore: 3500 }
};

// 4 cardinal directional offsets: [deltaRow, deltaCol, name]
const DIRECTIONS = [
  [-1,  0, 'Up'],
  [ 0,  1, 'Right'],
  [ 1,  0, 'Down'],
  [ 0, -1, 'Left']
];

/* ============================================================================
   3. SOUND SYNTHESIS ENGINE (WEB AUDIO API)
   ============================================================================ */
class SoundFx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq, type = 'sine', duration = 0.08, vol = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  step() { this.playTone(340, 'triangle', 0.05, 0.08); }
  bump() { this.playTone(130, 'sawtooth', 0.1, 0.12); }
  solveStep() { this.playTone(520, 'sine', 0.04, 0.05); }
  pathHighlight() { this.playTone(780, 'triangle', 0.06, 0.08); }
  win() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.22, 0.2), idx * 110);
    });
  }
}

/* ============================================================================
   4. MAZE GAME CONTROLLER CLASS
   ============================================================================ */
class MazeGame {
  constructor() {
    // Canvas & 2D Context
    this.canvas = document.getElementById('mazeCanvas');
    this.ctx = this.canvas.getContext('2d');

    // UI Elements - Screens & Modals
    this.startScreen = document.getElementById('start-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.instructionsModal = document.getElementById('instructions-modal');
    this.winModal = document.getElementById('win-modal');
    this.statusBanner = document.getElementById('status-banner');

    // HUD Elements
    this.hudDifficulty = document.getElementById('hud-difficulty');
    this.hudMoves = document.getElementById('hud-moves');
    this.hudTimer = document.getElementById('hud-timer');
    this.hudScore = document.getElementById('hud-score');

    // Telemetry Elements
    this.teleAlgo = document.getElementById('tele-algo');
    this.teleVisited = document.getElementById('tele-visited');
    this.telePathLength = document.getElementById('tele-path-length');
    this.teleRoutes = document.getElementById('tele-routes');

    // Buttons
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnShowInstructions = document.getElementById('btn-show-instructions');
    this.btnExitGame = document.getElementById('btn-exit-game');
    this.btnBackMenu = document.getElementById('btn-back-menu');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnGameHelp = document.getElementById('btn-game-help');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnNewMaze = document.getElementById('btn-new-maze');
    this.btnSolveDFS = document.getElementById('btn-solve-dfs');
    this.btnSolveBFS = document.getElementById('btn-solve-bfs');
    this.btnClearSolution = document.getElementById('btn-clear-solution');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnModalGotIt = document.getElementById('btn-modal-gotit');
    this.btnWinReplay = document.getElementById('btn-win-replay');
    this.btnWinNext = document.getElementById('btn-win-next');
    this.speedSlider = document.getElementById('solver-speed');
    this.speedLabel = document.getElementById('speed-label');

    // Audio Engine
    this.sound = new SoundFx();

    // Game State Variables
    this.difficulty = 'medium';
    this.routeMode = 'multi'; // 'multi' (many routes, loops, shortcuts) vs 'single' (classic tree)
    this.rows = 19;
    this.cols = 19;
    this.cellSize = 24;

    this.grid = []; // 2D array representation
    this.startPos = { r: 1, c: 1 };
    this.exitPos = { r: 17, c: 17 };
    this.playerPos = { r: 1, c: 1 };

    this.moves = 0;
    this.score = 1000;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isGameActive = false;
    this.isSolving = false;
    this.abortController = null;

    // Solution & Visited storage
    this.visitedCells = [];
    this.solutionPath = [];

    // Bind event listeners
    this.bindEvents();
    this.setDifficulty('medium');
    this.setRouteMode('multi');
    this.lastDfsSteps = null;
    this.lastBfsSteps = null;
  }

  /* --------------------------------------------------------------------------
     EVENT LISTENERS & BINDINGS
     -------------------------------------------------------------------------- */
  bindEvents() {
    // Start Screen
    this.btnStartGame.addEventListener('click', () => {
      this.sound.init();
      this.switchScreen('game');
      this.initNewGame();
    });

    this.btnShowInstructions.addEventListener('click', () => this.showModal('instructions'));
    this.btnExitGame.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit the Maze Solver Game?')) {
        window.close();
        this.setStatus('Game stopped. You may close this tab.', 'warning');
      }
    });

    // Start Screen Difficulty Pills
    document.querySelectorAll('#start-difficulty-picker .btn-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        target.blur();
        this.setDifficulty(target.getAttribute('data-difficulty'));
      });
    });

    // In-game Difficulty Chips (Segmented Buttons)
    document.querySelectorAll('#game-difficulty-picker .btn-diff-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        target.blur();
        this.setDifficulty(target.getAttribute('data-difficulty'));
        this.initNewGame();
      });
    });

    // Start Screen Route Style Pills
    document.querySelectorAll('#start-route-picker .btn-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        target.blur();
        this.setRouteMode(target.getAttribute('data-route'));
      });
    });

    // In-game Route Style Chips
    document.querySelectorAll('#game-route-picker .btn-diff-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        target.blur();
        this.setRouteMode(target.getAttribute('data-route'));
        this.initNewGame();
      });
    });

    // In-game controls
    this.btnBackMenu.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.stopTimer();
      this.cancelSolver();
      this.switchScreen('start');
    });

    this.btnRestart.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.restartCurrentLevel();
    });

    this.btnNewMaze.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.initNewGame();
    });

    this.btnSolveDFS.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.runSolver('DFS');
    });

    this.btnSolveBFS.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.runSolver('BFS');
    });

    this.btnClearSolution.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.clearSolutionMarkers();
    });

    this.btnGameHelp.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.showModal('instructions');
    });
    this.btnCloseModal.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.hideModal('instructions');
    });
    this.btnModalGotIt.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.hideModal('instructions');
    });

    // Win Modal actions
    this.btnWinReplay.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.hideModal('win');
      this.restartCurrentLevel();
    });
    this.btnWinNext.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.hideModal('win');
      this.initNewGame();
    });

    // Speed slider
    this.speedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const labels = ['', 'Slow', 'Normal', 'Brisk', 'Fast', 'Instant'];
      this.speedLabel.textContent = labels[val] || 'Normal';
    });
    this.speedSlider.addEventListener('change', (e) => {
      e.currentTarget.blur();
    });

    // Sound toggle
    this.btnSoundToggle.addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.sound.enabled = !this.sound.enabled;
      this.soundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
    });

    // Canvas click releases any input focus
    this.canvas.addEventListener('mousedown', () => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });

    // Keyboard navigation (WASD + Arrow Keys)
    window.addEventListener('keydown', (e) => {
      const validNavKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'
      ];

      if (!validNavKeys.includes(e.key)) return;

      // Always blur any focused button or element so cursor/menu never gets stuck
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }

      e.preventDefault();

      if (!this.isGameActive || this.isSolving) return;

      let dr = 0;
      let dc = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dr = -1; break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dr = 1; break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dr = -0; dc = -1; break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dr = 0; dc = 1; break;
        default:
          return;
      }
      this.handlePlayerMove(dr, dc);
    });

    // On-screen D-Pad for Mobile & Mouse clicks
    document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.isGameActive || this.isSolving) return;
        const dir = btn.getAttribute('data-dir');
        let dr = 0, dc = 0;
        if (dir === 'up') dr = -1;
        if (dir === 'down') dr = 1;
        if (dir === 'left') dc = -1;
        if (dir === 'right') dc = 1;
        this.handlePlayerMove(dr, dc);
      });
    });

    // Close modals on escape key or clicking backdrop
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal('instructions');
        this.hideModal('win');
      }
    });

    [this.instructionsModal, this.winModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Responsive Canvas Resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setDifficulty(diff) {
    if (!DIFFICULTY_CONFIG[diff]) return;
    this.difficulty = diff;

    // Sync Start Screen difficulty pills
    document.querySelectorAll('#start-difficulty-picker .btn-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-difficulty') === diff);
    });

    // Sync In-Game difficulty chips
    document.querySelectorAll('#game-difficulty-picker .btn-diff-chip').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-difficulty') === diff);
    });
  }

  setRouteMode(mode) {
    this.routeMode = mode;

    // Sync Start Screen route pills
    document.querySelectorAll('#start-route-picker .btn-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-route') === mode);
    });

    // Sync In-Game route chips
    document.querySelectorAll('#game-route-picker .btn-diff-chip').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-route') === mode);
    });

    if (this.teleRoutes) {
      this.teleRoutes.textContent = mode === 'multi' ? 'Multi-Route' : 'Single-Path';
    }
  }

  /* --------------------------------------------------------------------------
     SCREEN & MODAL CONTROLS
     -------------------------------------------------------------------------- */
  switchScreen(screenName) {
    if (screenName === 'start') {
      this.startScreen.classList.add('active');
      this.gameScreen.classList.remove('active');
    } else {
      this.startScreen.classList.remove('active');
      this.gameScreen.classList.add('active');
      this.resizeCanvas();
    }
  }

  showModal(name) {
    if (name === 'instructions') this.instructionsModal.classList.remove('hidden');
    if (name === 'win') this.winModal.classList.remove('hidden');
  }

  hideModal(name) {
    if (name === 'instructions') this.instructionsModal.classList.add('hidden');
    if (name === 'win') this.winModal.classList.add('hidden');
  }

  setStatus(msg, type = 'info') {
    this.statusBanner.className = `status-banner ${type}`;
    this.statusBanner.innerHTML = msg;
  }

  /* --------------------------------------------------------------------------
     CANVAS SIZING & RENDERING
     -------------------------------------------------------------------------- */
  resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    const maxDim = Math.min(container.clientWidth - 32, window.innerHeight - 240, 600);
    const size = Math.max(280, Math.floor(maxDim));
    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = size / this.cols;
    this.drawMaze();
  }

  /* --------------------------------------------------------------------------
     MAZE INITIALIZATION & LEVEL SETUP
     -------------------------------------------------------------------------- */
  initNewGame() {
    this.cancelSolver();

    const cfg = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.medium;
    this.rows = cfg.rows;
    this.cols = cfg.cols;
    this.score = cfg.baseScore;

    this.startPos = { r: 1, c: 1 };
    this.exitPos = { r: this.rows - 2, c: this.cols - 2 };
    this.playerPos = { r: this.startPos.r, c: this.startPos.c };

    this.moves = 0;
    this.timerSeconds = 0;
    this.visitedCells = [];
    this.solutionPath = [];
    this.lastDfsSteps = null;
    this.lastBfsSteps = null;

    // Reset HUD
    this.hudDifficulty.textContent = cfg.label.split(' ')[0];
    this.hudMoves.textContent = '0';
    this.hudTimer.textContent = '00:00';
    this.hudScore.textContent = this.score.toString();

    // Reset Telemetry
    this.teleAlgo.textContent = '-';
    this.teleVisited.textContent = '0';
    this.telePathLength.textContent = '0';
    if (this.teleRoutes) {
      this.teleRoutes.textContent = this.routeMode === 'multi' ? 'Multi-Route' : 'Single-Path';
    }
    this.btnClearSolution.disabled = true;

    // Generate Randomized Maze
    this.generateRandomMaze();

    this.resizeCanvas();
    this.startTimer();
    this.isGameActive = true;
    if (this.routeMode === 'multi') {
      this.setStatus('🔀 <strong>Strong Multi-Route Puzzle Active!</strong> Multiple routes & shortcuts to Exit (<span class="badge-inline exit">E</span>).', 'info');
    } else {
      this.setStatus('Reach the Exit (<span class="badge-inline exit">E</span>)! Use Arrow keys / WASD.', 'info');
    }
  }

  restartCurrentLevel() {
    this.cancelSolver();
    this.playerPos = { r: this.startPos.r, c: this.startPos.c };
    this.moves = 0;
    this.timerSeconds = 0;
    this.clearSolutionMarkers();
    this.lastDfsSteps = null;
    this.lastBfsSteps = null;

    const cfg = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.medium;
    this.score = cfg.baseScore;

    this.hudMoves.textContent = '0';
    this.hudTimer.textContent = '00:00';
    this.hudScore.textContent = this.score.toString();

    this.startTimer();
    this.isGameActive = true;
    this.setStatus('Level reset to Start (<span class="badge-inline start">S</span>). Good luck!', 'info');
    this.drawMaze();
  }

  /* --------------------------------------------------------------------------
     ALGORITHM 1: RANDOMIZED MAZE GENERATOR (WITH MULTI-ROUTE BRAIDING)
     --------------------------------------------------------------------------
     Generates:
     - Single-Path Mode: Perfect Tree Maze (exactly 1 solution)
     - Multi-Route Mode: Strong Braid Graph with multiple competing paths,
                         loops, bypasses, and alternate shortcuts to Exit.
     -------------------------------------------------------------------------- */
  generateRandomMaze() {
    // Step 1: Initialize full grid as solid walls ('#')
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(CELL.WALL)
    );

    // Step 2: Initialize explicit Stack for backtracking
    const stack = new Stack();

    // Starting cell for generator: (1, 1)
    const startR = 1;
    const startC = 1;
    this.grid[startR][startC] = CELL.PATH;
    stack.push({ r: startR, c: startC });

    // Step 3: While stack is not empty, carve unvisited neighbors 2 cells away
    while (!stack.isEmpty()) {
      const current = stack.peek();
      const neighbors = [];

      // Probe 4 cardinal directions at distance 2
      for (const [dr, dc] of DIRECTIONS) {
        const nr = current.r + dr * 2;
        const nc = current.c + dc * 2;

        // Verify within maze boundaries and currently a solid wall
        if (nr > 0 && nr < this.rows - 1 && nc > 0 && nc < this.cols - 1) {
          if (this.grid[nr][nc] === CELL.WALL) {
            neighbors.push({ r: nr, c: nc, wallR: current.r + dr, wallC: current.c + dc });
          }
        }
      }

      if (neighbors.length > 0) {
        // Randomly pick one unvisited neighbor
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Carve through the wall in between
        this.grid[chosen.wallR][chosen.wallC] = CELL.PATH;
        // Carve the target neighbor cell
        this.grid[chosen.r][chosen.c] = CELL.PATH;

        // Push new cell onto stack
        stack.push({ r: chosen.r, c: chosen.c });
      } else {
        // Dead end encountered: backtrack by popping stack
        stack.pop();
      }
    }

    // Step 4: Ensure Start (S) and Exit (E) cells are explicitly carved open
    this.grid[this.startPos.r][this.startPos.c] = CELL.START;
    this.grid[this.exitPos.r][this.exitPos.c] = CELL.EXIT;

    // Guarantee exit has at least one open entrance
    if (this.grid[this.exitPos.r - 1][this.exitPos.c] === CELL.WALL &&
        this.grid[this.exitPos.r][this.exitPos.c - 1] === CELL.WALL) {
      this.grid[this.exitPos.r - 1][this.exitPos.c] = CELL.PATH;
    }

    // Step 5: Inject Multiple Competing Routes & Shortcuts if in Multi-Route mode
    if (this.routeMode === 'multi') {
      this.injectMultipleRoutes();
    }
  }

  /**
   * Transforms the spanning tree into a Strong Multi-Route Puzzle (Braid Graph):
   * 1. Eliminates dead-ends to create circular bypasses and loops.
   * 2. Knocks down strategic internal divider walls to create multiple arteries.
   * 3. Opens multiple diverging corridors at Start and multiple arrivals at Exit.
   */
  injectMultipleRoutes() {
    // 1. Loop Creation & Dead-End Elimination (Braiding)
    const deadEnds = [];
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.grid[r][c] !== CELL.WALL) {
          let wallCount = 0;
          for (const [dr, dc] of DIRECTIONS) {
            if (this.grid[r + dr][c + dc] === CELL.WALL) wallCount++;
          }
          if (wallCount >= 3) {
            deadEnds.push({ r, c });
          }
        }
      }
    }

    // Connect ~75% of dead-ends to neighboring passages
    deadEnds.sort(() => Math.random() - 0.5);
    const toOpen = Math.floor(deadEnds.length * 0.75);
    for (let i = 0; i < toOpen; i++) {
      const de = deadEnds[i];
      const validWalls = [];
      for (const [dr, dc] of DIRECTIONS) {
        const wr = de.r + dr;
        const wc = de.c + dc;
        const beyondR = de.r + dr * 2;
        const beyondC = de.c + dc * 2;
        if (beyondR > 0 && beyondR < this.rows - 1 && beyondC > 0 && beyondC < this.cols - 1) {
          if (this.grid[wr][wc] === CELL.WALL && this.grid[beyondR][beyondC] !== CELL.WALL) {
            validWalls.push({ wr, wc });
          }
        }
      }
      if (validWalls.length > 0) {
        const chosen = validWalls[Math.floor(Math.random() * validWalls.length)];
        this.grid[chosen.wr][chosen.wc] = CELL.PATH;
      }
    }

    // 2. Interior Corridor Cross-Connectors (Creates multiple macro routes)
    const dividerWalls = [];
    for (let r = 2; r < this.rows - 2; r++) {
      for (let c = 2; c < this.cols - 2; c++) {
        if (this.grid[r][c] === CELL.WALL) {
          const verticalPath = (this.grid[r - 1][c] !== CELL.WALL && this.grid[r + 1][c] !== CELL.WALL);
          const horizontalPath = (this.grid[r][c - 1] !== CELL.WALL && this.grid[r][c + 1] !== CELL.WALL);

          if ((verticalPath && !horizontalPath) || (horizontalPath && !verticalPath)) {
            dividerWalls.push({ r, c });
          }
        }
      }
    }

    dividerWalls.sort(() => Math.random() - 0.5);
    const removeCount = Math.floor(dividerWalls.length * 0.16);
    for (let i = 0; i < removeCount; i++) {
      const w = dividerWalls[i];
      this.grid[w.r][w.c] = CELL.PATH;
    }

    // 3. Ensure multiple branching routes directly from Start and into Exit
    // Near Start (1, 1):
    if (this.grid[1][2] === CELL.WALL && this.grid[1][3] !== CELL.WALL) this.grid[1][2] = CELL.PATH;
    if (this.grid[2][1] === CELL.WALL && this.grid[3][1] !== CELL.WALL) this.grid[2][1] = CELL.PATH;

    // Near Exit (R-2, C-2):
    const er = this.exitPos.r;
    const ec = this.exitPos.c;
    if (er - 2 > 0 && this.grid[er - 2][ec] !== CELL.WALL) this.grid[er - 1][ec] = CELL.PATH;
    if (ec - 2 > 0 && this.grid[er][ec - 2] !== CELL.WALL) this.grid[er][ec - 1] = CELL.PATH;

    // Preserve Start and Exit token cells
    this.grid[this.startPos.r][this.startPos.c] = CELL.START;
    this.grid[this.exitPos.r][this.exitPos.c] = CELL.EXIT;
  }

  /* --------------------------------------------------------------------------
     ALGORITHM 2: DEPTH-FIRST SEARCH (DFS) MAZE SOLVER
     --------------------------------------------------------------------------
     Uses: Stack (LIFO) & 2D boolean visited array
     Exploration Order: Up, Right, Down, Left
     Time Complexity:  O(V + E) = O(R × C)
     Space Complexity: O(R × C)
     -------------------------------------------------------------------------- */
  async solveDFS(animate = true) {
    if (this.teleAlgo) this.teleAlgo.textContent = 'DFS (Stack)';
    if (this.teleRoutes) this.teleRoutes.textContent = this.routeMode === 'multi' ? 'Multi-Route' : 'Single-Path';

    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    const parentMap = new Map(); // key: 'r,c' -> value: {r, c}

    const stack = new Stack();
    stack.push(this.startPos);
    visited[this.startPos.r][this.startPos.c] = true;

    this.visitedCells = [];
    let found = false;

    const delayMs = this.getDelayMs();

    while (!stack.isEmpty()) {
      if (this.abortController && this.abortController.signal.aborted) return null;

      const current = stack.pop();
      this.visitedCells.push(current);

      // Telemetry update
      this.teleVisited.textContent = this.visitedCells.length.toString();

      // Check if exit is reached
      if (current.r === this.exitPos.r && current.c === this.exitPos.c) {
        found = true;
        break;
      }

      // Animate step
      if (animate && delayMs > 0) {
        this.drawMaze();
        this.sound.solveStep();
        await this.sleep(delayMs);
      }

      // Check 4 cardinal directions (Up, Right, Down, Left)
      // Reverse array so Up is popped first from stack
      const reversedDirs = [...DIRECTIONS].reverse();
      for (const [dr, dc] of reversedDirs) {
        const nr = current.r + dr;
        const nc = current.c + dc;

        if (this.isValidCell(nr, nc) && !visited[nr][nc]) {
          visited[nr][nc] = true;
          parentMap.set(`${nr},${nc}`, current);
          stack.push({ r: nr, c: nc });
        }
      }
    }

    if (!found) return null;

    // Backtrack from Exit to Start using parentMap to reconstruct path
    const path = [];
    let curr = this.exitPos;
    while (curr) {
      path.push(curr);
      if (curr.r === this.startPos.r && curr.c === this.startPos.c) break;
      curr = parentMap.get(`${curr.r},${curr.c}`);
    }
    path.reverse();
    return path;
  }

  /* --------------------------------------------------------------------------
     ALGORITHM 3: BREADTH-FIRST SEARCH (BFS) MAZE SOLVER
     --------------------------------------------------------------------------
     Uses: Queue (FIFO) & 2D boolean visited array
     Guarantees: Shortest Path in an unweighted grid graph
     Time Complexity:  O(V + E) = O(R × C)
     Space Complexity: O(R × C)
     -------------------------------------------------------------------------- */
  async solveBFS(animate = true) {
    if (this.teleAlgo) this.teleAlgo.textContent = 'BFS (Queue)';
    if (this.teleRoutes) this.teleRoutes.textContent = this.routeMode === 'multi' ? 'Multi-Route' : 'Single-Path';

    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    const parentMap = new Map();

    const queue = new Queue();
    queue.enqueue(this.startPos);
    visited[this.startPos.r][this.startPos.c] = true;

    this.visitedCells = [];
    let found = false;

    const delayMs = this.getDelayMs();

    while (!queue.isEmpty()) {
      if (this.abortController && this.abortController.signal.aborted) return null;

      const current = queue.dequeue();
      this.visitedCells.push(current);

      this.teleVisited.textContent = this.visitedCells.length.toString();

      if (current.r === this.exitPos.r && current.c === this.exitPos.c) {
        found = true;
        break;
      }

      if (animate && delayMs > 0) {
        this.drawMaze();
        this.sound.solveStep();
        await this.sleep(delayMs);
      }

      for (const [dr, dc] of DIRECTIONS) {
        const nr = current.r + dr;
        const nc = current.c + dc;

        if (this.isValidCell(nr, nc) && !visited[nr][nc]) {
          visited[nr][nc] = true;
          parentMap.set(`${nr},${nc}`, current);
          queue.enqueue({ r: nr, c: nc });
        }
      }
    }

    if (!found) return null;

    // Reconstruct shortest path
    const path = [];
    let curr = this.exitPos;
    while (curr) {
      path.push(curr);
      if (curr.r === this.startPos.r && curr.c === this.startPos.c) break;
      curr = parentMap.get(`${curr.r},${curr.c}`);
    }
    path.reverse();
    return path;
  }

  /* --------------------------------------------------------------------------
     SOLVER RUNNER & ANIMATION DISPATCHER
     -------------------------------------------------------------------------- */
  async runSolver(algoName) {
    if (this.isSolving) return;

    this.cancelSolver();
    this.clearSolutionMarkers();
    this.isSolving = true;
    this.abortController = new AbortController();

    this.btnSolveDFS.disabled = true;
    this.btnSolveBFS.disabled = true;
    this.btnClearSolution.disabled = false;

    this.setStatus(`Running <strong>${algoName}</strong> algorithm... Exploring maze graph.`, 'info');

    const startTime = performance.now();
    let path = null;

    try {
      if (algoName === 'DFS') {
        path = await this.solveDFS(true);
      } else {
        path = await this.solveBFS(true);
      }

      if (this.abortController && this.abortController.signal.aborted) {
        return;
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);

      if (path && path.length > 0) {
        this.solutionPath = path;
        this.telePathLength.textContent = path.length.toString();

        if (algoName === 'DFS') {
          this.lastDfsSteps = path.length;
        } else {
          this.lastBfsSteps = path.length;
        }

        if (this.routeMode === 'multi' && this.lastDfsSteps && this.lastBfsSteps) {
          if (this.lastBfsSteps < this.lastDfsSteps) {
            this.setStatus(`✅ <strong>BFS found the shortest route!</strong> (${this.lastBfsSteps} steps vs. DFS route of ${this.lastDfsSteps} steps — ${this.lastDfsSteps - this.lastBfsSteps} steps saved!).`, 'success');
          } else {
            this.setStatus(`✅ <strong>${algoName} Solved!</strong> Route length: ${path.length} steps (${duration}s). Both algorithms found equivalent paths.`, 'success');
          }
        } else if (this.routeMode === 'multi') {
          this.setStatus(`✅ <strong>${algoName} Solved!</strong> Route length: ${path.length} steps (${duration}s). Try running the other solver to compare routes!`, 'success');
        } else {
          this.setStatus(`✅ <strong>${algoName} Solved!</strong> Path length: ${path.length} steps (${duration}s).`, 'success');
        }

        // Animate solution path trace
        for (const node of path) {
          if (this.abortController && this.abortController.signal.aborted) break;
          this.drawMaze();
          this.sound.pathHighlight();
          await this.sleep(20);
        }
        this.drawMaze();
      } else {
        this.setStatus('⚠️ <strong>No Path Found!</strong> Start and Exit are disconnected.', 'warning');
        this.telePathLength.textContent = '0';
      }
    } catch (e) {
      console.error('Solver error:', e);
      this.setStatus(`⚠️ Solver encountered an error: ${e.message}`, 'warning');
    } finally {
      this.isSolving = false;
      this.btnSolveDFS.disabled = false;
      this.btnSolveBFS.disabled = false;
    }
  }

  cancelSolver() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isSolving = false;
    this.btnSolveDFS.disabled = false;
    this.btnSolveBFS.disabled = false;
  }

  clearSolutionMarkers() {
    this.cancelSolver();
    this.visitedCells = [];
    this.solutionPath = [];
    this.teleVisited.textContent = '0';
    this.telePathLength.textContent = '0';
    this.teleAlgo.textContent = '-';
    this.btnClearSolution.disabled = true;
    this.drawMaze();
  }

  isValidCell(r, c) {
    return (
      r >= 0 && r < this.rows &&
      c >= 0 && c < this.cols &&
      this.grid[r][c] !== CELL.WALL
    );
  }

  getDelayMs() {
    const val = parseInt(this.speedSlider.value, 10);
    switch (val) {
      case 1: return 80;  // Slow
      case 2: return 40;  // Normal
      case 3: return 20;  // Brisk
      case 4: return 8;   // Fast
      case 5: return 0;   // Instantaneous
      default: return 12;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* --------------------------------------------------------------------------
     PLAYER INTERACTION & COLLISION DETECTION
     -------------------------------------------------------------------------- */
  handlePlayerMove(dr, dc) {
    const targetR = this.playerPos.r + dr;
    const targetC = this.playerPos.c + dc;

    // Check Boundary & Wall Collision
    if (
      targetR < 0 || targetR >= this.rows ||
      targetC < 0 || targetC >= this.cols ||
      this.grid[targetR][targetC] === CELL.WALL
    ) {
      // Collision with wall
      this.sound.bump();
      this.setStatus('💥 <strong>Bump!</strong> Cannot walk through walls (<span class="badge-inline wall">#</span>).', 'warning');
      return;
    }

    // Valid move
    this.playerPos.r = targetR;
    this.playerPos.c = targetC;
    this.moves++;
    this.hudMoves.textContent = this.moves.toString();

    // Deduct move points
    this.score = Math.max(50, this.score - 2);
    this.hudScore.textContent = this.score.toString();

    this.sound.step();
    this.drawMaze();

    // Check Win Condition: Player reaches Exit
    if (this.playerPos.r === this.exitPos.r && this.playerPos.c === this.exitPos.c) {
      this.handleWin();
    }
  }

  handleWin() {
    this.isGameActive = false;
    this.stopTimer();
    this.sound.win();

    // Final score calculation
    const timeBonus = Math.max(0, 300 - this.timerSeconds * 5);
    const finalScore = this.score + timeBonus;

    document.getElementById('win-time').textContent = this.hudTimer.textContent;
    document.getElementById('win-moves').textContent = this.moves.toString();
    document.getElementById('win-score').textContent = finalScore.toString();

    this.setStatus('🏆 <strong>Victory!</strong> You successfully navigated the maze!', 'success');
    setTimeout(() => this.showModal('win'), 400);
  }

  /* --------------------------------------------------------------------------
     GAME TIMER
     -------------------------------------------------------------------------- */
  startTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
      this.hudTimer.textContent = `${mins}:${secs}`;

      // Decrement score over time
      if (this.timerSeconds % 2 === 0 && this.score > 100) {
        this.score--;
        this.hudScore.textContent = this.score.toString();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /* --------------------------------------------------------------------------
     GRAPHICAL CANVAS DRAWING ENGINE
     -------------------------------------------------------------------------- */
  drawMaze() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cs = this.cellSize;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Base Grid (Walls & Paths)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * cs;
        const y = r * cs;

        if (this.grid[r][c] === CELL.WALL) {
          // Wall styling (#)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, cs, cs);

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cs, cs);
        } else {
          // Empty Path corridor
          ctx.fillStyle = '#090d16';
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }

    // 2. Draw Visited Exploration Cells (Subtle Cyan pulses)
    if (this.visitedCells.length > 0) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
      for (const cell of this.visitedCells) {
        ctx.fillRect(cell.c * cs + 1, cell.r * cs + 1, cs - 2, cs - 2);
      }
    }

    // 3. Draw Solved Path Nodes (Amber Gold Trail)
    if (this.solutionPath.length > 0) {
      ctx.fillStyle = '#f59e0b';
      for (const node of this.solutionPath) {
        const cx = node.c * cs + cs / 2;
        const cy = node.r * cs + cs / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, cs * 0.22), 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connecting path line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = Math.max(2, cs * 0.28);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < this.solutionPath.length; i++) {
        const pt = this.solutionPath[i];
        const px = pt.c * cs + cs / 2;
        const py = pt.r * cs + cs / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 4. Draw Start Cell ('S')
    this.drawTokenCell(this.startPos.r, this.startPos.c, '#10b981', 'S');

    // 5. Draw Exit Cell ('E')
    this.drawTokenCell(this.exitPos.r, this.exitPos.c, '#f59e0b', 'E');

    // 6. Draw Player Token ('P')
    this.drawPlayerToken(this.playerPos.r, this.playerPos.c);
  }

  drawTokenCell(r, c, color, label) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const x = c * cs;
    const y = r * cs;

    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(10, Math.floor(cs * 0.58))}px 'Fira Code', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + cs / 2, y + cs / 2 + 1);
  }

  drawPlayerToken(r, c) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const cx = c * cs + cs / 2;
    const cy = r * cs + cs / 2;
    const radius = Math.max(4, cs * 0.38);

    // Glowing aura
    const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 1.5);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 1)');
    gradient.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Player core circle
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Center icon/letter
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.max(9, Math.floor(cs * 0.48))}px 'Fira Code', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', cx, cy + 1);
  }
}

/* ============================================================================
   5. GAME BOOTSTRAP
   ============================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const game = new MazeGame();
});
