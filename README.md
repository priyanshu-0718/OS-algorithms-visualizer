<h1 align="center">OS Process Scheduling & Page Replacement Simulator</h1>

<p align="center">
  <b>Interactive web-based simulator for visualizing and comparing classic CPU scheduling and page replacement algorithms.</b>
  <br>
  <i>Built with HTML, CSS, Vanilla JS, and Google Charts</i>
</p>

---

## 📁 Project Structure

<pre>
OS-Process-Scheduling-Algorithms/
├── assets/
│   ├── css/         # Main and vendor CSS files
│   ├── js/          # Vendor JS (jQuery, Google Charts, etc.)
│   ├── sass/        # SASS source files (for advanced styling)
│   └── webfonts/    # FontAwesome webfonts
├── images/          # Project images and icons
├── index.html       # Main web application UI
├── script.js        # All core simulation logic (process & page replacement)
├── style.css        # Custom styles for the simulator
└── README.md        # This documentation
</pre>

---

## 🚀 Features

- Multiple CPU Scheduling Algorithms: FCFS, SJF, LJF, Round Robin, SRTF, LRTF, HRRN
- Page Replacement Algorithms: FIFO, LRU, Optimal
- Interactive Process Table: Add, remove, and customize processes (with icons!)
- Real-time Gantt Chart Visualization: Animated execution timeline using Google Charts
- Performance Metrics: Average Waiting Time, Turnaround Time, CPU Utilization
- Config Import/Export: Save and load your process setups as JSON
- Simulation Speed Control: Watch the scheduling at your own pace
- Learning Section: In-app explanations and diagrams for each algorithm
- Page Replacement Visualization: Step-by-step frame table with hit/fault highlighting

---

## 🖥️ How It Works

### 1. Process Scheduling Simulator

- Select an Algorithm: Choose from FCFS, SJF, LJF, RR, SRTF, LRTF, or HRRN.
- Add Processes: Click "Add Process" to insert rows. Set Arrival and Burst times. (Icons are customizable!)
- (Optional) Set Time Quantum: For Round Robin, specify the time quantum.
- Run Simulation: Click "Run Simulation" to animate the Gantt chart and see metrics.
- Export/Import: Save your configuration or load a previous one.
- Sample Data: Quickly load example processes for instant demo.

### 2. Page Replacement Simulator

- Select Algorithm: FIFO, LRU, or Optimal.
- Set Reference String: Enter a sequence of page numbers (e.g., `7 0 1 2 0 3 0 4 2 3 0 3 2`).
- Set Number of Frames: Choose how many memory frames to simulate.
- Run Simulation: Visualize the frame table, with page hits and faults highlighted.
- Sample Data: Load a standard reference string for quick testing.

### 3. Learning Section

- Algorithm Explanations: Dropdown menu provides concise, illustrated explanations for each algorithm, including pros, cons, and example diagrams.

---

## 🧩 Technologies Used

- HTML5, CSS3, SASS
- Vanilla JavaScript
- Google Charts (for Gantt and timeline visualizations)
- FontAwesome (for icons)
- jQuery (for UI helpers)

---

## 🛠️ How to Run

1. Clone or Download this repository.
2. Open `index.html` in your browser (no server required).
3. Enjoy! All features work offline.

---

## 📚 Algorithm List

- CPU Scheduling: FCFS, SJF, LJF, RR, SRTF, LRTF, HRRN
- Page Replacement: FIFO, LRU, Optimal
