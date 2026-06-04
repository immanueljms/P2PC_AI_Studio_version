#pragma once
#include <string>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavutil/opt.h>
#include <libavutil/hwcontext.h>
#include <libavutil/hwcontext_d3d11va.h>
}

// Hardware-accelerated NVENC / AMF / QuickSync wrapper
class EncoderFFmpeg {
public:
    EncoderFFmpeg();
    ~EncoderFFmpeg();

    bool Initialize(int width, int height, int framerate, int bitrate, const std::string& encoderName = "h264_nvenc");
    bool EncodeFrame(AVFrame* hwFrame, AVPacket** outPacket);
    void Cleanup();

private:
    bool SetupHwContext();

    AVCodecContext* m_codecCtx = nullptr;
    const AVCodec* m_codec = nullptr;
    AVBufferRef* m_hwDeviceCtx = nullptr;
    AVFrame* m_swFrame = nullptr;
};
