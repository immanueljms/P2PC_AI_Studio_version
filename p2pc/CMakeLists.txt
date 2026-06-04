cmake_minimum_required(VERSION 3.20)
project(P2PC VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configure vcpkg
set(CMAKE_TOOLCHAIN_FILE "${CMAKE_CURRENT_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")

find_package(Qt6 COMPONENTS Core Gui Widgets REQUIRED)
find_package(FFmpeg REQUIRED)
# webrtc will be resolved via vcpkg

add_subdirectory(host)
add_subdirectory(client)
