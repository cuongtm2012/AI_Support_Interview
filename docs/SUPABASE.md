# Supabase — Interview Copilot

Project: `oogmcxyofaextlfqcnbo`  
Dashboard: https://supabase.com/dashboard/project/oogmcxyofaextlfqcnbo

## Env (app)

```env
NEXT_PUBLIC_SUPABASE_URL=https://oogmcxyofaextlfqcnbo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Đã cấu hình trong `.env.local` (local). Trên **Vercel** thêm cùng 2 biến.

## Schema (đã apply trên cloud)

| Bảng | Mục đích |
|------|----------|
| `profiles` | User sau Google login |
| `sessions` | Buổi phỏng vấn |
| `questions` | Câu hỏi + AI answer + `question_type` |

Migrations trong repo: `supabase/migrations/001` … `004`.

**Đã config qua MCP:**
- RLS policies (8)
- Trigger `on_auth_user_created` → tạo profile
- Revoke RPC trên `handle_new_user()` (security)
- Realtime publication cho `questions`

## Google OAuth (bắt buộc để đăng nhập)

1. [Authentication → Providers → Google](https://supabase.com/dashboard/project/oogmcxyofaextlfqcnbo/auth/providers) → **Enable**
2. Nhập **Client ID** + **Client Secret** từ [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Web client)
3. [URL Configuration](https://supabase.com/dashboard/project/oogmcxyofaextlfqcnbo/auth/url-configuration):

**Site URL** (dev):
```
http://localhost:3000
```

**Redirect URLs** (thêm tất cả):
```
http://localhost:3000/auth/callback
https://YOUR-VERCEL-DOMAIN/auth/callback
```

4. Trong Google Cloud → OAuth client → **Authorized redirect URIs** phải có:
```
https://oogmcxyofaextlfqcnbo.supabase.co/auth/v1/callback
```

(App redirect: `http://localhost:3000/auth/callback` — Supabase xử lý OAuth rồi redirect về app.)

## Test nhanh

```bash
npm run dev
```

1. Mở http://localhost:3000 → **Đăng nhập Google**
2. **Start Listening** → hỏi thử → **End Session**
3. **Sessions** → thấy buổi mới

## MCP (Cursor)

Server: `user-supabase`. Tools hữu ích: `list_tables`, `execute_sql`, `apply_migration`, `get_advisors`, `generate_typescript_types`.

Regenerate types → cập nhật `types/supabase.ts`.

## Troubleshooting

| Triệu chứng | Xử lý |
|-------------|--------|
| Redirect về `/?auth=error` | Kiểm tra Google provider + redirect URLs ở trên |
| Sessions trống dù đã phỏng vấn | Chưa đăng nhập — cần Google login |
| Realtime không sync | Đã bật `questions` trên `supabase_realtime` |
| Linter SECURITY DEFINER | Đã revoke EXECUTE — chạy `003` nếu project mới clone schema cũ |
