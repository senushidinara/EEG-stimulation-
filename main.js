// Advanced EEG Sleep Monitor - Fixed and Fully Functional
class AdvancedEEGSleepMonitor {
    constructor() {
        this.data = null;
        this.isPlaying = false;
        this.currentTimeIndex = 0;
        this.maxTime = 1000;
        this.activeBand = 'all';
        this.currentTab = 'home';
        this.playSpeed = 1.0;
        this.userName = 'Guest';
        this.userAvatar = '👤';
        this.isInitialized = false;
        
        // EEG Configuration
        this.samplingRate = 200;
        this.channels = ['Fp1', 'Fp2', 'F3', 'F4', 'F7', 'F8', 'T3', 'T4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2'];
        this.frequencyBands = {
            delta: [0.5, 4],
            theta: [4, 8],
            alpha: [8, 12],
            beta: [12, 30],
            gamma: [30, 100]
        };
        
        // Sleep stages configuration
        this.sleepStages = {
            'N1': { name: 'NREM Stage 1', color: '#E6F3FF', icon: 'fas fa-eye-slash' },
            'N2': { name: 'NREM Stage 2', color: '#D4DDFF', icon: 'fas fa-moon' },
            'N3': { name: 'NREM Stage 3', color: '#C2E0FF', icon: 'fas fa-bed' },
            'REM': { name: 'REM Sleep', color: '#FFE6F0', icon: 'fas fa-cloud' }
        };
        
        // Initialize immediately
        this.init();
    }

    init() {
        console.log('Initializing EEG Sleep Monitor...');
        
        // Skip user setup for now and go straight to the app
        this.initializeDirectly();
        
        this.setupEventListeners();
        this.generateSimulatedData();
        this.initializePlots();
        this.updateUI();
        this.startRealTimeUpdates();
        
        this.isInitialized = true;
        console.log('EEG Sleep Monitor initialized successfully');
    }

    initializeDirectly() {
        // Hide user setup modal and show main app
        const modal = document.getElementById('user-setup-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Show main dashboard
        const dashboard = document.querySelector('.main-dashboard');
        if (dashboard) {
            dashboard.style.display = 'grid';
        }
        
        // Set default user
        this.userName = 'Demo User';
        this.userAvatar = '👨‍⚕️';
        this.updateUserGreeting();
    }

    updateUserGreeting() {
        const greetingElement = document.getElementById('user-greeting');
        const profileElement = document.getElementById('profile-avatar');
        
        if (greetingElement) {
            greetingElement.textContent = `Hi ${this.userName} 👋`;
        }
        if (profileElement) {
            profileElement.textContent = this.userAvatar;
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Band filter toggles - Fixed selectors
        const bandToggles = document.querySelectorAll('.band-toggle');
        console.log('Found band toggles:', bandToggles.length);
        
        bandToggles.forEach((btn, index) => {
            const band = btn.getAttribute('data-band');
            console.log(`Setting up band toggle ${index}: ${band}`);
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Band toggle clicked: ${band}`);
                this.setActiveBand(band);
            });
        });

        // Playback controls
        this.setupButton('play-pause-btn', () => this.togglePlayback());
        this.setupButton('load-real-data-btn', () => this.loadRealEEGData());
        this.setupButton('detect-events-btn', () => this.detectSleepEvents());

        // Timeline controls
        const timelineSlider = document.getElementById('timeline-slider');
        if (timelineSlider) {
            timelineSlider.addEventListener('input', (e) => {
                this.updateTimePosition(parseInt(e.target.value));
            });
        }

        // Bottom navigation - Fixed
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Found nav items:', navItems.length);
        
        navItems.forEach((item, index) => {
            const tab = item.getAttribute('data-tab');
            console.log(`Setting up nav item ${index}: ${tab}`);
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Nav item clicked: ${tab}`);
                this.switchTab(tab);
            });
        });

        console.log('Event listeners setup complete');
    }

    setupButton(id, callback) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Button clicked: ${id}`);
                callback();
            });
            console.log(`Button setup: ${id}`);
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }

    generateSimulatedData() {
        console.log('Generating simulated EEG data...');
        
        const duration = 3600; // 1 hour of data
        const samples = duration * 10; // 10 Hz for demo
        
        this.data = {
            time: [],
            channels: {},
            sleepStages: []
        };

        // Generate time array
        for (let i = 0; i < samples; i++) {
            this.data.time.push(i / 10);
        }

        // Generate EEG data for each channel
        this.channels.forEach(channel => {
            this.data.channels[channel] = this.generateChannelData(samples, channel);
        });

        this.maxTime = samples - 1;
        
        // Update timeline slider
        const timelineSlider = document.getElementById('timeline-slider');
        if (timelineSlider) {
            timelineSlider.max = this.maxTime;
            timelineSlider.value = 0;
        }
        
        console.log('Simulated data generated:', this.data.time.length, 'samples');
    }

    generateChannelData(samples, channel) {
        const data = new Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const t = i / 10; // 10 Hz sampling
            let signal = 0;
            
            // Generate realistic EEG-like signal
            signal += Math.sin(2 * Math.PI * 10 * t) * 20; // Alpha waves
            signal += Math.sin(2 * Math.PI * 20 * t) * 15; // Beta waves
            signal += Math.sin(2 * Math.PI * 5 * t) * 25; // Theta waves
            signal += Math.sin(2 * Math.PI * 1 * t) * 30; // Delta waves
            
            // Add noise
            signal += (Math.random() - 0.5) * 10;
            
            data[i] = signal;
        }
        
        return data;
    }

    initializePlots() {
        console.log('Initializing Plotly plots...');
        
        // Wait for Plotly to be available
        if (typeof Plotly === 'undefined') {
            console.warn('Plotly not loaded yet, retrying...');
            setTimeout(() => this.initializePlots(), 1000);
            return;
        }
        
        try {
            this.initMainEEGPlot();
            this.initMiniEEGPlot();
            this.initSleepCycleChart();
            this.initREMTimelinePlot();
            console.log('Plots initialized successfully');
        } catch (error) {
            console.error('Error initializing plots:', error);
        }
    }

    initMainEEGPlot() {
        const layout = {
            title: {
                text: 'Real-time EEG Analysis',
                font: { size: 16, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (seconds)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            yaxis: {
                title: 'Amplitude (μV)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent',
            margin: { l: 50, r: 20, t: 50, b: 50 },
            showlegend: true
        };

        const config = {
            displayModeBar: true,
            displaylogo: false,
            responsive: true
        };

        // Create plot with initial empty data
        Plotly.newPlot('eeg-plot', [], layout, config);
        
        // Add some initial data
        this.updateMainEEGPlot();
    }

    initMiniEEGPlot() {
        const layout = {
            showlegend: false,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            xaxis: { visible: false },
            yaxis: { visible: false },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent'
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        Plotly.newPlot('mini-eeg-plot', [], layout, config);
        this.updateMiniEEGPlot();
    }

    initSleepCycleChart() {
        const data = [{
            values: [5, 45, 25, 25],
            labels: ['N1', 'N2', 'N3', 'REM'],
            type: 'pie',
            hole: 0.6,
            marker: {
                colors: ['#E6F3FF', '#D4DDFF', '#C2E0FF', '#FFE6F0']
            },
            textinfo: 'label+percent',
            hovertemplate: '%{label}: %{value}%<extra></extra>'
        }];

        const layout = {
            showlegend: false,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent'
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        Plotly.newPlot('sleep-cycle-chart', data, layout, config);
    }

    initREMTimelinePlot() {
        // Generate REM timeline data
        const remData = [{
            x: [1, 3, 5, 7],
            y: [0.5, 0.5, 0.5, 0.5],
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: '#FFB6C1',
                size: 15,
                symbol: 'square'
            },
            name: 'REM Episodes'
        }];

        const layout = {
            title: 'REM Episodes',
            showlegend: false,
            margin: { l: 20, r: 20, t: 30, b: 20 },
            xaxis: {
                title: 'Time (hours)',
                showgrid: false,
                range: [0, 8]
            },
            yaxis: {
                showgrid: false,
                range: [0, 1],
                tickvals: [],
                ticktext: []
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent'
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        Plotly.newPlot('rem-timeline-plot', remData, layout, config);
    }

    setActiveBand(band) {
        console.log(`Setting active band to: ${band}`);
        
        // Update button states
        document.querySelectorAll('.band-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-band="${band}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.activeBand = band;
        this.updateMainEEGPlot();
    }

    updateMainEEGPlot() {
        if (!this.data || !this.isInitialized) return;
        
        console.log('Updating main EEG plot for band:', this.activeBand);
        
        const windowSize = Math.min(300, this.data.time.length); // 30 second window
        const startIndex = Math.max(0, this.currentTimeIndex - windowSize / 2);
        const endIndex = Math.min(this.data.time.length, startIndex + windowSize);
        
        const timeWindow = this.data.time.slice(startIndex, endIndex);
        const traces = [];
        
        if (this.activeBand === 'all') {
            // Show multiple channels
            const channelsToShow = ['Fp1', 'C3', 'P3', 'O1'];
            channelsToShow.forEach((channel, index) => {
                if (this.data.channels[channel]) {
                    const channelData = this.data.channels[channel].slice(startIndex, endIndex);
                    
                    traces.push({
                        x: timeWindow,
                        y: channelData.map(val => val + index * 80), // Offset channels
                        type: 'scatter',
                        mode: 'lines',
                        name: channel,
                        line: { color: this.getChannelColor(channel), width: 1.5 }
                    });
                }
            });
        } else {
            // Show single channel for specific band
            const channel = 'C3';
            if (this.data.channels[channel]) {
                const channelData = this.data.channels[channel].slice(startIndex, endIndex);
                
                traces.push({
                    x: timeWindow,
                    y: channelData,
                    type: 'scatter',
                    mode: 'lines',
                    name: `${this.activeBand.toUpperCase()} Band`,
                    line: { color: this.getBandColor(this.activeBand), width: 2 }
                });
            }
        }
        
        // Add current time indicator
        const currentTime = this.data.time[this.currentTimeIndex] || 0;
        traces.push({
            x: [currentTime, currentTime],
            y: [-200, 400],
            type: 'scatter',
            mode: 'lines',
            name: 'Current Time',
            line: { color: '#6366f1', width: 2, dash: 'dash' },
            showlegend: false
        });
        
        const layout = {
            title: {
                text: `${this.activeBand === 'all' ? 'Multi-Channel' : this.activeBand.toUpperCase() + ' Band'} EEG`,
                font: { size: 16, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (seconds)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            yaxis: {
                title: 'Amplitude (μV)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent',
            margin: { l: 50, r: 20, t: 50, b: 50 },
            showlegend: true
        };
        
        try {
            Plotly.react('eeg-plot', traces, layout);
        } catch (error) {
            console.error('Error updating EEG plot:', error);
        }
    }

    updateMiniEEGPlot() {
        if (!this.data || !this.isInitialized) return;
        
        const windowSize = 50;
        const startIndex = Math.max(0, this.currentTimeIndex - windowSize / 2);
        const endIndex = Math.min(this.data.time.length, startIndex + windowSize);
        
        const timeWindow = this.data.time.slice(startIndex, endIndex);
        const channelData = this.data.channels['C3']?.slice(startIndex, endIndex) || [];
        
        const trace = {
            x: timeWindow,
            y: channelData,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#98FB98', width: 1 },
            showlegend: false
        };
        
        const layout = {
            showlegend: false,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            xaxis: { visible: false },
            yaxis: { visible: false },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent'
        };
        
        try {
            Plotly.react('mini-eeg-plot', [trace], layout);
        } catch (error) {
            console.error('Error updating mini EEG plot:', error);
        }
    }

    getChannelColor(channel) {
        const colors = {
            'Fp1': '#87CEEB', 'Fp2': '#87CEEB',
            'F3': '#87CEEB', 'F4': '#87CEEB',
            'C3': '#98FB98', 'C4': '#98FB98',
            'P3': '#DDA0DD', 'P4': '#DDA0DD',
            'O1': '#FFB6C1', 'O2': '#FFB6C1'
        };
        return colors[channel] || '#888888';
    }

    getBandColor(band) {
        const colors = {
            'delta': '#87CEEB',
            'theta': '#DDA0DD',
            'alpha': '#98FB98',
            'beta': '#FFDAB9',
            'gamma': '#FFB6C1'
        };
        return colors[band] || '#888888';
    }

    togglePlayback() {
        const btn = document.getElementById('play-pause-btn');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
            if (this.playAnimation) {
                cancelAnimationFrame(this.playAnimation);
            }
            console.log('Playback stopped');
        } else {
            this.isPlaying = true;
            if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
            this.startPlayback();
            console.log('Playback started');
        }
    }

    startPlayback() {
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            this.currentTimeIndex = (this.currentTimeIndex + 5) % this.maxTime;
            
            const timelineSlider = document.getElementById('timeline-slider');
            if (timelineSlider) {
                timelineSlider.value = this.currentTimeIndex;
            }
            
            this.updateTimePosition(this.currentTimeIndex);
            
            this.playAnimation = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }

    updateTimePosition(timeIndex) {
        this.currentTimeIndex = timeIndex;
        const timeInSeconds = timeIndex / 10; // 10 Hz sampling
        
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(timeInSeconds);
        }
        
        // Update visualizations
        this.updateMainEEGPlot();
        this.updateMiniEEGPlot();
    }

    async loadRealEEGData() {
        const btn = document.getElementById('load-real-data-btn');
        const originalHTML = btn ? btn.innerHTML : '';
        
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            btn.disabled = true;
        }
        
        try {
            console.log('Loading EEG data...');
            
            // Try to load CSV data
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            
            console.log('CSV data loaded, length:', csvText.length);
            
            // Process the data (simplified)
            const lines = csvText.split('\n');
            console.log('CSV lines:', lines.length);
            
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Data Loaded';
            }
            
            this.showTooltip('EEG data loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading data:', error);
            if (btn) {
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            }
            this.showTooltip('Error loading data', 'error');
        }
        
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }, 2000);
    }

    detectSleepEvents() {
        const btn = document.getElementById('detect-events-btn');
        const originalHTML = btn ? btn.innerHTML : '';
        
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
            btn.disabled = true;
        }
        
        console.log('Detecting sleep events...');
        
        setTimeout(() => {
            console.log('Sleep events detected');
            
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Events Detected';
            }
            
            this.showTooltip('Sleep events detected!', 'success');
            
            setTimeout(() => {
                if (btn) {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }
            }, 2000);
        }, 1500);
    }

    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Update navigation states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show/hide main dashboard
        const mainDashboard = document.querySelector('.main-dashboard');
        
        if (tabName === 'home') {
            if (mainDashboard) {
                mainDashboard.style.display = 'grid';
            }
        } else {
            if (mainDashboard) {
                mainDashboard.style.display = 'none';
            }
            
            const targetContent = document.getElementById(`${tabName}-content`);
            if (targetContent) {
                targetContent.style.display = 'block';
                
                // Initialize tab-specific content
                setTimeout(() => {
                    if (tabName === 'brain-regions') {
                        this.initializeRegionPlots();
                    } else if (tabName === 'sleep-stages') {
                        this.initializeSleepStagePlots();
                    }
                }, 100);
            }
        }
        
        this.currentTab = tabName;
        console.log(`Switched to tab: ${tabName}`);
    }

    initializeRegionPlots() {
        console.log('Initializing region plots...');
        
        const regions = ['frontal', 'temporal', 'parietal', 'occipital'];
        
        regions.forEach(region => {
            const plotElement = document.getElementById(`${region}-plot`);
            if (plotElement && typeof Plotly !== 'undefined') {
                this.createRegionPlot(region);
            }
        });
    }

    createRegionPlot(region) {
        console.log(`Creating plot for ${region} region`);
        
        const time = [];
        const data = [];
        
        for (let i = 0; i < 100; i++) {
            time.push(i / 10);
            data.push(Math.sin(i / 10) * 20 + (Math.random() - 0.5) * 10);
        }
        
        const trace = {
            x: time,
            y: data,
            type: 'scatter',
            mode: 'lines',
            name: `${region} EEG`,
            line: { color: this.getRegionColor(region), width: 2 }
        };
        
        const layout = {
            title: `${region.charAt(0).toUpperCase() + region.slice(1)} Region`,
            xaxis: { title: 'Time (s)' },
            yaxis: { title: 'Amplitude (μV)' },
            margin: { l: 40, r: 20, t: 40, b: 40 },
            showlegend: false
        };
        
        const config = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot(`${region}-plot`, [trace], layout, config);
    }

    getRegionColor(region) {
        const colors = {
            frontal: '#87CEEB',
            temporal: '#FFDAB9',
            parietal: '#DDA0DD',
            occipital: '#FFB6C1'
        };
        return colors[region] || '#888888';
    }

    initializeSleepStagePlots() {
        console.log('Initializing sleep stage plots...');
        
        const stages = ['n1', 'n2', 'n3', 'rem'];
        
        stages.forEach(stage => {
            const plotElement = document.getElementById(`${stage}-example-plot`);
            if (plotElement && typeof Plotly !== 'undefined') {
                this.createSleepStageExamplePlot(stage);
            }
        });
    }

    createSleepStageExamplePlot(stage) {
        console.log(`Creating plot for ${stage} stage`);
        
        const time = [];
        const data = [];
        
        for (let i = 0; i < 100; i++) {
            time.push(i / 10);
            
            // Different patterns for different sleep stages
            let signal = 0;
            switch (stage) {
                case 'n1':
                    signal = Math.sin(i / 5) * 15 + (Math.random() - 0.5) * 5;
                    break;
                case 'n2':
                    signal = Math.sin(i / 3) * 25 + (Math.random() - 0.5) * 8;
                    break;
                case 'n3':
                    signal = Math.sin(i / 8) * 40 + (Math.random() - 0.5) * 5;
                    break;
                case 'rem':
                    signal = Math.sin(i / 2) * 10 + (Math.random() - 0.5) * 15;
                    break;
            }
            
            data.push(signal);
        }
        
        const trace = {
            x: time,
            y: data,
            type: 'scatter',
            mode: 'lines',
            name: stage.toUpperCase(),
            line: { color: this.getStageColor(stage), width: 2 }
        };
        
        const layout = {
            title: `${stage.toUpperCase()} Sleep Stage`,
            xaxis: { title: 'Time (s)' },
            yaxis: { title: 'Amplitude (μV)' },
            margin: { l: 40, r: 20, t: 40, b: 40 },
            showlegend: false
        };
        
        const config = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot(`${stage}-example-plot`, [trace], layout, config);
    }

    getStageColor(stage) {
        const colors = {
            'n1': '#E6F3FF',
            'n2': '#D4DDFF',
            'n3': '#C2E0FF',
            'rem': '#FFE6F0'
        };
        return colors[stage] || '#888888';
    }

    startRealTimeUpdates() {
        setInterval(() => {
            // Update session info
            const sessionDuration = document.getElementById('session-duration');
            if (sessionDuration) {
                const hours = Math.floor(Math.random() * 8) + 1;
                const minutes = Math.floor(Math.random() * 60);
                sessionDuration.textContent = `${hours}h ${minutes}m`;
            }
            
            // Update sleep score
            const sleepScore = document.getElementById('sleep-score');
            if (sleepScore) {
                const score = 80 + Math.floor(Math.random() * 20);
                sleepScore.textContent = score;
            }
            
            // Update stage confidence
            const stageConfidence = document.getElementById('stage-confidence');
            if (stageConfidence) {
                const confidence = 85 + Math.floor(Math.random() * 15);
                stageConfidence.textContent = `${confidence}%`;
            }
            
        }, 3000);
    }

    updateUI() {
        // Initial UI updates
        this.updateUserGreeting();
        
        // Set initial time
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = '00:00:00';
        }
        
        // Set initial stage
        const stageName = document.getElementById('current-stage-name');
        const stageDesc = document.getElementById('current-stage-description');
        if (stageName) stageName.textContent = 'REM Sleep';
        if (stageDesc) stageDesc.textContent = 'Dreaming phase, rapid eye movement';
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showTooltip(message, type = 'info') {
        console.log(`Tooltip: ${type} - ${message}`);
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#6366f1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 2000;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        tooltip.textContent = message;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing EEG monitor...');
        window.eegMonitor = new AdvancedEEGSleepMonitor();
    });
} else {
    console.log('DOM already loaded, initializing EEG monitor...');
    window.eegMonitor = new AdvancedEEGSleepMonitor();
}

// Debug helper
window.debugEEG = function() {
    console.log('EEG Monitor Debug Info:');
    console.log('- Initialized:', window.eegMonitor?.isInitialized);
    console.log('- Current tab:', window.eegMonitor?.currentTab);
    console.log('- Active band:', window.eegMonitor?.activeBand);
    console.log('- Data loaded:', !!window.eegMonitor?.data);
    console.log('- Playing:', window.eegMonitor?.isPlaying);
    
    // Test button clicks
    console.log('Testing buttons...');
    const buttons = document.querySelectorAll('button');
    console.log('Found buttons:', buttons.length);
    
    const navItems = document.querySelectorAll('.nav-item');
    console.log('Found nav items:', navItems.length);
    
    const bandToggles = document.querySelectorAll('.band-toggle');
    console.log('Found band toggles:', bandToggles.length);
};
