const Editor = {
    initialized: false,
    history: [],
    maxHistory: 35,

    captureState() {
        return JSON.parse(JSON.stringify(window.App.state.currentDesign));
    },

    pushHistory() {
        const snapshot = this.captureState();
        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    },

    clearHistory() {
        this.history = [];
    },

    undo() {
        if (this.history.length === 0) {
            window.App.toast('Nothing to undo.');
            return;
        }

        const previous = this.history.pop();
        window.App.state.currentDesign = JSON.parse(JSON.stringify(previous));
        this.loadStateIntoUI();
        window.App.toast('Undo applied.');
    },

    init() {
        if (window.Canvas2D) window.Canvas2D.init('canvas-2d', 'canvas-2d-container');
        if (window.Scene3D) window.Scene3D.init('canvas-3d-container');

        this.clearHistory();
        this.bindEvents();
    },

    bindEvents() {
        // Room Dimensions
        document.getElementById('room-width').addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val) || val <= 1) {
                window.App.toast('Room width must be greater than 1m.');
                return;
            }
            this.pushHistory();
            window.App.state.currentDesign.room.width = val;
            this.syncRoom();
        });
        document.getElementById('room-depth').addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val) || val <= 1) {
                window.App.toast('Room depth must be greater than 1m.');
                return;
            }
            this.pushHistory();
            window.App.state.currentDesign.room.depth = val;
            this.syncRoom();
        });

        // Room Colors
        document.getElementById('color-floor').addEventListener('input', (e) => {
            this.pushHistory();
            window.App.state.currentDesign.room.colorFloor = e.target.value;
            this.syncRoom();
        });
        document.getElementById('color-wall').addEventListener('input', (e) => {
            this.pushHistory();
            window.App.state.currentDesign.room.colorWall = e.target.value;
            this.syncRoom();
        });

        // Add Furniture Buttons
        document.querySelectorAll('.furniture-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.addItem(type);
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.addItem(btn.dataset.type);
                }
            });
        });

        // Shading Toggle
        document.getElementById('toggle-shading').addEventListener('change', (e) => {
            if (window.Scene3D) window.Scene3D.toggleShading(e.target.checked);
        });

        // Save Button
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveDesign();
        });

        document.getElementById('btn-undo')?.addEventListener('click', () => {
            this.undo();
        });

        // Inspector Controls
        document.getElementById('btn-delete-item').addEventListener('click', () => {
            this.pushHistory();
            this.deleteSelectedItem();
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undo();
            }
        });

        document.getElementById('item-scale').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('scale-val').textContent = val.toFixed(1);
            this.updateSelectedItem('scale', val);
        });

        document.getElementById('item-rotation').addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            document.getElementById('rot-val').textContent = val;
            this.updateSelectedItem('rotation', val);
        });

        document.getElementById('item-color').addEventListener('input', (e) => {
            this.updateSelectedItem('color', e.target.value);
            if (window.Scene3D) window.Scene3D.updateItemColor(window.App.state.selectedItemId, e.target.value);
        });
    },

    addItem(type) {
        this.pushHistory();
        const colors = {
            chair: '#e63946',
            table: '#a8dadc',
            sofa: '#457b9d',
            sidetable: '#1d3557',
            bed: '#8ecae6',
            cupboard: '#b5838d',
            bookshelf: '#e5989b',
            tvstand: '#4a4e69'
        };

        const newItem = {
            id: 'item_' + Date.now(),
            type: type,
            x: 0, 
            z: 0,
            rotation: 0,
            scale: 1,
            color: colors[type] || '#ffffff'
        };

        window.App.state.currentDesign.items.push(newItem);
        this.selectItem(newItem.id);
        this.syncScene();
    },

    selectItem(id) {
        window.App.state.selectedItemId = id;

        const inspector = document.getElementById('inspector-panel');

        if (id) {
            const item = window.App.state.currentDesign.items.find(i => i.id === id);
            if (item) {
                // Populate inspector values
                document.getElementById('item-scale').value = item.scale;
                document.getElementById('scale-val').textContent = item.scale.toFixed(1);

                document.getElementById('item-rotation').value = item.rotation;
                document.getElementById('rot-val').textContent = item.rotation;

                document.getElementById('item-color').value = item.color;

                inspector.classList.remove('hidden');
            }
        } else {
            inspector.classList.add('hidden');
        }

        // Send visual cues to rendering engines
        if (window.Canvas2D) window.Canvas2D.draw();
        if (window.Scene3D) window.Scene3D.highlightObject(id);
    },

    updateSelectedItem(prop, value) {
        const id = window.App.state.selectedItemId;
        if (!id) return;

        const item = window.App.state.currentDesign.items.find(i => i.id === id);
        if (item) {
            this.pushHistory();
            item[prop] = value;
            if (prop !== 'color') {
                this.syncScene();
            } else {
                if (window.Canvas2D) window.Canvas2D.draw();
                if (window.Scene3D) window.Scene3D.updateItemColor(id, item.color);
            }
        }
    },

    deleteSelectedItem() {
        const id = window.App.state.selectedItemId;
        if (!id) return;

        const state = window.App.state.currentDesign;
        state.items = state.items.filter(i => i.id !== id);

        this.selectItem(null);
        this.syncScene();
    },

    syncRoom() {
        const room = window.App.state.currentDesign.room;
        if (window.Scene3D) window.Scene3D.buildRoom(room.width, room.depth, room.colorFloor, room.colorWall);
        if (window.Canvas2D) window.Canvas2D.draw();
    },

    syncScene() {
        const state = window.App.state.currentDesign;
        if (!state) return;

        // Sync 3D
        if (window.Scene3D) window.Scene3D.updateFurniture(state.items);

        // Sync 2D
        if (window.Canvas2D) window.Canvas2D.draw();
    },

    loadStateIntoUI() {
        const state = window.App.state.currentDesign;
        if (!state) return;

        // Auto-fix legacy designs that might not have a type or have 'all' as type
        if (!state.type || state.type === 'all') {
            const lowerName = (state.name || '').toLowerCase();
            if (lowerName.includes('living')) {
                state.type = 'living_room';
            } else if (lowerName.includes('bed')) {
                state.type = 'bed_room';
            }
        }

        document.getElementById('design-name').value = state.name;
        document.getElementById('room-width').value = state.room.width;
        document.getElementById('room-depth').value = state.room.depth;
        document.getElementById('color-floor').value = state.room.colorFloor;
        document.getElementById('color-wall').value = state.room.colorWall;

        this.filterFurniture(state.type);
        this.selectItem(null); 
        this.syncRoom();
        this.syncScene();

        // Establish undo baseline for this design
        this.clearHistory();
        this.pushHistory();
    },

    filterFurniture(roomType) {
        const allowedLiving = ['sofa', 'table', 'chair', 'bookshelf', 'tvstand', 'sidetable'];
        const allowedBed = ['bed', 'sidetable', 'cupboard', 'chair', 'table', 'bookshelf', 'tvstand'];

        document.querySelectorAll('.furniture-item').forEach(el => {
            const type = el.dataset.type;

            if (roomType === 'living_room') {
                el.style.display = allowedLiving.includes(type) ? 'flex' : 'none';
            } else if (roomType === 'bed_room') {
                el.style.display = allowedBed.includes(type) ? 'flex' : 'none';
            } else {
                // Show all if type is missing or 'all'
                el.style.display = 'flex';
            }
        });
    },

    saveDesign() {
        const state = window.App.state.currentDesign;
        if (!state) {
            window.App.toast('No design loaded.');
            return;
        }
        const room = state.room;
        if (!room || room.width < 2 || room.depth < 2) {
            window.App.toast('Please set room dimensions to at least 2m each.');
            return;
        }

        state.name = document.getElementById('design-name').value.trim() || 'Untitled Design';
        if (state.name.length > 60) {
            window.App.toast('Design name too long (max 60 chars).');
            return;
        }

        try {
            const id = Storage.saveDesign(window.App.state.currentUser, state);
            state.id = id;
            window.App.toast('Design saved successfully!');
        } catch (err) {
            console.error(err);
            window.App.toast('Failed to save design. Try again.');
        }
    }
};

window.Editor = Editor;

window.initEditorUI = () => {
    // Only bind events and initialize scenes once
    if (!Editor.initialized) {
        Editor.init();
        Editor.initialized = true;
    }
    Editor.loadStateIntoUI();
};
