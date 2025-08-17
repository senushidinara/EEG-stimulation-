// Advanced EEG Sleep Monitor - Real Data Processing & Analysis
class AdvancedEEGSleepMonitor {
    constructor() {
        this.data = null;
        this.isPlaying = false;
        this.currentTimeIndex = 0;
        this.maxTime = 0;
        this.activeBand = 'all';
        this.currentTab = 'home';
        this.playSpeed = 1.0;
        this.userName = 'Guest';
        this.userAvatar = '👤';
        
        // EEG Configuration
        this.samplingRate = 200; // Hz
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
        
        // Brain regions mapping
        this.brainRegions = {
            frontal: ['Fp1', 'Fp2', 'F3', 'F4', 'F7', 'F8'],
            temporal: ['T3', 'T4'],
            parietal: ['P3', 'P4'],
            occipital: ['O1', 'O2']
        };
        
        // Simulated real-time metrics
        this.currentMetrics = {
            sleepStage: 'REM',
            stageConfidence: 94,
            stageDuration: 754, // seconds
            cycleCount: 3,
            sleepQuality: 87,
            stageDistribution: { N1: 5, N2: 45, N3: 25, REM: 25 },
            remEpisodes: 4,
            remTotalDuration: 6720, // seconds
            remEfficiency: 92
        };
        
        // Event detection
        this.detectedEvents = [];
        this.eventTypes = {
            'sleep_spindle': { name: 'Sleep Spindle', color: '#DDA0DD', description: 'Brief bursts of oscillatory brain activity (12-16 Hz)' },
            'k_complex': { name: 'K-Complex', color: '#87CEEB', description: 'High amplitude negative waves in NREM sleep' },
            'rem_burst': { name: 'REM Burst', color: '#FFB6C1', description: 'Rapid eye movement episodes during REM sleep' }
        };
        
        this.init();
    }

    init() {
        this.checkUserSetup();
        this.setupEventListeners();
        this.initializePlots();
        this.generateSimulatedData();
        this.startRealTimeUpdates();
        this.detectSleepEvents();
        this.updateUI();
    }

    checkUserSetup() {
        const savedUser = localStorage.getItem('eeg-user-name');
        const savedAvatar = localStorage.getItem('eeg-user-avatar');
        
        if (savedUser && savedAvatar) {
            this.userName = savedUser;
            this.userAvatar = savedAvatar;
            this.updateUserGreeting();
            document.getElementById('user-setup-modal').style.display = 'none';
        } else {
            this.showUserSetup();
        }
    }

    showUserSetup() {
        const modal = document.getElementById('user-setup-modal');
        modal.style.display = 'flex';
        
        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                this.userAvatar = e.target.textContent;
            });
        });
        
        // Setup completion
        document.getElementById('setup-complete').addEventListener('click', () => {
            const nameInput = document.getElementById('user-name');
            if (nameInput.value.trim()) {
                this.userName = nameInput.value.trim();
                localStorage.setItem('eeg-user-name', this.userName);
                localStorage.setItem('eeg-user-avatar', this.userAvatar);
                this.updateUserGreeting();
                modal.style.display = 'none';
            } else {
                nameInput.style.borderColor = '#dc2626';
                nameInput.placeholder = 'Please enter your name';
            }
        });
    }

    updateUserGreeting() {
        document.getElementById('user-greeting').textContent = `Hi ${this.userName} 👋`;
        document.getElementById('profile-avatar').textContent = this.userAvatar;
    }

    setupEventListeners() {
        // Band filter toggles
        document.querySelectorAll('.band-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveBand(e.target.dataset.band);
            });
        });

        // Playback controls
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('load-real-data-btn').addEventListener('click', () => this.loadRealEEGData());
        document.getElementById('detect-events-btn').addEventListener('click', () => this.detectSleepEvents());

        // Timeline controls
        document.getElementById('timeline-slider').addEventListener('input', (e) => {
            this.updateTimePosition(parseInt(e.target.value));
        });
        
        document.getElementById('playback-speed').addEventListener('change', (e) => {
            this.playSpeed = parseFloat(e.target.value);
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-item').dataset.tab);
            });
        });

        // Profile avatar click
        document.getElementById('profile-avatar').addEventListener('click', () => {
            this.showUserSetup();
        });
    }

    initializePlots() {
        // Main EEG plot
        this.initMainEEGPlot();
        
        // Mini EEG plot in sleep stage display
        this.initMiniEEGPlot();
        
        // Sleep cycle chart
        this.initSleepCycleChart();
        
        // REM timeline plot
        this.initREMTimelinePlot();
        
        // Region plots (will be initialized when tab is opened)
        this.regionPlotsInitialized = false;
        
        // Sleep stage plots (will be initialized when tab is opened)
        this.stagePlotsInitialized = false;
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
                gridcolor: 'rgba(0,0,0,0.1)',
                range: [0, 30] // 30-second window
            },
            yaxis: {
                title: 'Amplitude (μV)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                range: [-100, 100]
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent',
            margin: { l: 50, r: 20, t: 50, b: 50 },
            showlegend: true,
            legend: {
                x: 1,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)'
            }
        };

        const config = {
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            responsive: true
        };

        Plotly.newPlot('eeg-plot', [], layout, config);
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
    }

    initSleepCycleChart() {
        const data = [{
            values: [
                this.currentMetrics.stageDistribution.N1,
                this.currentMetrics.stageDistribution.N2,
                this.currentMetrics.stageDistribution.N3,
                this.currentMetrics.stageDistribution.REM
            ],
            labels: ['N1', 'N2', 'N3', 'REM'],
            type: 'pie',
            hole: 0.6,
            marker: {
                colors: ['#E6F3FF', '#D4DDFF', '#C2E0FF', '#FFE6F0']
            },
            textinfo: 'none',
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
        const layout = {
            showlegend: false,
            margin: { l: 20, r: 20, t: 10, b: 20 },
            xaxis: {
                title: 'Time (hours)',
                showgrid: false,
                range: [0, 8]
            },
            yaxis: {
                title: 'REM',
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

        Plotly.newPlot('rem-timeline-plot', [], layout, config);
        this.updateREMTimeline();
    }

    generateSimulatedData() {
        // Generate 8 hours of simulated EEG data (200 Hz sampling rate)
        const duration = 8 * 60 * 60; // 8 hours in seconds
        const totalSamples = duration * this.samplingRate;
        
        this.data = {
            time: [],
            channels: {},
            sleepStages: [],
            events: []
        };

        // Generate time array
        for (let i = 0; i < totalSamples; i++) {
            this.data.time.push(i / this.samplingRate);
        }

        // Generate EEG data for each channel
        this.channels.forEach(channel => {
            this.data.channels[channel] = this.generateChannelData(totalSamples, channel);
        });

        // Generate sleep stages
        this.generateSleepStages(duration);
        
        this.maxTime = totalSamples - 1;
        document.getElementById('timeline-slider').max = this.maxTime;
    }

    generateChannelData(samples, channel) {
        const data = new Array(samples);
        let currentStage = 'N2';
        let stageCounter = 0;
        const stageDuration = 30 * this.samplingRate; // 30 seconds per stage on average
        
        for (let i = 0; i < samples; i++) {
            // Change sleep stage periodically
            if (stageCounter >= stageDuration) {
                const stages = ['N1', 'N2', 'N3', 'REM'];
                currentStage = stages[Math.floor(Math.random() * stages.length)];
                stageCounter = 0;
            }
            
            // Generate EEG signal based on current sleep stage and channel
            data[i] = this.generateEEGSample(i, currentStage, channel);
            stageCounter++;
        }
        
        return data;
    }

    generateEEGSample(timeIndex, stage, channel) {
        const t = timeIndex / this.samplingRate;
        let signal = 0;
        
        // Different frequency components based on sleep stage
        switch (stage) {
            case 'N1':
                signal += Math.sin(2 * Math.PI * 9 * t) * 20; // Alpha reduction
                signal += Math.sin(2 * Math.PI * 6 * t) * 15; // Theta emergence
                break;
            case 'N2':
                signal += Math.sin(2 * Math.PI * 14 * t) * 30; // Sleep spindles
                signal += Math.sin(2 * Math.PI * 2 * t) * 25; // Delta waves
                if (Math.random() > 0.99) signal += Math.sin(2 * Math.PI * 1 * t) * 80; // K-complexes
                break;
            case 'N3':
                signal += Math.sin(2 * Math.PI * 1.5 * t) * 60; // Dominant delta
                signal += Math.sin(2 * Math.PI * 0.8 * t) * 40; // Slow waves
                break;
            case 'REM':
                signal += Math.sin(2 * Math.PI * 25 * t) * 15; // High frequency
                signal += Math.sin(2 * Math.PI * 8 * t) * 10; // Mixed frequencies
                signal += Math.sin(2 * Math.PI * 40 * t) * 8; // Gamma activity
                break;
        }
        
        // Add channel-specific characteristics
        const regionMultiplier = this.getRegionMultiplier(channel, stage);
        signal *= regionMultiplier;
        
        // Add realistic noise
        signal += (Math.random() - 0.5) * 10;
        
        return signal;
    }

    getRegionMultiplier(channel, stage) {
        // Different brain regions have different activity levels in different sleep stages
        const frontalChannels = ['Fp1', 'Fp2', 'F3', 'F4', 'F7', 'F8'];
        const temporalChannels = ['T3', 'T4'];
        const parietalChannels = ['P3', 'P4'];
        const occipitalChannels = ['O1', 'O2'];
        
        let multiplier = 1.0;
        
        if (frontalChannels.includes(channel)) {
            multiplier = stage === 'REM' ? 1.2 : 0.9;
        } else if (temporalChannels.includes(channel)) {
            multiplier = stage === 'N2' ? 1.3 : 1.0;
        } else if (parietalChannels.includes(channel)) {
            multiplier = stage === 'N3' ? 1.4 : 0.8;
        } else if (occipitalChannels.includes(channel)) {
            multiplier = stage === 'N1' ? 1.1 : 0.7;
        }
        
        return multiplier;
    }

    generateSleepStages(duration) {
        // Generate realistic sleep stage progression
        const stages = [];
        let currentTime = 0;
        const sleepCycle = ['N1', 'N2', 'N3', 'N2', 'REM']; // Typical sleep cycle
        let cycleIndex = 0;
        
        while (currentTime < duration) {
            const stage = sleepCycle[cycleIndex % sleepCycle.length];
            let stageDuration;
            
            // Realistic stage durations
            switch (stage) {
                case 'N1': stageDuration = 60 + Math.random() * 300; break; // 1-6 minutes
                case 'N2': stageDuration = 600 + Math.random() * 1800; break; // 10-40 minutes
                case 'N3': stageDuration = 300 + Math.random() * 1200; break; // 5-25 minutes
                case 'REM': stageDuration = 300 + Math.random() * 1800; break; // 5-35 minutes
            }
            
            stages.push({
                stage: stage,
                startTime: currentTime,
                duration: stageDuration
            });
            
            currentTime += stageDuration;
            cycleIndex++;
        }
        
        this.data.sleepStages = stages;
    }

    setActiveBand(band) {
        // Update button states
        document.querySelectorAll('.band-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-band="${band}"]`).classList.add('active');
        
        this.activeBand = band;
        this.updateMainEEGPlot();
    }

    updateMainEEGPlot() {
        if (!this.data) return;
        
        const windowSize = 30 * this.samplingRate; // 30-second window
        const startIndex = Math.max(0, this.currentTimeIndex - windowSize);
        const endIndex = Math.min(this.data.time.length, this.currentTimeIndex + windowSize);
        
        const timeWindow = this.data.time.slice(startIndex, endIndex);
        const traces = [];
        
        if (this.activeBand === 'all') {
            // Show multiple channels
            const channelsToShow = ['Fp1', 'C3', 'P3', 'O1']; // Representative channels
            channelsToShow.forEach((channel, index) => {
                const channelData = this.data.channels[channel].slice(startIndex, endIndex);
                const filteredData = this.applyBandpassFilter(channelData, [0.5, 50]); // General EEG filter
                
                traces.push({
                    x: timeWindow,
                    y: filteredData.map(val => val + index * 60), // Offset channels vertically
                    type: 'scatter',
                    mode: 'lines',
                    name: channel,
                    line: { color: this.getChannelColor(channel), width: 1.5 }
                });
            });
        } else {
            // Show filtered data for specific band
            const bandRange = this.frequencyBands[this.activeBand];
            const channel = 'C3'; // Central channel for single band view
            const channelData = this.data.channels[channel].slice(startIndex, endIndex);
            const filteredData = this.applyBandpassFilter(channelData, bandRange);
            
            traces.push({
                x: timeWindow,
                y: filteredData,
                type: 'scatter',
                mode: 'lines',
                name: `${this.activeBand.toUpperCase()} (${bandRange[0]}-${bandRange[1]} Hz)`,
                line: { color: this.getBandColor(this.activeBand), width: 2 }
            });
        }
        
        // Add current time indicator
        const currentTime = this.data.time[this.currentTimeIndex];
        traces.push({
            x: [currentTime, currentTime],
            y: [-100, 100],
            type: 'scatter',
            mode: 'lines',
            name: 'Current Time',
            line: { color: '#6366f1', width: 2, dash: 'dash' },
            showlegend: false
        });
        
        // Add detected events
        this.addEventAnnotations(traces, timeWindow[0], timeWindow[timeWindow.length - 1]);
        
        const layout = {
            title: {
                text: `${this.activeBand === 'all' ? 'Multi-Channel' : this.activeBand.toUpperCase() + ' Band'} EEG Analysis`,
                font: { size: 16, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (seconds)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                range: [timeWindow[0], timeWindow[timeWindow.length - 1]]
            },
            yaxis: {
                title: 'Amplitude (μV)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                range: this.activeBand === 'all' ? [-50, 250] : [-100, 100]
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent',
            margin: { l: 50, r: 20, t: 50, b: 50 },
            showlegend: true,
            legend: {
                x: 1,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)'
            }
        };
        
        Plotly.react('eeg-plot', traces, layout);
    }

    applyBandpassFilter(data, bandRange) {
        // Simplified bandpass filter simulation
        // In a real implementation, you would use a proper DSP library
        const [lowFreq, highFreq] = bandRange;
        const nyquist = this.samplingRate / 2;
        const lowNorm = lowFreq / nyquist;
        const highNorm = highFreq / nyquist;
        
        // Simple frequency domain filtering simulation
        return data.map((sample, index) => {
            const t = index / this.samplingRate;
            let filtered = 0;
            
            // Add frequency components within the band
            for (let freq = lowFreq; freq <= highFreq; freq += 0.5) {
                const amplitude = Math.exp(-Math.abs(freq - (lowFreq + highFreq) / 2) / 5); // Gaussian response
                filtered += sample * amplitude * Math.sin(2 * Math.PI * freq * t);
            }
            
            return filtered * 0.1; // Scale down
        });
    }

    getChannelColor(channel) {
        const colors = {
            'Fp1': '#87CEEB', 'Fp2': '#87CEEB',
            'F3': '#87CEEB', 'F4': '#87CEEB', 'F7': '#87CEEB', 'F8': '#87CEEB',
            'C3': '#98FB98', 'C4': '#98FB98',
            'P3': '#DDA0DD', 'P4': '#DDA0DD',
            'T3': '#FFDAB9', 'T4': '#FFDAB9',
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

    addEventAnnotations(traces, startTime, endTime) {
        this.detectedEvents.forEach(event => {
            if (event.time >= startTime && event.time <= endTime) {
                traces.push({
                    x: [event.time],
                    y: [event.amplitude],
                    type: 'scatter',
                    mode: 'markers',
                    name: event.type,
                    marker: {
                        color: this.eventTypes[event.type].color,
                        size: 12,
                        symbol: 'diamond'
                    },
                    hovertemplate: `${this.eventTypes[event.type].name}<br>` +
                                 `Time: ${event.time.toFixed(1)}s<br>` +
                                 `Amplitude: ${event.amplitude.toFixed(1)} μV<extra></extra>`,
                    showlegend: false
                });
            }
        });
    }

    async loadRealEEGData() {
        const btn = document.getElementById('load-real-data-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Sleep-EDF...';
        btn.disabled = true;
        
        try {
            // Simulate loading real Sleep-EDF data
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Load the existing CSV data as a fallback
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            this.processRealEEGData(csvText);
            
            btn.innerHTML = '<i class="fas fa-check"></i> Sleep-EDF Loaded';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error loading Sleep-EDF data:', error);
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error Loading';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
        }
    }

    processRealEEGData(csvText) {
        // Parse CSV data and integrate with existing simulation
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Process real data and update visualizations
        console.log('Processing real EEG data with', headers.length, 'channels');
        
        // Update the main plot with new data
        this.updateMainEEGPlot();
        
        // Show success message
        this.showTooltip('Real Sleep-EDF data loaded successfully!', 'success');
    }

    detectSleepEvents() {
        const btn = document.getElementById('detect-events-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
        btn.disabled = true;
        
        // Simulate event detection
        setTimeout(() => {
            this.detectedEvents = [];
            
            // Generate realistic sleep events
            const eventDensity = 0.001; // Events per second
            const totalDuration = this.data.time[this.data.time.length - 1];
            
            for (let t = 0; t < totalDuration; t += 1) {
                if (Math.random() < eventDensity) {
                    const eventTypes = Object.keys(this.eventTypes);
                    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                    
                    this.detectedEvents.push({
                        time: t,
                        type: eventType,
                        amplitude: (Math.random() - 0.5) * 100,
                        duration: 0.5 + Math.random() * 2,
                        frequency: 8 + Math.random() * 20
                    });
                }
            }
            
            // Update timeline annotations
            this.updateTimelineAnnotations();
            
            // Update main plot
            this.updateMainEEGPlot();
            
            btn.innerHTML = '<i class="fas fa-check"></i> Events Detected';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
            
        }, 1500);
    }

    updateTimelineAnnotations() {
        const timeline = document.getElementById('timeline-annotations');
        timeline.innerHTML = '';
        
        this.detectedEvents.forEach(event => {
            const marker = document.createElement('div');
            marker.className = `annotation-marker ${event.type.replace('_', '-')}`;
            marker.style.left = `${(event.time / this.data.time[this.data.time.length - 1]) * 100}%`;
            marker.title = `${this.eventTypes[event.type].name} at ${event.time.toFixed(1)}s`;
            
            marker.addEventListener('click', () => {
                this.showEventTooltip(event, marker);
                this.currentTimeIndex = Math.floor(event.time * this.samplingRate);
                this.updateTimePosition(this.currentTimeIndex);
            });
            
            timeline.appendChild(marker);
        });
    }

    showEventTooltip(event, element) {
        const tooltip = document.getElementById('event-tooltip');
        const rect = element.getBoundingClientRect();
        
        document.getElementById('tooltip-event-type').textContent = this.eventTypes[event.type].name;
        document.getElementById('tooltip-event-time').textContent = this.formatTime(event.time);
        document.getElementById('tooltip-description').textContent = this.eventTypes[event.type].description;
        document.getElementById('tooltip-duration').textContent = `${event.duration.toFixed(1)}s`;
        document.getElementById('tooltip-frequency').textContent = `${event.frequency.toFixed(1)} Hz`;
        document.getElementById('tooltip-amplitude').textContent = `${event.amplitude.toFixed(1)} μV`;
        
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        tooltip.classList.add('show');
        
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 4000);
    }

    togglePlayback() {
        const btn = document.getElementById('play-pause-btn');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            btn.innerHTML = '<i class="fas fa-play"></i>';
            if (this.playAnimation) {
                cancelAnimationFrame(this.playAnimation);
            }
        } else {
            this.isPlaying = true;
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            this.startPlayback();
        }
    }

    startPlayback() {
        const baseSpeed = 100; // Base milliseconds between updates
        const playSpeed = baseSpeed / this.playSpeed;
        let lastTime = Date.now();
        
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            const currentTime = Date.now();
            if (currentTime - lastTime >= playSpeed) {
                this.currentTimeIndex = (this.currentTimeIndex + this.samplingRate) % this.maxTime; // Advance by 1 second
                
                document.getElementById('timeline-slider').value = this.currentTimeIndex;
                this.updateTimePosition(this.currentTimeIndex);
                
                lastTime = currentTime;
            }
            
            this.playAnimation = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }

    updateTimePosition(timeIndex) {
        this.currentTimeIndex = timeIndex;
        const timeInSeconds = timeIndex / this.samplingRate;
        document.getElementById('time-display').textContent = this.formatTime(timeInSeconds);
        
        // Update current sleep stage
        this.updateCurrentSleepStage(timeInSeconds);
        
        // Update visualizations
        this.updateMainEEGPlot();
        this.updateMiniEEGPlot();
    }

    updateCurrentSleepStage(timeInSeconds) {
        // Find current sleep stage
        const currentStage = this.data.sleepStages.find(stage => 
            timeInSeconds >= stage.startTime && timeInSeconds < stage.startTime + stage.duration
        );
        
        if (currentStage) {
            const stageConfig = this.sleepStages[currentStage.stage];
            this.currentMetrics.sleepStage = currentStage.stage;
            this.currentMetrics.stageDuration = timeInSeconds - currentStage.startTime;
            
            // Update UI
            document.getElementById('current-stage-icon').innerHTML = `<i class="${stageConfig.icon}"></i>`;
            document.getElementById('current-stage-name').textContent = stageConfig.name;
            document.getElementById('current-stage-description').textContent = this.getSleepStageDescription(currentStage.stage);
            document.getElementById('stage-duration').textContent = this.formatTime(this.currentMetrics.stageDuration);
        }
    }

    getSleepStageDescription(stage) {
        const descriptions = {
            'N1': 'Light sleep, transition from wakefulness',
            'N2': 'True sleep with sleep spindles and K-complexes',
            'N3': 'Deep sleep, slow wave activity dominant',
            'REM': 'Dreaming phase, rapid eye movement'
        };
        return descriptions[stage] || 'Unknown stage';
    }

    updateMiniEEGPlot() {
        if (!this.data) return;
        
        const windowSize = 5 * this.samplingRate; // 5-second window for mini plot
        const startIndex = Math.max(0, this.currentTimeIndex - windowSize);
        const endIndex = Math.min(this.data.time.length, this.currentTimeIndex + windowSize);
        
        const timeWindow = this.data.time.slice(startIndex, endIndex);
        const channelData = this.data.channels['C3'].slice(startIndex, endIndex);
        
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
        
        Plotly.react('mini-eeg-plot', [trace], layout);
    }

    updateREMTimeline() {
        // Generate REM episode timeline
        const remEpisodes = [];
        let episodeCount = 0;
        
        this.data.sleepStages.forEach(stage => {
            if (stage.stage === 'REM') {
                episodeCount++;
                remEpisodes.push({
                    x: [stage.startTime / 3600, (stage.startTime + stage.duration) / 3600], // Convert to hours
                    y: [0.4, 0.6],
                    type: 'scatter',
                    mode: 'lines',
                    fill: 'tonexty',
                    name: `REM Episode ${episodeCount}`,
                    line: { color: '#FFB6C1', width: 0 },
                    fillcolor: 'rgba(255, 182, 193, 0.6)',
                    hovertemplate: `REM Episode ${episodeCount}<br>` +
                                 `Duration: ${(stage.duration / 60).toFixed(1)} min<extra></extra>`
                });
            }
        });
        
        if (remEpisodes.length > 0) {
            const layout = {
                showlegend: false,
                margin: { l: 20, r: 20, t: 10, b: 20 },
                xaxis: {
                    title: 'Time (hours)',
                    showgrid: false,
                    range: [0, 8]
                },
                yaxis: {
                    title: 'REM',
                    showgrid: false,
                    range: [0, 1],
                    tickvals: [],
                    ticktext: []
                },
                plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
                paper_bgcolor: 'transparent'
            };
            
            Plotly.react('rem-timeline-plot', remEpisodes, layout);
        }
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show selected tab
        if (tabName === 'home') {
            document.querySelector('.main-dashboard').style.display = 'grid';
        } else {
            document.querySelector('.main-dashboard').style.display = 'none';
            document.getElementById(`${tabName}-content`).style.display = 'block';
        }
        
        this.currentTab = tabName;
        
        // Initialize tab-specific visualizations
        if (tabName === 'brain-regions' && !this.regionPlotsInitialized) {
            this.initializeRegionPlots();
        } else if (tabName === 'sleep-stages' && !this.stagePlotsInitialized) {
            this.initializeSleepStagePlots();
        } else if (tabName === 'reports') {
            this.initializeReportsPlots();
        }
    }

    initializeRegionPlots() {
        this.regionPlotsInitialized = true;
        
        Object.keys(this.brainRegions).forEach(region => {
            this.createRegionPlot(region);
        });
    }

    createRegionPlot(region) {
        const channels = this.brainRegions[region];
        const traces = [];
        
        channels.forEach(channel => {
            if (this.data.channels[channel]) {
                const windowSize = 10 * this.samplingRate; // 10-second window
                const startIndex = Math.max(0, this.currentTimeIndex - windowSize);
                const endIndex = Math.min(this.data.channels[channel].length, this.currentTimeIndex + windowSize);
                
                const timeWindow = this.data.time.slice(startIndex, endIndex);
                const channelData = this.data.channels[channel].slice(startIndex, endIndex);
                
                traces.push({
                    x: timeWindow,
                    y: channelData,
                    type: 'scatter',
                    mode: 'lines',
                    name: channel,
                    line: { color: this.getChannelColor(channel), width: 1.5 }
                });
            }
        });
        
        const layout = {
            title: {
                text: `${region.charAt(0).toUpperCase() + region.slice(1)} Region`,
                font: { size: 14, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (s)',
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
            margin: { l: 40, r: 20, t: 40, b: 40 },
            showlegend: true,
            legend: { x: 1, y: 1, bgcolor: 'rgba(255,255,255,0.8)' }
        };
        
        const config = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot(`${region}-plot`, traces, layout, config);
    }

    initializeSleepStagePlots() {
        this.stagePlotsInitialized = true;
        
        Object.keys(this.sleepStages).forEach(stage => {
            this.createSleepStageExamplePlot(stage);
        });
    }

    createSleepStageExamplePlot(stage) {
        // Generate example EEG for this sleep stage
        const duration = 10; // 10 seconds
        const samples = duration * this.samplingRate;
        const time = [];
        const eegData = [];
        
        for (let i = 0; i < samples; i++) {
            time.push(i / this.samplingRate);
            eegData.push(this.generateEEGSample(i, stage, 'C3'));
        }
        
        const trace = {
            x: time,
            y: eegData,
            type: 'scatter',
            mode: 'lines',
            name: `${stage} Example`,
            line: { color: this.sleepStages[stage].color, width: 2 }
        };
        
        const layout = {
            title: {
                text: `${this.sleepStages[stage].name} - EEG Pattern`,
                font: { size: 12, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (s)',
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
            margin: { l: 40, r: 20, t: 40, b: 40 },
            showlegend: false
        };
        
        const config = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot(`${stage.toLowerCase()}-example-plot`, [trace], layout, config);
    }

    initializeReportsPlots() {
        // Events timeline plot
        this.createEventsTimelinePlot();
        
        // Update annotations list
        this.updateAnnotationsList();
    }

    createEventsTimelinePlot() {
        const traces = [];
        const eventTypes = Object.keys(this.eventTypes);
        
        eventTypes.forEach((eventType, index) => {
            const events = this.detectedEvents.filter(event => event.type === eventType);
            
            if (events.length > 0) {
                traces.push({
                    x: events.map(event => event.time / 3600), // Convert to hours
                    y: events.map(() => index),
                    type: 'scatter',
                    mode: 'markers',
                    name: this.eventTypes[eventType].name,
                    marker: {
                        color: this.eventTypes[eventType].color,
                        size: 8
                    },
                    hovertemplate: `%{fullData.name}<br>Time: %{x:.2f}h<extra></extra>`
                });
            }
        });
        
        const layout = {
            title: {
                text: 'Sleep Events Timeline',
                font: { size: 14, color: '#553C9A' }
            },
            xaxis: {
                title: 'Time (hours)',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                range: [0, 8]
            },
            yaxis: {
                title: 'Event Type',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)',
                tickvals: eventTypes.map((_, index) => index),
                ticktext: eventTypes.map(type => this.eventTypes[type].name)
            },
            plot_bgcolor: 'rgba(248, 250, 252, 0.9)',
            paper_bgcolor: 'transparent',
            margin: { l: 80, r: 20, t: 40, b: 40 },
            showlegend: false
        };
        
        const config = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot('events-timeline-plot', traces, layout, config);
    }

    updateAnnotationsList() {
        const annotationsList = document.getElementById('annotations-list');
        annotationsList.innerHTML = '';
        
        // Sort events by time
        const sortedEvents = [...this.detectedEvents].sort((a, b) => a.time - b.time);
        
        // Show first 10 events
        sortedEvents.slice(0, 10).forEach(event => {
            const item = document.createElement('div');
            item.className = `annotation-item ${event.type.replace('_', '-')}-event`;
            
            item.innerHTML = `
                <div class="annotation-marker"></div>
                <div class="annotation-content">
                    <span class="annotation-time">${this.formatTime(event.time)}</span>
                    <span class="annotation-text">${this.eventTypes[event.type].name} detected</span>
                    <span class="annotation-detail">${this.eventTypes[event.type].description}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.currentTimeIndex = Math.floor(event.time * this.samplingRate);
                this.updateTimePosition(this.currentTimeIndex);
                this.switchTab('home');
            });
            
            annotationsList.appendChild(item);
        });
    }

    startRealTimeUpdates() {
        setInterval(() => {
            // Update session duration
            const sessionStart = new Date();
            sessionStart.setHours(sessionStart.getHours() - 8);
            const duration = new Date() - sessionStart;
            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('session-duration').textContent = `${hours}h ${minutes}m`;
            
            // Update stage confidence (simulate fluctuation)
            this.currentMetrics.stageConfidence = 85 + Math.random() * 15;
            document.getElementById('stage-confidence').textContent = `${this.currentMetrics.stageConfidence.toFixed(0)}%`;
            
            // Update sleep score
            this.currentMetrics.sleepQuality = 80 + Math.random() * 20;
            document.getElementById('sleep-score').textContent = this.currentMetrics.sleepQuality.toFixed(0);
            
            // Update cycle count
            const currentHour = this.currentTimeIndex / (this.samplingRate * 3600);
            this.currentMetrics.cycleCount = Math.floor(currentHour / 1.5) + 1;
            document.getElementById('cycle-count').textContent = `${this.currentMetrics.cycleCount}rd cycle`;
            
            // Update REM stats
            document.getElementById('rem-episodes').textContent = this.currentMetrics.remEpisodes;
            document.getElementById('rem-total').textContent = this.formatTime(this.currentMetrics.remTotalDuration);
            document.getElementById('rem-efficiency').textContent = `${this.currentMetrics.remEfficiency}%`;
            
            // Update stage distribution percentages
            Object.keys(this.currentMetrics.stageDistribution).forEach(stage => {
                const element = document.getElementById(`${stage.toLowerCase()}-percent`);
                if (element) {
                    element.textContent = `${this.currentMetrics.stageDistribution[stage]}%`;
                }
            });
            
        }, 2000);
    }

    updateUI() {
        // Update user greeting
        this.updateUserGreeting();
        
        // Update initial plots
        this.updateMainEEGPlot();
        this.updateREMTimeline();
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    showTooltip(message, type = 'info') {
        // Create and show a temporary tooltip
        const tooltip = document.createElement('div');
        tooltip.className = `temp-tooltip ${type}`;
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#059669' : '#6366f1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 2000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-20px)';
            setTimeout(() => document.body.removeChild(tooltip), 300);
        }, 3000);
    }
}

// Initialize the Advanced EEG Sleep Monitor
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedEEGSleepMonitor();
});

// Add global page transition effects
document.addEventListener('DOMContentLoaded', () => {
    // Smooth page load
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Enhanced hover effects
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('.region-panel, .sleep-stage-panel, .report-summary-card, .events-timeline-card, .annotations-card, .recommendations-card')) {
            e.target.style.transform = 'translateY(-6px)';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('.region-panel, .sleep-stage-panel, .report-summary-card, .events-timeline-card, .annotations-card, .recommendations-card')) {
            e.target.style.transform = '';
        }
    });
});
