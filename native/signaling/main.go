package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
	Target  string          `json:"target,omitempty"`
}

type Client struct {
	Conn *websocket.Conn
	Role string // "host" or "player"
	ID   string
}

var (
	clients = make(map[string]*Client)
	mutex   = sync.Mutex{}
)

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer ws.Close()

	client := &Client{Conn: ws}

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			mutex.Lock()
			delete(clients, client.ID)
			mutex.Unlock()
			break
		}

		switch msg.Type {
		case "register":
			var data struct {
				Role string `json:"role"`
				ID   string `json:"id"`
			}
			json.Unmarshal(msg.Payload, &data)
			client.Role = data.Role
			client.ID = data.ID

			mutex.Lock()
			clients[client.ID] = client
			mutex.Unlock()
			log.Printf("Registered %s: %s", client.Role, client.ID)

		case "offer", "answer", "ice-candidate":
			// Route signaling messages
			mutex.Lock()
			targetClient, ok := clients[msg.Target]
			mutex.Unlock()

			if ok {
				targetClient.Conn.WriteJSON(msg)
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)
	log.Println("P2PC Go/Pion Signaling Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
