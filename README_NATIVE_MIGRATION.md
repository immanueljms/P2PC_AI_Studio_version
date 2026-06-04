# P2PC Native (C++ / Go)

This repository contains the foundational source code for the requested ultra-low latency, native C++ Windows desktop version of P2PC, along with the Go signaling server.

## Architecture

*   **Signaling Server (`/native/signaling`)**: A Go-based WebSockets server using `gorilla/websocket`. Designed to be easily expandable with `pion/webrtc` if SFU routing is needed later. Currently handles pure SDP/ICE exchange.
*   **Desktop App (`/native/desktop`)**: A native C++ Qt6 application.
    *   **Capture**: Uses Windows DXGI Desktop Duplication API for hardware-accelerated, zero-copy screen framing.
    *   **Encode**: Uses FFmpeg (`libavcodec`) to leverage NVENC (NVIDIA), AMF (AMD), or QuickSync (Intel) hardware H.264/HEVC encoding. 
    *   **Networking**: Configured to link against Google's native `libwebrtc` for SDP exchange, ICE traversal, and injecting the elementary H.264 bitstream directly into an RTP WebRTC track. WebRTC DataChannels are utilized for transmitting Win32 mouse/keyboard inputs.
    *   **Render**: Direct3D 11 is used on the client-side to render received frames with sub-millisecond dispatch times.

## Build Requirements (Windows)

To build this on your Windows machine, ensure you have the following installed:

1.  **CMake** (3.16+)
2.  **Visual Studio 2022** (MSVC, Desktop development with C++)
3.  **Qt 6** (Open Source or Commercial, installed via Qt Maintenance Tool)
4.  **FFmpeg** (vcpkg or pre-compiled binaries containing dev headers/libs)
5.  **libwebrtc** (Requires compiling Chromium's webrtc standalone checkout using native `ninja` build tools. Pre-compiled binaries like `webrtc-builds` can also be used).
6.  **Go 1.21+** (For the signaling server)

## Instructions

1.  **Export the Code**: Click the **Settings (three dots)** menu in the AI Studio environment and select **Export > Download as ZIP**.
2.  **Run Signaling Server**:
    ```bash
    cd native/signaling
    go mod tidy
    go run main.go
    ```
3.  **Compile Desktop App**:
    ```bash
    cd native/desktop
    mkdir build && cd build
    cmake .. -DCMAKE_PREFIX_PATH="C:/Qt/6.5.0/msvc2019_64"
    cmake --build . --config Release
    ```
