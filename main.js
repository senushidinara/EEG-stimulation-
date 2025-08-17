import * as THREE from 'three';

// Enhanced EEG Brain Activation Visualization with 3D Interactive Models
class InteractiveBrainVisualizer {
    constructor() {
        this.data = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.brain = null;
        this.electrodes = [];
        this.animationId = null;
        this.isPlaying = false;
        this.currentTimeIndex = 0;
        this.maxTime = 0;
        
        // EEG electrode positions (10-20 system) - adjusted for realistic brain anatomy
        this.electrodePositions = {
            // Frontal electrodes
            'Fp1': [-0.35, 0.75, 0.95], 'Fp2': [0.35, 0.75, 0.95],
            'F7': [-0.85, 0.3, 0.45], 'F3': [-0.45, 0.55, 0.85], 'Fz': [0, 0.65, 0.95], 'F4': [0.45, 0.55, 0.85], 'F8': [0.85, 0.3, 0.45],

            // Central electrodes
            'T3': [-0.95, 0, 0.25], 'C3': [-0.55, 0.15, 0.95], 'Cz': [0, 0.25, 1.05], 'C4': [0.55, 0.15, 0.95], 'T4': [0.95, 0, 0.25],

            // Posterior electrodes
            'T5': [-0.85, -0.45, 0.35], 'P3': [-0.45, -0.35, 0.85], 'Pz': [0, -0.25, 1.0], 'P4': [0.45, -0.35, 0.85], 'T6': [0.85, -0.45, 0.35],

            // Occipital electrodes
            'O1': [-0.25, -0.75, 0.65], 'O2': [0.25, -0.75, 0.65],

            // Additional electrodes for better coverage
            'F1': [-0.22, 0.6, 0.9], 'F2': [0.22, 0.6, 0.9],
            'C1': [-0.25, 0.2, 1.0], 'C2': [0.25, 0.2, 1.0],
            'P1': [-0.22, -0.3, 0.9], 'P2': [0.22, -0.3, 0.9]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initThreeJS();
        this.createBrainModel();
        this.createElectrodes();
        this.setupElectrodeMap();
        this.animate();
        this.updateViewMode();
    }

    setupEventListeners() {
        const loadBtn = document.getElementById('load-btn');
        const playBtn = document.getElementById('play-btn');
        const resetBtn = document.getElementById('reset-btn');
        const dataSelect = document.getElementById('data-select');
        const viewMode = document.getElementById('view-mode');
        const timeSlider = document.getElementById('time-slider');
        
        loadBtn.addEventListener('click', () => this.loadEEGData());
        playBtn.addEventListener('click', () => this.togglePlayback());
        resetBtn.addEventListener('click', () => this.resetView());
        dataSelect.addEventListener('change', () => this.updateVisualization());
        viewMode.addEventListener('change', () => this.updateViewMode());
        timeSlider.addEventListener('input', (e) => this.updateTimePosition(e.target.value));
        
        // Window resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initThreeJS() {
        const container = document.getElementById('brain-3d');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 3);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x667eea, 0.5);
        pointLight.position.set(-5, 0, 5);
        this.scene.add(pointLight);
        
        // Controls
        this.setupControls();
    }

    setupControls() {
        const controls = {
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false
        };
        
        const container = this.renderer.domElement;
        
        container.addEventListener('mousedown', (event) => {
            controls.isMouseDown = true;
            controls.mouseX = event.clientX;
            controls.mouseY = event.clientY;
        });
        
        container.addEventListener('mouseup', () => {
            controls.isMouseDown = false;
        });
        
        container.addEventListener('mousemove', (event) => {
            if (controls.isMouseDown && this.brain) {
                const deltaX = event.clientX - controls.mouseX;
                const deltaY = event.clientY - controls.mouseY;
                
                this.brain.rotation.y += deltaX * 0.01;
                this.brain.rotation.x += deltaY * 0.01;
                
                controls.mouseX = event.clientX;
                controls.mouseY = event.clientY;
            }
        });
        
        container.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY * 0.001;
            this.camera.position.z = Math.max(1.5, Math.min(5, this.camera.position.z + delta));
        });
    }

    createBrainModel() {
        // Create anatomically accurate brain model
        const brainGroup = new THREE.Group();

        // Create realistic brain hemispheres with cortical folding
        this.createRealisticHemispheres(brainGroup);

        // Add anatomical structures
        this.addCerebellum(brainGroup);
        this.addBrainStem(brainGroup);
        this.addCorpusCallosum(brainGroup);

        // Add cortical surface details (gyri and sulci)
        this.addCorticalSurface(brainGroup);

        this.brain = brainGroup;
        this.scene.add(this.brain);

        // Add anatomical brain regions
        this.addAnatomicalRegions(brainGroup);
    }

    createRealisticHemispheres(brainGroup) {
        // Create left hemisphere with realistic shape
        const leftGeometry = this.createBrainGeometry();
        const brainMaterial = new THREE.MeshPhongMaterial({
            color: 0xd4a574, // Realistic brain color
            transparent: false,
            shininess: 10,
            bumpScale: 0.1
        });

        const leftHemisphere = new THREE.Mesh(leftGeometry, brainMaterial);
        leftHemisphere.scale.set(-1, 1, 1); // Flip for left side
        leftHemisphere.position.set(-0.05, 0, 0);
        brainGroup.add(leftHemisphere);

        // Create right hemisphere
        const rightHemisphere = new THREE.Mesh(leftGeometry, brainMaterial.clone());
        rightHemisphere.position.set(0.05, 0, 0);
        brainGroup.add(rightHemisphere);

        // Store hemispheres for later reference
        this.leftHemisphere = leftHemisphere;
        this.rightHemisphere = rightHemisphere;
    }

    createBrainGeometry() {
        // Create realistic brain shape using parametric geometry
        const brainGeometry = new THREE.SphereGeometry(1, 64, 32);
        const positions = brainGeometry.attributes.position;

        // Deform sphere to brain-like shape
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            // Create brain-like deformations
            const angle = Math.atan2(z, x);
            const elevation = Math.asin(y);

            // Front lobe protrusion
            let frontFactor = 1.0;
            if (z > 0.3) {
                frontFactor = 1.2 - 0.3 * Math.abs(y);
            }

            // Temporal lobe bulge
            let temporalFactor = 1.0;
            if (Math.abs(x) > 0.6 && y < 0.2 && y > -0.8) {
                temporalFactor = 1.3;
            }

            // Occipital narrowing
            let occipitalFactor = 1.0;
            if (z < -0.3) {
                occipitalFactor = 0.8 + 0.2 * Math.abs(y);
            }

            // Flatten top slightly
            let topFactor = 1.0;
            if (y > 0.7) {
                topFactor = 0.9;
            }

            // Apply deformations
            const deformFactor = frontFactor * temporalFactor * occipitalFactor * topFactor;

            positions.setXYZ(i,
                x * deformFactor * 0.9,
                y * deformFactor * 1.1,
                z * deformFactor * 1.2
            );
        }

        brainGeometry.attributes.position.needsUpdate = true;
        brainGeometry.computeVertexNormals();

        return brainGeometry;
    }

    addCorticalSurface(brainGroup) {
        // Add gyri (ridges) and sulci (grooves) details
        const corticalMaterial = new THREE.MeshPhongMaterial({
            color: 0xc4956a,
            transparent: true,
            opacity: 0.8,
            shininess: 5
        });

        // Create major sulci (grooves)
        this.createCentralSulcus(brainGroup, corticalMaterial);
        this.createSylvianFissure(brainGroup, corticalMaterial);
        this.createLongitudinalFissure(brainGroup, corticalMaterial);

        // Add surface texture for gyri
        this.addGyriTexture(brainGroup);
    }

    createCentralSulcus(brainGroup, material) {
        // Central sulcus - divides frontal from parietal lobe
        const sulcusGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
        const centralSulcus = new THREE.Mesh(sulcusGeometry, material.clone());
        centralSulcus.material.color.setHex(0x8b6f4a); // Darker for groove
        centralSulcus.rotation.z = Math.PI / 6;
        centralSulcus.position.set(0, 0.2, 0.1);
        brainGroup.add(centralSulcus);
    }

    createSylvianFissure(brainGroup, material) {
        // Sylvian fissure - separates temporal from frontal/parietal
        const fissureGeometry = new THREE.CylinderGeometry(0.03, 0.01, 1.0, 8);

        // Left sylvian fissure
        const leftFissure = new THREE.Mesh(fissureGeometry, material.clone());
        leftFissure.material.color.setHex(0x8b6f4a);
        leftFissure.rotation.z = -Math.PI / 4;
        leftFissure.position.set(-0.6, -0.1, 0.3);
        brainGroup.add(leftFissure);

        // Right sylvian fissure
        const rightFissure = new THREE.Mesh(fissureGeometry, material.clone());
        rightFissure.material.color.setHex(0x8b6f4a);
        rightFissure.rotation.z = Math.PI / 4;
        rightFissure.position.set(0.6, -0.1, 0.3);
        brainGroup.add(rightFissure);
    }

    createLongitudinalFissure(brainGroup, material) {
        // Longitudinal fissure - separates left and right hemispheres
        const fissureGeometry = new THREE.PlaneGeometry(0.05, 2.4);
        const longitudinalFissure = new THREE.Mesh(fissureGeometry, material.clone());
        longitudinalFissure.material.color.setHex(0x5a4a3a);
        longitudinalFissure.material.transparent = true;
        longitudinalFissure.material.opacity = 0.7;
        longitudinalFissure.position.set(0, 0, 0);
        brainGroup.add(longitudinalFissure);
    }

    addGyriTexture(brainGroup) {
        // Add small ridges to simulate gyri (brain folds)
        const gyriMaterial = new THREE.MeshPhongMaterial({
            color: 0xe4b584,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < 40; i++) {
            const gyrusGeometry = new THREE.CylinderGeometry(0.015, 0.015, Math.random() * 0.8 + 0.4, 6);
            const gyrus = new THREE.Mesh(gyrusGeometry, gyriMaterial);

            // Random position on brain surface
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 1.05;

            gyrus.position.setFromSphericalCoords(radius, theta, phi);
            gyrus.lookAt(0, 0, 0);
            gyrus.rotateX(Math.PI / 2);

            // Random rotation for natural look
            gyrus.rotation.z = Math.random() * Math.PI;

            brainGroup.add(gyrus);
        }
    }

    addCerebellum(brainGroup) {
        // Create cerebellum (little brain)
        const cerebellumGeometry = new THREE.SphereGeometry(0.4, 32, 16);
        const cerebellumMaterial = new THREE.MeshPhongMaterial({
            color: 0xb8956f, // Slightly different color than cerebrum
            shininess: 15
        });

        const cerebellum = new THREE.Mesh(cerebellumGeometry, cerebellumMaterial);
        cerebellum.scale.set(1.2, 0.8, 1);
        cerebellum.position.set(0, -0.7, -0.8);
        brainGroup.add(cerebellum);

        // Add cerebellar folia (folds)
        this.addCerebellarFolia(cerebellum);
    }

    addCerebellarFolia(cerebellum) {
        // Add characteristic cerebellar folding pattern
        const foliaGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6);
        const foliaMaterial = new THREE.MeshPhongMaterial({
            color: 0xa0835b,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 12; i++) {
            const folia = new THREE.Mesh(foliaGeometry, foliaMaterial);
            const angle = (i / 12) * Math.PI * 2;
            folia.position.set(
                Math.cos(angle) * 0.3,
                -0.7,
                Math.sin(angle) * 0.3 - 0.8
            );
            folia.rotation.y = angle;
            this.brain.add(folia);
        }
    }

    addBrainStem(brainGroup) {
        // Midbrain
        const midbrainGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 12);
        const midbrainMaterial = new THREE.MeshPhongMaterial({ color: 0xa08570 });
        const midbrain = new THREE.Mesh(midbrainGeometry, midbrainMaterial);
        midbrain.position.set(0, -0.4, -0.3);
        brainGroup.add(midbrain);

        // Pons
        const ponsGeometry = new THREE.CylinderGeometry(0.18, 0.2, 0.25, 12);
        const ponsMaterial = new THREE.MeshPhongMaterial({ color: 0x957a65 });
        const pons = new THREE.Mesh(ponsGeometry, ponsMaterial);
        pons.position.set(0, -0.6, -0.4);
        brainGroup.add(pons);

        // Medulla oblongata
        const medullaGeometry = new THREE.CylinderGeometry(0.12, 0.18, 0.4, 10);
        const medullaMaterial = new THREE.MeshPhongMaterial({ color: 0x8a7055 });
        const medulla = new THREE.Mesh(medullaGeometry, medullaMaterial);
        medulla.position.set(0, -0.85, -0.5);
        brainGroup.add(medulla);
    }

    addCorpusCallosum(brainGroup) {
        // Corpus callosum - connects left and right hemispheres
        const callosumGeometry = new THREE.BoxGeometry(0.03, 1.5, 0.8);
        const callosumMaterial = new THREE.MeshPhongMaterial({
            color: 0xf5f5dc, // White matter color
            transparent: true,
            opacity: 0.9
        });

        const corpusCallosum = new THREE.Mesh(callosumGeometry, callosumMaterial);
        corpusCallosum.position.set(0, 0, 0);
        brainGroup.add(corpusCallosum);
    }

    addAnatomicalRegions(brainGroup) {
        // More anatomically accurate brain regions
        const regions = [
            { name: 'Frontal Cortex', position: [0, 0.4, 0.8], color: 0x3498db, size: 0.08 },
            { name: 'Parietal Cortex', position: [0, 0.6, -0.3], color: 0xe74c3c, size: 0.08 },
            { name: 'Temporal Cortex', position: [-0.7, -0.2, 0.2], color: 0xf39c12, size: 0.08 },
            { name: 'Occipital Cortex', position: [0, 0.1, -1.0], color: 0x9b59b6, size: 0.08 },
            { name: 'Motor Cortex', position: [0, 0.3, 0.2], color: 0x2ecc71, size: 0.06 },
            { name: 'Somatosensory', position: [0, 0.2, -0.1], color: 0xe67e22, size: 0.06 },
            { name: 'Broca\'s Area', position: [-0.6, 0.2, 0.5], color: 0x1abc9c, size: 0.05 },
            { name: 'Wernicke\'s Area', position: [-0.7, -0.1, -0.2], color: 0x34495e, size: 0.05 }
        ];

        regions.forEach(region => {
            const regionGeometry = new THREE.SphereGeometry(region.size, 12, 12);
            const regionMaterial = new THREE.MeshPhongMaterial({
                color: region.color,
                transparent: true,
                opacity: 0.6,
                emissive: region.color,
                emissiveIntensity: 0.1
            });

            const regionMesh = new THREE.Mesh(regionGeometry, regionMaterial);
            regionMesh.position.set(...region.position);
            regionMesh.userData = { type: 'brain-region', name: region.name };
            brainGroup.add(regionMesh);

            // Add pulsing animation for active regions
            this.animateRegion(regionMesh);
        });
    }

    animateRegion(regionMesh) {
        const originalScale = regionMesh.scale.clone();
        const animate = () => {
            if (regionMesh.userData.activity > 0.5) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
                regionMesh.scale.setScalar(originalScale.x * pulse);
                regionMesh.material.emissiveIntensity = 0.1 + regionMesh.userData.activity * 0.3;
            } else {
                regionMesh.scale.copy(originalScale);
                regionMesh.material.emissiveIntensity = 0.1;
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    createElectrodes() {
        Object.entries(this.electrodePositions).forEach(([name, position]) => {
            // Create more realistic electrode appearance
            const electrodeGroup = new THREE.Group();

            // Main electrode contact
            const contactGeometry = new THREE.SphereGeometry(0.025, 12, 12);
            const contactMaterial = new THREE.MeshPhongMaterial({
                color: 0xc0c0c0, // Metallic silver
                shininess: 100,
                emissive: 0x002200
            });

            const contact = new THREE.Mesh(contactGeometry, contactMaterial);
            electrodeGroup.add(contact);

            // Electrode base/housing
            const baseGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.01, 8);
            const baseMaterial = new THREE.MeshPhongMaterial({
                color: 0x333333, // Dark housing
                shininess: 50
            });

            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = -0.015;
            electrodeGroup.add(base);

            // Position electrode on brain surface
            electrodeGroup.position.set(...position);

            // Point electrode normal toward brain center
            const brainCenter = new THREE.Vector3(0, 0, 0);
            const electrodePos = new THREE.Vector3(...position);
            const direction = brainCenter.sub(electrodePos).normalize();
            electrodeGroup.lookAt(direction.multiplyScalar(-1).add(electrodePos));

            electrodeGroup.userData = {
                type: 'electrode',
                name: name,
                originalColor: 0xc0c0c0,
                activity: 0,
                contact: contact // Reference to the contact for color changes
            };

            // Add electrode label
            this.addElectrodeLabel(electrodeGroup, name);

            this.electrodes.push(electrodeGroup);
            this.brain.add(electrodeGroup);
        });

        // Add electrode interaction
        this.setupElectrodeInteraction();
    }

    addElectrodeLabel(electrode, name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;
        
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fillRect(0, 0, 64, 32);
        context.fillStyle = 'black';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(name, 32, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.2, 0.1, 1);
        label.position.copy(electrode.position);
        label.position.y += 0.1;
        
        this.brain.add(label);
    }

    setupElectrodeInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.electrodes);
            
            // Reset all electrodes
            this.electrodes.forEach(electrode => {
                electrode.material.emissive.setHex(0x002200);
                electrode.scale.set(1, 1, 1);
            });
            
            if (intersects.length > 0) {
                const electrode = intersects[0].object;
                electrode.material.emissive.setHex(0x444444);
                electrode.scale.set(1.5, 1.5, 1.5);
                
                this.showElectrodeInfo(electrode.userData);
            }
        });
    }

    showElectrodeInfo(electrodeData) {
        const infoElement = document.getElementById('electrode-details');
        infoElement.innerHTML = `
            <strong>${electrodeData.name}</strong><br>
            Activity: ${(electrodeData.activity * 100).toFixed(1)}%<br>
            Type: EEG Electrode<br>
            Status: Active
        `;
    }

    setupElectrodeMap() {
        const electrodeMap = document.getElementById('electrode-map');
        
        Object.keys(this.electrodePositions).forEach(name => {
            const electrodeItem = document.createElement('div');
            electrodeItem.className = 'electrode-item';
            electrodeItem.textContent = name;
            electrodeItem.addEventListener('click', () => this.focusOnElectrode(name));
            electrodeMap.appendChild(electrodeItem);
        });
    }

    focusOnElectrode(electrodeName) {
        const electrode = this.electrodes.find(e => e.userData.name === electrodeName);
        if (electrode) {
            // Animate camera to focus on electrode
            this.animateCamera(electrode.position);
            
            // Highlight electrode
            electrode.material.emissive.setHex(0x666600);
            setTimeout(() => {
                electrode.material.emissive.setHex(0x002200);
            }, 2000);
        }
    }

    animateCamera(targetPosition) {
        const startPosition = this.camera.position.clone();
        const endPosition = targetPosition.clone().add(new THREE.Vector3(0, 0, 2));
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.camera.position.lerpVectors(startPosition, endPosition, progress);
            this.camera.lookAt(targetPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    async loadEEGData() {
        try {
            document.getElementById('load-btn').classList.add('loading');
            
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            
            this.data = this.parseCSV(csvText);
            this.maxTime = this.data.data.length - 1;
            
            // Update time slider
            const timeSlider = document.getElementById('time-slider');
            timeSlider.max = this.maxTime;
            timeSlider.value = 0;
            
            // Enable play button
            document.getElementById('play-btn').disabled = false;
            
            this.updateDataSummary();
            this.updateVisualization();
            this.updateActivityMeters();
            
        } catch (error) {
            console.error('Error loading EEG data:', error);
            this.updateDataSummary('Error loading data');
        } finally {
            document.getElementById('load-btn').classList.remove('loading');
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

    updateVisualization() {
        if (!this.data) return;
        
        const currentRow = this.data.data[this.currentTimeIndex] || this.data.data[0];
        
        // Update electrode activities with realistic brain activity visualization
        this.electrodes.forEach(electrode => {
            const electrodeName = electrode.userData.name;
            const activity = currentRow[electrodeName] || Math.random() * 0.5;

            electrode.userData.activity = Math.abs(activity);

            // Color electrode contact based on activity
            const intensity = Math.min(Math.abs(activity) * 2, 1);
            const contact = electrode.userData.contact;

            if (contact) {
                // Use brain activity color scale (blue=low, red=high)
                const color = new THREE.Color();
                if (intensity < 0.3) {
                    color.setHSL(0.67, 0.8, 0.5); // Blue for low activity
                } else if (intensity < 0.7) {
                    color.setHSL(0.17, 0.9, 0.6); // Yellow for medium activity
                } else {
                    color.setHSL(0.0, 0.9, 0.6); // Red for high activity
                }

                contact.material.color = color;
                contact.material.emissive.setHex(intensity > 0.5 ? 0x221100 : 0x001122);

                // Scale electrode slightly based on activity
                const scale = 1.0 + intensity * 0.3;
                contact.scale.setScalar(scale);
            }

            // Update corresponding brain region activity
            this.updateBrainRegionActivity(electrodeName, intensity);
        });
        
        this.updateActivityMeters();
    }

    updateBrainRegionActivity(electrodeName, intensity) {
        // Map electrodes to brain regions for realistic activation
        const regionMapping = {
            'Fp1': 'Frontal Cortex', 'Fp2': 'Frontal Cortex',
            'F1': 'Frontal Cortex', 'F2': 'Frontal Cortex',
            'F3': 'Frontal Cortex', 'F4': 'Frontal Cortex',
            'F7': 'Broca\'s Area', 'F8': 'Frontal Cortex',
            'Fz': 'Motor Cortex',
            'C1': 'Motor Cortex', 'C2': 'Motor Cortex',
            'C3': 'Somatosensory', 'C4': 'Somatosensory',
            'Cz': 'Motor Cortex',
            'P1': 'Parietal Cortex', 'P2': 'Parietal Cortex',
            'P3': 'Parietal Cortex', 'P4': 'Parietal Cortex',
            'Pz': 'Parietal Cortex',
            'T3': 'Temporal Cortex', 'T4': 'Temporal Cortex',
            'T5': 'Wernicke\'s Area', 'T6': 'Temporal Cortex',
            'O1': 'Occipital Cortex', 'O2': 'Occipital Cortex'
        };

        const regionName = regionMapping[electrodeName];
        if (regionName && this.brain) {
            // Find the brain region mesh and update its activity
            this.brain.children.forEach(child => {
                if (child.userData && child.userData.name === regionName) {
                    child.userData.activity = intensity;

                    // Update region color based on activity
                    if (intensity > 0.6) {
                        child.material.emissiveIntensity = 0.3;
                    } else if (intensity > 0.3) {
                        child.material.emissiveIntensity = 0.2;
                    } else {
                        child.material.emissiveIntensity = 0.1;
                    }
                }
            });
        }
    }

    updateActivityMeters() {
        if (!this.data) return;
        
        const currentRow = this.data.data[this.currentTimeIndex] || this.data.data[0];
        const numericColumns = this.data.headers.filter(header => 
            typeof currentRow[header] === 'number'
        );
        
        if (numericColumns.length >= 4) {
            const activities = numericColumns.slice(0, 4).map(col => Math.abs(currentRow[col] || 0));
            const maxActivity = Math.max(...activities, 1);
            
            ['alpha', 'beta', 'theta', 'delta'].forEach((wave, index) => {
                const meter = document.getElementById(`${wave}-meter`);
                const percentage = (activities[index] / maxActivity) * 100;
                meter.style.width = `${percentage}%`;
            });
        }
    }

    updateTimePosition(value) {
        this.currentTimeIndex = parseInt(value);
        const timeDisplay = document.getElementById('time-display');
        timeDisplay.textContent = `${this.currentTimeIndex * 10}ms`;
        
        this.updateVisualization();
    }

    togglePlayback() {
        const playBtn = document.getElementById('play-btn');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            playBtn.textContent = '▶ Play';
            cancelAnimationFrame(this.playAnimation);
        } else {
            this.isPlaying = true;
            playBtn.textContent = '⏸ Pause';
            this.startPlayback();
        }
    }

    startPlayback() {
        const playSpeed = 100; // milliseconds between frames
        let lastTime = Date.now();
        
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            const currentTime = Date.now();
            if (currentTime - lastTime >= playSpeed) {
                this.currentTimeIndex = (this.currentTimeIndex + 1) % (this.maxTime + 1);
                
                const timeSlider = document.getElementById('time-slider');
                timeSlider.value = this.currentTimeIndex;
                this.updateTimePosition(this.currentTimeIndex);
                
                lastTime = currentTime;
            }
            
            this.playAnimation = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }

    resetView() {
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(0, 0, 0);
        
        if (this.brain) {
            this.brain.rotation.set(0, 0, 0);
        }
        
        this.currentTimeIndex = 0;
        const timeSlider = document.getElementById('time-slider');
        timeSlider.value = 0;
        this.updateTimePosition(0);
        
        if (this.isPlaying) {
            this.togglePlayback();
        }
    }

    updateViewMode() {
        const viewMode = document.getElementById('view-mode').value;
        const body = document.body;
        
        // Remove existing view classes
        body.classList.remove('view-3d-brain', 'view-2d-chart', 'view-split');
        
        // Add new view class
        body.classList.add(`view-${viewMode}`);
        
        if (viewMode === '2d-chart') {
            this.setup2DChart();
        }
    }

    setup2DChart() {
        const canvas = document.getElementById('eeg-chart');
        const ctx = canvas.getContext('2d');
        
        // Implement 2D chart similar to original code
        this.draw2DVisualization(ctx);
    }

    draw2DVisualization(ctx) {
        if (!this.data) return;
        
        const canvas = ctx.canvas;
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw time series for selected channels
        const numericColumns = this.data.headers.filter(header => 
            this.data.data.length > 0 && typeof this.data.data[0][header] === 'number'
        ).slice(0, 5);
        
        if (numericColumns.length === 0) return;
        
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Calculate bounds
        let minVal = Infinity, maxVal = -Infinity;
        this.data.data.forEach(row => {
            numericColumns.forEach(col => {
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
        
        // Draw data lines
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
        
        numericColumns.forEach((column, columnIndex) => {
            ctx.strokeStyle = colors[columnIndex];
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
        
        // Current time indicator
        const currentX = padding + (chartWidth * this.currentTimeIndex / (this.data.data.length - 1));
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, padding);
        ctx.lineTo(currentX, height - padding);
        ctx.stroke();
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
            <div><strong>Time Points:</strong> ${rowCount}</div>
            <div><strong>Electrodes:</strong> ${columnCount}</div>
            <div><strong>Active Channels:</strong> ${numericColumns}</div>
            <div><strong>Duration:</strong> ${(rowCount * 10)}ms</div>
            <div><strong>Sample Rate:</strong> 100 Hz</div>
        `;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.brain) {
            // Gentle rotation when not being controlled
            if (!this.isPlaying) {
                this.brain.rotation.y += 0.005;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
        
        // Update 2D chart if in split view
        if (document.body.classList.contains('view-split') || 
            document.body.classList.contains('view-2d-chart')) {
            this.draw2DVisualization(document.getElementById('eeg-chart').getContext('2d'));
        }
    }

    onWindowResize() {
        const container = document.getElementById('brain-3d');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveBrainVisualizer();
});
