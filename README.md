# P2PC - Peer-to-Peer GPU Cloud Gaming Platform

P2PC is a decentralized cloud gaming MVP where hosts with gaming rigs (hosts) can rent out their GPU power to players who want to stream and play games remotely (similar to GeForce NOW, but peer-to-peer). 

Built as a complete full-stack application using **Node.js, Express, React, TypeScript, Tailwind CSS, SQLite, and WebSockets**.

---

## 🚀 Key Features

* **Role-Based Authentication**: Secure registration/login for **Hosts** and **Players** with JWT state management saved in local storage.
  * **Players** start with a default balance of **100.00 credits** to book dynamic rig connections.
  * **Hosts** rent out compute devices and earn credit assets.
* **Matchmaking & VRAM Allocation Filter**: Automated matchmaking queries where players select high-intensity gaming software (`Cyberpunk 2077`, `Elden Ring`, etc.) and the engine automatically checks minimum VRAM specifications (e.g., 8GB vs 12GB VRAM limits) to retrieve qualified hosts.
* **Immersive Streaming Simulator HUD**: Once booked, player and host connect to a dedicated **Session HUD**. Displays real-time rendering statistics, 60fps compression bitrates, interactive delay feedback overlays (simulated roundtrip latency: 12-28ms), and captured input streams.
* **Realistic Dynamic Credit Settlement**: Built with an interactive settlement engine where **1 second of real-time rental simulates 1 minute on the server**. This allows you to experience credit transfers and transaction completions instantly!
* **Robust WebSockets Tracking**: Synchronizes session status updates globally across multiple consoles, dispatching state changes to both host and player immediately.

---

## 🛠️ Architecture and Stack

* **Backend Routing**: `server.ts` handles API endpoints and upgrades incoming HTTP connections to WebSockets natively. Integrated seamlessly as a production-bundled file `dist/server.cjs` via `esbuild`.
* **Database Persistency**: Runs file-supported relational SQLite under `database.ts` generating `p2pc.db` schema structures instantly. No external server provisioning required.
* **Frontend Controller**: React (with standard named imports and TypeScript) integrated with a modern Tailwind clean visual theme. Fully responsive layout utilizing customizable display sizes.

---

## 🎮 Setup & Verification

1. **Install Base Packages**:
   ```bash
   npm install
   ```
2. **Execute Full-Stack Sandbox**:
   ```bash
   npm run dev
   ```
   *Bootstraps the Express backend and Vite frontend pipelines on the externally open container Port 3000.*

3. **Verify Bundle Integrity**:
   ```bash
   npm run build
   ```
   *Creates optimized static browser pages and bundles backend server paths inside the CJS-compatible `dist/` directory safely.*
