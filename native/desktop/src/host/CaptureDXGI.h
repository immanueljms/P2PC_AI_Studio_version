#pragma once

#include <d3d11.h>
#include <dxgi1_2.h>
#include <wrl/client.h>
#include <memory>

using Microsoft::WRL::ComPtr;

class CaptureDXGI {
public:
    CaptureDXGI();
    ~CaptureDXGI();

    bool Initialize(int monitorIndex = 0);
    bool CaptureFrame(ID3D11Texture2D** outTexture);
    void Cleanup();

private:
    ComPtr<ID3D11Device> m_device;
    ComPtr<ID3D11DeviceContext> m_context;
    ComPtr<IDXGIOutputDuplication> m_deskDupl;
    ComPtr<ID3D11Texture2D> m_acquiredDesktopImage;
};
