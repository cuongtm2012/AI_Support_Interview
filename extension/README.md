# Interview Copilot — Chrome Extension (MVP)

> Capture tab audio tự động qua `chrome.tabCapture` — bổ sung cho web app `getDisplayMedia`.

## Trạng thái

**MVP stub** — extension có popup + background service worker. Web app vẫn dùng **Share tab audio** trong Meeting zone (ổn định hơn trên mọi browser).

## Cài extension (dev)

1. Mở `chrome://extensions`
2. Bật **Developer mode**
3. **Load unpacked** → chọn thư mục `extension/`
4. Mở tab Meet/YouTube → click icon extension → **Capture tab hiện tại**

## Luồng tích hợp (kế hoạch)

1. Extension lấy `streamId` từ `tabCapture.getMediaStreamId`
2. Gửi `streamId` sang tab Interview Copilot qua `chrome.runtime.connectExternal`
3. Web app dùng `navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId }}})` — chỉ Chrome + extension

## Files

| File | Mô tả |
|------|--------|
| `manifest.json` | MV3, permissions `tabCapture` |
| `background.js` | Service worker — capture handler |
| `popup.html` / `popup.js` | UI test capture |

## Liên quan

- [docs/DEPLOY.md](../docs/DEPLOY.md) — deploy production
- [docs/SETUP.md](../docs/SETUP.md) — mic + tab audio thủ công
