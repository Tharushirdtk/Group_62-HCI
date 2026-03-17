# RoomCraft - 2D/3D Furniture Design App

RoomCraft is a browser-based interactive room design application built for HCI and computer graphics coursework. It supports designer authentication, room setup, 2D layout editing, and live 3D visualization with procedural furniture models.

## ✅ What this project implements

- Designer user management (register, login, logout)
- Room specifications (width, depth, floor and wall colors)
- Add furniture items (chair, table, sofa, side table, bed, cupboard, bookshelf, TV stand)
- Drag and place furniture in 2D layout
- Real-time 3D rendering via Three.js with shading/shadow toggle
- Item transformations: scale, rotation, color
- Save, edit, and delete designs in browser localStorage
- Undo last action (Ctrl+Z or Undo button)
- User feedback, error checks, and accessibility support

## 📁 Project structure

- `index.html` - main UI template and layout
- `css/style.css` - styling for views and components
- `js/storage.js` - localStorage backend logic and CRUD operations
- `js/app.js` - app routing, login/dashboard flow, UI transitions
- `js/editor.js` - editor controls, design state sync, undo, save
- `js/canvas2d.js` - 2D canvas rendering and drag interactions
- `js/scene3d.js` - Three.js 3D scene, room and furniture rendering
- `js/furniture.js` - procedural 3D furniture models

## 🚀 Run locally

1. Open terminal in project folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open browser at the URL shown (e.g. http://localhost:5173)

## 🧪 Usage walkthrough

1. Register as a designer (any username/password)
2. Create a new Room design (Living, Bed, or New Room)
3. In editor:
   - Set room width, depth, colors
   - Add furniture from sidebar
   - Drag in 2D to move
   - Use scale/rotation/color controls
4. Toggle shading in 3D to view lighting
5. Save design; return to dashboard to edit/delete

## 🧠 HCI/design principles applied

- Consistent layout and clear labels
- Immediate feedback (toast messages, modal confirmations)
- Undo and confirmation on risky actions
- Accessible controls: button roles, keyboard interactions, visible focus styles
- Low cognitive load with grouped controls and clear sections

## ✅ Final cleanup

- Remove generated `dist/` before final packaging
- Do not include `node_modules/` in final upload

## 📌 License

MIT
