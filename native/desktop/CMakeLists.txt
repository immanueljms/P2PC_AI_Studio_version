cmake_minimum_required(VERSION 3.16)
project(P2PC_Desktop VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Qt6
find_package(Qt6 COMPONENTS Core Gui Widgets REQUIRED)

# Find FFmpeg
find_package(PkgConfig REQUIRED)
pkg_check_modules(FFMPEG REQUIRED libavcodec libavformat libavutil libswscale)

# Find libwebrtc (Requires local build of webrtc.lib/libwebrtc.a in real environment)
# For the purpose of this structure we assume include/ and lib/ paths are managed
# find_package(webrtc REQUIRED)

# DXGI & D3D11 (Windows SDK)
if(WIN32)
    link_libraries(d3d11 dxgi d3dcompiler user32)
endif()

add_executable(p2pc_native
    src/main.cpp
    src/ui/MainWindow.h
    src/ui/MainWindow.cpp
    src/host/CaptureDXGI.h
    src/host/CaptureDXGI.cpp
    src/host/EncoderFFmpeg.h
    src/host/EncoderFFmpeg.cpp
    src/client/RendererD3D11.h
    src/client/RendererD3D11.cpp
    src/network/WebRTCManager.h
    src/network/WebRTCManager.cpp
)

target_include_directories(p2pc_native PRIVATE 
    ${FFMPEG_INCLUDE_DIRS}
    src/
)

target_link_libraries(p2pc_native PRIVATE 
    Qt6::Core Qt6::Gui Qt6::Widgets
    ${FFMPEG_LIBRARIES}
    # webrtc 
)

# Qt UI compilation (MOC)
set_target_properties(p2pc_native PROPERTIES AUTOMOC ON AUTOUI ON AUTORCC ON)
