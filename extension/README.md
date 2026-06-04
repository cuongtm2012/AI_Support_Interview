# Interview Copilot — Chrome Extension (Phase 4)

> SPEC v2.4 — capture **system audio** tự động, không cần mic ngoài.

## Trạng thái

**Planned** — chưa implement. Web app hiện dùng `getUserMedia` (mic ngoài).

## Mục tiêu (khi build)

1. Extension capture tab audio (Zoom/Meet/Teams tab)
2. Stream PCM tới Deepgram WebSocket (cùng pipeline web app)
3. Hoặc inject bridge script giao tiếp với tab Interview Copilot

## Gợi ý kỹ thuật

- Manifest V3 + `chrome.tabCapture` hoặc `offscreen` document
- User chọn tab cuộc gọi → audio → extension → Deepgram
- API keys vẫn từ user (storage.local), không hardcode

## Liên quan

Xem [docs/SETUP.md](../docs/SETUP.md) cho setup mic hiện tại.
