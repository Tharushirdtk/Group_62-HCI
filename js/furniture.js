const getMaterial = (colorStr) => {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorStr),
        roughness: 0.7,
        metalness: 0.1
    });
};

const FurnitureBuilder = {
    // Helper to create a basic meshed primitive
    createBox: function (w, h, d, material) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    },

    createCylinder: function (rTop, rBottom, h, rSeg, material) {
        const geo = new THREE.CylinderGeometry(rTop, rBottom, h, rSeg);
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    },

    /**
     * Chair Model
     * Composed of: 4 legs, 1 seat, 1 backrest
     */
    buildChair: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);

        const seatW = 0.5;
        const seatD = 0.5;
        const seatH = 0.05;
        const legH = 0.45;
        const legW = 0.04;

        // Seat 
        const seat = this.createBox(seatW, seatH, seatD, mat);
        seat.position.y = legH + seatH / 2;
        group.add(seat);

        // Legs
        const legOffsets = [
            [-seatW / 2 + legW / 2, -seatD / 2 + legW / 2],
            [seatW / 2 - legW / 2, -seatD / 2 + legW / 2],
            [-seatW / 2 + legW / 2, seatD / 2 - legW / 2],
            [seatW / 2 - legW / 2, seatD / 2 - legW / 2]
        ];

        legOffsets.forEach(pos => {
            const leg = this.createBox(legW, legH, legW, mat);
            leg.position.set(pos[0], legH / 2, pos[1]);
            group.add(leg);
        });

        // Backrest
        const backH = 0.5;
        const backrest = this.createBox(seatW, backH, legW, mat);
        backrest.position.set(0, legH + seatH + backH / 2, -seatD / 2 + legW / 2);
        group.add(backrest);

        return group;
    },

    /**
     * Table Model
     * Composed of: 4 legs, 1 large top
     */
    buildTable: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);

        const topW = 1.6;
        const topD = 0.9;
        const topH = 0.05;
        const legH = 0.75;
        const legW = 0.06;

        // Top
        const top = this.createBox(topW, topH, topD, mat);
        top.position.y = legH + topH / 2;
        group.add(top);

        // Legs
        const legOffsets = [
            [-topW / 2 + legW, -topD / 2 + legW],
            [topW / 2 - legW, -topD / 2 + legW],
            [-topW / 2 + legW, topD / 2 - legW],
            [topW / 2 - legW, topD / 2 - legW]
        ];

        legOffsets.forEach(pos => {
            // Use cylinders for table legs to differentiate from chair
            const leg = this.createCylinder(legW / 2, legW / 3, legH, 16, mat);
            leg.position.set(pos[0], legH / 2, pos[1]);
            group.add(leg);
        });

        return group;
    },

    /**
     * Sofa Model
     * Composed of: Base, 2 armrests, backrest, cushions
     */
    buildSofa: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);
        const cushionMat = getMaterial(this.lightenColor(color, 20)); 

        const width = 2.0;
        const depth = 0.8;
        const baseH = 0.2;
        const armW = 0.2;
        const armH = 0.6;
        const backH = 0.7;

        // Base
        const base = this.createBox(width, baseH, depth, mat);
        base.position.y = baseH / 2 + 0.05;
        group.add(base);

        // 4 tiny legs
        const legOffsets = [
            [-width / 2 + 0.1, -depth / 2 + 0.1],
            [width / 2 - 0.1, -depth / 2 + 0.1],
            [-width / 2 + 0.1, depth / 2 - 0.1],
            [width / 2 - 0.1, depth / 2 - 0.1]
        ];
        legOffsets.forEach(pos => {
            const leg = this.createCylinder(0.04, 0.02, 0.05, 8, getMaterial('#333333'));
            leg.position.set(pos[0], 0.025, pos[1]);
            group.add(leg);
        });

        // Armrests
        const leftArm = this.createBox(armW, armH, depth, mat);
        leftArm.position.set(-width / 2 + armW / 2, armH / 2 + 0.05, 0);
        group.add(leftArm);

        const rightArm = this.createBox(armW, armH, depth, mat);
        rightArm.position.set(width / 2 - armW / 2, armH / 2 + 0.05, 0);
        group.add(rightArm);

        // Backrest
        const backrest = this.createBox(width - armW * 2, backH, 0.2, mat);
        backrest.position.set(0, backH / 2 + 0.05, -depth / 2 + 0.1);
        group.add(backrest);

        // Cushions (2 seater sofa)
        const cushionW = (width - armW * 2) / 2 - 0.02;
        const cushionD = depth - 0.2;
        const cushionH = 0.15;

        const c1 = this.createBox(cushionW, cushionH, cushionD, cushionMat);
        c1.position.set(-cushionW / 2, baseH + cushionH / 2 + 0.05, 0.1);
        group.add(c1);

        const c2 = this.createBox(cushionW, cushionH, cushionD, cushionMat);
        c2.position.set(cushionW / 2, baseH + cushionH / 2 + 0.05, 0.1);
        group.add(c2);

        return group;
    },

    /**
     * Side Table Model
     * Small, round top, single central pillar base
     */
    buildSideTable: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);

        const radius = 0.25;
        const height = 0.5;

        // Base plate
        const base = this.createCylinder(0.15, 0.15, 0.02, 16, mat);
        base.position.y = 0.01;
        group.add(base);

        // Pillar
        const pillar = this.createCylinder(0.03, 0.03, height - 0.04, 8, mat);
        pillar.position.y = height / 2;
        group.add(pillar);

        // Top
        const top = this.createCylinder(radius, radius, 0.03, 32, mat);
        top.position.y = height - 0.015;
        group.add(top);

        return group;
    },

    /**
     * Bed Model
     * Composed of: Mattress, Frame/Base, Headboard, Pillows
     */
    buildBed: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);
        const mattressMat = getMaterial('#ffffff'); 
        const pillowMat = getMaterial(this.lightenColor(color, 20));

        const width = 1.6;
        const depth = 2.0;
        const frameH = 0.2;
        const mattressH = 0.15;
        const headboardH = 0.8;

        // Base frame
        const frame = this.createBox(width, frameH, depth, mat);
        frame.position.y = frameH / 2;
        group.add(frame);

        // Mattress
        const mattress = this.createBox(width - 0.05, mattressH, depth - 0.05, mattressMat);
        mattress.position.y = frameH + mattressH / 2;
        group.add(mattress);

        // Headboard
        const headboard = this.createBox(width, headboardH, 0.1, mat);
        headboard.position.set(0, headboardH / 2, -depth / 2 + 0.05);
        group.add(headboard);

        // 2 Pillows
        const pillowW = 0.6;
        const pillowD = 0.3;
        const pillowH = 0.08;

        const p1 = this.createBox(pillowW, pillowH, pillowD, pillowMat);
        p1.position.set(-width / 4, frameH + mattressH + pillowH / 2, -depth / 2 + 0.3);
        group.add(p1);

        const p2 = this.createBox(pillowW, pillowH, pillowD, pillowMat);
        p2.position.set(width / 4, frameH + mattressH + pillowH / 2, -depth / 2 + 0.3);
        group.add(p2);

        return group;
    },

    /**
     * Cupboard Model (Wardrobe)
     * Tall, large rectangular block with doors
     */
    buildCupboard: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);
        const darkMat = getMaterial('#222222');

        const width = 1.2;
        const depth = 0.6;
        const height = 2.0;

        // Main body
        const body = this.createBox(width, height, depth, mat);
        body.position.y = height / 2;
        group.add(body);

        // Vertical split for doors (visual trick)
        const split = this.createBox(0.02, height - 0.1, 0.01, darkMat);
        split.position.set(0, height / 2, depth / 2 + 0.005);
        group.add(split);

        // Handles
        const handle1 = this.createBox(0.03, 0.2, 0.03, getMaterial('#aaaaaa'));
        handle1.position.set(-0.05, height / 2, depth / 2 + 0.02);
        group.add(handle1);

        const handle2 = this.createBox(0.03, 0.2, 0.03, getMaterial('#aaaaaa'));
        handle2.position.set(0.05, height / 2, depth / 2 + 0.02);
        group.add(handle2);

        return group;
    },

    /**
     * Bookshelf Model
     * Open shelves
     */
    buildBookshelf: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);

        const width = 1.0;
        const depth = 0.3;
        const height = 1.8;
        const thick = 0.05;

        // Sides
        const leftSide = this.createBox(thick, height, depth, mat);
        leftSide.position.set(-width / 2 + thick / 2, height / 2, 0);
        group.add(leftSide);

        const rightSide = this.createBox(thick, height, depth, mat);
        rightSide.position.set(width / 2 - thick / 2, height / 2, 0);
        group.add(rightSide);

        // Shelves
        const numShelves = 5;
        const spacing = height / numShelves;
        for (let i = 0; i <= numShelves; i++) {
            const shelf = this.createBox(width - thick * 2, thick, depth, mat);
            shelf.position.set(0, i * spacing + thick / 2, 0);
            group.add(shelf);
        }

        // Back panel
        const back = this.createBox(width, height, 0.02, mat);
        back.position.set(0, height / 2, -depth / 2 + 0.01);
        group.add(back);

        return group;
    },

    /**
     * TV Stand with TV Model
     * Wide low stand with a large flat panel TV on top
     */
    buildTvStand: function (color) {
        const group = new THREE.Group();
        const mat = getMaterial(color);
        const tvMat = getMaterial('#111111'); // Dark plastic/screen
        const screenMat = getMaterial('#050505'); // Darker screen

        const standW = 1.4;
        const standD = 0.4;
        const standH = 0.4;

        // Stand base
        const stand = this.createBox(standW, standH, standD, mat);
        stand.position.y = standH / 2;
        group.add(stand);

        // TV Base/Neck
        const neck = this.createCylinder(0.04, 0.08, 0.1, 16, tvMat);
        neck.position.y = standH + 0.05;
        group.add(neck);

        // TV Body
        const tvW = 1.2;
        const tvH = 0.7;
        const tvD = 0.05;
        const tv = this.createBox(tvW, tvH, tvD, tvMat);
        tv.position.set(0, standH + 0.1 + tvH / 2, 0);
        group.add(tv);

        // TV Screen overlay
        const screen = this.createBox(tvW - 0.04, tvH - 0.04, 0.01, screenMat);
        screen.position.set(0, standH + 0.1 + tvH / 2, tvD / 2 + 0.005);
        group.add(screen);

        return group;
    },

    // Main factory function
    createItem: function (type, color = '#ffffff') {
        let group;
        const builder = FurnitureBuilder;

        switch (type) {
            case 'chair': group = builder.buildChair(color); break;
            case 'table': group = builder.buildTable(color); break;
            case 'sofa': group = builder.buildSofa(color); break;
            case 'sidetable': group = builder.buildSideTable(color); break;
            case 'bed': group = builder.buildBed(color); break;
            case 'cupboard': group = builder.buildCupboard(color); break;
            case 'bookshelf': group = builder.buildBookshelf(color); break;
            case 'tvstand': group = builder.buildTvStand(color); break;
            default: group = builder.createBox(0.5, 0.5, 0.5, getMaterial(color)); 
        }

        // Add a bounding box helper logically for picking later
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());

        // Store logical dimensions inside userData for 2D sync and collision
        group.userData = {
            width: size.x,
            height: size.y,
            depth: size.z,
            type: type
        };

        return group;
    },

    // Helper for generating slightly varied colors for cushions/details
    lightenColor: function (colorStr, percent) {
        let num = parseInt(colorStr.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            B = (num >> 8 & 0x00FF) + amt,
            G = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    }
};

window.Furniture = FurnitureBuilder;
