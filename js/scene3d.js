const Scene3D = {
    container: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,

    // Scene objects
    floor: null,
    walls: [],
    furnitureGroup: null, 
    itemMeshes: {}, 

    // Lights
    dirLight: null,
    ambLight: null,

    init(containerId) {
        this.container = document.getElementById(containerId);

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#f0f0f5'); 

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; 
        this.controls.target.set(0, 0, 0);

        // Lights
        this.setupLighting();

        // Object Groups
        this.furnitureGroup = new THREE.Group();
        this.scene.add(this.furnitureGroup);

        // Resize Listener
        window.addEventListener('resize', () => this.resize());

        // Start Loop
        this.animate();
    },

    setupLighting() {
        // Ambient Light for base illumination
        this.ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambLight);

        // Directional Light for shadows and highlights
        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.dirLight.position.set(5, 10, 7);
        this.dirLight.castShadow = true;

        // Shadow map resolution
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 25;
        this.dirLight.shadow.camera.left = -10;
        this.dirLight.shadow.camera.right = 10;
        this.dirLight.shadow.camera.top = 10;
        this.dirLight.shadow.camera.bottom = -10;

        this.scene.add(this.dirLight);
    },

    toggleShading(enabled) {
        if (this.renderer) {
            this.renderer.shadowMap.enabled = enabled;
            // Force material update for shadows
            this.scene.traverse((child) => {
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            });
        }
    },

    buildRoom(width, depth, floorColor, wallColor) {
        // Clear old room geometries
        if (this.floor) this.scene.remove(this.floor);
        this.walls.forEach(w => this.scene.remove(w));
        this.walls = [];

        // Center room horizontally at 0,0
        // Coordinates: x goes left/right, z goes forward/back

        // Floor
        const floorGeo = new THREE.PlaneGeometry(width, depth);
        const floorMat = new THREE.MeshStandardMaterial({
            color: floorColor,
            roughness: 0.8
        });

        this.floor = new THREE.Mesh(floorGeo, floorMat);
        this.floor.rotation.x = -Math.PI / 2; 
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Walls
        const wallHeight = 3;
        const wallThickness = 0.2;
        const wallMat = new THREE.MeshStandardMaterial({
            color: wallColor,
            roughness: 0.9
        });

        // Helper to create a wall
        const createWall = (w, h, d, x, z) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            mesh.position.set(x, h / 2, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.walls.push(mesh);
        };

        // Back Wall
        createWall(width, wallHeight, wallThickness, 0, -depth / 2 - wallThickness / 2);
        // Left Wall
        createWall(wallThickness, wallHeight, depth, -width / 2 - wallThickness / 2, 0);
 
        this.controls.target.set(0, wallHeight / 2, 0);
    },

    updateFurniture(items) {
        // Clear existing items that are no longer in state
        const stateIds = new Set(items.map(i => i.id));
        for (const [id, mesh] of Object.entries(this.itemMeshes)) {
            if (!stateIds.has(id)) {
                this.furnitureGroup.remove(mesh);
                delete this.itemMeshes[id];
            }
        }

        // Add or update items
        items.forEach(itemData => {
            let itemGroup = this.itemMeshes[itemData.id];

            // If it doesn't exist, create it via custom builder
            if (!itemGroup) {
                // Determine primitive vs complex object
                itemGroup = window.Furniture.createItem(itemData.type, itemData.color);

                this.furnitureGroup.add(itemGroup);
                this.itemMeshes[itemData.id] = itemGroup;
            }

            // Sync visual properties
            // Coordinate mapping: 2D Canvas top-left (0,0) -> 3D Space centered (0,0)
            // If room is Width x Depth, center is 0,0.

            // X and Z come from the state (which assumes 0,0 is center)
            itemGroup.position.set(itemData.x, 0, itemData.z);

            // Rotation (convert deg to rad)
            itemGroup.rotation.y = THREE.MathUtils.degToRad(-itemData.rotation);

            // Scale
            itemGroup.scale.setScalar(itemData.scale);
        });
    },

    // Outline selected object
    highlightObject(id) {
        // Reset all emissives
        for (const [key, group] of Object.entries(this.itemMeshes)) {
            group.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (key === id) {
                        child.material.emissive.setHex(0x555555); // slight glow
                    } else {
                        child.material.emissive.setHex(0x000000);
                    }
                }
            });
        }
    },

    // Updates a specific item's color dynamically
    updateItemColor(id, hexColor) {
        const group = this.itemMeshes[id];
        if (group) {

            // Find existing data in state
            const stateItem = window.App.state.currentDesign.items.find(i => i.id === id);
            if (stateItem) {
            
                const oldScale = group.scale.clone();
                const oldPos = group.position.clone();
                const oldRot = group.rotation.clone();

                this.furnitureGroup.remove(group);

                const newGroup = window.Furniture.createItem(stateItem.type, hexColor);
                newGroup.position.copy(oldPos);
                newGroup.rotation.copy(oldRot);
                newGroup.scale.copy(oldScale);

                this.furnitureGroup.add(newGroup);
                this.itemMeshes[id] = newGroup;

                this.highlightObject(id);
            }
        }
    },

    resize() {
        if (!this.camera || !this.renderer || !this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
};

window.Scene3D = Scene3D;
