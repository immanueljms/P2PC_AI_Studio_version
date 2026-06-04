export interface User {
  id: number;
  username: string;
  role: 'host' | 'player';
  credits: number;
}

export interface HostProfile {
  id: number;
  user_id: number;
  gpu_model: string;
  vram_gb: number;
  upload_speed: number;
  price_per_hour: number;
  is_available: boolean;
  username?: string;
  host_credits?: number;
}

export interface GameSession {
  id: number;
  host_id: number;
  player_id: number;
  game_name: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  total_cost: number;
  player_username?: string;
  host_username?: string;
  gpu_model?: string;
  price_per_hour?: number;
}
