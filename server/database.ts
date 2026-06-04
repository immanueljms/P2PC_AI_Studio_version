import { createClient } from '@libsql/client';

export interface Database {
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    const client = createClient({
      url: 'file:p2pc.db'
    });
    
    dbInstance = {
      run: async (sql, params = []) => {
        const result = await client.execute({ sql, args: params });
        return { 
          lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined, 
          changes: result.rowsAffected 
        };
      },
      get: async (sql, params = []) => {
        const result = await client.execute({ sql, args: params });
        if (result.rows.length > 0) {
           const row = result.rows[0];
           // Convert back to standard object mapping because libsql returns arrays or a proxy
           return Object.fromEntries(Object.entries(row)) as any;
        }
        return undefined;
      },
      all: async (sql, params = []) => {
        const result = await client.execute({ sql, args: params });
        return result.rows.map(r => Object.fromEntries(Object.entries(r))) as any[];
      },
      exec: async (sql) => {
        await client.executeMultiple(sql);
      }
    };
    
    // Enable foreign keys
    await client.execute('PRAGMA foreign_keys = ON;');
    
    // Create tables
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL,
        credits REAL DEFAULT 100.0
      );

      CREATE TABLE IF NOT EXISTS host_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        gpu_model TEXT NOT NULL,
        vram_gb INTEGER NOT NULL,
        upload_speed REAL NOT NULL,
        price_per_hour REAL NOT NULL,
        is_available INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        game_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        start_time TEXT NOT NULL,
        end_time TEXT,
        total_cost REAL DEFAULT 0.0,
        FOREIGN KEY(host_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(player_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }
  return dbInstance;
}
