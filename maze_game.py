#!/usr/bin/env python3
"""
================================================================================
MAZE SOLVER GAME USING DATA STRUCTURES AND ALGORITHMS (DSA)
Bachelor of Computer Applications (BCA) - 2nd Year College Project
Author: BCA Student
Technologies: Python 3, Tkinter GUI, Standard Library

Core DSA Demonstrated:
1. 2D Array / List Matrix [Rows x Cols]
2. Custom Stack Class (LIFO) for DFS & Backtracking
3. Custom Queue Class (FIFO) for BFS (Shortest Path)
4. Randomized Depth-First Search Maze Generation
5. Visited Boolean 2D Matrix for Cycle Elimination
================================================================================
"""

import sys
import time
import random
from collections import deque

# Attempt importing Tkinter; if unavailable, a terminal ASCII mode is provided
try:
    import tkinter as tk
    from tkinter import messagebox, ttk
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False


# ==============================================================================
# 1. DATA STRUCTURES IMPLEMENTATIONS
# ==============================================================================

class Stack:
    """
    Stack Data Structure (LIFO - Last In, First Out).
    Implements fundamental operations: push, pop, peek, is_empty, size.
    Used in Depth-First Search (DFS) and Maze Backtracking.
    """
    def __init__(self):
        self._items = []

    def push(self, item):
        """Add item to top of stack - O(1)"""
        self._items.append(item)

    def pop(self):
        """Remove and return top item - O(1)"""
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        """Return top item without removing - O(1)"""
        if self.is_empty():
            return None
        return self._items[-1]

    def is_empty(self):
        """Check if stack is empty - O(1)"""
        return len(self._items) == 0

    def size(self):
        """Return total items in stack - O(1)"""
        return len(self._items)

    def clear(self):
        """Clear all items - O(1)"""
        self._items.clear()


class Queue:
    """
    Queue Data Structure (FIFO - First In, First Out).
    Implements fundamental operations: enqueue, dequeue, front, is_empty, size.
    Used in Breadth-First Search (BFS) to guarantee the shortest path.
    """
    def __init__(self):
        self._items = deque()

    def enqueue(self, item):
        """Add item to rear of queue - O(1)"""
        self._items.append(item)

    def dequeue(self):
        """Remove and return front item - O(1)"""
        if self.is_empty():
            raise IndexError("dequeue from empty queue")
        return self._items.popleft()

    def front(self):
        """Return front item without removing - O(1)"""
        if self.is_empty():
            return None
        return self._items[0]

    def is_empty(self):
        """Check if queue is empty - O(1)"""
        return len(self._items) == 0

    def size(self):
        """Return total items in queue - O(1)"""
        return len(self._items)

    def clear(self):
        """Clear all items - O(1)"""
        self._items.clear()


# ==============================================================================
# 2. CONSTANTS & CELL CODES
# ==============================================================================
WALL = '#'
PATH = ' '
START = 'S'
EXIT = 'E'
PLAYER = 'P'
VISITED = '.'
SOLUTION = '*'

DIRECTIONS = [
    (-1, 0, 'Up'),
    (0, 1, 'Right'),
    (1, 0, 'Down'),
    (0, -1, 'Left')
]


# ==============================================================================
# 3. MAZE GENERATION & SOLVER ENGINE
# ==============================================================================

class MazeEngine:
    """
    Handles 2D Grid representation, Randomized DFS generation,
    and automatic DFS/BFS solving algorithms.
    """
    def __init__(self, rows=19, cols=19, route_mode='multi'):
        # Enforce odd dimensions for wall/cell grid structure
        self.rows = rows if rows % 2 != 0 else rows + 1
        self.cols = cols if cols % 2 != 0 else cols + 1
        self.route_mode = route_mode  # 'multi' (many routes) vs 'single' (classic tree)
        self.start = (1, 1)
        self.exit = (self.rows - 2, self.cols - 2)
        self.grid = []
        self.generate_maze()

    def generate_maze(self):
        """
        Algorithm: Randomized Depth-First Search with Backtracking
        Time Complexity:  O(R * C)
        Space Complexity: O(R * C)
        Generates either a pure spanning tree (single path) or a strong
        multi-route braid graph with loops and shortcuts to exit.
        """
        # Step 1: Fill entire 2D matrix with solid walls ('#')
        self.grid = [[WALL for _ in range(self.cols)] for _ in range(self.rows)]

        stack = Stack()
        start_r, start_c = self.start
        self.grid[start_r][start_c] = PATH
        stack.push((start_r, start_c))

        while not stack.is_empty():
            curr_r, curr_c = stack.peek()
            neighbors = []

            # Check neighbors 2 units away in 4 cardinal directions
            for dr, dc, _ in DIRECTIONS:
                nr, nc = curr_r + dr * 2, curr_c + dc * 2
                if 0 < nr < self.rows - 1 and 0 < nc < self.cols - 1:
                    if self.grid[nr][nc] == WALL:
                        neighbors.append((nr, nc, curr_r + dr, curr_c + dc))

            if neighbors:
                # Randomly choose an unvisited neighbor
                nr, nc, wall_r, wall_c = random.choice(neighbors)
                # Knock down the intermediate wall and the neighbor cell
                self.grid[wall_r][wall_c] = PATH
                self.grid[nr][nc] = PATH
                stack.push((nr, nc))
            else:
                # Backtrack when dead end is reached
                stack.pop()

        # Step 2: Explicitly mark Start (S) and Exit (E)
        self.grid[self.start[0]][self.start[1]] = START
        self.grid[self.exit[0]][self.exit[1]] = EXIT

        # Ensure entrance to exit is clear
        er, ec = self.exit
        if self.grid[er - 1][ec] == WALL and self.grid[er][ec - 1] == WALL:
            self.grid[er - 1][ec] = PATH

        # Step 3: Inject Multiple Competing Routes & Shortcuts if in Multi-Route mode
        if self.route_mode == 'multi':
            self.inject_multiple_routes()

    def inject_multiple_routes(self):
        """Creates multiple routes, loops, and shortcuts to achieve finish point."""
        # 1. Eliminate ~75% of dead ends (Braiding)
        dead_ends = []
        for r in range(1, self.rows - 1):
            for c in range(1, self.cols - 1):
                if self.grid[r][c] != WALL:
                    walls = sum(1 for dr, dc, _ in DIRECTIONS if self.grid[r + dr][c + dc] == WALL)
                    if walls >= 3:
                        dead_ends.append((r, c))

        random.shuffle(dead_ends)
        for r, c in dead_ends[:int(len(dead_ends) * 0.75)]:
            candidates = []
            for dr, dc, _ in DIRECTIONS:
                wr, wc = r + dr, c + dc
                br, bc = r + dr * 2, c + dc * 2
                if 0 < br < self.rows - 1 and 0 < bc < self.cols - 1:
                    if self.grid[wr][wc] == WALL and self.grid[br][bc] != WALL:
                        candidates.append((wr, wc))
            if candidates:
                wr, wc = random.choice(candidates)
                self.grid[wr][wc] = PATH

        # 2. Open internal corridor cross-connectors
        internal_walls = []
        for r in range(2, self.rows - 2):
            for c in range(2, self.cols - 2):
                if self.grid[r][c] == WALL:
                    vert = (self.grid[r - 1][c] != WALL and self.grid[r + 1][c] != WALL)
                    horiz = (self.grid[r][c - 1] != WALL and self.grid[r][c + 1] != WALL)
                    if (vert and not horiz) or (horiz and not vert):
                        internal_walls.append((r, c))

        random.shuffle(internal_walls)
        for r, c in internal_walls[:int(len(internal_walls) * 0.16)]:
            self.grid[r][c] = PATH

        # 3. Branching at Start and Exit
        if self.grid[1][2] == WALL and self.grid[1][3] != WALL: self.grid[1][2] = PATH
        if self.grid[2][1] == WALL and self.grid[3][1] != WALL: self.grid[2][1] = PATH
        er, ec = self.exit
        if er - 2 > 0 and self.grid[er - 2][ec] != WALL: self.grid[er - 1][ec] = PATH
        if ec - 2 > 0 and self.grid[er][ec - 2] != WALL: self.grid[er][ec - 1] = PATH

        self.grid[self.start[0]][self.start[1]] = START
        self.grid[self.exit[0]][self.exit[1]] = EXIT

    def solve_dfs(self):
        """
        Depth-First Search (DFS) Maze Solver using an explicit Stack.
        Time Complexity:  O(V + E) = O(R * C)
        Space Complexity: O(R * C) for visited tracking & stack
        Returns: (solution_path, visited_order)
        """
        visited = [[False for _ in range(self.cols)] for _ in range(self.rows)]
        parent = {}
        stack = Stack()
        visited_order = []

        stack.push(self.start)
        visited[self.start[0]][self.start[1]] = True
        found = False

        while not stack.is_empty():
            curr = stack.pop()
            visited_order.append(curr)

            if curr == self.exit:
                found = True
                break

            # Probe 4 directions (Up, Right, Down, Left)
            # Reverse order so Up is popped first
            for dr, dc, _ in reversed(DIRECTIONS):
                nr, nc = curr[0] + dr, curr[1] + dc
                if self.is_valid(nr, nc) and not visited[nr][nc]:
                    visited[nr][nc] = True
                    parent[(nr, nc)] = curr
                    stack.push((nr, nc))

        if not found:
            return None, visited_order

        # Reconstruct path by backtracking through parent dictionary
        path = []
        curr = self.exit
        while curr:
            path.append(curr)
            if curr == self.start:
                break
            curr = parent.get(curr)
        path.reverse()
        return path, visited_order

    def solve_bfs(self):
        """
        Breadth-First Search (BFS) Maze Solver using a Queue (FIFO).
        Guarantees the optimal shortest path.
        Time Complexity:  O(V + E) = O(R * C)
        Space Complexity: O(R * C)
        Returns: (shortest_path, visited_order)
        """
        visited = [[False for _ in range(self.cols)] for _ in range(self.rows)]
        parent = {}
        queue = Queue()
        visited_order = []

        queue.enqueue(self.start)
        visited[self.start[0]][self.start[1]] = True
        found = False

        while not queue.is_empty():
            curr = queue.dequeue()
            visited_order.append(curr)

            if curr == self.exit:
                found = True
                break

            for dr, dc, _ in DIRECTIONS:
                nr, nc = curr[0] + dr, curr[1] + dc
                if self.is_valid(nr, nc) and not visited[nr][nc]:
                    visited[nr][nc] = True
                    parent[(nr, nc)] = curr
                    queue.enqueue((nr, nc))

        if not found:
            return None, visited_order

        path = []
        curr = self.exit
        while curr:
            path.append(curr)
            if curr == self.start:
                break
            curr = parent.get(curr)
        path.reverse()
        return path, visited_order

    def is_valid(self, r, c):
        return (0 <= r < self.rows and
                0 <= c < self.cols and
                self.grid[r][c] != WALL)


# ==============================================================================
# 4. TKINTER GRAPHICAL USER INTERFACE (GUI)
# ==============================================================================

if TKINTER_AVAILABLE:
    class MazeGameGUI:
        def __init__(self, root):
            self.root = root
            self.root.title("Maze Solver Game - BCA DSA Project")
            self.root.geometry("860x720")
            self.root.configure(bg="#0f172a")

            # Difficulty configurations
            self.difficulties = {
                "Easy (11x11)": 11,
                "Medium (19x19)": 19,
                "Hard (27x27)": 27,
                "Expert (33x33)": 33
            }
            self.current_diff = "Medium (19x19)"

            # Initialize Game Engine
            self.engine = MazeEngine(rows=19, cols=19, route_mode='multi')
            self.player_pos = list(self.engine.start)
            self.moves = 0
            self.start_time = time.time()
            self.timer_running = True
            self.score = 1000

            self.visited_cells = []
            self.solution_path = []
            self.last_dfs_len = None
            self.last_bfs_len = None
            self.is_animating = False

            self.setup_ui()
            self.bind_keys()
            self.update_timer()
            self.draw_maze()

        def setup_ui(self):
            # Top Header Bar
            header_frame = tk.Frame(self.root, bg="#1e293b", pady=10, padx=20)
            header_frame.pack(fill=tk.X)

            title_label = tk.Label(
                header_frame,
                text="Maze Solver Game (DSA Project)",
                font=("Arial", 16, "bold"),
                fg="#38bdf8",
                bg="#1e293b"
            )
            title_label.pack(side=tk.LEFT)

            # HUD Display
            self.hud_frame = tk.Frame(header_frame, bg="#0f172a", padx=15, pady=4, relief=tk.RIDGE, bd=1)
            self.hud_frame.pack(side=tk.RIGHT)

            self.moves_label = tk.Label(self.hud_frame, text="Moves: 0", font=("Arial", 10, "bold"), fg="#f8fafc", bg="#0f172a")
            self.moves_label.pack(side=tk.LEFT, padx=10)

            self.timer_label = tk.Label(self.hud_frame, text="Time: 00:00", font=("Arial", 10, "bold"), fg="#f59e0b", bg="#0f172a")
            self.timer_label.pack(side=tk.LEFT, padx=10)

            self.score_label = tk.Label(self.hud_frame, text="Score: 1000", font=("Arial", 10, "bold"), fg="#10b981", bg="#0f172a")
            self.score_label.pack(side=tk.LEFT, padx=10)

            # Main Content Area
            content_frame = tk.Frame(self.root, bg="#0f172a", padx=20, pady=15)
            content_frame.pack(fill=tk.BOTH, expand=True)

            # Left Canvas for Maze
            self.canvas_size = 540
            self.canvas = tk.Canvas(
                content_frame,
                width=self.canvas_size,
                height=self.canvas_size,
                bg="#090d16",
                highlightthickness=1,
                highlightbackground="#334155"
            )
            self.canvas.pack(side=tk.LEFT, padx=(0, 20))

            # Right Sidebar Controls
            sidebar = tk.Frame(content_frame, bg="#1e293b", padx=16, pady=16, relief=tk.RIDGE, bd=1)
            sidebar.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

            # Difficulty Selector
            diff_label = tk.Label(sidebar, text="Difficulty Level:", font=("Arial", 10, "bold"), fg="#94a3b8", bg="#1e293b")
            diff_label.pack(anchor="w", pady=(0, 4))

            self.diff_var = tk.StringVar(value=self.current_diff)
            self.diff_menu = ttk.Combobox(sidebar, textvariable=self.diff_var, values=list(self.difficulties.keys()), state="readonly")
            self.diff_menu.pack(fill=tk.X, pady=(0, 10))
            self.diff_menu.bind("<<ComboboxSelected>>", self.change_difficulty)

            # Route Style Selector
            route_label = tk.Label(sidebar, text="Route Style:", font=("Arial", 10, "bold"), fg="#94a3b8", bg="#1e293b")
            route_label.pack(anchor="w", pady=(0, 4))

            self.route_var = tk.StringVar(value="Multi-Route (Strong)")
            self.route_menu = ttk.Combobox(sidebar, textvariable=self.route_var, values=["Multi-Route (Strong)", "Single-Path (Classic)"], state="readonly")
            self.route_menu.pack(fill=tk.X, pady=(0, 14))
            self.route_menu.bind("<<ComboboxSelected>>", self.change_route_mode)

            # Solvers Section
            solver_title = tk.Label(sidebar, text="Algorithms (Automatic Solvers):", font=("Arial", 10, "bold"), fg="#38bdf8", bg="#1e293b")
            solver_title.pack(anchor="w", pady=(0, 6))

            btn_dfs = tk.Button(sidebar, text="Solve with DFS (Stack)", font=("Arial", 10, "bold"), bg="#8b5cf6", fg="white", activebackground="#7c3aed", relief=tk.FLAT, pady=6, cursor="hand2", command=self.solve_dfs)
            btn_dfs.pack(fill=tk.X, pady=4)

            btn_bfs = tk.Button(sidebar, text="Solve with BFS (Queue)", font=("Arial", 10, "bold"), bg="#06b6d4", fg="white", activebackground="#0891b2", relief=tk.FLAT, pady=6, cursor="hand2", command=self.solve_bfs)
            btn_bfs.pack(fill=tk.X, pady=4)

            btn_clear = tk.Button(sidebar, text="Clear Solution Path", font=("Arial", 9), bg="#334155", fg="#f8fafc", activebackground="#475569", relief=tk.FLAT, pady=4, cursor="hand2", command=self.clear_solution)
            btn_clear.pack(fill=tk.X, pady=(4, 16))

            # Game Controls
            control_title = tk.Label(sidebar, text="Game Controls:", font=("Arial", 10, "bold"), fg="#94a3b8", bg="#1e293b")
            control_title.pack(anchor="w", pady=(0, 6))

            btn_new = tk.Button(sidebar, text="New Maze", font=("Arial", 10, "bold"), bg="#2563eb", fg="white", activebackground="#1d4ed8", relief=tk.FLAT, pady=6, cursor="hand2", command=self.new_maze)
            btn_new.pack(fill=tk.X, pady=4)

            btn_restart = tk.Button(sidebar, text="Restart Level", font=("Arial", 10), bg="#475569", fg="white", activebackground="#64748b", relief=tk.FLAT, pady=6, cursor="hand2", command=self.restart_level)
            btn_restart.pack(fill=tk.X, pady=4)

            btn_help = tk.Button(sidebar, text="Instructions & DSA", font=("Arial", 9), bg="#1e293b", fg="#94a3b8", relief=tk.GROOVE, pady=4, cursor="hand2", command=self.show_instructions)
            btn_help.pack(fill=tk.X, pady=(16, 4))

            # Status Banner at Bottom
            self.status_label = tk.Label(self.root, text="Use Arrow Keys or WASD to reach Exit (E).", font=("Arial", 10), fg="#94a3b8", bg="#0f172a", pady=6)
            self.status_label.pack(side=tk.BOTTOM, fill=tk.X)

        def bind_keys(self):
            for key in ("<Up>", "<w>", "<W>"):
                self.root.bind(key, lambda e: (self.root.focus_set(), self.move_player(-1, 0)))
            for key in ("<Down>", "<s>", "<S>"):
                self.root.bind(key, lambda e: (self.root.focus_set(), self.move_player(1, 0)))
            for key in ("<Left>", "<a>", "<A>"):
                self.root.bind(key, lambda e: (self.root.focus_set(), self.move_player(0, -1)))
            for key in ("<Right>", "<d>", "<D>"):
                self.root.bind(key, lambda e: (self.root.focus_set(), self.move_player(0, 1)))
            self.canvas.bind("<Button-1>", lambda e: self.root.focus_set())

        def change_difficulty(self, event=None):
            self.current_diff = self.diff_var.get()
            self.new_maze()
            self.root.focus_set()

        def change_route_mode(self, event=None):
            self.new_maze()
            self.root.focus_set()

        def new_maze(self):
            dim = self.difficulties[self.current_diff]
            mode = 'multi' if "Multi-Route" in self.route_var.get() else 'single'
            self.engine = MazeEngine(rows=dim, cols=dim, route_mode=mode)
            self.restart_level()

        def restart_level(self):
            self.player_pos = list(self.engine.start)
            self.moves = 0
            self.score = 1000
            self.start_time = time.time()
            self.timer_running = True
            self.visited_cells.clear()
            self.solution_path.clear()
            self.last_dfs_len = None
            self.last_bfs_len = None
            self.moves_label.config(text="Moves: 0")
            self.score_label.config(text=f"Score: {self.score}")
            self.status_label.config(text="Navigate to the exit (E)!", fg="#94a3b8")
            self.draw_maze()

        def move_player(self, dr, dc):
            if not self.timer_running or self.is_animating:
                return

            nr = self.player_pos[0] + dr
            nc = self.player_pos[1] + dc

            # Wall Collision Detection
            if self.engine.is_valid(nr, nc):
                self.player_pos = [nr, nc]
                self.moves += 1
                self.score = max(50, self.score - 2)
                self.moves_label.config(text=f"Moves: {self.moves}")
                self.score_label.config(text=f"Score: {self.score}")
                self.draw_maze()

                # Win Condition
                if tuple(self.player_pos) == self.engine.exit:
                    self.timer_running = False
                    total_time = int(time.time() - self.start_time)
                    mins, secs = divmod(total_time, 60)
                    msg = f"🏆 Congratulations! You solved the maze!\n\nTime: {mins:02d}:{secs:02d}\nMoves: {self.moves}\nFinal Score: {self.score}"
                    messagebox.showinfo("Victory!", msg)
                    self.status_label.config(text="Victory! Level complete.", fg="#10b981")
            else:
                self.status_label.config(text="💥 Bump! Wall ahead.", fg="#f43f5e")

        def solve_dfs(self):
            if self.is_animating:
                return
            path, visited = self.engine.solve_dfs()
            self.animate_solution(path, visited, "DFS (Stack)")

        def solve_bfs(self):
            if self.is_animating:
                return
            path, visited = self.engine.solve_bfs()
            self.animate_solution(path, visited, "BFS (Queue - Shortest Path)")

        def animate_solution(self, path, visited, algo_name):
            self.is_animating = True
            self.visited_cells.clear()
            self.solution_path.clear()

            self.status_label.config(text=f"Solving with {algo_name}...", fg="#38bdf8")

            def step_visit(idx=0):
                if idx < len(visited):
                    self.visited_cells.append(visited[idx])
                    self.draw_maze()
                    self.root.after(8, step_visit, idx + 1)
                else:
                    if path:
                        self.solution_path = path
                        self.draw_maze()
                        if "DFS" in algo_name:
                            self.last_dfs_len = len(path)
                        else:
                            self.last_bfs_len = len(path)

                        if self.last_dfs_len and self.last_bfs_len and "Multi-Route" in self.route_var.get():
                            diff = self.last_dfs_len - self.last_bfs_len
                            if diff > 0:
                                self.status_label.config(
                                    text=f"✅ BFS found the shortest route! ({self.last_bfs_len} steps vs DFS {self.last_dfs_len} steps — {diff} steps shorter!).",
                                    fg="#10b981"
                                )
                            else:
                                self.status_label.config(
                                    text=f"✅ {algo_name} Finished! Path length: {len(path)} steps.",
                                    fg="#10b981"
                                )
                        else:
                            self.status_label.config(
                                text=f"✅ {algo_name} Finished! Path length: {len(path)} steps (Multi-Route).",
                                fg="#10b981"
                            )
                    else:
                        self.status_label.config(text="⚠️ No Path Found!", fg="#f59e0b")
                    self.is_animating = False

            step_visit()

        def clear_solution(self):
            self.visited_cells.clear()
            self.solution_path.clear()
            self.draw_maze()
            self.status_label.config(text="Solution path cleared.", fg="#94a3b8")

        def update_timer(self):
            if self.timer_running:
                elapsed = int(time.time() - self.start_time)
                mins, secs = divmod(elapsed, 60)
                self.timer_label.config(text=f"Time: {mins:02d}:{secs:02d}")
            self.root.after(1000, self.update_timer)

        def show_instructions(self):
            info = (
                "MAZE SOLVER GAME - DATA STRUCTURES & ALGORITHMS\n\n"
                "• Controls:\n"
                "  - Up/Down/Left/Right or W/A/S/D to move.\n"
                "  - 'S' = Start cell (Green)\n"
                "  - 'E' = Exit cell (Gold)\n"
                "  - '#' = Solid Walls (Impassable)\n\n"
                "• Data Structures Used:\n"
                "  - 2D List Matrix: Represents the grid state.\n"
                "  - Stack (LIFO): Powers Depth-First Search (DFS) & Backtracking.\n"
                "  - Queue (FIFO): Powers Breadth-First Search (BFS).\n"
                "  - Visited 2D Array: Prevents infinite loops.\n\n"
                "• Algorithms:\n"
                "  - Randomized DFS: Generates perfect solvable mazes.\n"
                "  - DFS Solver: Finds path by exploring deeply.\n"
                "  - BFS Solver: Guarantees the shortest path."
            )
            messagebox.showinfo("Instructions & DSA Concepts", info)

        def draw_maze(self):
            self.canvas.delete("all")
            rows, cols = self.engine.rows, self.engine.cols
            cell_size = self.canvas_size / cols

            # 1. Base Grid (Walls & Paths)
            for r in range(rows):
                for c in range(cols):
                    x1, y1 = c * cell_size, r * cell_size
                    x2, y2 = x1 + cell_size, y1 + cell_size
                    cell_val = self.engine.grid[r][c]

                    if cell_val == WALL:
                        self.canvas.create_rectangle(x1, y1, x2, y2, fill="#1e293b", outline="#0f172a")
                    else:
                        self.canvas.create_rectangle(x1, y1, x2, y2, fill="#090d16", outline="#090d16")

            # 2. Visited Exploration Nodes
            for r, c in self.visited_cells:
                x1, y1 = c * cell_size + 1, r * cell_size + 1
                x2, y2 = x1 + cell_size - 2, y1 + cell_size - 2
                self.canvas.create_rectangle(x1, y1, x2, y2, fill="#164e63", outline="")

            # 3. Solved Path
            for r, c in self.solution_path:
                cx, cy = c * cell_size + cell_size / 2, r * cell_size + cell_size / 2
                rad = max(2, cell_size * 0.25)
                self.canvas.create_oval(cx - rad, cy - rad, cx + rad, cy + rad, fill="#fbbf24", outline="")

            # 4. Start (S) Cell
            sr, sc = self.engine.start
            sx1, sy1 = sc * cell_size + 2, sr * cell_size + 2
            sx2, sy2 = sx1 + cell_size - 4, sy1 + cell_size - 4
            self.canvas.create_rectangle(sx1, sy1, sx2, sy2, fill="#10b981", outline="")
            self.canvas.create_text((sx1 + sx2) / 2, (sy1 + sy2) / 2, text="S", fill="#000", font=("Arial", int(cell_size * 0.5), "bold"))

            # 5. Exit (E) Cell
            er, ec = self.engine.exit
            ex1, ey1 = ec * cell_size + 2, er * cell_size + 2
            ex2, ey2 = ex1 + cell_size - 4, ey1 + cell_size - 4
            self.canvas.create_rectangle(ex1, ey1, ex2, ey2, fill="#f59e0b", outline="")
            self.canvas.create_text((ex1 + ex2) / 2, (ey1 + ey2) / 2, text="E", fill="#000", font=("Arial", int(cell_size * 0.5), "bold"))

            # 6. Player (P) Token
            pr, pc = self.player_pos
            px1, py1 = pc * cell_size + 2, pr * cell_size + 2
            px2, py2 = px1 + cell_size - 4, py1 + cell_size - 4
            self.canvas.create_oval(px1, py1, px2, py2, fill="#38bdf8", outline="#0284c7")
            self.canvas.create_text((px1 + px2) / 2, (py1 + py2) / 2, text="P", fill="#0f172a", font=("Arial", int(cell_size * 0.45), "bold"))


# ==============================================================================
# 5. TERMINAL / CONSOLE MODE FALLBACK
# ==============================================================================

def run_terminal_mode():
    """Fallback interactive CLI if GUI is not available."""
    print("=" * 60)
    print("  MAZE SOLVER GAME (CLI MODE) - BCA DSA PROJECT")
    print("=" * 60)
    engine = MazeEngine(15, 15)
    player = list(engine.start)

    while True:
        # Render ASCII Maze
        print()
        for r in range(engine.rows):
            line = []
            for c in range(engine.cols):
                if [r, c] == player:
                    line.append('P')
                else:
                    line.append(engine.grid[r][c])
            print(" ".join(line))
        print()

        if tuple(player) == engine.exit:
            print("🏆 VICTORY! You navigated the maze successfully!")
            break

        cmd = input("Move (W=Up, S=Down, A=Left, D=Right, DFS=Solve, Q=Quit): ").strip().upper()
        if cmd == 'Q':
            break
        elif cmd == 'DFS':
            path, _ = engine.solve_dfs()
            if path:
                print(f"DFS Solution Path ({len(path)} steps):")
                print(" -> ".join([f"({r},{c})" for r, c in path]))
            else:
                print("No path found.")
            break
        elif cmd in ('W', 'S', 'A', 'D'):
            dr, dc = {'W': (-1, 0), 'S': (1, 0), 'A': (0, -1), 'D': (0, 1)}[cmd]
            nr, nc = player[0] + dr, player[1] + dc
            if engine.is_valid(nr, nc):
                player = [nr, nc]
            else:
                print("💥 Bump! Wall ahead.")


# ==============================================================================
# 6. MAIN EXECUTION ENTRY POINT
# ==============================================================================

def main():
    if TKINTER_AVAILABLE and "--cli" not in sys.argv:
        root = tk.Tk()
        app = MazeGameGUI(root)
        root.mainloop()
    else:
        run_terminal_mode()


if __name__ == "__main__":
    main()
