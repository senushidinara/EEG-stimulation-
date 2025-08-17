// EEG Brain Activation Visualization
class EEGVisualizer {
    constructor() {
        this.data = null;
        this.chart = null;
        this.canvas = document.getElementById('eeg-chart');
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeChart();
    }

    setupEventListeners() {
        const loadBtn = document.getElementById('load-btn');
        const dataSelect = document.getElementById('data-select');
        
        loadBtn.addEventListener('click', () => this.loadEEGData());
        dataSelect.addEventListener('change', () => this.updateVisualization());
    }

    async loadEEGData() {
        try {
            // Load the CSV data
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            
            // Parse CSV data
            this.data = this.parseCSV(csvText);
            this.updateDataSummary();
            this.updateVisualization();
            
        } catch (error) {
            console.error('Error loading EEG data:', error);
            this.updateDataSummary('Error loading data');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
                row[header] = isNaN(value) ? value : parseFloat(value);
            });
            data.push(row);
        }
        
        return { headers, data };
    }

    initializeChart() {
        this.resizeCanvas();
        this.drawPlaceholder();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    drawPlaceholder() {
        const ctx = this.ctx;
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw placeholder
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(20, 20, width - 40, height - 40);
        
        ctx.fillStyle = '#999';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Load EEG Data" to visualize brain activation', width / 2, height / 2);
        
        ctx.setLineDash([]);
    }

    updateVisualization() {
        if (!this.data) {
            this.drawPlaceholder();
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        const dataSelect = document.getElementById('data-select');
        const viewType = dataSelect.value;
        
        ctx.clearRect(0, 0, width, height);
        
        // Get numeric columns for visualization
        const numericColumns = this.data.headers.filter(header => {
            return this.data.data.length > 0 && 
                   typeof this.data.data[0][header] === 'number';
        });
        
        if (numericColumns.length === 0) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No numeric data found for visualization', width / 2, height / 2);
            return;
        }
        
        // Draw time series chart
        this.drawTimeSeriesChart(numericColumns, viewType);
    }

    drawTimeSeriesChart(columns, viewType) {
        const ctx = this.ctx;
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Filter columns based on view type
        const displayColumns = viewType === 'filtered' ? columns.slice(0, 3) : columns;
        
        // Calculate data bounds
        let minVal = Infinity;
        let maxVal = -Infinity;
        
        this.data.data.forEach(row => {
            displayColumns.forEach(col => {
                const val = row[col];
                if (typeof val === 'number' && !isNaN(val)) {
                    minVal = Math.min(minVal, val);
                    maxVal = Math.max(maxVal, val);
                }
            });
        });
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw grid
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 10; i++) {
            const y = padding + (chartHeight * i / 10);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw data lines
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        
        displayColumns.forEach((column, columnIndex) => {
            ctx.strokeStyle = colors[columnIndex % colors.length];
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            let firstPoint = true;
            this.data.data.forEach((row, index) => {
                const val = row[column];
                if (typeof val === 'number' && !isNaN(val)) {
                    const x = padding + (chartWidth * index / (this.data.data.length - 1));
                    const y = height - padding - ((val - minVal) / (maxVal - minVal)) * chartHeight;
                    
                    if (firstPoint) {
                        ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            
            ctx.stroke();
        });
        
        // Draw legend
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        displayColumns.forEach((column, index) => {
            const y = 30 + index * 20;
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(width - 150, y - 8, 12, 12);
            ctx.fillStyle = '#333';
            ctx.fillText(column, width - 130, y + 2);
        });
    }

    updateDataSummary(errorMessage = null) {
        const summaryElement = document.getElementById('data-summary');
        
        if (errorMessage) {
            summaryElement.innerHTML = `<span style="color: #e74c3c;">${errorMessage}</span>`;
            return;
        }
        
        if (!this.data) {
            summaryElement.textContent = 'No data loaded';
            return;
        }
        
        const rowCount = this.data.data.length;
        const columnCount = this.data.headers.length;
        const numericColumns = this.data.headers.filter(header => {
            return this.data.data.length > 0 && 
                   typeof this.data.data[0][header] === 'number';
        }).length;
        
        summaryElement.innerHTML = `
            <div><strong>Rows:</strong> ${rowCount}</div>
            <div><strong>Columns:</strong> ${columnCount}</div>
            <div><strong>Numeric Columns:</strong> ${numericColumns}</div>
            <div><strong>Headers:</strong> ${this.data.headers.slice(0, 3).join(', ')}${this.data.headers.length > 3 ? '...' : ''}</div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EEGVisualizer();
});
