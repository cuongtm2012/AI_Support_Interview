# Interview Copilot

Web app hỗ trợ phỏng vấn online bằng AI — real-time STT (Deepgram), dịch (Google Translate), gợi ý câu trả lời (DeepSeek), lưu lịch sử qua Supabase.

## Yêu cầu

- Node.js 18+
- API keys (nhập trên web → localStorage):
  - **Deepgram** — bắt buộc (STT)
  - **DeepSeek** — bắt buộc (gợi ý câu trả lời)
  - **Google Translate** — tùy chọn
- **Supabase** (tùy chọn — lưu session & lịch sử):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Google OAuth enabled trong Supabase Auth

## Cài đặt

```bash
npm install
cp .env.example .env.local
# Điền Supabase URL + anon key (nếu dùng cloud history)
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Supabase setup (SPEC v2.2)

1. Tạo project tại [supabase.com](https://supabase.com)
2. **SQL Editor** → chạy file `supabase/migrations/001_initial.sql`
3. **Authentication** → Providers → bật **Google**
4. **Authentication** → URL Configuration → thêm redirect:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.vercel.app/auth/callback`
5. Copy **Project URL** + **anon key** vào `.env.local`

## Sử dụng

1. **Settings** → nhập Deepgram + DeepSeek (+ Google nếu cần dịch)
2. **Đăng nhập Google** (nếu có Supabase) → lưu lịch sử cloud
3. Paste Profile + JD → **Start Listening**
4. Xem lại buổi cũ tại **Sessions**

## Dữ liệu lưu ở đâu

| Dữ liệu | Vị trí |
|---------|--------|
| API keys | localStorage (client) |
| Transcript real-time | Zustand (memory) |
| Session + Q&A | Supabase (khi đã login) |

## Deploy (Vercel)

```bash
vercel
```

Env trên Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Phím tắt

- `Space` — toggle mic
- `R` — regenerate answer

Hướng dẫn chi tiết PiP + mic + deploy: [docs/SETUP.md](docs/SETUP.md)

Xem `SPEC-v2.md` cho PRD đầy đủ.

## Tính năng (theo SPEC phases)

- MVP: STT, dịch, AI answer, API keys web, Supabase auth + sessions
- Polish: streaming, regenerate, speak, history, dark/light mode, responsive, skeleton
- Advanced: export transcript, confidence meter, shortcuts, PWA manifest, Deepgram reconnect
- Production: rate limiting API, error boundary, `vercel.json`, setup guide
- **v2.4**: phân loại câu hỏi (behavioral/technical/situational/competency), prompt theo loại, **End Session** + recap (copy / JSON / TXT), `question_type` trên Supabase (`002_question_type.sql`)
