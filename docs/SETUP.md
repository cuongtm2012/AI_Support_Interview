# Hướng dẫn setup — Interview Copilot

## 1. Cài đặt local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3000

## 2. API Keys (Settings → API Keys)

| Key | Bắt buộc | Mục đích |
|-----|----------|----------|
| Deepgram | Có | Speech-to-text real-time |
| DeepSeek | Có | Gợi ý câu trả lời AI |
| Google Translate | Không | Dịch transcript |

Keys lưu **localStorage** — không gửi lên server trừ khi gọi proxy (header `x-api-key`).

## 3. Supabase (lịch sử cloud)

1. Tạo project tại https://supabase.com
2. SQL Editor → chạy `supabase/migrations/001_initial.sql` (project mới đã có `question_type` trong bảng `questions`)
3. Nếu đã chạy migration cũ: chạy thêm `supabase/migrations/002_question_type.sql`
4. Authentication → Providers → bật **Google**
5. URL Configuration → Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_DOMAIN/auth/callback`
6. `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## 4. Microphone (mic ngoài)

1. Cắm mic USB / headset vào máy
2. Mở app → **Settings** hoặc footer → chọn mic trong dropdown
3. Chrome: cho phép quyền Microphone khi browser hỏi
4. **Khuyến nghị:** dùng mic ngoài, không dùng mic laptop (ít nhiễu)
5. Trong Settings điều chỉnh **Confidence threshold** (0.7 mặc định) — thanh **Mic quality** hiện khi đang nghe

### macOS

- System Settings → Sound → Input → chọn mic ngoài
- Chrome dùng mic đã chọn trong app dropdown

### Windows

- Settings → System → Sound → Input
- Chọn đúng device trong app

## 5. Picture-in-Picture (Zoom / Meet / Teams)

1. Mở cuộc gọi phỏng vấn trên **browser tab** (Chrome/Edge khuyến nghị)
2. Trong player video, bấm nút **Picture-in-Picture** (hoặc menu ⋮ → PiP)
3. Cửa sổ PiP nổi → **kéo vào góc trái** vùng "Meeting (PiP)" của Interview Copilot
4. App Copilot full màn hình — PiP nổi trên cùng, không bị che nếu kéo đúng vùng

### Nếu PiP không đẹp

- **macOS:** Amphetamine + cửa sổ Zoom always on top
- **Windows:** Zoom/Meet "Always on top"

## 6. Phím tắt

| Phím | Hành động |
|------|-----------|
| `Space` | Bật/tắt listening (khi focus body) |
| `R` | Regenerate câu trả lời AI |

## 7. PWA (cài như app)

- Chrome: menu → "Install Interview Copilot" hoặc nút **Cài app** trên header
- Cần HTTPS (Vercel deploy)

Offline: mở `/offline` khi không có mạng.

## 8. Deploy Vercel (one-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Env variables trên Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

API keys do từng user nhập trên web — không cần env Deepgram/DeepSeek trên Vercel (trừ dev fallback).

## 9. Luồng phỏng vấn (SPEC v2.4)

- **Start Listening** — bắt đầu STT + tạo session Supabase (nếu đã đăng nhập)
- **Stop Listening** — chỉ tắt mic/STT; session vẫn mở, có thể Start lại
- **End Session** — đóng session DB, mở **Recap** (copy all, download JSON/TXT)
- Mỗi câu hỏi: AI phân loại (behavioral / technical / situational / competency) → badge + prompt phù hợp

## 10. Export transcript

- **Đang phỏng vấn:** footer → **Export transcript** (copy buổi hiện tại)
- **Sau End Session:** Recap → Copy All / Download JSON / TXT
- **Buổi cũ:** Sessions → chọn buổi → **Export all**

## 11. Troubleshooting


| Vấn đề | Cách xử lý |
|--------|------------|
| Không có transcript | Kiểm tra Deepgram key, mic permission, Confidence threshold |
| Mất kết nối STT | App tự reconnect 5 lần; nếu fail → Stop → Start lại |
| Không dịch | Thêm Google Translate key hoặc bỏ qua (hiện text gốc) |
| Không lưu Sessions | Đăng nhập Google + cấu hình Supabase |
