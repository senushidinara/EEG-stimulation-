import * as THREE from 'three';

// Advanced Medical Brain Visualization System
class AdvancedBrainVisualizer {
    constructor() {
        this.data = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.brain = null;
        this.electrodes = [];
        this.animationId = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.currentTimeIndex = 0;
        this.maxTime = 0;
        this.currentMode = 'medical-3d';
        this.currentVideo = null;
        this.analysisMode = 'real-time';
        this.frequencyFilter = 'all';
        
        // Advanced settings
        this.settings = {
            opacity: 0.8,
            sensitivity: 5,
            animationSpeed: 1.0,
            showConnectivity: true,
            realTimeAnalysis: true
        };
        
        // EEG electrode positions (enhanced 10-20 system)
        this.electrodePositions = {
            'Fp1': [-0.35, 0.75, 0.95], 'Fp2': [0.35, 0.75, 0.95],
            'F7': [-0.85, 0.3, 0.45], 'F3': [-0.45, 0.55, 0.85], 'Fz': [0, 0.65, 0.95], 
            'F4': [0.45, 0.55, 0.85], 'F8': [0.85, 0.3, 0.45],
            'T3': [-0.95, 0, 0.25], 'C3': [-0.55, 0.15, 0.95], 'Cz': [0, 0.25, 1.05], 
            'C4': [0.55, 0.15, 0.95], 'T4': [0.95, 0, 0.25],
            'T5': [-0.85, -0.45, 0.35], 'P3': [-0.45, -0.35, 0.85], 'Pz': [0, -0.25, 1.0], 
            'P4': [0.45, -0.35, 0.85], 'T6': [0.85, -0.45, 0.35],
            'O1': [-0.25, -0.75, 0.65], 'O2': [0.25, -0.75, 0.65]
        };
        
        // Real-time metrics
        this.metrics = {
            alphaPower: 0,
            betaPower: 0,
            thetaPower: 0,
            gammaPower: 0,
            connectivity: [],
            dominantFreq: 0,
            coherence: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initThreeJS();
        this.createAdvancedBrainModel();
        this.createElectrodes();
        this.setupElectrodeGrid();
        this.setupConnectivityMatrix();
        this.setupVideoBackgrounds();
        this.startRealTimeAnalysis();
        this.animate();
        this.updateViewMode();
    }

    setupEventListeners() {
        // Main control buttons
        document.getElementById('load-data-btn').addEventListener('click', () => this.loadEEGData());
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('record-btn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        
        // Mode selectors
        document.getElementById('brain-mode').addEventListener('change', (e) => this.changeBrainMode(e.target.value));
        document.getElementById('analysis-mode').addEventListener('change', (e) => this.changeAnalysisMode(e.target.value));
        
        // Timeline
        document.getElementById('timeline-slider').addEventListener('input', (e) => this.updateTimePosition(e.target.value));
        
        // Frequency filters
        document.querySelectorAll('.freq-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFrequencyFilter(e.target.dataset.freq));
        });
        
        // Settings sliders
        document.getElementById('opacity-slider').addEventListener('input', (e) => this.updateOpacity(e.target.value));
        document.getElementById('sensitivity-slider').addEventListener('input', (e) => this.updateSensitivity(e.target.value));
        document.getElementById('speed-slider').addEventListener('input', (e) => this.updateSpeed(e.target.value));
        
        // Brain regions
        document.querySelectorAll('.region-item').forEach(item => {
            item.addEventListener('click', (e) => this.focusOnRegion(e.target.dataset.region));
        });
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initThreeJS() {
        const container = document.getElementById('brain-canvas');
        
        // Scene setup with advanced rendering
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1a);
        this.scene.fog = new THREE.Fog(0x0a0e1a, 10, 50);
        
        // Camera with enhanced controls
        this.camera = new THREE.PerspectiveCamera(
            60, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 4);
        
        // Advanced renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
        
        // Advanced lighting system
        this.setupAdvancedLighting();
        
        // Enhanced controls
        this.setupAdvancedControls();
    }

    setupAdvancedLighting() {
        // Ambient light with color temperature
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // Main key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(10, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 500;
        this.scene.add(keyLight);
        
        // Fill lights for even illumination
        const fillLight1 = new THREE.DirectionalLight(0x4080ff, 0.8);
        fillLight1.position.set(-5, 5, 3);
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xff8040, 0.6);
        fillLight2.position.set(3, -3, -5);
        this.scene.add(fillLight2);
        
        // Rim light for brain contour
        const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.4);
        rimLight.position.set(-10, -5, -10);
        this.scene.add(rimLight);
        
        // Point lights for electrodes
        this.electrodeLight = new THREE.PointLight(0x00d4aa, 0.5, 10);
        this.electrodeLight.position.set(0, 2, 2);
        this.scene.add(this.electrodeLight);
    }

    setupAdvancedControls() {
        const controls = {
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false,
            isDragging: false
        };
        
        const container = this.renderer.domElement;
        
        container.addEventListener('mousedown', (event) => {
            controls.isMouseDown = true;
            controls.mouseX = event.clientX;
            controls.mouseY = event.clientY;
            controls.isDragging = false;
        });
        
        container.addEventListener('mouseup', (event) => {
            if (!controls.isDragging) {
                this.handleClick(event);
            }
            controls.isMouseDown = false;
            controls.isDragging = false;
        });
        
        container.addEventListener('mousemove', (event) => {
            if (controls.isMouseDown) {
                const deltaX = event.clientX - controls.mouseX;
                const deltaY = event.clientY - controls.mouseY;
                
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    controls.isDragging = true;
                    
                    if (this.brain) {
                        this.brain.rotation.y += deltaX * 0.01;
                        this.brain.rotation.x += deltaY * 0.01;
                    }
                }
                
                controls.mouseX = event.clientX;
                controls.mouseY = event.clientY;
            } else {
                this.handleMouseMove(event);
            }
        });
        
        container.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY * 0.001;
            this.camera.position.z = Math.max(2, Math.min(8, this.camera.position.z + delta));
        });
    }

    createAdvancedBrainModel() {
        const brainGroup = new THREE.Group();
        
        // Create different brain models based on mode
        switch (this.currentMode) {
            case 'medical-3d':
                this.createMedicalBrainModel(brainGroup);
                break;
            case 'neural-network':
                this.createNeuralNetworkModel(brainGroup);
                break;
            case 'activation-map':
                this.createActivationMapModel(brainGroup);
                break;
            case 'anatomical':
                this.createAnatomicalModel(brainGroup);
                break;
            case 'mri-simulation':
                this.createMRISimulationModel(brainGroup);
                break;
        }
        
        this.brain = brainGroup;
        this.scene.add(this.brain);
    }

    createMedicalBrainModel(brainGroup) {
        // Create medical-grade brain with proper anatomy
        const brainGeometry = this.createAdvancedBrainGeometry();
        
        // Medical brain material with subsurface scattering effect
        const brainMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd4a574,
            roughness: 0.8,
            metalness: 0.1,
            clearcoat: 0.1,
            clearcoatRoughness: 0.8,
            transmission: 0.1,
            thickness: 0.5,
            ior: 1.4,
            opacity: this.settings.opacity
        });
        
        // Left hemisphere
        const leftHemisphere = new THREE.Mesh(brainGeometry, brainMaterial);
        leftHemisphere.scale.set(-1, 1, 1);
        leftHemisphere.position.set(-0.05, 0, 0);
        leftHemisphere.castShadow = true;
        leftHemisphere.receiveShadow = true;
        brainGroup.add(leftHemisphere);
        
        // Right hemisphere
        const rightHemisphere = new THREE.Mesh(brainGeometry, brainMaterial.clone());
        rightHemisphere.position.set(0.05, 0, 0);
        rightHemisphere.castShadow = true;
        rightHemisphere.receiveShadow = true;
        brainGroup.add(rightHemisphere);
        
        // Add advanced anatomical structures
        this.addAdvancedAnatomicalStructures(brainGroup);
    }

    createNeuralNetworkModel(brainGroup) {
        // Create neural network visualization
        const nodeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00d4aa,
            emissive: 0x002244,
            transparent: true,
            opacity: 0.8
        });
        
        // Create network nodes
        for (let i = 0; i < 200; i++) {
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
            
            // Position nodes in brain-like distribution
            const phi = Math.acos(-1 + (2 * i) / 200);
            const theta = Math.sqrt(200 * Math.PI) * phi;
            const radius = 0.8 + Math.random() * 0.4;
            
            node.position.setFromSphericalCoords(radius, phi, theta);
            brainGroup.add(node);
            
            // Add to electrode list for interaction
            this.electrodes.push(node);
        }
        
        // Create neural connections
        this.createNeuralConnections(brainGroup);
    }

    createActivationMapModel(brainGroup) {
        // Create heat map overlay on brain surface
        const brainGeometry = this.createAdvancedBrainGeometry();
        
        // Shader material for activation visualization
        const activationMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                activationData: { value: new THREE.DataTexture() }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                vec3 heatmapColor(float value) {
                    vec3 blue = vec3(0.0, 0.0, 1.0);
                    vec3 cyan = vec3(0.0, 1.0, 1.0);
                    vec3 yellow = vec3(1.0, 1.0, 0.0);
                    vec3 red = vec3(1.0, 0.0, 0.0);
                    
                    if (value < 0.33) {
                        return mix(blue, cyan, value / 0.33);
                    } else if (value < 0.66) {
                        return mix(cyan, yellow, (value - 0.33) / 0.33);
                    } else {
                        return mix(yellow, red, (value - 0.66) / 0.34);
                    }
                }
                
                void main() {
                    float activation = sin(time + vPosition.x * 5.0) * 0.5 + 0.5;
                    vec3 color = heatmapColor(activation);
                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true
        });
        
        const activationMesh = new THREE.Mesh(brainGeometry, activationMaterial);
        brainGroup.add(activationMesh);
        
        this.activationMaterial = activationMaterial;
    }

    createAnatomicalModel(brainGroup) {
        // Detailed anatomical brain model
        this.createMedicalBrainModel(brainGroup);
        
        // Add anatomical labels
        this.addAnatomicalLabels(brainGroup);
    }

    createMRISimulationModel(brainGroup) {
        // Create MRI-like slices visualization
        const sliceGeometry = new THREE.PlaneGeometry(2, 2);
        const sliceMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Create multiple brain slices
        for (let i = 0; i < 20; i++) {
            const slice = new THREE.Mesh(sliceGeometry, sliceMaterial.clone());
            slice.position.z = -1 + (i / 20) * 2;
            slice.material.map = this.generateMRISliceTexture(i);
            brainGroup.add(slice);
        }
    }

    createAdvancedBrainGeometry() {
        const brainGeometry = new THREE.SphereGeometry(1, 128, 64);
        const positions = brainGeometry.attributes.position;
        
        // Advanced brain deformation based on real anatomy
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Multiple deformation factors for realistic shape
            const frontFactor = z > 0.3 ? 1.3 - 0.4 * Math.abs(y) : 1.0;
            const temporalFactor = Math.abs(x) > 0.6 && y < 0.2 && y > -0.8 ? 1.4 : 1.0;
            const occipitalFactor = z < -0.3 ? 0.7 + 0.3 * Math.abs(y) : 1.0;
            const topFactor = y > 0.7 ? 0.85 : 1.0;
            
            // Cortical folding simulation
            const noise = (Math.sin(x * 10) + Math.sin(y * 10) + Math.sin(z * 10)) * 0.02;
            
            const deformFactor = frontFactor * temporalFactor * occipitalFactor * topFactor;
            
            positions.setXYZ(i, 
                x * deformFactor * 0.9 + noise,
                y * deformFactor * 1.1 + noise,
                z * deformFactor * 1.2 + noise
            );
        }
        
        brainGeometry.attributes.position.needsUpdate = true;
        brainGeometry.computeVertexNormals();
        
        return brainGeometry;
    }

    addAdvancedAnatomicalStructures(brainGroup) {
        // Cerebellum with detailed folding
        const cerebellumGeometry = new THREE.SphereGeometry(0.35, 32, 16);
        const cerebellumMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xb8956f,
            roughness: 0.9,
            metalness: 0.05
        });
        
        const cerebellum = new THREE.Mesh(cerebellumGeometry, cerebellumMaterial);
        cerebellum.scale.set(1.3, 0.7, 1.1);
        cerebellum.position.set(0, -0.8, -0.9);
        cerebellum.castShadow = true;
        brainGroup.add(cerebellum);
        
        // Brain stem components
        this.addBrainStemComponents(brainGroup);
        
        // Ventricular system
        this.addVentricularSystem(brainGroup);
        
        // White matter tracts
        this.addWhiteMatterTracts(brainGroup);
    }

    addBrainStemComponents(brainGroup) {
        // Midbrain
        const midbrainGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 16);
        const stemMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa08570, roughness: 0.8 });
        
        const midbrain = new THREE.Mesh(midbrainGeometry, stemMaterial);
        midbrain.position.set(0, -0.45, -0.35);
        midbrain.castShadow = true;
        brainGroup.add(midbrain);
        
        // Pons
        const ponsGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.2, 16);
        const pons = new THREE.Mesh(ponsGeometry, stemMaterial.clone());
        pons.position.set(0, -0.65, -0.45);
        pons.castShadow = true;
        brainGroup.add(pons);
        
        // Medulla
        const medullaGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.35, 12);
        const medulla = new THREE.Mesh(medullaGeometry, stemMaterial.clone());
        medulla.position.set(0, -0.9, -0.55);
        medulla.castShadow = true;
        brainGroup.add(medulla);
    }

    addVentricularSystem(brainGroup) {
        // Lateral ventricles
        const ventricleGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.8);
        const ventricleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3,
            transmission: 0.9,
            ior: 1.33
        });
        
        const leftVentricle = new THREE.Mesh(ventricleGeometry, ventricleMaterial);
        leftVentricle.position.set(-0.3, 0.2, 0);
        brainGroup.add(leftVentricle);
        
        const rightVentricle = new THREE.Mesh(ventricleGeometry, ventricleMaterial.clone());
        rightVentricle.position.set(0.3, 0.2, 0);
        brainGroup.add(rightVentricle);
    }

    addWhiteMatterTracts(brainGroup) {
        // Corpus callosum
        const callosumGeometry = new THREE.BoxGeometry(0.02, 1.4, 0.6);
        const whiteMatterMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf5f5dc,
            metalness: 0.1,
            roughness: 0.7
        });
        
        const corpusCallosum = new THREE.Mesh(callosumGeometry, whiteMatterMaterial);
        corpusCallosum.position.set(0, 0.1, -0.1);
        brainGroup.add(corpusCallosum);
        
        // Add fiber tracts
        this.addFiberTracts(brainGroup);
    }

    addFiberTracts(brainGroup) {
        const fiberMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Create curved fiber paths
        for (let i = 0; i < 50; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.8 + Math.random() * 1.6, -0.5, -0.5),
                new THREE.Vector3(-0.4 + Math.random() * 0.8, 0, 0),
                new THREE.Vector3(-0.8 + Math.random() * 1.6, 0.5, 0.5)
            ]);
            
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.005, 8, false);
            const fiber = new THREE.Mesh(tubeGeometry, fiberMaterial.clone());
            brainGroup.add(fiber);
        }
    }

    createElectrodes() {
        Object.entries(this.electrodePositions).forEach(([name, position]) => {
            const electrodeGroup = new THREE.Group();
            
            // Advanced electrode design
            const contactGeometry = new THREE.SphereGeometry(0.02, 16, 16);
            const contactMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xc0c0c0,
                metalness: 0.9,
                roughness: 0.1,
                clearcoat: 1.0,
                emissive: 0x001122
            });
            
            const contact = new THREE.Mesh(contactGeometry, contactMaterial);
            contact.castShadow = true;
            electrodeGroup.add(contact);
            
            // Electrode wire
            const wireGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.3, 8);
            const wireMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.2
            });
            
            const wire = new THREE.Mesh(wireGeometry, wireMaterial);
            wire.position.y = -0.15;
            electrodeGroup.add(wire);
            
            // Position and orient electrode
            electrodeGroup.position.set(...position);
            
            const brainCenter = new THREE.Vector3(0, 0, 0);
            const electrodePos = new THREE.Vector3(...position);
            const direction = brainCenter.sub(electrodePos).normalize();
            electrodeGroup.lookAt(direction.multiplyScalar(-1).add(electrodePos));
            
            electrodeGroup.userData = { 
                type: 'electrode', 
                name: name,
                contact: contact,
                activity: 0,
                frequency: 0,
                amplitude: 0
            };
            
            // Add advanced electrode label
            this.addAdvancedElectrodeLabel(electrodeGroup, name);
            
            this.electrodes.push(electrodeGroup);
            this.brain.add(electrodeGroup);
        });
        
        this.setupAdvancedElectrodeInteraction();
    }

    addAdvancedElectrodeLabel(electrode, name) {
        // Create high-resolution label canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        // Draw label with medical styling
        context.fillStyle = 'rgba(0, 20, 40, 0.9)';
        context.fillRect(0, 0, 128, 64);
        context.strokeStyle = '#00d4aa';
        context.lineWidth = 2;
        context.strokeRect(2, 2, 124, 60);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(name, 64, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.3, 0.15, 1);
        label.position.copy(electrode.position);
        label.position.y += 0.15;
        
        this.brain.add(label);
    }

    setupAdvancedElectrodeInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(
                this.electrodes.map(e => e.children[0])
            );
            
            // Reset all electrodes
            this.electrodes.forEach(electrode => {
                const contact = electrode.userData.contact;
                contact.material.emissive.setHex(0x001122);
                contact.scale.setScalar(1);
            });
            
            if (intersects.length > 0) {
                const electrode = intersects[0].object.parent;
                const contact = electrode.userData.contact;
                contact.material.emissive.setHex(0x004444);
                contact.scale.setScalar(1.3);
                
                this.showAdvancedElectrodeTooltip(electrode, event);
            } else {
                this.hideElectrodeTooltip();
            }
        });
    }

    showAdvancedElectrodeTooltip(electrode, event) {
        const tooltip = document.getElementById('electrode-tooltip');
        const data = electrode.userData;
        
        // Update tooltip content with real-time data
        tooltip.querySelector('.electrode-name').textContent = data.name;
        tooltip.querySelector('.tooltip-content .metric:nth-child(1) .value').textContent = 
            `${(data.amplitude * 100 + Math.random() * 50).toFixed(1)} μV`;
        tooltip.querySelector('.tooltip-content .metric:nth-child(2) .value').textContent = 
            `${(data.frequency + Math.random() * 5).toFixed(1)} Hz`;
        
        const activityLevel = data.activity > 0.7 ? 'High' : data.activity > 0.4 ? 'Medium' : 'Low';
        tooltip.querySelector('.tooltip-content .metric:nth-child(3) .value').textContent = activityLevel;
        
        // Position tooltip
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top = (event.clientY - tooltip.offsetHeight - 10) + 'px';
        tooltip.classList.add('visible');
    }

    hideElectrodeTooltip() {
        document.getElementById('electrode-tooltip').classList.remove('visible');
    }

    setupElectrodeGrid() {
        const electrodeGrid = document.getElementById('electrode-grid');
        
        Object.keys(this.electrodePositions).forEach(name => {
            const electrodeStatus = document.createElement('div');
            electrodeStatus.className = 'electrode-status active';
            electrodeStatus.textContent = name;
            electrodeStatus.dataset.electrode = name;
            
            electrodeStatus.addEventListener('click', () => {
                this.focusOnElectrode(name);
            });
            
            electrodeGrid.appendChild(electrodeStatus);
        });
    }

    setupConnectivityMatrix() {
        const matrix = document.getElementById('connectivity-matrix');
        const canvas = document.createElement('canvas');
        canvas.width = matrix.offsetWidth;
        canvas.height = matrix.offsetHeight;
        matrix.appendChild(canvas);
        
        this.connectivityCanvas = canvas;
        this.connectivityCtx = canvas.getContext('2d');
        this.updateConnectivityMatrix();
    }

    updateConnectivityMatrix() {
        if (!this.connectivityCtx) return;
        
        const ctx = this.connectivityCtx;
        const width = this.connectivityCanvas.width;
        const height = this.connectivityCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const electrodeCount = Object.keys(this.electrodePositions).length;
        const cellWidth = width / electrodeCount;
        const cellHeight = height / electrodeCount;
        
        // Draw connectivity matrix
        for (let i = 0; i < electrodeCount; i++) {
            for (let j = 0; j < electrodeCount; j++) {
                const connectivity = Math.random(); // Replace with real connectivity data
                const color = `hsl(${connectivity * 240}, 100%, 50%)`;
                
                ctx.fillStyle = color;
                ctx.globalAlpha = connectivity;
                ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
            }
        }
        
        ctx.globalAlpha = 1;
    }

    setupVideoBackgrounds() {
        const videos = document.querySelectorAll('.brain-video');
        videos.forEach((video, index) => {
            video.addEventListener('loadeddata', () => {
                console.log(`Video ${index + 1} loaded`);
            });
            
            video.addEventListener('error', (e) => {
                console.warn(`Video ${index + 1} failed to load:`, e);
            });
        });
        
        // Set initial video
        this.setActiveVideo(1);
    }

    setActiveVideo(videoIndex) {
        document.querySelectorAll('.brain-video').forEach((video, index) => {
            video.classList.remove('active');
            video.pause();
        });
        
        const activeVideo = document.getElementById(`brain-video-${videoIndex}`);
        if (activeVideo) {
            activeVideo.classList.add('active');
            activeVideo.currentTime = 0;
            activeVideo.play().catch(e => console.warn('Video autoplay failed:', e));
            this.currentVideo = activeVideo;
        }
    }

    startRealTimeAnalysis() {
        setInterval(() => {
            this.updateRealTimeMetrics();
            this.updateConnectivityMatrix();
            this.updateBrainRegionActivity();
        }, 100);
    }

    updateRealTimeMetrics() {
        // Simulate real-time EEG analysis
        this.metrics.alphaPower = 5 + Math.sin(Date.now() * 0.001) * 3 + Math.random();
        this.metrics.betaPower = 4 + Math.cos(Date.now() * 0.0015) * 2 + Math.random();
        this.metrics.thetaPower = 3 + Math.sin(Date.now() * 0.0008) * 2 + Math.random();
        this.metrics.gammaPower = 7 + Math.cos(Date.now() * 0.002) * 4 + Math.random();
        
        // Update UI
        document.getElementById('alpha-power').textContent = this.metrics.alphaPower.toFixed(1);
        document.getElementById('beta-power').textContent = this.metrics.betaPower.toFixed(1);
        document.getElementById('theta-power').textContent = this.metrics.thetaPower.toFixed(1);
        document.getElementById('gamma-power').textContent = this.metrics.gammaPower.toFixed(1);
        
        // Update progress bars
        document.querySelector('.alpha-fill').style.width = `${(this.metrics.alphaPower / 10) * 100}%`;
        document.querySelector('.beta-fill').style.width = `${(this.metrics.betaPower / 10) * 100}%`;
        document.querySelector('.theta-fill').style.width = `${(this.metrics.thetaPower / 10) * 100}%`;
        document.querySelector('.gamma-fill').style.width = `${(this.metrics.gammaPower / 10) * 100}%`;
    }

    updateBrainRegionActivity() {
        // Update brain region activity percentages
        const regions = document.querySelectorAll('.region-activity');
        regions.forEach(region => {
            const activity = 30 + Math.random() * 70;
            region.textContent = `${activity.toFixed(0)}%`;
        });
    }

    // Control Functions
    async loadEEGData() {
        const btn = document.getElementById('load-data-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
        
        try {
            const response = await fetch('./eeg_data.csv');
            const csvText = await response.text();
            
            this.data = this.parseCSV(csvText);
            this.maxTime = this.data.data.length - 1;
            
            // Update timeline
            document.getElementById('timeline-slider').max = this.maxTime;
            
            // Enable controls
            document.getElementById('play-pause-btn').disabled = false;
            
            // Start visualization
            this.updateVisualization();
            
            btn.innerHTML = '<i class="fas fa-check"></i> Data Loaded';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-upload"></i> Load EEG Data';
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error loading data:', error);
            btn.innerHTML = '<i class="fas fa-exclamation"></i> Error';
            btn.disabled = false;
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
        const btn = document.getElementById('play-pause-btn');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Play';
            cancelAnimationFrame(this.playAnimation);
        } else {
            this.isPlaying = true;
            btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            this.startPlayback();
        }
    }

    startPlayback() {
        const playSpeed = 50 / this.settings.animationSpeed;
        let lastTime = Date.now();
        
        const playLoop = () => {
            if (!this.isPlaying) return;
            
            const currentTime = Date.now();
            if (currentTime - lastTime >= playSpeed) {
                this.currentTimeIndex = (this.currentTimeIndex + 1) % (this.maxTime + 1);
                
                document.getElementById('timeline-slider').value = this.currentTimeIndex;
                this.updateTimePosition(this.currentTimeIndex);
                
                lastTime = currentTime;
            }
            
            this.playAnimation = requestAnimationFrame(playLoop);
        };
        
        playLoop();
    }

    toggleRecording() {
        const btn = document.getElementById('record-btn');
        
        if (this.isRecording) {
            this.isRecording = false;
            btn.innerHTML = '<i class="fas fa-record-vinyl"></i> Record';
            btn.classList.remove('recording');
        } else {
            this.isRecording = true;
            btn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
            btn.classList.add('recording');
        }
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            electrodeData: this.electrodes.map(e => ({
                name: e.userData.name,
                activity: e.userData.activity,
                position: e.position.toArray()
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brain-analysis-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    changeBrainMode(mode) {
        this.currentMode = mode;
        
        // Switch video based on mode
        switch (mode) {
            case 'medical-3d':
                this.setActiveVideo(1);
                break;
            case 'neural-network':
                this.setActiveVideo(2);
                break;
            case 'activation-map':
                this.setActiveVideo(3);
                break;
            case 'anatomical':
                this.setActiveVideo(4);
                break;
            case 'mri-simulation':
                this.setActiveVideo(5);
                break;
        }
        
        // Recreate brain model
        if (this.brain) {
            this.scene.remove(this.brain);
        }
        this.createAdvancedBrainModel();
        this.createElectrodes();
    }

    changeAnalysisMode(mode) {
        this.analysisMode = mode;
        console.log(`Analysis mode changed to: ${mode}`);
    }

    setFrequencyFilter(freq) {
        // Update active frequency button
        document.querySelectorAll('.freq-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-freq="${freq}"]`).classList.add('active');
        
        this.frequencyFilter = freq;
        this.updateVisualization();
    }

    updateTimePosition(value) {
        this.currentTimeIndex = parseInt(value);
        const timeInSeconds = (this.currentTimeIndex * 0.01).toFixed(1);
        document.getElementById('time-display').textContent = `${timeInSeconds}s`;
        
        this.updateVisualization();
    }

    updateVisualization() {
        if (!this.data) return;
        
        const currentRow = this.data.data[this.currentTimeIndex] || this.data.data[0];
        
        // Update electrode activities with frequency filtering
        this.electrodes.forEach(electrode => {
            const electrodeName = electrode.userData.name;
            let activity = currentRow[electrodeName] || Math.random() * 0.5;
            
            // Apply frequency filter
            if (this.frequencyFilter !== 'all') {
                activity = this.applyFrequencyFilter(activity, this.frequencyFilter);
            }
            
            electrode.userData.activity = Math.abs(activity);
            electrode.userData.amplitude = Math.abs(activity) * 100;
            electrode.userData.frequency = 8 + Math.random() * 20;
            
            const contact = electrode.userData.contact;
            if (contact) {
                const intensity = Math.min(Math.abs(activity) * 2, 1);
                const color = new THREE.Color();
                
                // Advanced color mapping
                if (intensity < 0.3) {
                    color.setHSL(0.67, 0.8, 0.3 + intensity * 0.7);
                } else if (intensity < 0.7) {
                    color.setHSL(0.17, 0.9, 0.4 + intensity * 0.6);
                } else {
                    color.setHSL(0.0, 0.9, 0.5 + intensity * 0.5);
                }
                
                contact.material.color = color;
                contact.material.emissive.copy(color).multiplyScalar(0.3);
                
                const scale = 1.0 + intensity * 0.5;
                contact.scale.setScalar(scale);
            }
        });
        
        // Update shader uniforms if using activation map
        if (this.activationMaterial) {
            this.activationMaterial.uniforms.time.value = Date.now() * 0.001;
        }
    }

    applyFrequencyFilter(activity, filter) {
        // Simulate frequency filtering
        const filterMap = {
            'alpha': activity * (0.8 + Math.sin(Date.now() * 0.01) * 0.2),
            'beta': activity * (0.6 + Math.cos(Date.now() * 0.015) * 0.4),
            'gamma': activity * (0.9 + Math.sin(Date.now() * 0.02) * 0.1)
        };
        
        return filterMap[filter] || activity;
    }

    updateOpacity(value) {
        this.settings.opacity = value / 100;
        if (this.brain) {
            this.brain.children.forEach(child => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = this.settings.opacity;
                }
            });
        }
    }

    updateSensitivity(value) {
        this.settings.sensitivity = value;
    }

    updateSpeed(value) {
        this.settings.animationSpeed = parseFloat(value);
    }

    focusOnElectrode(electrodeName) {
        const electrode = this.electrodes.find(e => e.userData.name === electrodeName);
        if (electrode) {
            this.animateCamera(electrode.position);
            
            // Highlight electrode
            const contact = electrode.userData.contact;
            contact.material.emissive.setHex(0x006666);
            setTimeout(() => {
                contact.material.emissive.setHex(0x001122);
            }, 2000);
        }
    }

    focusOnRegion(regionName) {
        // Define region center positions
        const regionPositions = {
            'frontal': new THREE.Vector3(0, 0.4, 0.8),
            'parietal': new THREE.Vector3(0, 0.3, -0.3),
            'temporal': new THREE.Vector3(-0.7, -0.1, 0.2),
            'occipital': new THREE.Vector3(0, -0.5, -0.8)
        };
        
        const position = regionPositions[regionName];
        if (position) {
            this.animateCamera(position);
        }
    }

    animateCamera(targetPosition) {
        const startPosition = this.camera.position.clone();
        const endPosition = targetPosition.clone().add(new THREE.Vector3(0, 0, 3));
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.camera.position.lerpVectors(startPosition, endPosition, easeProgress);
            this.camera.lookAt(targetPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    handleClick(event) {
        // Handle 3D object clicking
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.brain.children, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            console.log('Clicked on:', object.userData);
        }
    }

    handleMouseMove(event) {
        // Handle mouse movement for tooltips and highlights
        this.setupAdvancedElectrodeInteraction();
    }

    updateViewMode() {
        // Update view based on current mode
        this.changeBrainMode(this.currentMode);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Gentle brain rotation when not being controlled
        if (this.brain && !this.isPlaying) {
            this.brain.rotation.y += 0.002;
        }
        
        // Update animations
        if (this.currentVideo) {
            // Sync 3D animations with video
            const videoTime = this.currentVideo.currentTime;
            if (this.brain) {
                this.brain.rotation.z = Math.sin(videoTime) * 0.1;
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const container = document.getElementById('brain-canvas');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        // Update connectivity matrix canvas
        if (this.connectivityCanvas) {
            this.connectivityCanvas.width = width;
            this.connectivityCanvas.height = height;
            this.updateConnectivityMatrix();
        }
    }
}

// Initialize the advanced brain visualization
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedBrainVisualizer();
});
