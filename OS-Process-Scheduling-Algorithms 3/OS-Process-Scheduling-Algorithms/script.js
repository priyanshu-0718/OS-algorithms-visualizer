document.addEventListener('DOMContentLoaded', function() {
// Process Table Management
let processCount = 1;
const addProcessBtn = document.querySelector('.add-process-btn');
const removeProcessBtn = document.querySelector('.remove-process-btn');
const processTable = document.querySelector('.main-table tbody');

function createProcessRow(id, icon = '⚙️') {
    return `
        <tr>
            <td><span class="process-icon" style="font-size:1.2em;margin-right:6px;cursor:pointer;">${icon}</span><span class="process-id">P${id}</span></td>
            <td class="priority hide"><input type="number" min="1" step="1" value="1"></td>
            <td class="arrival-time"><input type="number" min="0" step="1" value="0"></td>
            <td class="burst-time"><input type="number" min="1" step="1" value="1"></td>
            <td>
                <button class="add-process-btn"><i class="fas fa-plus"></i></button>
                <button class="remove-process-btn"><i class="fas fa-minus"></i></button>
            </td>
        </tr>
    `;
}

// Add process button click handler
function getNextProcessNumber() {
    // Count only visible rows
    return processTable.querySelectorAll('tr').length + 1;
}

document.addEventListener('click', function(e) {
    if (e.target.closest('.add-process-btn')) {
        const nextNum = getNextProcessNumber();
        processTable.insertAdjacentHTML('beforeend', createProcessRow(nextNum));
        updateProcessColors();
        renumberProcesses();
    }
});

// Remove process button click handler
document.addEventListener('click', function(e) {
    if (e.target.closest('.remove-process-btn')) {
        const rows = processTable.querySelectorAll('tr');
        if (rows.length > 0) {
            processTable.removeChild(rows[rows.length - 1]);
            updateProcessColors();
            renumberProcesses();
        }
    }
});

// Process Colors
const processColors = [
    '#4a90e2', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
];

function updateProcessColors() {
    const processIds = document.querySelectorAll('.process-id');
    processIds.forEach((id, index) => {
        id.style.color = processColors[index % processColors.length];
    });
}

// Algorithm Selection
const algorithmInputs = document.querySelectorAll('input[name="algo"]');
const timeQuantumDiv = document.getElementById('time-quantum');

algorithmInputs.forEach(input => {
    input.addEventListener('change', () => {
        timeQuantumDiv.classList.toggle('hide', input.id !== 'rr');
    });
});

// Simulation Speed Control
const speedControl = document.getElementById('simulation-speed');
let simulationSpeed = 3;

speedControl.addEventListener('input', (e) => {
    simulationSpeed = e.target.value;
});

// Export/Import Configuration
const exportBtn = document.querySelector('.export-btn');
const importBtn = document.querySelector('.import-btn');

exportBtn.addEventListener('click', () => {
    const config = {
        processes: Array.from(processTable.children).reduce((acc, row) => {
            const processId = row.querySelector('.process-id').textContent;
            const icon = row.querySelector('.process-icon')?.textContent || '⚙️';
            const priority = row.querySelector('.priority input')?.value;
            const arrivalTime = row.querySelector('.arrival-time input').value;
            const burstTime = row.querySelector('.burst-time input').value;
            acc.push({ processId, icon, priority, arrivalTime, burstTime });
            return acc;
        }, []),
        algorithm: document.querySelector('input[name="algo"]:checked').id,
        timeQuantum: document.getElementById('tq').value
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheduler-config.json';
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const config = JSON.parse(event.target.result);
            // Clear existing processes
            processTable.innerHTML = '';
            // Add imported processes
            config.processes.forEach((process, index) => {
                processTable.insertAdjacentHTML('beforeend', createProcessRow(index + 1, process.icon || '⚙️'));
                const rows = processTable.children;
                const row = rows[index];
                row.querySelector('.process-id').textContent = process.processId;
                row.querySelector('.process-icon').textContent = process.icon || '⚙️';
                if (process.priority) {
                    row.querySelector('.priority input').value = process.priority;
                }
                row.querySelector('.arrival-time input').value = process.arrivalTime;
                row.querySelector('.burst-time input').value = process.burstTime;
            });
            // Set algorithm and time quantum
            document.getElementById(config.algorithm).checked = true;
            document.getElementById('tq').value = config.timeQuantum;
            timeQuantumDiv.classList.toggle('hide', config.algorithm !== 'rr');
            updateProcessColors();
        };
        reader.readAsText(file);
    };
    input.click();
});

// Gantt Chart Visualization
google.charts.load('current', { packages: ['timeline'] });
google.charts.setOnLoadCallback(drawGanttChart);

function drawGanttChart(data = [], processInfo = []) {
    const container = document.getElementById('gantt-chart');
    const chart = new google.visualization.Timeline(container);
    const dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Process' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    // Add icons to process labels
    const dataWithIcons = data.map(row => {
        if (!processInfo || !processInfo.length) return row;
        const proc = processInfo.find(p => p.processId === row[0]);
        if (proc && proc.icon) {
            return [`${proc.icon} ${row[0]}`, row[1], row[2]];
        }
        return row;
    });
    dataTable.addRows(dataWithIcons);

    const options = {
        timeline: {
            showRowLabels: true,
            groupByRowLabel: false,
            colorByRowLabel: true,
            barLabelStyle: { fontSize: 10 },
            rowLabelStyle: { fontSize: 12 }
        },
        backgroundColor: 'transparent',
        colors: processColors,
        height: Math.max(150, data.length * 50),
        hAxis: {
            format: '0',
            minValue: 0
        },
    };

    chart.draw(dataTable, options);

    // Add interactive tooltip/modal
    if (!document.getElementById('gantt-modal')) {
        const modal = document.createElement('div');
        modal.id = 'gantt-modal';
        modal.style.position = 'fixed';
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = 'white';
        modal.style.border = '2px solid #4a90e2';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        modal.style.padding = '24px 32px';
        modal.style.zIndex = '99999';
        modal.style.display = 'none';
        modal.innerHTML = '<div id="gantt-modal-content"></div><button id="gantt-modal-close" style="margin-top:18px;padding:6px 18px;background:#4a90e2;color:white;border:none;border-radius:6px;cursor:pointer;">Close</button>';
        document.body.appendChild(modal);
        document.getElementById('gantt-modal-close').onclick = () => { modal.style.display = 'none'; };
    }
    const modal = document.getElementById('gantt-modal');
    const modalContent = document.getElementById('gantt-modal-content');

    google.visualization.events.addListener(chart, 'select', function() {
        const sel = chart.getSelection();
        if (sel.length > 0) {
            const row = sel[0].row;
            const [pid, start, end] = data[row];
            // Find process info
            let proc = null;
            if (processInfo && processInfo.length) {
                proc = processInfo.find(p => p.processId === pid);
            }
            let waiting = proc ? (start - proc.arrivalTime) : (start);
            let turnaround = proc ? (end - proc.arrivalTime) : (end - start);
            modalContent.innerHTML = `
                <h3 style='margin-top:0;color:#4a90e2;'>Process ${pid}</h3>
                <div><b>Start Time:</b> ${start}</div>
                <div><b>End Time:</b> ${end}</div>
                <div><b>Waiting Time:</b> ${waiting}</div>
                <div><b>Turnaround Time:</b> ${turnaround}</div>
                ${proc ? `<div><b>Arrival Time:</b> ${proc.arrivalTime}</div><div><b>Burst Time:</b> ${proc.burstTime}</div>` : ''}
            `;
            modal.style.display = 'block';
        }
    });
}

// Metrics Update
function updateMetrics(waitingTime, turnaroundTime, cpuUtilization) {
    document.getElementById('avg-waiting-time').textContent = waitingTime.toFixed(2);
    document.getElementById('avg-turnaround-time').textContent = turnaroundTime.toFixed(2);
    document.getElementById('cpu-utilization').textContent = `${(cpuUtilization * 100).toFixed(1)}%`;
}

// Run Simulation
const calculateBtn = document.querySelector('.calculate');

// Animate Gantt Chart
function animateGanttChart(ganttData, speedValue, processInfo) {
    const delayMap = { 1: 800, 2: 500, 3: 300, 4: 150, 5: 50 };
    const delay = delayMap[speedValue] || 300;
    let step = 0;
    function drawStep() {
        drawGanttChart(ganttData.slice(0, step + 1), processInfo);
        if (step < ganttData.length - 1) {
            step++;
            setTimeout(drawStep, delay);
        }
    }
    drawStep();
}

calculateBtn.addEventListener('click', () => {
    const processIds = Array.from(processTable.querySelectorAll('.process-id'));
    const processes = [];
    processIds.forEach((pidElem) => {
        const row = pidElem.closest('tr');
        if (row.style.display === 'none') return;
        const processId = pidElem.textContent.trim();
        const icon = row.querySelector('.process-icon')?.textContent || '⚙️';
        const priority = row.querySelector('.priority input')?.value;
        const arrivalInput = row.querySelector('.arrival-time input');
        const burstInput = row.querySelector('.burst-time input');
        if (!processId || !arrivalInput || !burstInput) return;
        const arrivalTime = parseInt(arrivalInput.value);
        const burstTime = parseInt(burstInput.value);
        if (isNaN(arrivalTime) || isNaN(burstTime)) return;
        if (arrivalTime < 0 || burstTime < 1) return;
        processes.push({ processId, icon, priority, arrivalTime, burstTime });
        console.log(`Added process:`, { processId, icon, arrivalTime, burstTime });
    });
    console.log('All collected processes:', processes);
    if (processes.length === 0) {
        alert('Please add at least one process with valid data.');
        return;
    }
    const algorithm = document.querySelector('input[name="algo"]:checked').id;
    const timeQuantum = parseInt(document.getElementById('tq').value) || 2;
    let result;
    switch (algorithm) {
        case 'fcfs':
            result = runFCFS(processes);
            break;
        case 'sjf':
            result = runSJF(processes);
            break;
        case 'ljf':
            result = runLJF(processes);
            break;
        case 'rr':
            result = runRoundRobin(processes, timeQuantum);
            break;
        case 'srjf':
            result = runSRTF(processes);
            break;
        case 'lrjf':
            result = runLRTF(processes);
            break;
        case 'hrrn':
            result = runHRRN(processes);
            break;
    }
    if (result) {
        console.log('Gantt chart data:', result.ganttData);
        const speedValue = parseInt(document.getElementById('simulation-speed').value) || 3;
        animateGanttChart(result.ganttData, speedValue, processes);
        updateMetrics(result.avgWaitingTime, result.avgTurnaroundTime, result.cpuUtilization);
    }
});

// Sample data button
document.querySelector('.sample-data-btn').addEventListener('click', () => {
    // Clear existing processes
    processTable.innerHTML = '';
    processCount = 0;
    
    // Add sample processes
    const sampleProcesses = [
        { id: 1, arrival: 0, burst: 4 },
        { id: 2, arrival: 1, burst: 3 },
        { id: 3, arrival: 2, burst: 5 }
    ];
    
    sampleProcesses.forEach(proc => {
        processCount++;
        processTable.insertAdjacentHTML('beforeend', createProcessRow(processCount));
        const rows = processTable.querySelectorAll('tr');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.arrival-time input').value = proc.arrival;
        lastRow.querySelector('.burst-time input').value = proc.burst;
    });
    
    updateProcessColors();
});

// Algorithm Implementations
function runFCFS(processes) {
    // Defensive copy and sort
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const ganttData = [];
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    sortedProcesses.forEach(process => {
        if (currentTime < process.arrivalTime) {
            currentTime = process.arrivalTime;
        }
        const waitingTime = currentTime - process.arrivalTime;
        const turnaroundTime = waitingTime + process.burstTime;
        ganttData.push([process.processId, currentTime, currentTime + process.burstTime]);
        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
        currentTime += process.burstTime;
    });
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / sortedProcesses.length,
        avgTurnaroundTime: totalTurnaroundTime / sortedProcesses.length,
        cpuUtilization: sortedProcesses.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Shortest Job First (Non-preemptive)
function runSJF(processes) {
    let procs = processes.map(p => ({...p}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    let isCompleted = Array(n).fill(false);
    while (completed < n) {
        let idx = -1, minBurst = Infinity;
        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && procs[i].arrivalTime <= currentTime && procs[i].burstTime < minBurst) {
                minBurst = procs[i].burstTime;
                idx = i;
            }
        }
        if (idx === -1) {
            currentTime++;
        } else {
            let start = currentTime;
            let end = start + procs[idx].burstTime;
            ganttData.push([procs[idx].processId, start, end]);
            let waiting = start - procs[idx].arrivalTime;
            let turnaround = end - procs[idx].arrivalTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
            currentTime = end;
            isCompleted[idx] = true;
            completed++;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Longest Job First (Non-preemptive)
function runLJF(processes) {
    let procs = processes.map(p => ({...p}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    let isCompleted = Array(n).fill(false);
    while (completed < n) {
        let idx = -1, maxBurst = -1;
        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && procs[i].arrivalTime <= currentTime && procs[i].burstTime > maxBurst) {
                maxBurst = procs[i].burstTime;
                idx = i;
            }
        }
        if (idx === -1) {
            currentTime++;
        } else {
            let start = currentTime;
            let end = start + procs[idx].burstTime;
            ganttData.push([procs[idx].processId, start, end]);
            let waiting = start - procs[idx].arrivalTime;
            let turnaround = end - procs[idx].arrivalTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
            currentTime = end;
            isCompleted[idx] = true;
            completed++;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Round Robin (Preemptive)
function runRoundRobin(processes, timeQuantum) {
    let procs = processes.map(p => ({...p, remaining: p.burstTime}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let queue = [];
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    let lastEnd = {};
    let arrived = Array(n).fill(false);
    while (completed < n) {
        // Add newly arrived processes
        for (let i = 0; i < n; i++) {
            if (!arrived[i] && procs[i].arrivalTime <= currentTime) {
                queue.push(i);
                arrived[i] = true;
            }
        }
        if (queue.length === 0) {
            currentTime++;
            continue;
        }
        let idx = queue.shift();
        let proc = procs[idx];
        let start = Math.max(currentTime, proc.arrivalTime, lastEnd[idx] || 0);
        let execTime = Math.min(timeQuantum, proc.remaining);
        let end = start + execTime;
        ganttData.push([proc.processId, start, end]);
        proc.remaining -= execTime;
        currentTime = end;
        lastEnd[idx] = end;
        // Add newly arrived processes during this quantum
        for (let i = 0; i < n; i++) {
            if (!arrived[i] && procs[i].arrivalTime <= currentTime) {
                queue.push(i);
                arrived[i] = true;
            }
        }
        if (proc.remaining > 0) {
            queue.push(idx);
        } else {
            completed++;
            let turnaround = end - proc.arrivalTime;
            let waiting = turnaround - proc.burstTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Shortest Remaining Time First (Preemptive SJF)
function runSRTF(processes) {
    let procs = processes.map(p => ({...p, remaining: p.burstTime}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let isCompleted = Array(n).fill(false);
    let lastProc = null, startTime = 0;
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    while (completed < n) {
        let idx = -1, minRem = Infinity;
        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && procs[i].arrivalTime <= currentTime && procs[i].remaining < minRem && procs[i].remaining > 0) {
                minRem = procs[i].remaining;
                idx = i;
            }
        }
        if (idx === -1) {
            currentTime++;
            continue;
        }
        if (lastProc !== idx) {
            if (lastProc !== null && procs[lastProc].remaining > 0) {
                ganttData.push([procs[lastProc].processId, startTime, currentTime]);
            }
            startTime = currentTime;
            lastProc = idx;
        }
        procs[idx].remaining--;
        currentTime++;
        if (procs[idx].remaining === 0) {
            isCompleted[idx] = true;
            completed++;
            ganttData.push([procs[idx].processId, startTime, currentTime]);
            let turnaround = currentTime - procs[idx].arrivalTime;
            let waiting = turnaround - procs[idx].burstTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
            lastProc = null;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Longest Remaining Time First (Preemptive LJF)
function runLRTF(processes) {
    let procs = processes.map(p => ({...p, remaining: p.burstTime}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let isCompleted = Array(n).fill(false);
    let lastProc = null, startTime = 0;
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    while (completed < n) {
        let idx = -1, maxRem = -1;
        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && procs[i].arrivalTime <= currentTime && procs[i].remaining > maxRem && procs[i].remaining > 0) {
                maxRem = procs[i].remaining;
                idx = i;
            }
        }
        if (idx === -1) {
            currentTime++;
            continue;
        }
        if (lastProc !== idx) {
            if (lastProc !== null && procs[lastProc].remaining > 0) {
                ganttData.push([procs[lastProc].processId, startTime, currentTime]);
            }
            startTime = currentTime;
            lastProc = idx;
        }
        procs[idx].remaining--;
        currentTime++;
        if (procs[idx].remaining === 0) {
            isCompleted[idx] = true;
            completed++;
            ganttData.push([procs[idx].processId, startTime, currentTime]);
            let turnaround = currentTime - procs[idx].arrivalTime;
            let waiting = turnaround - procs[idx].burstTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
            lastProc = null;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

// Highest Response Ratio Next (Non-preemptive)
function runHRRN(processes) {
    let procs = processes.map(p => ({...p}));
    let n = procs.length, completed = 0, currentTime = 0;
    let ganttData = [];
    let totalWaitingTime = 0, totalTurnaroundTime = 0;
    let isCompleted = Array(n).fill(false);
    while (completed < n) {
        let idx = -1, maxRR = -1;
        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && procs[i].arrivalTime <= currentTime) {
                let waiting = currentTime - procs[i].arrivalTime;
                let rr = (waiting + procs[i].burstTime) / procs[i].burstTime;
                if (rr > maxRR) {
                    maxRR = rr;
                    idx = i;
                }
            }
        }
        if (idx === -1) {
            currentTime++;
        } else {
            let start = currentTime;
            let end = start + procs[idx].burstTime;
            ganttData.push([procs[idx].processId, start, end]);
            let waiting = start - procs[idx].arrivalTime;
            let turnaround = end - procs[idx].arrivalTime;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
            currentTime = end;
            isCompleted[idx] = true;
            completed++;
        }
    }
    return {
        ganttData,
        avgWaitingTime: totalWaitingTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        cpuUtilization: procs.reduce((sum, p) => sum + p.burstTime, 0) / currentTime
    };
}

function renumberProcesses() {
    const processIds = processTable.querySelectorAll('.process-id');
    processIds.forEach((idElem, idx) => {
        idElem.textContent = `P${idx + 1}`;
    });
}

// --- Page Replacement Section ---
const pageTable = document.querySelector('.page-table tbody');
const addPageBtn = document.querySelector('.add-page-btn');
const removePageBtn = document.querySelector('.remove-page-btn');
const pageSampleBtn = document.querySelector('.page-sample-data-btn');
const pageCalcBtn = document.querySelector('.page-calculate');
const pageReferenceInput = document.querySelector('.page-reference-input');
const pageFaultsElem = document.getElementById('page-faults');
const pageHitsElem = document.getElementById('page-hits');
const pageChart = document.getElementById('page-replacement-chart');

// Add/Remove reference string rows (optional, but UI supports it)
addPageBtn.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="page-reference-input" placeholder="e.g. 7 0 1 2 0 3 0 4 2 3 0 3 2" style="width: 100%"></td>
        <td>
            <button class="add-page-btn"><i class="fas fa-plus"></i></button>
            <button class="remove-page-btn"><i class="fas fa-minus"></i></button>
        </td>
    `;
    pageTable.appendChild(row);
    row.querySelector('.add-page-btn').addEventListener('click', addPageBtn.onclick);
    row.querySelector('.remove-page-btn').addEventListener('click', removePageBtn.onclick);
});

removePageBtn.addEventListener('click', () => {
    if (pageTable.children.length > 1) {
        pageTable.removeChild(pageTable.lastElementChild);
    }
});

// Load Sample Data
pageSampleBtn.addEventListener('click', () => {
    // Use a standard reference string
    const sample = '7 0 1 2 0 3 0 4 2 3 0 3 2';
    // Set the first input
    pageTable.querySelector('.page-reference-input').value = sample;
    // Clear any additional rows
    while (pageTable.children.length > 1) {
        pageTable.removeChild(pageTable.lastElementChild);
    }
});

// Page Replacement Algorithms
function parseReferenceString(str) {
    return str.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
}

function runFIFO(refs, frames) {
    let queue = [];
    let faults = 0, hits = 0;
    let history = [];
    refs.forEach(page => {
        if (!queue.includes(page)) {
            faults++;
            if (queue.length === frames) queue.shift();
            queue.push(page);
        } else {
            hits++;
        }
        history.push([...queue]);
    });
    return { faults, hits, history };
}

function runLRU(refs, frames) {
    let queue = [];
    let faults = 0, hits = 0;
    let history = [];
    refs.forEach(page => {
        let idx = queue.indexOf(page);
        if (idx === -1) {
            faults++;
            if (queue.length === frames) queue.shift();
        } else {
            hits++;
            queue.splice(idx, 1);
        }
        queue.push(page);
        history.push([...queue]);
    });
    return { faults, hits, history };
}

function runOptimal(refs, frames) {
    let queue = [];
    let faults = 0, hits = 0;
    let history = [];
    refs.forEach((page, i) => {
        if (!queue.includes(page)) {
            faults++;
            if (queue.length === frames) {
                // Find the page not used for the longest in future
                let idxToRemove = 0, farthest = -1;
                for (let j = 0; j < queue.length; j++) {
                    let idx = refs.slice(i + 1).indexOf(queue[j]);
                    if (idx === -1) {
                        idxToRemove = j;
                        break;
                    } else if (idx > farthest) {
                        farthest = idx;
                        idxToRemove = j;
                    }
                }
                queue.splice(idxToRemove, 1);
            }
            queue.push(page);
        } else {
            hits++;
        }
        history.push([...queue]);
    });
    return { faults, hits, history };
}

// Visualization (enhanced table with color coding and summary row)
function showPageChart(refs, history, frames, faultArr) {
    let html = '<table style="width:100%;text-align:center;border-collapse:collapse;">';
    html += '<tr><th>Ref</th>';
    for (let i = 0; i < refs.length; i++) html += `<th>${refs[i]}</th>`;
    html += '</tr>';
    for (let f = 0; f < frames; f++) {
        html += `<tr><td>Frame ${f + 1}</td>`;
        for (let i = 0; i < refs.length; i++) {
            let val = history[i][f] !== undefined ? history[i][f] : '';
            let style = '';
            if (faultArr && faultArr[i] && history[i][f] !== undefined && val === refs[i]) style = 'background:#ffcccc;font-weight:bold;';
            html += `<td style="${style}">${val}</td>`;
        }
        html += '</tr>';
    }
    // Summary row for Fault/Hit
    html += '<tr><td><b>Result</b></td>';
    for (let i = 0; i < refs.length; i++) {
        if (faultArr && faultArr[i]) {
            html += '<td style="background:#ff4d4d;color:white;font-weight:bold;">F</td>';
        } else {
            html += '<td style="background:#4caf50;color:white;font-weight:bold;">H</td>';
        }
    }
    html += '</tr>';
    html += '</table>';
    // Legend
    html += '<div style="margin-top:10px;text-align:left;font-size:0.95em;">'
        + '<span style="display:inline-block;width:18px;height:18px;background:#ff4d4d;margin-right:5px;vertical-align:middle;"></span>Page Fault '
        + '<span style="display:inline-block;width:18px;height:18px;background:#4caf50;margin-left:15px;margin-right:5px;vertical-align:middle;"></span>Page Hit '
        + '<span style="display:inline-block;width:18px;height:18px;background:#ffeb3b;margin-left:15px;margin-right:5px;vertical-align:middle;border:1px solid #ccc;"></span>Current Reference'
        + '</div>';
    pageChart.innerHTML = html;
}

// Animate Page Replacement Chart
function animatePageChart(refs, history, frames, faultArr, speedValue) {
    const delayMap = { 1: 800, 2: 500, 3: 300, 4: 150, 5: 50 };
    const delay = delayMap[speedValue] || 300;
    let step = 0;
    function drawStep() {
        showPageChart(refs.slice(0, step + 1), history.slice(0, step + 1), frames, faultArr ? faultArr.slice(0, step + 1) : undefined);
        if (step < refs.length - 1) {
            step++;
            setTimeout(drawStep, delay);
        }
    }
    drawStep();
}

// Run Simulation
pageCalcBtn.addEventListener('click', () => {
    // Get reference string and number of frames (default 3)
    const refInput = pageTable.querySelector('.page-reference-input').value;
    const refs = parseReferenceString(refInput);
    const frames = parseInt(document.getElementById('num-frames').value) || 3;
    const algo = document.querySelector('input[name="page-algo"]:checked').id;
    let result;
    let faultArr = [];
    if (algo === 'fifo') {
        result = runFIFO(refs, frames);
        // Fault array: true if fault at that step
        let queue = [], arr = [];
        refs.forEach(page => {
            if (!queue.includes(page)) {
                arr.push(true);
                if (queue.length === frames) queue.shift();
                queue.push(page);
            } else {
                arr.push(false);
            }
        });
        faultArr = arr;
    }
    else if (algo === 'lru') {
        result = runLRU(refs, frames);
        let queue = [], arr = [];
        refs.forEach(page => {
            let idx = queue.indexOf(page);
            if (idx === -1) {
                arr.push(true);
                if (queue.length === frames) queue.shift();
            } else {
                arr.push(false);
                queue.splice(idx, 1);
            }
            queue.push(page);
        });
        faultArr = arr;
    }
    else if (algo === 'optimal') {
        result = runOptimal(refs, frames);
        let queue = [], arr = [];
        refs.forEach((page, i) => {
            if (!queue.includes(page)) {
                arr.push(true);
                if (queue.length === frames) {
                    let idxToRemove = 0, farthest = -1;
                    for (let j = 0; j < queue.length; j++) {
                        let idx = refs.slice(i + 1).indexOf(queue[j]);
                        if (idx === -1) {
                            idxToRemove = j;
                            break;
                        } else if (idx > farthest) {
                            farthest = idx;
                            idxToRemove = j;
                        }
                    }
                    queue.splice(idxToRemove, 1);
                }
                queue.push(page);
            } else {
                arr.push(false);
            }
        });
        faultArr = arr;
    }
    else return;
    pageFaultsElem.textContent = result.faults;
    pageHitsElem.textContent = result.hits;
    // Animate the chart
    const speedValue = parseInt(document.getElementById('page-simulation-speed').value) || 3;
    animatePageChart(refs, result.history, frames, faultArr, speedValue);
});

// Learning Section Logic
const algoLearnContent = {
  fcfs: {
    title: 'First Come First Serve (FCFS)',
    desc: 'FCFS is the simplest process scheduling algorithm. Processes are executed strictly in the order they arrive (FIFO queue). It is non-preemptive, so once a process starts, it runs to completion. While easy to implement and fair, it can lead to the convoy effect, where short processes wait behind long ones, resulting in poor average waiting time.',
    points: [
      'Non-preemptive: Once a process starts, it cannot be interrupted.',
      'Simple FIFO queue: Processes are scheduled in arrival order.',
      'Fair, but can cause long waiting times for short jobs.',
      'Convoy effect: A long process can delay all others.',
      'No starvation: Every process will eventually run.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P1 |----|\nP2      |--|\nP3         |-----|</pre></div>`
  },
  sjf: {
    title: 'Shortest Job First (SJF)',
    desc: 'SJF selects the process with the shortest CPU burst time next. It minimizes average waiting time and is optimal in that sense. However, it requires knowledge or estimation of burst times in advance and can cause starvation for longer jobs if short jobs keep arriving.',
    points: [
      'Non-preemptive: Once a process starts, it runs to completion.',
      'Optimal for average waiting time.',
      'Starvation possible for long jobs.',
      'Requires burst time prediction or estimation.',
      'Not suitable for time-sharing systems.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P2 |--|\nP1    |----|\nP3         |-----|</pre></div>`
  },
  ljf: {
    title: 'Longest Job First (LJF)',
    desc: 'LJF selects the process with the longest burst time next. It is rarely used in practice because it can cause high waiting times for short jobs and is generally less efficient. It is mostly of theoretical interest.',
    points: [
      'Non-preemptive.',
      'Opposite of SJF: Longest jobs go first.',
      'Short jobs may starve.',
      'Rarely used in real systems.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P3 |-----|\nP1       |----|\nP2            |--|</pre></div>`
  },
  rr: {
    title: 'Round Robin (RR)',
    desc: 'Round Robin is a preemptive scheduling algorithm designed for time-sharing systems. Each process is assigned a fixed time quantum and processes are scheduled in a cyclic order. If a process does not finish in its time slice, it is preempted and placed at the end of the queue. The choice of time quantum is crucial: too small increases context switching, too large degrades to FCFS.',
    points: [
      'Preemptive: Processes can be interrupted after their time quantum.',
      'Time quantum (slice) based.',
      'Fair for all processes.',
      'Context switching overhead if quantum is too small.',
      'No starvation.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P1 |--| |--|\nP2    |--| |--|\nP3       |--| |--|</pre></div>`
  },
  srjf: {
    title: 'Shortest Remaining Time First (SRTF)',
    desc: 'SRTF is the preemptive version of SJF. At every scheduling decision, the process with the shortest remaining burst time is selected. If a new process arrives with a shorter remaining time, it preempts the current process. This minimizes average waiting time but can cause starvation for long jobs.',
    points: [
      'Preemptive: Can interrupt running process if a shorter job arrives.',
      'Optimal for average waiting time.',
      'Starvation possible for long jobs.',
      'Requires accurate burst time prediction.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P2 |-|
P1   |-|
P2     |-|
P3       |-----|</pre></div>`
  },
  lrjf: {
    title: 'Longest Remaining Time First (LRJF)',
    desc: 'LRJF is the preemptive version of LJF. The process with the longest remaining burst time is always selected. It is rarely used and can cause high waiting times for short jobs.',
    points: [
      'Preemptive.',
      'Opposite of SRTF: Longest jobs go first.',
      'Short jobs may starve.',
      'Rarely used in real systems.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br><pre>P3 |-----|\nP1       |--|\nP2            |--|</pre></div>`
  },
  hrrn: {
    title: 'Highest Response Ratio Next (HRRN)',
    desc: 'HRRN is a non-preemptive algorithm that selects the process with the highest response ratio, calculated as (waiting time + burst time) / burst time. This balances short and long jobs, reducing starvation and improving fairness.',
    points: [
      'Non-preemptive.',
      'Balances short and long jobs.',
      'No starvation.',
      'Requires waiting time tracking.',
      'Improves fairness over SJF.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Response Ratio:</b> (Waiting Time + Burst Time) / Burst Time</div>`
  },
  fifo: {
    title: 'FIFO (Page Replacement)',
    desc: 'FIFO (First-In, First-Out) is the simplest page replacement algorithm. When a page needs to be replaced, the oldest page in memory (the one that arrived first) is removed. It is easy to implement but can suffer from Belady\'s anomaly, where increasing the number of frames can increase the number of page faults.',
    points: [
      'Simple queue structure.',
      'Replaces the oldest page in memory.',
      'Can suffer from Belady\'s anomaly.',
      'Not always optimal.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br>Pages: 1 2 3 4 1 2 5 1 2 3 4 5<br>Frames: [1] [2] [3] ...</div>`
  },
  lru: {
    title: 'LRU (Page Replacement)',
    desc: 'LRU (Least Recently Used) replaces the page that has not been used for the longest time. It approximates optimal replacement if recent past is a good predictor of near future. LRU is more efficient than FIFO but requires tracking page usage history.',
    points: [
      'Replaces the least recently used page.',
      'Better performance than FIFO in most cases.',
      'Requires tracking usage history (can be costly).',
      'No Belady\'s anomaly.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br>Pages: 7 0 1 2 0 3 0 4 2 3 0 3 2<br>Frames: [7] [0] [1] ...</div>`
  },
  optimal: {
    title: 'Optimal (Page Replacement)',
    desc: 'The Optimal page replacement algorithm replaces the page that will not be used for the longest time in the future. It is used as a benchmark because it gives the lowest possible page fault rate, but it is not implementable in practice since it requires future knowledge.',
    points: [
      'Theoretical best: lowest possible page faults.',
      'Requires future knowledge (not implementable in real systems).',
      'Used for benchmarking other algorithms.',
      'No Belady\'s anomaly.'
    ],
    diagram: `<div style='margin:10px 0;'><b>Example:</b><br>Pages: 1 2 3 4 2 1 5 3 2 4 5<br>Frames: [1] [2] [3] ...</div>`
  }
};

function renderAlgoLearnContent(key) {
  const c = algoLearnContent[key];
  console.log('renderAlgoLearnContent called with key:', key, 'found:', !!c);
  const contentDiv = document.getElementById('algo-learn-content');
  if (!c) {
    contentDiv.innerHTML = `<div style='color:red;'>No explanation found for: <b>${key}</b>. Please check the dropdown value and script keys.</div>`;
    return;
  }
  contentDiv.innerHTML = `
    <h4 style='margin-top:0;color:#4a90e2;'>${c.title}</h4>
    <div style='margin-bottom:10px;'>${c.desc}</div>
    <ul style='margin-bottom:10px;'>${c.points.map(p => `<li>${p}</li>`).join('')}</ul>
    ${c.diagram}
  `;
}

const algoSelect = document.getElementById('algo-select');
if (algoSelect) {
  algoSelect.addEventListener('change', e => renderAlgoLearnContent(e.target.value));
  renderAlgoLearnContent(algoSelect.value);
}

// Icon selection logic
const presetIcons = ['⚙️', '🧠', '🚀', '🐢', '⏱️'];
document.addEventListener('click', function(e) {
    const iconElem = e.target.closest('.process-icon');
    if (iconElem) {
        // Remove any existing popup
        document.querySelectorAll('.icon-popup').forEach(p => p.remove());
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'icon-popup';
        popup.style.position = 'absolute';
        popup.style.background = '#fff';
        popup.style.border = '1px solid #ccc';
        popup.style.borderRadius = '8px';
        popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        popup.style.padding = '6px 10px';
        popup.style.zIndex = 10000;
        popup.style.display = 'flex';
        popup.style.gap = '8px';
        presetIcons.forEach(ic => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = ic;
            btn.style.fontSize = '1.2em';
            btn.style.background = 'none';
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.onclick = (ev) => {
                iconElem.textContent = ic;
                iconElem.setAttribute('data-icon', ic);
                popup.remove();
                ev.stopPropagation();
            };
            popup.appendChild(btn);
        });
        // Position popup
        const rect = iconElem.getBoundingClientRect();
        popup.style.left = (rect.left + window.scrollX) + 'px';
        popup.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        document.body.appendChild(popup);
        // Remove popup on outside click
        setTimeout(() => {
            document.addEventListener('click', function handler(ev) {
                if (!popup.contains(ev.target)) {
                    popup.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 10);
    }
});

});