# Interview Copilot — Auth Screen Spec v1.0

> **Nâng cấp từ Google OAuth-only → màn hình login riêng với email/password + Magic Link + Forgot Password, giữ nguyên Google Login.**
> Built on: SPEC-v2.md (v4.1), Next.js 14 App Router + Supabase Auth + Tailwind CSS

---

## 1. Mục tiêu (Objectives)

- [ ] Tạo màn hình `/login` — gộp Sign In / Sign Up trong 1 page (toggle)
- [ ] Thêm **email/password** auth (Supabase Auth native) — đăng ký + đăng nhập
- [ ] Thêm **Magic Link** — login bằng email, không cần password
- [ ] Thêm **Forgot Password** — gửi email reset password
- [ ] **Bắt buộc login** trước khi vào app — middleware redirect về `/login` nếu chưa auth
- [ ] Giữ nguyên **Google OAuth** button
- [ ] AuthProvider: cập nhật để hỗ trợ email/password + magic link methods
- [ ] PWA login page: responsive, dark mode (consistent với main app theme)

## 2. Non-Goals

- [ ] KHÔNG thay đổi Supabase DB schema / RLS policies — auth vẫn dùng auth.users mặc định
- [ ] KHÔNG thêm provider khác (GitHub, Apple) ở phase này
- [ ] KHÔNG làm OTP SMS / phone auth
- [ ] KHÔNG thay đổi SettingsModal, interview pipeline, hay UI components khác
- [ ] KHÔNG migrate dữ liệu user cũ

---

## 3. User Flow

```
┌──────────────────────────────────────────────────────────┐
│                     /login page                           │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  [Sign In]  /  [Sign Up]          ← toggle tab      │  │
│  │                                                       │  │
│  │  Tab: SIGN IN                                         │  │
│  │  ┌───────────────────────────────────┐                │  │
│  │  │ Email                             │                │  │
│  │  │ Password                          │                │  │
│  │  │                                    │                │  │
│  │  │ [Sign In]                         │                │  │
│  │  │                                    │                │  │
│  │  │ ─── or ───                        │                │  │
│  │  │ [Google]  [Magic Link]            │                │  │
│  │  │                                    │                │  │
│  │  │ Forgot password?                   │                │  │
│  │  └───────────────────────────────────┘                │  │
│  │                                                       │  │
│  │  Tab: SIGN UP                                         │  │
│  │  ┌───────────────────────────────────┐                │  │
│  │  │ Email                             │                │  │
│  │  │ Password                          │                │  │
│  │  │ Confirm Password                  │                │  │
│  │  │                                    │                │  │
│  │  │ [Create Account]                  │                │  │
│  │  │                                    │                │  │
│  │  │ ─── or ───                        │                │  │
│  │  │ [Google]                           │                │  │
│  │  └───────────────────────────────────┘                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Success → redirect "/" (main interview page)            │
└──────────────────────────────────────────────────────────┘
```

### Flow detail

1. User mở app → middleware kiểm tra session cookie
2. Chưa đăng nhập → **redirect 302 → /login**
3. User login (email/password | Google | Magic Link)
4. Auth success → redirect về "/"
5. Main interview page render bình thường (đã có auth context)
6. User logout → AuthProvider signOut → redirect "/login"

## 4. Component Tree & Pages

### New Pages

| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Single page app — toggle Sign In / Sign Up |
| ForgotPasswordPage | `/auth/forgot-password` | Form nhập email → gửi reset link |
| ResetPasswordPage | `/auth/reset-password` | Form nhập password mới (sau khi click link trong email) |

### Updated Files

| File | Change |
|------|--------|
| `middleware.ts` | Thêm auth check → redirect sang `/login` nếu chưa login |
| `app/layout.tsx` | Bỏ `overflow: hidden` trên body khi ở login page (scroll if needed) |
| `components/providers/AuthProvider.tsx` | Thêm `signUp`, `signInWithPassword`, `signInWithMagicLink`, `resetPassword`, `updatePassword`, `isSigningIn` state |
| `components/providers/AppProviders.tsx` | Thêm `LoginGuard` (nếu chưa auth, show login modal hoặc redirect) |

### New Components

| Component | Description |
|-----------|-------------|
| `components/LoginPage.tsx` | Full login page orchestrator — toggle signin/signup |
| `components/auth/SignInForm.tsx` | Email + Password form + Google + Magic Link buttons |
| `components/auth/SignUpForm.tsx` | Email + Password + Confirm form + Google button |
| `components/auth/ForgotPasswordForm.tsx` | Email input + send reset link |
| `components/auth/ResetPasswordForm.tsx` | New password + confirm |
| `components/auth/AuthDivider.tsx` | "─ or ─" divider for OAuth split |
| `components/auth/MagicLinkForm.tsx` | Email input + send magic link (inline phần signin) |

---

## 5. Layout & Design (Login Page)

### Theme: Dark mode (matched với main app)

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│           ┌─── IC ───┐                                        │
│           │ Interview │  ← icon + brand name, trên cùng      │
│           │  Copilot  │                                        │
│                        │                                        │
│           ┌─────────────────────┐                             │
│           │  Sign In | Sign Up  │   ← toggle tab pill        │
│           │                     │                             │
│           │  ┌───────────────┐  │                             │
│           │  │ ✉️ Email      │  │  ← input-field             │
│           │  └───────────────┘  │                             │
│           │  ┌───────────────┐  │                             │
│           │  │ 🔒 Password   │  │  ← input-field              │
│           │  └───────────────┘  │                             │
│           │                     │                             │
│           │  [Sign In]         │  ← primary button (full w)   │
│           │                     │                             │
│           │  ── or continue with ──                          │
│           │                     │                             │
│           │  [G] [✉️ Magic Link]│  ← Google + Magic Link     │
│           │                     │                             │
│           │  Forgot password?   │  ← link                    │
│           └─────────────────────┘                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Footer: ToS | Privacy (links)                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### LoginCard background:
- `glass-panel` component class (giống SettingsModal/ProfileInput style)
- Center vertically + horizontally (`flex items-center justify-center min-h-screen`)
- Max width: `max-w-sm` (384px)
- Padding: `p-8`
- Subtle glow/shadow giống `shadow-panel`

### Form states

```
Form States:
├── IDLE          — form trống, sẵn sàng nhập
├── VALIDATING    — validate email format, password strength
├── SUBMITTING    — loading spinner, các nút disabled
├── SUCCESS       — checkmark + redirect countdown (hoặc "Check email" cho Magic Link)
├── ERROR         — error message trong form (inline, không toast)
│   ├── "Email already registered" (Sign Up)
│   ├── "Invalid login credentials" (Sign In)
│   ├── "Network error. Please try again"
│   └── "Too many requests. Please wait..."
└── EMAIL_SENT    — Magic Link / Forgot Password: "Check your email"
```

### Validation

| Field | Rules |
|-------|-------|
| Email | Required, valid email format (regex), trimmed lowercase |
| Password (Sign In) | Required, min 1 char |
| Password (Sign Up) | Required, min 8 chars, hiển thị strength indicator |
| Confirm Password | Required, must match Password |

### Google OAuth — giữ nguyên logic hiện tại:
- Gọi `supabase.auth.signInWithOAuth({ provider: "google" })` 
- Redirect `/auth/callback` → exchange code → redirect về "/"

### Magic Link:
- Input email → gọi `supabase.auth.signInWithOAuth({ provider: "google", options: { ... } })` — dùng `signInWithOtp` thực ra:

```typescript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```
- Hiển thị "Check your email for the magic link" + icon ✉️
- Không cần password

### Forgot Password:
- Input email → gọi `supabase.auth.resetPasswordForEmail(email, { redirectTo: "/auth/reset-password" })`
- Hiển thị "Check your email for reset instructions"

### Reset Password:
- Form: New Password + Confirm Password
- Gọi `supabase.auth.updateUser({ password })`
- Success → redirect "/"

---

## 6. Middleware Auth Guard (thay đổi `middleware.ts`)

**Hiện tại:** Chỉ refresh session cookie, không redirect

**Mới:** Kiểm tra session → chưa login → redirect `/login`

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Skip auth check cho login pages, public assets, api callback
  const publicPaths = ["/login", "/auth/callback", "/auth/reset-password", "/offline"]
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublic && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return updateSession(request)
}
```

**Config matcher:** Giữ nguyên pattern hiện tại (trừ _next/static, favicon, v.v.)

---

## 7. Cập nhật AuthProvider (AuthProvider.tsx)

Thêm methods vào AuthContext:

```typescript
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  // Existing
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // New
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}
```

**AuthResult type:**
```typescript
type AuthResult = { success: true } | { success: false; error: string };
```

Không throw — các form component nhận error message để render inline.

---

## 8. Chỉnh sửa Files

### 8.1 `middleware.ts`

Thay thế nội dung hiện tại bằng auth guard logic ở section 6. Import `createServerClient` từ `@supabase/ssr` thay vì gọi `updateSession` riêng.

### 8.2 `components/providers/AuthProvider.tsx`

- Thêm 5 methods mới (signUp, signInWithPassword, signInWithMagicLink, resetPassword, updatePassword)
- Mỗi method try/catch với `supabaseClient.auth` API
- Không throw error — trả về AuthResult
- Giữ nguyên `signInWithGoogle` và `signOut`

### 8.3 `app/page.tsx`

Không cần thay đổi — middleware redirect về login trước khi page.tsx mount.
Tuy nhiên InterviewPage component hiện tại có loading message "Đang tải Interview Copilot…". Nếu middleware không redirect kịp trước khi page render (do dynamic import), cần check auth ở đầu InterviewPage và redirect thủ công. **Recommendation:** dùng `useAuth()` + `useEffect` redirect fallback trong InterviewPage nếu không có user (phòng trường hợp middleware chưa kịp trigger).

### 8.4 `app/layout.tsx`

Thêm `body` class động cho login page. Hoặc để body luôn scroll được (remove `overflow: hidden`) — login page cần scroll nếu content > viewport, main app vẫn 'h-full' nhờ layout bên trong.

### 8.5 CSS (`globals.css`)

Thêm class cho login form states:

```css
.auth-input-error {
  @apply border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30;
}

.auth-error-message {
  @apply text-xs text-red-400;
}

.auth-success-message {
  @apply text-xs text-emerald-400;
}

.auth-loading-spinner {
  @apply inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white;
}
```

### 8.6 `app/auth/callback/route.ts`

Giữ nguyên. Magic Link + email/password redirect cũng dùng callback này nếu có `emailRedirectTo`. Tuy nhiên cần kiểm tra: Supabase `signInWithOtp` redirect về `/auth/callback` → exchange code → về "/" (OK).

### 8.7 New: `components/LoginPage.tsx`

Full page component:
```
┌──────────────────────────────┐
│  LoginPage                   │
│  ├── Logo + Branding         │
│  ├── TabToggle (SignIn/SignUp)│
│  ├── SignInForm / SignUpForm │
│  └── Footer                  │
└──────────────────────────────┘
```

Khi toggle:
- Giữ nguyên email input value khi chuyển tab (nếu có)
- Clear error message

### 8.8 New: `components/auth/AuthDivider.tsx`

```tsx
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-xs text-slate-500">or continue with</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}
```

---

## 9. PWA Considerations

- Login page: `overflow-y: auto` cho phép scroll (nếu form dài + mobile)
- `/login` được thêm vào public paths → không cần auth
- Sau login, PWA service worker cache main app pages
- Offline fallback (`/offline`) vẫn là public

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| Supabase chưa configured (`!configured`) | AuthProvider trả về `configured: false`. Login page hiển thị message "Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường." + ẩn tất cả form |
| Email đã tồn tại (Sign Up) | Error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác." |
| Sai email/password | Error: "Email hoặc mật khẩu không đúng." |
| Magic Link gửi lỗi | Error: "Không thể gửi magic link. Vui lòng thử lại." |
| Reset password email lỗi | Error: "Không thể gửi email reset. Vui lòng thử lại." |
| Network error | Error: "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại." |
| Rate limit | Error: "Quá nhiều yêu cầu. Vui lòng đợi 1 phút." |

## 11. Security Notes

- **Passwords:** không bao giờ lưu trong client-side state
- **Supabase Auth:** passwords được hash server-side (bcrypt)
- **CSRF:** Supabase Auth tự handle
- **XSS:** Không dùng dangerouslySetInnerHTML
- **Redirect validation:** Chỉ redirect tới relative URLs (`/` hoặc `/?auth=error`) — đã được xử lý trong auth/callback
- **Magic Link:** link chỉ dùng 1 lần, có expire time (Supabase mặc định)
- **Rate limit:** Supabase Auth tự rate limit trên IP

---

## 12. Development Phases

### Phase 1: Core Auth Forms (ước lượng: 1-2 sessions)
- [ ] Tạo `components/auth/SignInForm.tsx` + `SignUpForm.tsx`
- [ ] Tạo `AuthDivider.tsx`
- [ ] Cập nhật `AuthProvider.tsx` — thêm 5 methods mới
- [ ] Cập nhật `AuthContextValue` type
- [ ] Tạo `app/login/page.tsx` + `LoginPage.tsx` với toggle tab

### Phase 2: Forgot/Reset Password (ước lượng: 1 session)
- [ ] Tạo `app/auth/forgot-password/page.tsx` + `ForgotPasswordForm.tsx`
- [ ] Tạo `app/auth/reset-password/page.tsx` + `ResetPasswordForm.tsx`
- [ ] Tạo component `MagicLinkForm.tsx` (integrate vào SignInForm inline)

### Phase 3: Middleware Auth Guard (ước lượng: 1 session)
- [ ] Sửa `middleware.ts` — thêm auth check + redirect `/login`
- [ ] Kiểm tra public paths list
- [ ] Fallback check trong `InterviewPage` (phòng middleware chưa kịp)

### Phase 4: Polish & Integration (ước lượng: 1 session)
- [ ] CSS: form states, loading spinner, error/success messages
- [ ] Responsive: mobile login card full width, padding adjustment
- [ ] PWA: login page scroll, offline fallback public
- [ ] Remove `LoginBanner.tsx` và `AuthErrorBanner.tsx` nếu không còn dùng
- [ ] `AuthButton.tsx`: cập nhật redirect logic (nếu click logout → redirect "/login")
- [ ] Test full flow: sign up → login → interview → logout → redirect login

---

## 13. File Change Summary

| File | Action |
|------|--------|
| `app/login/page.tsx` | **NEW** — re-export LoginPage |
| `components/LoginPage.tsx` | **NEW** — login page orchestrator |
| `components/auth/SignInForm.tsx` | **NEW** |
| `components/auth/SignUpForm.tsx` | **NEW** |
| `components/auth/ForgotPasswordForm.tsx` | **NEW** |
| `components/auth/ResetPasswordForm.tsx` | **NEW** |
| `components/auth/AuthDivider.tsx` | **NEW** |
| `components/auth/MagicLinkForm.tsx` | **NEW** |
| `app/auth/forgot-password/page.tsx` | **NEW** |
| `app/auth/reset-password/page.tsx` | **NEW** |
| `components/providers/AuthProvider.tsx` | **MODIFY** — thêm methods + types |
| `middleware.ts` | **MODIFY** — auth guard redirect |
| `app/layout.tsx` | **MODIFY** — body overflow handling |
| `app/globals.css` | **MODIFY** — auth form CSS classes |
| `components/InterviewPage.tsx` | **MODIFY** — fallback auth check |
| `components/AuthButton.tsx` | **MODIFY** — logout redirect về /login |
| `components/LoginBanner.tsx` | **REMOVE** (tùy chọn — có thể giữ nếu muốn) |
| `components/AuthErrorBanner.tsx` | **REMOVE** (tùy chọn) |

---

## 14. Test Checklist (Sau khi code)

- [ ] `/login` render đúng Sign In tab mặc định
- [ ] Toggle Sign In / Sign Up hoạt động mượt
- [ ] Sign Up: email + password + confirm → Create Account → success → redirect "/"
- [ ] Sign In: email + password → Sign In → success → redirect "/"
- [ ] Google OAuth: click → redirect Google → callback → redirect "/"
- [ ] Magic Link: nhập email → "Check your email" → click link → login → redirect "/"
- [ ] Forgot Password: nhập email → "Check your email" → click link → mở /auth/reset-password → nhập pw mới → redirect "/"
- [ ] Invalid email format → error inline
- [ ] Password too short (Sign Up) → error inline
- [ ] Confirm password mismatch → error inline
- [ ] Wrong email/password (Sign In) → error inline
- [ ] Email already exists (Sign Up) → error inline
- [ ] Chưa login → redirect "/login" khi truy cập "/"
- [ ] Đã login → redirect "/" khi truy cập "/login"
- [ ] Public paths (/auth/callback, /offline) không bị redirect
- [ ] Logout → redirect "/login"
- [ ] PWA offline fallback vẫn hoạt động
- [ ] Mobile responsive: login card full width, scroll OK
- [ ] Dark mode: consistent với main app theme
- [ ] Supabase chưa configured → message hiển thị, form ẩn
