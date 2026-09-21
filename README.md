# 🎮 Maze Solver Game Using Data Structures and Algorithms (DSA)
**BCA 2nd-Year College Project | Academic Practical Submission**

An interactive, educational Maze Solver Game demonstrating core Data Structures and Algorithms:
- **2D Array / Matrix**: Spatial representation of walls (`#`), paths, start (`S`), exit (`E`), and player (`P`).
- **Stack (LIFO)**: Powers Depth-First Search (DFS) and randomized maze generation with backtracking.
- **Queue (FIFO)**: Powers Breadth-First Search (BFS) to guarantee the shortest path.
- **2D Visited Array**: Prevents infinite cycles during graph traversal.
- **Web Audio API**: Real-time synthesized audio feedback for steps, bumps, solver pulses, and victory.

---

## 📂 Project Structure

```
c:\Users\prate\OneDrive\Desktop\GAME\
│
├── index.html               # Web Game Interface (Start Screen, Game Grid, HUD, Modals)
├── style.css                # Modern, responsive styling with Dark Theme & Animations
├── script.js                # Core JavaScript Game Engine & DSA Implementations (Stack, Queue, DFS, BFS)
├── maze_game.py             # Standalone Python 3 Tkinter Desktop Application + CLI fallback
├── PROJECT_DOCUMENTATION.md # Complete 22-section BCA academic report with flowcharts & viva Q&As
└── README.md                # Quick start guide and overview
```

---

## 🚀 How to Run the Project

### Option A: Web Version (Recommended & Zero Installation)
1. Double-click [`index.html`](file:///c:/Users/prate/OneDrive/Desktop/GAME/index.html) in your file manager to open it in Google Chrome, Microsoft Edge, Firefox, or Safari.
2. Click **Start Game** and navigate using **Arrow Keys** or **W, A, S, D**.
3. Press **"Solve with DFS"** or **"Solve with BFS"** to watch the algorithms explore the maze in real time!

### Option B: Python Desktop Version
1. Open Command Prompt / PowerShell in this directory:
   ```bash
   cd "c:\Users\prate\OneDrive\Desktop\GAME"
   ```
2. Run using Python 3:
   ```bash
   python maze_game.py
   ```
3. To run in terminal ASCII mode:
   ```bash
   python maze_game.py --cli
   ```

---

## 📘 Documentation & College Submission
The file [`PROJECT_DOCUMENTATION.md`](file:///c:/Users/prate/OneDrive/Desktop/GAME/PROJECT_DOCUMENTATION.md) contains the complete academic project report ready for submission, including:
- Abstract, Introduction & Problem Statement
- Hardware and Software Requirements
- Data Structures & Algorithms Explanations
- Time & Space Complexity Derivations ($\mathcal{O}(R \times C)$)
- Mermaid & ASCII Flowcharts
- Test Cases & Test Matrix (9 scenarios)
- 20 High-Frequency Practical Viva Voce Questions with In-Depth Answers
