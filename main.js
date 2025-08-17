// Modern Pastel EEG Sleep Monitor
class EEGSleepMonitor {
    constructor() {
        this.data = null;
        this.isPlaying = false;
        this.currentTimeIndex = 0;
        this.maxTime = 0;
        this.activeWave = 'all';
        this.currentTab = 'home';
        this.animationId = null;
        this.playAnimation = null;
        
        // Brain videos
        this.videos = [];
        this.currentVideoIndex = 0;
        
        // Wave colors (pastel palette)
        this.waveColors = {
            delta: '#A8D8EA',    // Pastel blue
            theta: '#C8A8E9',    // Lavender
            alpha: '#A8E6CF',    // Mint green
            beta: '#FFD3A5',     // Peach
            gamma: '#FFA8CC',    // Pink
            all: '#E0E0E0'       // Light gray
        };
        
        // Simulated metrics
        this.metrics = {
            sleepStage: 'REM',
            stageTimer: 0,
            brainActivity: {
                frontal: 75,
                parietal: 62,
                temporal: 58,
                occipital: 84
            },
            annotations: [
                { time: 3, type: 'blink', text: 'Blink detected — Frontal spike' },
                { time: 45, type: 'rem', text: 'REM sleep starts here' },
                { time: 83, type: 'alpha-peak', text: 'Strong alpha wave activity' }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.setupVideos();
        this.setupTimelineEvents();
        this.startRealTimeUpdates();
        this.startEEGAnimation();
        this.simulateBlinkDetection();
    }

    setupEventListeners() {
        // Wave filter buttons
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveWave(e.target.dataset.wave);
            });
        });

        // Playback controls
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('load-btn').addEventListener('click', () => this.loadEEGData());
        document.getElementById('rem-highlight-btn').addEventListener('click', () => this.highlightREM());

        // Timeline
        document.getElementById('timeline-slider').addEventListener('input', (e) => {
            this.updateTimePosition(e.target.value);
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-item').dataset.tab);
            });
        });

        // Profile picture upload
        document.getElementById('profile-pic').addEventListener('click', () => {
            this.uploadProfilePicture();
        });

        // Brain region cards
        document.querySelectorAll('.region-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.focusOnRegion(e.target.closest('.region-card'));
            });
        });

        // Sleep stage cards
        document.querySelectorAll('.sleep-stage-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.showStageDetails(e.target.closest('.sleep-stage-card'));
            });
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('eeg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Setup region charts
        this.setupRegionCharts();
        this.setupSleepStageWaves();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupVideos() {
        // Load brain videos
        for (let i = 1; i <= 5; i++) {
            const video = document.createElement('video');
            video.src = `brain_video_${i}.mp4`;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.style.display = 'none';
            this.videos.push(video);
        }
        
        // Set the first video as subject video
        const subjectVideo = document.getElementById('subject-video');
        subjectVideo.src = this.videos[0].src;
        subjectVideo.play().catch(e => console.log('Video autoplay prevented'));
    }

    setupTimelineEvents() {
        const timelineEvents = document.getElementById('timeline-events');
        
        this.metrics.annotations.forEach(annotation => {
            const marker = document.createElement('div');
            marker.className = `event-marker ${annotation.type.replace('-', '-')}`;
            marker.style.left = `${(annotation.time / 120) * 100}%`;
            marker.title = annotation.text;
            
            marker.addEventListener('click', () => {
                this.showTooltip(annotation, marker);
                this.currentTimeIndex = annotation.time;
                document.getElementById('timeline-slider').value = annotation.time;
                this.updateTimePosition(annotation.time);
            });
            
            timelineEvents.appendChild(marker);
        });
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    startEEGAnimation() {
        const animate = () => {
            this.drawEEGWaves();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    drawEEGWaves() {
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(width, height);
        
        // Draw waves based on active filter
        if (this.activeWave === 'all') {
            this.drawAllWaves(width, height);
        } else {
            this.drawSingleWave(width, height, this.activeWave);
        }
        
        // Draw current time indicator
        this.drawTimeIndicator(width, height);
        
        // Draw annotations
        this.drawAnnotations(width, height);
    }

    drawGrid(width, height) {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    drawAllWaves(width, height) {
        const waves = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
        const waveHeight = height / (waves.length + 1);
        
        waves.forEach((wave, index) => {
            const centerY = waveHeight * (index + 1);
            this.drawWaveform(width, centerY, wave, waveHeight * 0.3);
            
            // Draw wave label
            this.ctx.fillStyle = this.waveColors[wave];
            this.ctx.font = '12px Inter';
            this.ctx.fillText(wave.toUpperCase(), 10, centerY - waveHeight * 0.2);
        });
    }

    drawSingleWave(width, height, waveType) {
        const centerY = height / 2;
        this.drawWaveform(width, centerY, waveType, height * 0.3);
        
        // Draw wave label
        this.ctx.fillStyle = this.waveColors[waveType];
        this.ctx.font = 'bold 16px Inter';
        this.ctx.fillText(waveType.toUpperCase() + ' WAVES', 20, 30);
    }

    drawWaveform(width, centerY, waveType, amplitude) {
        this.ctx.strokeStyle = this.waveColors[waveType];
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const time = Date.now() * 0.001;
        const frequency = this.getWaveFrequency(waveType);
        const points = width * 2;
        
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const phase = (x / width) * frequency * Math.PI * 2 + time;
            
            // Add some realistic EEG noise
            const noise = (Math.random() - 0.5) * 0.1;
            const baseWave = Math.sin(phase) * amplitude;
            const harmonics = Math.sin(phase * 2) * amplitude * 0.3 + 
                            Math.sin(phase * 3) * amplitude * 0.1;
            
            const y = centerY + baseWave + harmonics + noise * amplitude;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = this.waveColors[waveType];
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    getWaveFrequency(waveType) {
        const frequencies = {
            delta: 2,     // 0.5-4 Hz
            theta: 4,     // 4-8 Hz
            alpha: 8,     // 8-12 Hz
            beta: 16,     // 12-30 Hz
            gamma: 32     // 30-100 Hz
        };
        return frequencies[waveType] || 8;
    }

    drawTimeIndicator(width, height) {
        if (!this.data || this.maxTime === 0) return;
        
        const x = (this.currentTimeIndex / this.maxTime) * width;
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawAnnotations(width, height) {
        if (!this.data || this.maxTime === 0) return;
        
        this.metrics.annotations.forEach(annotation => {
            const x = (annotation.time / 120) * width;
            
            // Draw annotation marker
            this.ctx.fillStyle = this.getAnnotationColor(annotation.type);
            this.ctx.fillRect(x - 2, 10, 4, height - 20);
            
            // Draw annotation text
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.font = '10px Inter';
            this.ctx.fillText(annotation.type.toUpperCase(), x + 5, 25);
        });
    }

    getAnnotationColor(type) {
        const colors = {
            'blink': this.waveColors.beta,
            'rem': this.waveColors.gamma,
            'alpha-peak': this.waveColors.alpha
        };
        return colors[type] || '#666';
    }

    setActiveWave(wave) {
        // Update button states
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-wave="${wave}"]`).classList.add('active');
        
        this.activeWave = wave;
        
        // Switch to corresponding brain video
        this.switchBrainVideo(wave);
    }

    switchBrainVideo(wave) {
        const videoMap = {
            'all': 0,
            'delta': 1,
            'theta': 2,
            'alpha': 3,
            'beta': 4,
            'gamma': 4  // Use same as beta for now
        };
        
        const videoIndex = videoMap[wave] || 0;
        if (this.videos[videoIndex]) {
            const subjectVideo = document.getElementById('subject-video');
            subjectVideo.src = this.videos[videoIndex].src;
            subjectVideo.play().catch(e => console.log('Video switch failed'));
        }
    }

    async loadEEGData() {
        const btn = document.getElementById('load-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
        
        try {
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            
            this.data = this.parseCSV(csvText);
            this.maxTime = this.data.data.length - 1;
            
            // Update timeline
            document.getElementById('timeline-slider').max = this.maxTime;
            
            // Show success
            btn.innerHTML = '<i class="fas fa-check"></i> Data Loaded';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error loading data:', error);
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
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

    togglePlayback() {
        const btn = document.getElementById('play-btn');
        
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
        const playSpeed = 100; // milliseconds between updates
        let lastTime = Date.now();
        
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            const currentTime = Date.now();
            if (currentTime - lastTime >= playSpeed) {
                this.currentTimeIndex = (this.currentTimeIndex + 1) % 120; // 2 minute loop
                
                document.getElementById('timeline-slider').value = this.currentTimeIndex;
                this.updateTimePosition(this.currentTimeIndex);
                
                lastTime = currentTime;
            }
            
            this.playAnimation = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }

    updateTimePosition(value) {
        this.currentTimeIndex = parseInt(value);
        const minutes = Math.floor(this.currentTimeIndex / 60);
        const seconds = this.currentTimeIndex % 60;
        document.getElementById('time-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Check for annotations at current time
        this.checkAnnotations();
    }

    checkAnnotations() {
        const currentAnnotation = this.metrics.annotations.find(
            ann => Math.abs(ann.time - this.currentTimeIndex) < 1
        );
        
        if (currentAnnotation) {
            this.showAnnotationAlert(currentAnnotation);
        }
    }

    showAnnotationAlert(annotation) {
        // Create annotation popup
        const annotationDiv = document.createElement('div');
        annotationDiv.className = `annotation-marker ${annotation.type}`;
        annotationDiv.textContent = annotation.text;
        annotationDiv.style.left = `${Math.random() * 60 + 20}%`;
        annotationDiv.style.top = `${Math.random() * 40 + 30}%`;
        
        const annotationsContainer = document.getElementById('wave-annotations');
        annotationsContainer.appendChild(annotationDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (annotationDiv.parentNode) {
                annotationDiv.parentNode.removeChild(annotationDiv);
            }
        }, 3000);
    }

    highlightREM() {
        // Switch to REM visualization
        this.setActiveWave('gamma');
        
        // Add REM highlight effect
        const btn = document.getElementById('rem-highlight-btn');
        btn.style.background = 'linear-gradient(135deg, #FFA8CC, #C8A8E9)';
        btn.style.transform = 'scale(1.05)';
        
        // Simulate REM sleep stage
        this.updateSleepStage('REM');
        
        setTimeout(() => {
            btn.style.background = '';
            btn.style.transform = '';
        }, 2000);
    }

    updateSleepStage(stage) {
        const stageIcon = document.querySelector('.stage-icon');
        const stageInfo = document.querySelector('.stage-info h4');
        const stageDesc = document.querySelector('.stage-info p');
        
        const stageData = {
            'REM': {
                icon: 'fas fa-cloud',
                title: 'REM Sleep',
                description: 'Dreaming & Memory consolidation',
                color: 'linear-gradient(135deg, #FFA8CC, #C8A8E9)'
            },
            'NREM-1': {
                icon: 'fas fa-eye-slash',
                title: 'NREM Stage 1',
                description: 'Light sleep, drowsiness',
                color: 'linear-gradient(135deg, #A8D8EA, #A8E6CF)'
            },
            'NREM-2': {
                icon: 'fas fa-moon',
                title: 'NREM Stage 2',
                description: 'True sleep begins',
                color: 'linear-gradient(135deg, #C8A8E9, #A8D8EA)'
            },
            'NREM-3': {
                icon: 'fas fa-bed',
                title: 'NREM Stage 3',
                description: 'Deep sleep, restoration',
                color: 'linear-gradient(135deg, #A8D8EA, #C8A8E9)'
            }
        };
        
        const data = stageData[stage];
        if (data) {
            stageIcon.innerHTML = `<i class="${data.icon}"></i>`;
            stageIcon.style.background = data.color;
            stageInfo.textContent = data.title;
            stageDesc.textContent = data.description;
        }
    }

    simulateBlinkDetection() {
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every 3 seconds
                this.showBlinkIndicator();
            }
        }, 3000);
    }

    showBlinkIndicator() {
        const indicator = document.getElementById('blink-indicator');
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
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
            // Home tab is the main dashboard, so hide tab contents
            document.querySelector('.main-dashboard').style.display = 'grid';
        } else {
            document.querySelector('.main-dashboard').style.display = 'none';
            document.getElementById(`${tabName}-content`).style.display = 'block';
        }
        
        this.currentTab = tabName;
        
        // Initialize charts for the new tab
        if (tabName === 'brain') {
            this.setupRegionCharts();
        } else if (tabName === 'sleep') {
            this.setupSleepStageWaves();
        }
    }

    setupRegionCharts() {
        const regions = ['frontal', 'parietal', 'temporal', 'occipital'];
        
        regions.forEach(region => {
            const canvas = document.getElementById(`${region}-chart`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
            
            this.drawRegionChart(ctx, canvas.offsetWidth, canvas.offsetHeight, region);
        });
    }

    drawRegionChart(ctx, width, height, region) {
        ctx.clearRect(0, 0, width, height);
        
        // Get region color
        const colors = {
            frontal: this.waveColors.delta,
            parietal: this.waveColors.theta,
            temporal: this.waveColors.beta,
            occipital: this.waveColors.gamma
        };
        
        const color = colors[region];
        
        // Draw wave for this region
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const time = Date.now() * 0.001;
        const frequency = 6 + Math.random() * 8;
        const amplitude = height * 0.3;
        const centerY = height / 2;
        
        for (let i = 0; i < width; i++) {
            const x = i;
            const phase = (i / width) * frequency * Math.PI * 2 + time;
            const noise = (Math.random() - 0.5) * 0.1;
            const y = centerY + Math.sin(phase) * amplitude + noise * amplitude;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Add glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    setupSleepStageWaves() {
        const stages = ['nrem1', 'nrem2', 'nrem3', 'rem'];
        
        stages.forEach(stage => {
            const canvas = document.getElementById(`${stage}-wave`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
            
            this.drawStageWave(ctx, canvas.offsetWidth, canvas.offsetHeight, stage);
        });
    }

    drawStageWave(ctx, width, height, stage) {
        ctx.clearRect(0, 0, width, height);
        
        const stageProperties = {
            nrem1: { freq: 8, amp: 0.3, color: this.waveColors.alpha },
            nrem2: { freq: 12, amp: 0.4, color: this.waveColors.theta },
            nrem3: { freq: 2, amp: 0.8, color: this.waveColors.delta },
            rem: { freq: 20, amp: 0.2, color: this.waveColors.gamma }
        };
        
        const props = stageProperties[stage];
        
        ctx.strokeStyle = props.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const time = Date.now() * 0.001;
        const amplitude = height * props.amp;
        const centerY = height / 2;
        
        for (let i = 0; i < width; i++) {
            const x = i;
            const phase = (i / width) * props.freq * Math.PI * 2 + time;
            const noise = (Math.random() - 0.5) * 0.05;
            const y = centerY + Math.sin(phase) * amplitude + noise * amplitude;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    uploadProfilePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const profilePic = document.getElementById('profile-pic');
                    profilePic.style.backgroundImage = `url(${e.target.result})`;
                    profilePic.style.backgroundSize = 'cover';
                    profilePic.innerHTML = '';
                    
                    // Save to localStorage
                    localStorage.setItem('eeg-profile-pic', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    loadSavedSettings() {
        // Load profile picture
        const savedPic = localStorage.getItem('eeg-profile-pic');
        if (savedPic) {
            const profilePic = document.getElementById('profile-pic');
            profilePic.style.backgroundImage = `url(${savedPic})`;
            profilePic.style.backgroundSize = 'cover';
            profilePic.innerHTML = '';
        }
        
        // Load other settings
        const savedTheme = localStorage.getItem('eeg-theme');
        if (savedTheme) {
            document.body.className = savedTheme;
        }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            // Update brain activity metrics
            Object.keys(this.metrics.brainActivity).forEach(region => {
                const activity = 40 + Math.random() * 50;
                this.metrics.brainActivity[region] = Math.round(activity);
                
                // Update UI
                const activityElement = document.querySelector(`.${region}-region .metric-value`);
                if (activityElement) {
                    activityElement.textContent = `${activity.toFixed(0)}%`;
                }
            });
            
            // Update sleep cycle progress
            const progress = (this.currentTimeIndex / 120) * 100;
            document.querySelector('.progress-fill').style.width = `${progress}%`;
            
            // Update stage timer
            this.metrics.stageTimer++;
            const minutes = Math.floor(this.metrics.stageTimer / 60);
            const seconds = this.metrics.stageTimer % 60;
            document.querySelector('.stage-timer').textContent = 
                `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
        }, 1000);
    }

    showTooltip(annotation, element) {
        const tooltip = document.getElementById('spike-tooltip');
        const rect = element.getBoundingClientRect();
        
        tooltip.querySelector('h4').textContent = annotation.text;
        tooltip.querySelector('p').textContent = 'Detected brain activity spike';
        tooltip.querySelector('.tooltip-time').textContent = `${Math.floor(annotation.time / 60)}:${(annotation.time % 60).toString().padStart(2, '0')}`;
        
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        tooltip.classList.add('show');
        
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 3000);
    }

    focusOnRegion(regionCard) {
        // Add focus animation
        regionCard.style.transform = 'translateY(-8px) scale(1.02)';
        regionCard.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
        
        setTimeout(() => {
            regionCard.style.transform = '';
            regionCard.style.boxShadow = '';
        }, 1000);
        
        // Update charts for this region
        const regionName = regionCard.className.split(' ')[1].replace('-region', '');
        this.highlightRegionActivity(regionName);
    }

    highlightRegionActivity(regionName) {
        // Switch to wave type associated with this region
        const regionWaves = {
            'frontal': 'beta',
            'parietal': 'alpha',
            'temporal': 'theta',
            'occipital': 'gamma'
        };
        
        const waveType = regionWaves[regionName];
        if (waveType) {
            this.setActiveWave(waveType);
        }
    }

    showStageDetails(stageCard) {
        // Add selection animation
        document.querySelectorAll('.sleep-stage-card').forEach(card => {
            card.classList.remove('active');
        });
        stageCard.classList.add('active');
        
        // Update main sleep stage display
        const stageName = stageCard.querySelector('h3').textContent;
        this.updateSleepStage(stageName.replace(' ', '-'));
    }
}

// Initialize the EEG Sleep Monitor
document.addEventListener('DOMContentLoaded', () => {
    new EEGSleepMonitor();
});

// Add some global animations and effects
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth page transitions
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Add hover effects to cards
    document.querySelectorAll('.region-card, .sleep-stage-card, .report-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
});
