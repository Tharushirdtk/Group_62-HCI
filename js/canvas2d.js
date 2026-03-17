const Canvas2D = {
    canvas: null,
    ctx: null,
    container: null,

    // Grid settings
    scale: 40, 
    offsetX: 0,
    offsetY: 0,

    // Interaction state
    isDragging: false,
    dragItem: null,
    dragStartPos: { x: 0, y: 0 },
    dragStartMouse: { x: 0, y: 0 },

    init(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        this.setupEvents();
    },

    resize() {
        if (!this.container || !this.canvas) return;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;

        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;

        this.draw();
    },

    setupEvents() {
        // Mouse Down
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert screen to world (meters)
            const worldX = (mouseX - this.offsetX) / this.scale;
            const worldZ = (mouseY - this.offsetY) / this.scale; 

            // Check collision with items (reverse order for top-most)
            const items = window.App.state.currentDesign.items;
            let hitId = null;

            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];

                // Simple circle/box collision config based on type (mocked as 1m radius logic)
                let sItemWidth = 0.6;
                let sItemDepth = 0.6;

                if (item.type === 'table') { sItemWidth = 1.6; sItemDepth = 0.9; }
                else if (item.type === 'sofa') { sItemWidth = 2.0; sItemDepth = 0.8; }
                else if (item.type === 'bed') { sItemWidth = 1.6; sItemDepth = 2.0; }
                else if (item.type === 'cupboard') { sItemWidth = 1.2; sItemDepth = 0.6; }
                else if (item.type === 'bookshelf') { sItemWidth = 1.0; sItemDepth = 0.3; }

                // Actual scaled visual bounds
                const w = (sItemWidth * item.scale * this.scale) / 2;
                const h = (sItemDepth * item.scale * this.scale) / 2;

                const cx = this.offsetX + item.x * this.scale;
                const cy = this.offsetY + item.z * this.scale;

                if (mouseX > cx - w && mouseX < cx + w &&
                    mouseY > cy - h && mouseY < cy + h) {
                    hitId = item.id;
                    break;
                }
            }

            if (hitId) {
                this.isDragging = true;
                this.dragItem = items.find(i => i.id === hitId);

                // Add undo history before drag
                if (window.Editor && typeof window.Editor.pushHistory === 'function') {
                    window.Editor.pushHistory();
                }

                // Select item globally
                window.Editor.selectItem(hitId);

                this.dragStartMouse = { x: mouseX, y: mouseY };
                this.dragStartPos = { x: this.dragItem.x, z: this.dragItem.z };
                this.canvas.style.cursor = 'grabbing';
            } else {
                window.Editor.selectItem(null);
            }
        });

        // Mouse Move
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.dragItem) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const dx = (mouseX - this.dragStartMouse.x) / this.scale;
            const dz = (mouseY - this.dragStartMouse.y) / this.scale;

            // Update state
            this.dragItem.x = this.dragStartPos.x + dx;
            this.dragItem.z = this.dragStartPos.z + dz;

            // Clamp to room bounds
            const room = window.App.state.currentDesign.room;
            const hw = room.width / 2;
            const hd = room.depth / 2;

            this.dragItem.x = Math.max(-hw, Math.min(hw, this.dragItem.x));
            this.dragItem.z = Math.max(-hd, Math.min(hd, this.dragItem.z));

            // Sync visual
            this.draw();
            window.Editor.syncScene();
        });

        // Mouse Up
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragItem = null;
                this.canvas.style.cursor = 'crosshair';
            }
        });
    },

    draw() {
        if (!this.ctx) return;
        const design = window.App.state.currentDesign;
        if (!design) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Room Floor
        const rw = design.room.width * this.scale;
        const rh = design.room.depth * this.scale; 
        const rx = this.offsetX - rw / 2;
        const ry = this.offsetY - rh / 2;

        this.ctx.fillStyle = design.room.colorFloor;
        this.ctx.fillRect(rx, ry, rw, rh);

        // Draw Wall Outlines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(rx, ry, rw, rh);

        // Draw Grid Overlay (1m spacing)
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Verticals
        for (let x = rx; x <= rx + rw; x += this.scale) {
            this.ctx.moveTo(x, ry); this.ctx.lineTo(x, ry + rh);
        }
        // Horizontals
        for (let y = ry; y <= ry + rh; y += this.scale) {
            this.ctx.moveTo(rx, y); this.ctx.lineTo(rx + rw, y);
        }
        this.ctx.stroke();

        // Draw Items Top Down
        design.items.forEach(item => {
            this.ctx.save();

            const cx = this.offsetX + item.x * this.scale;
            const cy = this.offsetY + item.z * this.scale;

            this.ctx.translate(cx, cy);
            this.ctx.rotate((item.rotation * Math.PI) / 180);

            // Shape based logic
            this.ctx.fillStyle = item.color;

            // Highlight if selected
            if (window.App.state.selectedItemId === item.id) {
                this.ctx.shadowColor = '#6366f1';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = '#555';
                this.ctx.lineWidth = 1;
            }

            // Approximate shapes based on procedural models
            let iw = 0.5 * item.scale * this.scale;
            let ih = 0.5 * item.scale * this.scale;

            if (item.type === 'table') {
                iw = 1.6 * item.scale * this.scale;
                ih = 0.9 * item.scale * this.scale;
            } else if (item.type === 'sofa') {
                iw = 2.0 * item.scale * this.scale;
                ih = 0.8 * item.scale * this.scale;
            } else if (item.type === 'bed') {
                iw = 1.6 * item.scale * this.scale;
                ih = 2.0 * item.scale * this.scale;
            } else if (item.type === 'cupboard') {
                iw = 1.2 * item.scale * this.scale;
                ih = 0.6 * item.scale * this.scale;
            } else if (item.type === 'bookshelf') {
                iw = 1.0 * item.scale * this.scale;
                ih = 0.3 * item.scale * this.scale;
            } else if (item.type === 'sidetable') {
                // Circle
                const r = 0.25 * item.scale * this.scale;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r * 0.2, 0, 2 * Math.PI);
                this.ctx.fill();

                this.ctx.restore();
                return; // Early return for circles
            }

            // Rectangles
            this.ctx.fillRect(-iw / 2, -ih / 2, iw, ih);
            this.ctx.strokeRect(-iw / 2, -ih / 2, iw, ih);

            // Draw directional indicator for rotation visual
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            if (item.type !== 'table') {
                this.ctx.fillRect(-iw / 2, ih / 2 - (0.1 * this.scale), iw, (0.1 * this.scale)); // backrest visual
            }

            this.ctx.restore();
        });
    }
};

window.Canvas2D = Canvas2D;
