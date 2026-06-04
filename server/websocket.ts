import { WebSocket } from 'ws';

export class WebSocketManager {
  private activeConnections = new Map<number, WebSocket>();

  public connect(userId: number, ws: WebSocket) {
    this.activeConnections.set(userId, ws);
    console.log(`User ${userId} connected via WebSocket.`);
  }

  public disconnect(userId: number) {
    this.activeConnections.delete(userId);
    console.log(`User ${userId} disconnected from WebSocket.`);
  }

  public sendToUser(userId: number, message: any) {
    const ws = this.activeConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error(`Error sending message to user ${userId}:`, err);
      }
    }
  }

  public broadcastSessionUpdate(hostId: number, playerId: number, data: any) {
    this.sendToUser(hostId, data);
    this.sendToUser(playerId, data);
  }
}

export const wsManager = new WebSocketManager();
