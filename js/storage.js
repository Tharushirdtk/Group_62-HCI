const STORAGE_KEY = 'roomio_designs_v1';
const CURRENT_USER_KEY = 'roomio_current_user';
const USERS_KEY = 'roomio_users';

const Storage = {
    // Auth
    register(username, password) {
        const users = this.getUsers();
        if (users[username]) {
            return { success: false, message: 'Username already exists' };
        }
        users[username] = { password }; 
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        this.loginWithoutCheck(username); 
        return { success: true };
    },

    login(username, password) {
        const users = this.getUsers();
        if (!users[username]) {
            return { success: false, message: 'User not found' };
        }
        if (users[username].password !== password) {
            return { success: false, message: 'Incorrect password' };
        }
        this.loginWithoutCheck(username);
        return { success: true };
    },

    loginWithoutCheck(username) {
        localStorage.setItem(CURRENT_USER_KEY, username);
        return username;
    },

    getUsers() {
        const data = localStorage.getItem(USERS_KEY);
        try {
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Failed to parse users", e);
            return {};
        }
    },

    logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser() {
        return localStorage.getItem(CURRENT_USER_KEY);
    },

    // Designs CRUD
    getAllDesigns() {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Failed to parse storage", e);
            return {};
        }
    },

    getUserDesigns(username) {
        const allDesigns = this.getAllDesigns();
        if (!allDesigns[username]) {
            allDesigns[username] = [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allDesigns));
        }
        return allDesigns[username];
    },

    saveDesign(username, designData) {
        const allDesigns = this.getAllDesigns();
        if (!allDesigns[username]) allDesigns[username] = [];

        // If it's an update, replace the existing one
        const existingIndex = allDesigns[username].findIndex(d => d.id === designData.id);

        designData.updatedAt = new Date().toISOString();

        if (existingIndex >= 0) {
            allDesigns[username][existingIndex] = designData;
        } else {
            // New design
            designData.id = Date.now().toString();
            designData.createdAt = designData.updatedAt;
            allDesigns[username].push(designData);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allDesigns));
        return designData.id;
    },

    getDesign(username, designId) {
        const userDesigns = this.getUserDesigns(username);
        return userDesigns.find(d => d.id === designId);
    },

    deleteDesign(username, designId) {
        const allDesigns = this.getAllDesigns();
        if (!allDesigns[username]) return false;

        allDesigns[username] = allDesigns[username].filter(d => d.id !== designId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allDesigns));
        return true;
    },

    // Default empty design blueprint
    createEmptyDesign() {
        return {
            id: null,
            type: 'all',
            name: 'Untitled Design',
            room: {
                width: 5,
                depth: 5, 
                colorFloor: '#bbbbbb',
                colorWall: '#e0e0e0'
            },
            items: [] 
        };
    },

    // Preconfigured Living Room template (Empty Room)
    createLivingRoomDesign() {
        return {
            id: null,
            type: 'living_room',
            name: 'Living Room Design',
            room: {
                width: 6,
                depth: 5,
                colorFloor: '#bbbbbb',
                colorWall: '#e0e0e0'
            },
            items: []
        };
    },

    // Preconfigured Bedroom template (Empty Room)
    createBedRoomDesign() {
        return {
            id: null,
            type: 'bed_room',
            name: 'Bedroom Design',
            room: {
                width: 4,
                depth: 4,
                colorFloor: '#bbbbbb',
                colorWall: '#e0e0e0'
            },
            items: []
        };
    }
};
