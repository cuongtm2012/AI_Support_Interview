# Deploy Interview Copilot (Vercel + Supabase)

## 1. Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy migration: `supabase/migrations/001_initial.sql` (SQL Editor hoặc CLI)
3. **Authentication → Providers → Google**: bật OAuth, thêm Client ID/Secret
4. **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

## 2. Environment variables

Copy `.env.example` → Vercel **Project → Settings → Environment Variables**:

| Variable | Required | Mô tả |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Publishable / anon key |
| `DEEPGRAM_API_KEY` | Optional | Dev fallback proxy (user vẫn nhập key trên web) |
| `DEEPSEEK_API_KEY` | Optional | Dev fallback cho translate/AI |
| `GOOGLE_TRANSLATE_API_KEY` | Optional | Khi chọn Google Translate |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limit production (120 req/min/IP) |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash token |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Error monitoring |

Không commit `.env.local` — API keys chính do user nhập trong Settings (localStorage).

## 3. Vercel

```bash
npm i -g vercel   # hoặc dùng GitHub integration
vercel --prod
```

- Framework preset: **Next.js**
- Build: `npm run build`
- Root: repository root

## 4. Tab capture + mic (manual)

1. Mở app → **Meeting** → click vùng PiP → chọn tab Meet/YouTube
2. Bật **Share tab audio** (Chrome) — nếu không bật, app fallback mic
3. **Settings** → nhập Deepgram key (bắt buộc để Start Listening)
4. DeepSeek key tùy chọn (dịch + AI answer)

## 5. PWA

Production build tự đăng ký `public/sw.js`. Cài từ Chrome → Install app.

## 6. Chrome Extension (optional)

Load unpacked từ `extension/` — xem [extension/README.md](../extension/README.md).

## Checklist sau deploy

- [ ] Google login redirect OK
- [ ] Start Listening + transcript < 2s
- [ ] Session lưu Supabase sau End Session
- [ ] Rate limit 429 khi spam API (nếu có Upstash)
