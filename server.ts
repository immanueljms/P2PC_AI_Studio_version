import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/database';
import { wsManager } from './server/websocket';
import {
  authenticateJWT,
  AuthenticatedRequest,
  hashPassword,
  verifyPassword,
  generateToken
} from './server/auth';

const PORT = 3000;

// Hardcoded VRAM requirements in GB for the listed games
export const GAME_MIN_VRAM: Record<string, number> = {
  "Cyberpunk 2077": 8,
  "Elden Ring": 6,
  "Counter-Strike 2": 4,
  "Dota 2": 2,
  "Alan Wake 2": 12
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS middleware for localhost and general web interface
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Auth: Register
  app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields (username, password, role) are required' });
    }
    if (role !== 'host' && role !== 'player') {
      return res.status(400).json({ success: false, error: 'Role must be either "host" or "player"' });
    }

    try {
      const db = await getDb();
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Username already registered' });
      }

      const hashed = hashPassword(password);
      // Players start with 100 credits, hosts start with 0
      const initialCredits = role === 'player' ? 100.0 : 0.0;

      const result = await db.run(
        'INSERT INTO users (username, hashed_password, role, credits) VALUES (?, ?, ?, ?)',
        [username, hashed, role, initialCredits]
      );

      const userId = result.lastID;

      // If registered as host, auto-create an empty host profile for easy editing later
      if (role === 'host') {
        await db.run(
          'INSERT INTO host_profiles (user_id, gpu_model, vram_gb, upload_speed, price_per_hour, is_available) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, 'NVIDIA RTX 3060', 12, 100.0, 10.0, 0]
        );
      }

      return res.json({ success: true, data: { id: userId, username, role } });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message || 'Database error occurred' });
    }
  });

  // Auth: Login
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    try {
      const db = await getDb();
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user || !verifyPassword(password, user.hashed_password)) {
        return res.status(400).json({ success: false, error: 'Incorrect username or password' });
      }

      const token = generateToken({ id: user.id, username: user.username, role: user.role });
      return res.json({
        success: true,
        data: {
          access_token: token,
          token_type: 'bearer',
          role: user.role,
          username: user.username,
          credits: user.credits
        }
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message || 'Database error occurred' });
    }
  });

  // Get Current User (Me)
  app.get('/api/me', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    try {
      const db = await getDb();
      // Fetch latest credits
      const user = await db.get('SELECT id, username, role, credits FROM users WHERE id = ?', [req.user.id]);
      return res.json({ success: true, data: user });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Host: Get profile
  app.get('/api/host/profile', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user || req.user.role !== 'host') {
      return res.status(403).json({ success: false, error: 'Only hosts can access GPU configuration' });
    }

    try {
      const db = await getDb();
      const profile = await db.get('SELECT * FROM host_profiles WHERE user_id = ?', [req.user.id]);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Host profile not found' });
      }
      return res.json({ success: true, data: profile });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Host: Create / Update profile
  app.post('/api/host/profile', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user || req.user.role !== 'host') {
      return res.status(403).json({ success: false, error: 'Only hosts can customize profiles' });
    }

    const { gpu_model, vram_gb, upload_speed, price_per_hour, is_available } = req.body;
    if (!gpu_model || vram_gb === undefined || upload_speed === undefined || price_per_hour === undefined) {
      return res.status(400).json({ success: false, error: 'All configuration parameters are required' });
    }

    try {
      const db = await getDb();
      const availableVal = is_available ? 1 : 0;

      const profile = await db.get('SELECT id FROM host_profiles WHERE user_id = ?', [req.user.id]);
      if (profile) {
        await db.run(
          `UPDATE host_profiles 
           SET gpu_model = ?, vram_gb = ?, upload_speed = ?, price_per_hour = ?, is_available = ? 
           WHERE user_id = ?`,
          [gpu_model, vram_gb, upload_speed, price_per_hour, availableVal, req.user.id]
        );
      } else {
        await db.run(
          `INSERT INTO host_profiles (user_id, gpu_model, vram_gb, upload_speed, price_per_hour, is_available) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user.id, gpu_model, vram_gb, upload_speed, price_per_hour, availableVal]
        );
      }

      return res.json({ success: true, message: 'Profile updated successfully' });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message || 'Database error occurred' });
    }
  });

  // Player: Get available hosts (with optional game-based VRAM requirements check)
  app.get('/api/hosts', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const { game } = req.query;
    let minVram = 0;

    if (game && typeof game === 'string') {
      const reqVram = GAME_MIN_VRAM[game];
      if (reqVram) {
        minVram = reqVram;
      }
    }

    try {
      const db = await getDb();
      const hosts = await db.all(
        `SELECT hp.*, u.username, u.credits as host_credits
         FROM host_profiles hp
         JOIN users u ON hp.user_id = u.id
         WHERE hp.is_available = 1 AND hp.vram_gb >= ?`,
        [minVram]
      );

      return res.json({ success: true, data: hosts });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Active session router - find active session for user
  app.get('/api/sessions/active', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(412).json({ success: false });

    try {
      const db = await getDb();
      const activeSession = await db.get(
        `SELECT s.*, 
                pu.username as player_username, 
                hu.username as host_username,
                hp.gpu_model, hp.price_per_hour
         FROM sessions s
         JOIN users pu ON s.player_id = pu.id
         JOIN users hu ON s.host_id = hu.id
         JOIN host_profiles hp ON s.host_id = hp.user_id
         WHERE (s.player_id = ? OR s.host_id = ?) AND s.status = 'active'
         ORDER BY s.id DESC LIMIT 1`,
        [req.user.id, req.user.id]
      );

      if (!activeSession) {
        return res.json({ success: true, data: null });
      }

      return res.json({ success: true, data: activeSession });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Player & Host: Get historical sessions
  app.get('/api/sessions/history', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(412);
    try {
      const db = await getDb();
      const history = await db.all(
        `SELECT s.*, 
                pu.username as player_username, 
                hu.username as host_username,
                hp.gpu_model
         FROM sessions s
         JOIN users pu ON s.player_id = pu.id
         JOIN users hu ON s.host_id = hu.id
         JOIN host_profiles hp ON s.host_id = hp.user_id
         WHERE (s.player_id = ? OR s.host_id = ?) AND s.status != 'active'
         ORDER BY s.id DESC`,
        [req.user.id, req.user.id]
      );
      return res.json({ success: true, data: history });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Book a session
  app.post('/api/sessions/book', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ success: false, error: 'Only players can book host GPUs' });
    }

    const { host_id, game_name } = req.body;
    if (!host_id || !game_name) {
      return res.status(400).json({ success: false, error: 'Host ID and Game Name are required' });
    }

    try {
      const db = await getDb();

      // Check current active session for player
      const activePlayerSession = await db.get(
        "SELECT id FROM sessions WHERE player_id = ? AND status = 'active'",
        [req.user.id]
      );
      if (activePlayerSession) {
        return res.status(400).json({ success: false, error: 'You already have an active game session' });
      }

      // Verify selected host exists and is available
      const hostProfile = await db.get(
        'SELECT * FROM host_profiles WHERE user_id = ? AND is_available = 1',
        [host_id]
      );
      if (!hostProfile) {
        return res.status(400).json({ success: false, error: 'Host is currently offline or rented' });
      }

      // Verify player has enough starting credits (at least 1 hour fee)
      if (req.user.credits < hostProfile.price_per_hour) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. You need at least ${hostProfile.price_per_hour} credits to rent this GPU.`
        });
      }

      // Set host state as unavailable
      await db.run('UPDATE host_profiles SET is_available = 0 WHERE user_id = ?', [host_id]);

      // Register session
      const startTimeISO = new Date().toISOString();
      const result = await db.run(
        `INSERT INTO sessions (host_id, player_id, game_name, status, start_time, total_cost) 
         VALUES (?, ?, ?, 'active', ?, 0.0)`,
        [host_id, req.user.id, game_name, startTimeISO]
      );

      const sessionId = result.lastID;

      // Broadcast update to host and player
      wsManager.broadcastSessionUpdate(host_id, req.user.id, {
        type: 'SESSION_STARTED',
        session_id: sessionId,
        game_name,
        host_id,
        player_id: req.user.id
      });

      return res.json({
        success: true,
        data: {
          id: sessionId,
          host_id,
          player_id: req.user.id,
          game_name,
          status: 'active',
          start_time: startTimeISO
        }
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // End / Complete a session
  app.post('/api/sessions/:session_id/complete', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const { session_id } = req.params;
    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    try {
      const db = await getDb();
      const session = await db.get('SELECT * FROM sessions WHERE id = ?', [session_id]);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      if (session.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Session is already closed' });
      }

      // Calculate elapsed credit cost
      const startTime = new Date(session.start_time).getTime();
      const nowTime = Date.now();
      const durationMs = nowTime - startTime;

      // For a highly interactive and quick MVP experience, we treat
      // "10 seconds of real-time as 1 hour of game-time" OR simply
      // use standard actual time with a minimum charge.
      // Let's do: 1 second of streaming = 1 minute of game-time.
      // Meaning 60 seconds = 1 hour. This makes credit updates super interactive!
      const secondsPassed = Math.floor(durationMs / 1000);
      const simulatedHours = Math.max(0.1, secondsPassed / 60);

      const hostProfile = await db.get('SELECT price_per_hour FROM host_profiles WHERE user_id = ?', [session.host_id]);
      if (!hostProfile) {
        return res.status(404).json({ success: false, error: 'Host profile database reference missing' });
      }

      // Calculate fee
      const calculatedCost = Number((simulatedHours * hostProfile.price_per_hour).toFixed(2));

      // Retrieve host and player accounts
      const player = await db.get('SELECT credits FROM users WHERE id = ?', [session.player_id]);
      const host = await db.get('SELECT credits FROM users WHERE id = ?', [session.host_id]);

      if (!player) {
         return res.status(404).json({ success: false, error: 'Player user not found' });
      }

      // Ensure player credits don't go negative or clip
      const finalCost = Math.min(player.credits, calculatedCost);

      const playerNewCredits = Math.max(0, player.credits - finalCost);
      const hostNewCredits = (host?.credits || 0) + finalCost;

      // Update database values inside a safe batch
      await db.run('BEGIN TRANSACTION;');
      await db.run(
        `UPDATE sessions 
         SET status = 'completed', end_time = ?, total_cost = ? 
         WHERE id = ?`,
        [new Date(nowTime).toISOString(), finalCost, session_id]
      );
      await db.run('UPDATE users SET credits = ? WHERE id = ?', [playerNewCredits, session.player_id]);
      await db.run('UPDATE users SET credits = ? WHERE id = ?', [hostNewCredits, session.host_id]);
      await db.run('UPDATE host_profiles SET is_available = 1 WHERE user_id = ?', [session.host_id]);
      await db.run('COMMIT;');

      // WebSocket broadcast session ended notification
      wsManager.broadcastSessionUpdate(session.host_id, session.player_id, {
        type: 'SESSION_ENDED',
        session_id: Number(session_id),
        total_cost: finalCost,
        duration_minutes: Math.ceil(simulatedHours * 60)
      });

      return res.json({
        success: true,
        data: {
          session_id,
          final_cost: finalCost,
          duration_minutes: Math.ceil(simulatedHours * 60)
        }
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Setup Vite Dev server middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static files serve
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind WebSockets on the same HTTP Server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    const match = pathname.match(/^\/ws\/(\d+)/);
    if (match) {
      const userId = parseInt(match[1]);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wsManager.connect(userId, ws);
        
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.targetId) {
              wsManager.sendToUser(data.targetId, {
                type: data.type,
                senderId: userId,
                payload: data.payload
              });
            }
          } catch (e) {
            console.error('WebSocket parsing error:', e);
          }
        });

        ws.on('close', () => {
          wsManager.disconnect(userId);
        });
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`P2PC Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

// Start full-stack server
startServer().catch((e) => {
  console.error('Fatal Server Boot Error:', e);
});
