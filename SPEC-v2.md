# Interview Copilot — PRD & Technical Specification v3.0

> **Web app hỗ trợ phỏng vấn online bằng AI** — full màn hình, capture tab cuộc gọi (system audio), real-time STT + dịch tùy chọn + gợi ý câu trả lời theo loại câu hỏi.

---

## 1. Mục tiêu (Objectives)

- [ ] Web app full màn hình — dễ đọc transcript, bản dịch và câu trả lời AI
- [ ] Capture tab YouTube/Meet/Teams bằng Screen Capture API (getDisplayMedia) — lấy cả audio hệ thống, không cần mic ngoài
- [ ] Capture âm thanh từ microphone làm fallback → Deepgram Nova-3 STT real-time → dịch En↔Vi
- [ ] Upload profile ngắn + JD → AI gợi ý câu trả lời chuẩn context
- [ ] Chạy trên browser (macOS + Windows), không cần cài đặt
- [ ] Auth + lưu lịch sử phỏng vấn qua Supabase (Google login)
- [ ] PWA — install như app desktop

## 2. Non-Goals

- [ ] KHÔNG phải desktop app — đây là web app chạy trên browser
- [ ] KHÔNG can thiệp vào Zoom/Meet/Teams (chỉ capture tab audio)
- [ ] KHÔNG ghi âm/lưu trữ raw audio — chỉ transcript + answer
- [ ] KHÔNG làm tính năng luyện tập / mock interview
- [ ] KHÔNG làm Chrome Extension ở phase này

---

## 3. Core Use Cases

### UC1: Phỏng vấn với người Mỹ (English → Vietnamese)

1. Mở app trên browser trước buổi phỏng vấn
2. Settings: Source = English, Target = Vietnamese
3. Nhập API keys (Deepgram bắt buộc, DeepSeek tùy chọn cho AI answer)
4. Optional: paste profile + JD
5. Optional: bấm "Chọn tab" → chọn tab cuộc gọi → bật "Share tab audio" → capture cả system audio
6. Bấm "Start Listening" → app tạo Supabase session + kết nối Deepgram WebSocket
7. Interviewer hỏi → app real-time hiện:
   - **[Transcript]** "Tell me about a time you handled a difficult situation"
   - **[Dịch]** "Hãy kể về một lần bạn xử lý tình huống khó khăn" (chọn dịch DeepSeek hoặc Google)
   - **[Gợi ý]** Câu trả lời bằng ngôn ngữ đã chọn, format dựa trên loại câu hỏi, dựa trên profile + JD
8. Đọc và trả lời theo
9. Kết thúc buổi → recap screen + download JSON/TXT + lưu Supabase

### UC2: Phỏng vấn với người Việt (Vietnamese → English)
- Source = Vietnamese, Target = English
- Dùng khi interviewer nói tiếng Việt nhưng muốn kiểm tra lại bản dịch
- Câu trả lời gợi ý bằng tiếng Anh

### UC3: Không cần AI answer (chỉ STT + dịch)
- Không nhập DeepSeek key → chỉ có transcript + dịch
- AI answer panel hiển thị placeholder

---

## 4. UX & Layout (Web App Full Screen)

### Main Screen Layout (v3.0 — Unified Q&A Flow)

```
┌──────────────────────────────────────────────────────────────┐
│ IC Interview Copilot          Sessions  Google  ⚙️ Settings   │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│ 📹 MEETING │  📋 Q&A MAIN PANEL (trung tâm — focus chính)   │
│  (preview) │                                                 │
│  compact   │  ┌─────────────────────────────────────────────┐│
│            │  │ Q1 [behavioral]                             ││
│ 📋 HISTORY │  │ EN: Tell me about a time you handled...  202││
│  (compact) │  │ 🌐 VI: Hãy kể về một lần bạn xử lý...     ││
│  click →   │  ├─────────────────────────────────────────────┤│
│  scroll    │  │ 💡 STAR Answer:                            ││
│  đến card  │  │ Situation: At my previous role...          ││
│            │  │ Task: I needed to...                       ││
│            │  │ Action: I implemented...                   ││
│            │  │ Result: Increased...                       ││
│            │  │ [Copy] [Regen] [Speak]                     ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
│            │  ┌─────────────────────────────────────────────┐│
│            │  │ Q2 [technical]                              ││
│            │  │ EN: Explain the difference between...    202││
│            │  │ 🌐 VI: Giải thích sự khác biệt giữa...     ││
│            │  ├─────────────────────────────────────────────┤│
│            │  │ 💡 Answer:                                 ││
│            │  │ The key difference is...                   ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
├────────────┴─────────────────────────────────────────────────┤
│ 🎤 EN  Tell me about a time… (interim)        [Connected]   │
│ 🌐 VI  Hãy kể về một lần… (interim translate, nếu có)      │
├──────────────────────────────────────────────────────────────┤
│ [Start] [End] [Export]  Profile  Space=Regen  [⋮]          │
└──────────────────────────────────────────────────────────────┘
```

### Key UX Decisions (v3.0)

| Decision | Why |
|----------|-----|
| Q&A Main Panel trung tâm — **gộp transcript + answer cùng 1 chỗ** | Mắt đọc từ trên xuống: câu hỏi (gốc → dịch) → câu trả lời. Ko cần nhìn 2 panel riêng |
| Bottom bar chỉ hiển thị **interim** (đang STT) | Câu đang được nhận dạng tạm thời — final text tự động nhảy lên card mới trong main panel |
| Translation hiển thị **trong card Q&A**, không ở bottom bar | Ngôn ngữ gốc hiện trước (lớn, đậm), dịch nhỏ/xám bên dưới — đọc gốc trước, tham khảo dịch sau |
| History panel bên trái compact | Click vào history item → scroll đến card tương ứng trong main panel |
| Meeting preview góc trái trên (nhỏ) | Khi không capture tab, vùng này collapse → history panel mở rộng |
| Card tự động scroll xuống card mới nhất | Luôn thấy câu hỏi + câu trả lời mới nhất mà không cần cuộn tay |
| Mỗi card có QuestionTypeBadge + timestamp | Biết ngay câu này behavioral/technical, biết khi nào hỏi |
| Stop Listening ≠ End Session | Pause mic/STT nhưng giữ Supabase session active |

### Audio Capture — 2 modes

**Mode 1: Meeting Tab (recommended)**
- getDisplayMedia → chọn tab YouTube/Meet/Teams
- Tick "Share tab audio" → capture system audio trực tiếp
- Video preview ở PiPZone + audio track gửi vào Deepgram
- Không cần microphone rời

**Mode 2: Microphone (fallback)**
- getUserMedia → mic built-in hoặc mic ngoài
- Khi đã có meeting stream mà mic vẫn dùng → cảnh báo: "Đang dùng mic. Để nghe audio tab: chọn lại tab và bật Share tab audio"

---

## 5. Settings Panel (⚙️)

### Tab: Keys — API Keys (localStorage)

| Setting | Required | Notes |
|---------|----------|-------|
| Deepgram API Key | ✅ Bắt buộc | Cho STT real-time (Nova-3) |
| DeepSeek API Key | ❌ Tùy chọn | Cho AI answer + dịch (mặc định) |

DeepSeek key vừa dùng cho AI answer vừa dùng cho translation mặc định.
Google Translate key: chỉ hiện khi user chọn "Google" trong Translation Provider.

### Tab: Interview — Language & Style

| Setting | Options | Default | Notes |
|---------|---------|---------|-------|
| Translation Provider | none / deepseek / google | deepseek | Mặc định DeepSeek (dùng chung key AI) |
| Source Language | En, Vi | English | Ngôn ngữ interviewer nói |
| Target Language | Vi, En | Vietnamese | Ngôn ngữ dịch sang |
| Answer Style | STAR, Professional, Casual, Concise, Technical | STAR | Format câu trả lời AI |
| Answer Language | Vietnamese, English, Same as target | Same as target | Ngôn ngữ gợi ý trả lời |
| Confidence Threshold | 0.5 - 1.0 | 0.70 | Lọc final transcript theo độ tin cậy |

### Tab: Profile — Profile & JD

| Setting | Notes |
|---------|-------|
| Profile Text | Textarea (3-5 câu: kinh nghiệm, skills, role) |
| JD Text | Textarea (paste JD) |
| DOC/PDF → MD | Tool external: doctomd.com, lightpdf.com/pdf-to-markdown |

### Tab: Display

| Setting | Options | Default |
|---------|---------|---------|
| Text Size | Small / Medium / Large | Large |
| Dark Mode | On / Off | On |

---

## 6. Technical Architecture

### Web Stack

```
Layer                    Technology
────────────────────────────────────────────────────
Frontend                 Next.js 14 + React 18 + TypeScript + Tailwind CSS
State Management         Zustand (persist: localStorage)
Audio Capture            getUserMedia (mic) + getDisplayMedia (tab audio)
STT Engine               Deepgram Nova-3 (WebSocket real-time)
Translation              DeepSeek API (default) hoặc Google Cloud Translation API
AI Answer Generation     DeepSeek API (deepseek-chat, streaming SSE)
Meeting Inject           getDisplayMedia preview + PiP (native browser API)
Auth                     Supabase Auth (Google OAuth)
Database                 Supabase PostgreSQL (sessions + questions)
Realtime Sync            Supabase Realtime (postgres_changes)
Hosting / Deploy         Vercel (free tier)
Backend                  Next.js App Router API routes + Supabase SDK
PWA                      next-pwa / custom service worker + manifest.webmanifest
```

### Why Next.js (not Vite)

| Factor | Next.js | Vite |
|--------|---------|------|
| API routes | Built-in (App Router) | Cần Express/BFF riêng |
| API key proxy | Tự nhiên, cùng domain | Cần proxy config |
| Supabase SSR | @supabase/ssr tích hợp sẵn | Phải setup thêm |
| Middleware | Built-in (auth refresh) | Không có |
| Deploy | Vercel 1-click | Cần adapt |
| **Chosen** | ✅ **v1** | ❌ |

### Data Flow (API key từ client)

```
┌───────────┐  audio chunks      ┌───────────────┐  text stream   ┌──────────┐
│ Browser    │ ──────────────────→│ Deepgram       │ ────────────→ │ React    │
│ getUserMedia│  via WebSocket   │ Nova-3 (WS)   │               │ Frontend │
│ (mic/tab)  │   + temp token    └───────────────┘               └────┬─────┘
└───────────┘                                                          │
                                                                       │
              ┌────────────────────────────────────────────────────────┤
              │                                                        │
         ┌────▼────┐                                         ┌──────────┐
         │ Next.js  │       x-api-key header                  │ DeepSeek │
         │ API Proxy│ ◄────────────────────────────────────  │   API    │
         │ (/api/*) │       (proxy nhận key từ client)       └──────────┘
         └────┬────┘
              │
         ┌────▼────┐
         │ Google   │   (chỉ khi user chọn Google provider)
         │ Translate│
         └──────────┘

API Key Flow:
1. User nhập key trong Settings → Zustand persist → localStorage
2. Client call API proxy (translate, answer, classify):
   fetch("/api/translate", { headers: { "x-api-key": key } })
3. Next.js route handler đọc header → gọi API thật (DeepSeek/Google)
4. Deepgram: client fetch GET /api/deepgram-token → nhận temp token → WebSocket
5. Key không bao giờ lộ trong source/build code
```

---

## 7. Detailed Pipeline

### Step-by-step (7 bước)

```
1. SETUP PHASE
   - Mở app trên browser
   - Settings: nhập Deepgram key (bắt buộc) + DeepSeek key (tùy chọn)
   - Chọn En→Vi (hoặc ngược lại), style STAR
   - Paste profile (3-5 câu) + JD (nếu có)
   - Optional: chọn tab cuộc gọi → bật Share tab audio
   - Bấm "Start Listening"

2. AUDIO CAPTURE
   - Kiểm tra meeting stream có audio không
     - Có → createAudioCaptureFromStream (system audio từ tab)
     - Không → getUserMedia({ audio: { deviceId } }) (mic)
   - PCM 16kHz mono, chunk 4096 samples
   - ScriptProcessorNode (không AudioWorklet — browser compatibility)
   - Echo cancellation OFF (cần clear voice)

3. STT (Deepgram WebSocket)
   - fetch /api/deepgram-token → nhận temporary token
   - WebSocket wss://api.deepgram.com/v1/listen?model=nova-3&language=...
   - Stream audio chunks → nhận interim + final transcript
   - Interim: hiện text đang nhận dạng (mờ dần)
   - Final: text chính xác (in đậm) → trigger dịch + classify + AI answer
   - Auto reconnect: 5 lần retry, exponential backoff (1s base)
   - keepAliveInterval mỗi 5s → ping WebSocket

4. TRANSLATION (tùy chọn, background)
   - Khi có final transcript → gọi translate API
   - Provider: DeepSeek (default) hoặc Google Translate
   - Cache trong session (Map: hash(text) → translated)
   - Fallback: nếu API lỗi, hiện translated = "" (im lặng bỏ qua)
   - Translation cache key = hash(finalText)
   - Bỏ qua nếu source === target hoặc provider === "none"
   - Không chặn pipeline — chạy background song song với classify

5. QUESTION TYPE DETECTION  ★ (bước mới v2.4)
   - Khi có final transcript, phân loại câu hỏi trước khi gen answer:
     - behavioral → STAR (kể về, describe a time, give me an example)
     - technical → giải thích + ví dụ (explain, how does, difference between)
     - situational → approach + giải pháp (how would you, what would you do if)
     - competency → liệt kê kinh nghiệm (liên quan JD)
   - Cơ chế fallback 2 lớp:
     Lớp 1: heuristicClassify() — regex-based, không cần API, chạy ngay
     Lớp 2: DeepSeek 1-shot classify (nếu có key) → format hint + type
   - Fallback: nếu DeepSeek lỗi → dùng kết quả heuristic
   - Output: { type, formatHint } → truyền vào prompt bước 6
   - UI hiển thị QuestionTypeBadge ngay khi classify xong (kèm status "Classifying…")

6. AI ANSWER (DeepSeek API) — tùy chọn
   - Auto trigger ngay khi có final transcript (không cần click)
   - Skip nếu không có DeepSeek key
   - Skip nếu confidence < threshold
   - Dedup: hash text → trùng thì bỏ
   - Abort controller: câu hỏi mới → abort câu cũ đang gen
   - Context prompt:
     ```
     Bạn là assistant phỏng vấn. Dựa trên:
     - Câu hỏi: [transcript gốc]
     - Loại câu hỏi: [behavioral | technical | situational | competency]
     - Hồ sơ ứng viên: [profile text]
     - JD: [job description text]

     Viết câu trả lời bằng [ngôn ngữ], format [style].
     Loại behavioral → format STAR
     Loại technical → giải thích ngắn gọn + ví dụ thực tế
     Loại situational → approach + giải pháp từng bước
     Loại competency → liệt kê kinh nghiệm liên quan JD
     Answer:
     ```
   - Streaming SSE: fetch POST /api/answer → ReadableStream
   - DeepSeek model: deepseek-chat, temp 0.7, max_tokens 1500
   - Khi answer xong → lưu vào transcript history + lưu Supabase (nếu có session)

7. POST-INTERVIEW SUMMARY  ★ (bước mới v2.4)
   - "End Session" button → stop audio + đóng Supabase session (status = "ended")
   - RecapScreen hiển thị toàn màn hình:
     - Thời gian bắt đầu/kết thúc, duration
     - Tổng số câu hỏi
     - Ngôn ngữ + style
     - Danh sách Q&A scroll được (kèm QuestionTypeBadge)
   - Nút Download: JSON (format SessionExportPayload) + TXT (markdown)
   - Nút Copy All (clipboard API)
   - Nút "Phỏng vấn mới" → clear state, đóng recap
   - Supabase lưu: sessions (profile, JD, lang, style) + questions (từng câu hỏi)
```

### Q&A Card Flow (v3.0)

Khi final transcript đến từ Deepgram:

1. Final text → tạo **QnaCard** mới ở cuối QnaMainPanel
2. Card state: `{ status: "transcribing", original: finalText, translated: null, answer: null }`
3. **translateInBackground** chạy song song → khi có kết quả → update card: `translated: "..." `
4. **classify + generateAnswer** chạy → khi có answer → update card: `answer: "...", status: "complete" `
5. Auto-scroll đến card mới nhất
6. Bottom bar interim vẫn chạy độc lập, không ảnh hưởng đến cards

### Session States

```
IDLE ──Start Listening──→ LISTENING
LISTENING ──Stop──→ SESSION PAUSED (DB session vẫn active)
SESSION PAUSED ──Start Listening──→ LISTENING (reconnect Deepgram)
LISTENING ──End Session──→ RECAP → IDLE
SESSION PAUSED ──End Session──→ RECAP → IDLE
```

### Realtime Sync

Khi user A dùng trên 2 tab, Supabase Realtime subscription đồng bộ questions giữa các tab:
- Channel: `session-questions:{sessionId}`
- Event: INSERT trên table `questions`
- Dedup: kiểm tra transcript_raw + ai_answer trùng với local history

---

## 8. Database Schema (Supabase PostgreSQL)

### Tables

```sql
-- users: Supabase Auth quản lý tự động (auth.users)
-- public.profiles: metadata cho user

create table public.profiles (
  id          uuid primary key references auth.users(id),
  email       text,
  full_name   text,
  created_at  timestamptz default now()
);

-- sessions: mỗi buổi phỏng vấn
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id),
  source_lang   text not null default 'en',
  target_lang   text not null default 'vi',
  answer_style  text not null default 'STAR',
  profile_text  text,
  jd_text       text,
  status        text not null default 'active',  -- active | ended
  started_at    timestamptz default now(),
  ended_at      timestamptz
);

-- questions: từng câu hỏi + câu trả lời
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id),
  question_type   text,
  transcript_raw  text not null,
  transcript_vi   text,
  ai_answer       text,
  answer_lang     text default 'en',
  created_at      timestamptz default now()
);

-- Indexes
create index idx_sessions_user on public.sessions(user_id);
create index idx_questions_session on public.questions(session_id);
create index idx_sessions_status on public.sessions(status);
```

### Row Level Security (RLS)

```sql
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

alter table public.sessions enable row level security;
create policy "Users can view own sessions"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.sessions for update using (auth.uid() = user_id);

alter table public.questions enable row level security;
create policy "Users can view own questions"
  on public.questions for select using (
    exists (select 1 from public.sessions
            where sessions.id = questions.session_id
            and sessions.user_id = auth.uid()));
create policy "Users can insert own questions"
  on public.questions for insert with check (
    exists (select 1 from public.sessions
            where sessions.id = questions.session_id
            and sessions.user_id = auth.uid()));
```

### Data lưu ở client vs server

| Dữ liệu | Lưu ở đâu | Lý do |
|---------|-----------|-------|
| API Keys | localStorage (Zustand persist) | Mỗi user tự nhập, không lên server |
| Profile + JD text | localStorage + sessions.profile_text / sessions.jd_text | Client cache + lưu session để xem lại |
| Transcript real-time | Zustand (memory) + Supabase questions | Memory cho hiển thị, DB cho lịch sử |
| Câu trả lời AI | Zustand (memory) + Supabase questions | Tương tự |
| Session list | Supabase sessions | Dashboard xem lại các buổi cũ |
| Settings (language, style, text size...) | localStorage (Zustand persist) | Persist giữa các phiên |

### Supabase Free Tier Limits

| Resource | Limit | Phù hợp? |
|----------|-------|----------|
| Database | 500MB | ✅ Đủ cho ~10k sessions + 100k questions |
| Auth users | 50,000 | ✅ Quá đủ |
| Realtime connections | 200 concurrent | ✅ Đủ cho phase đầu |
| Edge Functions | 500K invocations/mo | ✅ Ko cần dùng nhiều |
| Storage | 1GB | ✅ Dư |

---

## 9. Cost Estimate (per Interview Hour)

| Service | Usage | Cost/hr | Monthly (20h) |
|---------|-------|---------|---------------|
| Deepgram Nova-3 STT | 60 min streaming | $0.46 | $9.20 |
| DeepSeek Translate | ~1K chars/min (60K/hr) | ~$0.003 | ~$0.06 |
| DeepSeek API (deepseek-chat) | ~30 questions × 5K tokens | ~$0.02 | ~$0.40 |
| Supabase | Free tier (500MB DB + Auth) | $0 | $0 |
| Vercel Hosting | Free tier (100h/serverless) | $0 | $0 |
| **Total (DeepSeek dịch)** | | **~$0.48/hr** | **~$9.66/tháng** |
| **Total (Google Translate)** | | **~$1.68/hr** | **~$33.60/tháng** |

**Cost reduction:**
- Dùng DeepSeek làm provider dịch → tiết kiệm $1.20/hr so với Google Translate
- Confidence threshold filter → giảm số lần gọi AI không cần thiết
- Cache translation trong session → tránh dịch lại text trùng

---

## 10. Development Phases

### Phase 1: MVP (DONE)
- [x] Next.js + React + Tailwind project scaffolding
- [x] Supabase setup: project, Auth (Google login), tables, RLS
- [x] getUserMedia mic capture (chọn device)
- [x] Deepgram WebSocket STT → transcript real-time
- [x] Translation (DeepSeek + Google Cloud) — dual provider
- [x] Question type detection (heuristic + DeepSeek classify)
- [x] DeepSeek answer generation với type-specific prompt
- [x] Settings panel: API keys, En/Vi, mic, style, display
- [x] Profile + JD input textarea
- [x] Post-interview: lưu Supabase + recap screen + download
- [x] Copy answer button
- [x] Deploy lên Vercel

### Phase 2: Polish (DONE)
- [x] Streaming AI response (ReadableStream SSE)
- [x] Regenerate + Speak (Web Speech API TTS)
- [x] Question history (HistoryPanel) + click để xem lại
- [x] Answer language selection (En vs Vi vs Same as target)
- [x] Meeting capture (getDisplayMedia + tab audio)
- [x] Auto-scroll + pause scroll
- [x] Dark mode (mặc định)
- [x] Responsive layout (laptop vs external monitor)
- [x] Loading/skeleton states
- [x] DeepSeek làm translation provider mặc định
- [x] ExportTranscriptButton (clipboard copy)
- [x] Session detail page (/sessions/[id])

### Phase 3: Advanced (DONE)
- [x] Export transcript (copy all questions + answers)
- [x] Confidence visual indicator (bar + % + label)
- [x] Keyboard shortcuts (Space = toggle mic, R = regenerate)
- [x] PWA (install as app, offline fallback page)
- [x] Error handling + reconnection logic (Deepgram WS: 5 retries)
- [x] Supabase Auth + Google login
- [x] LoginBanner + AuthErrorBanner + ApiKeyBanner
- [x] ConnectionStatus badge (reconnecting/error/disconnected)

### Phase 4: Layout Restructure — v3.0
- [ ] Create QnaCard component (question gốc + dịch + answer + actions)
- [ ] Create QnaMainPanel component (scrollable card list + auto-scroll)
- [ ] Restructure InterviewPage layout (sidebar | main panel | bottom interim bar)
- [ ] Update TranscriptPanel: chỉ hiển thị interim text + interim translation
- [ ] Update pipeline.ts: final transcript → push card vào QnaMainPanel thay vì setState riêng
- [ ] HistoryPanel: click → scroll đến card tương ứng
- [ ] Meeting preview: collapse khi không capture
- [ ] Remove deprecated AnswerPanel (replace by QnaMainPanel)

### Phase 5: Production
- [ ] Rate limiting (in-memory bucket, 120 req/min/IP)
- [ ] Error monitoring (Sentry)
- [ ] One-click deploy template
- [ ] Manual setup guide for tab capture + mic
- [ ] Chrome Extension — capture system audio tự động (không cần chọn tab thủ công)

---

## 11. Success Criteria

- [x] Mở browser → load app → chọn mic → Start Listening → transcript xuất hiện <2 giây
- [x] Deepgram transcript accuracy >90% (mic ngoài, English)
- [x] Dịch En→Vi chính xác >85%
- [x] AI answer chất lượng, bám sát profile + JD
- [x] Meeting tab capture hoạt động với Share tab audio
- [x] Không crash/sập trang trong 2h liên tục
- [x] Tổng latency: speech → transcript → dịch → answer <3 giây
- [x] Question type detection: behavioral/technical chính xác >90%
- [x] Post-interview: lưu Supabase + download transcript JSON/TXT trong <5 giây
- [x] PWA install được như app desktop
- [x] Google Auth hoạt động — session lưu theo user

---

## 12. Confirmed Decisions

| Decision | Result |
|----------|--------|
| **Framework** | Next.js 14 App Router ✅ (không Vite) |
| **Deploy** | Vercel free tier ✅ |
| **AI answer trigger** | Auto gen khi có final transcript, không cần click ✅ |
| **Question type detection** | Phân loại behavioral/technical/situational/competency trước gen answer ✅ |
| **Post-interview summary** | Lưu Supabase + recap + download JSON/TXT ✅ |
| **Profile + JD** | Paste tay (textarea) + tool external: doctomd.com, lightpdf.com/pdf-to-markdown ✅ |
| **API keys** | Nhập từ màn hình web → localStorage, tự nhập, browser nhớ ✅ |
| **Supabase** | PostgreSQL free tier + Auth (Google login) + Realtime ✅ |
| **Translation default** | DeepSeek (dùng chung key AI, rẻ hơn Google ~40x) ✅ |
| **Meeting capture** | getDisplayMedia + tab audio (không cần mic ngoài) ✅ |
| **Session states** | Stop Listening = pause (DB active), End Session = kết thúc ✅ |
| **Realtime sync** | Supabase Realtime — đồng bộ questions giữa các tab ✅ |
| **PWA** | Install as app + offline fallback ✅ |
| **Chrome Extension** | Phase 4 — capture system audio tự động, không cần mic ngoài ✅ |

---

## 13. Project File Structure

```
interview-copilot-web/
├── package.json              # Next 14, React 18, Zustand 5, Supabase SSR
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── middleware.ts             # Supabase SSR middleware (auth refresh)
├── app/
│   ├── layout.tsx            # Root layout (fonts + AppProviders)
│   ├── page.tsx              # Main interview page (dynamic import, ssr:false)
│   ├── globals.css           # Tailwind + glass-panel styles
│   ├── offline/page.tsx      # PWA offline fallback
│   ├── auth/callback/route.ts  # OAuth callback (exchange code for session)
│   ├── sessions/
│   │   ├── page.tsx          # Session history list
│   │   └── [id]/page.tsx     # Session detail with questions
│   └── api/
│       ├── translate/route.ts         # Translation proxy (DeepSeek + Google)
│       ├── answer/route.ts            # DeepSeek answer proxy (streaming SSE)
│       ├── classify-question/route.ts # Question type classifier
│       └── deepgram-token/route.ts    # Deepgram temp token
├── components/
│   ├── InterviewPage.tsx     # Main layout orchestrator (v3.0 — 3-column: menu | Q&A main | controls)
│   ├── MicControl.tsx        # Start/Stop/End + mic device selector
│   ├── TranscriptPanel.tsx   # Bottom bar: interim + interim translation (v3.0: chỉ hiển thị interim)
│   ├── AnswerPanel.tsx       # (v3.0 deprecated) → replace with QnaMainPanel
│   ├── QnaCard.tsx           # ★ NEW (v3.0) — 1 card = question (gốc + dịch) + answer + actions
│   ├── QnaMainPanel.tsx      # ★ NEW (v3.0) — scrollable list of QnaCards, auto-scroll
│   ├── PiPZone.tsx           # Meeting capture: getDisplayMedia + preview + PiP
│   ├── SettingsModal.tsx     # Settings panel (tabbed: Keys/Interview/Profile/Display)
│   ├── ProfileInput.tsx      # Profile + JD textarea (variant: compact/default)
│   ├── RecapScreen.tsx       # Post-interview summary + download JSON/TXT
│   ├── HistoryPanel.tsx      # Question history sidebar (clickable → scroll to card)
│   ├── QuestionTypeBadge.tsx # Color-coded badge (behavioral/technical/...)
│   ├── ConnectionStatus.tsx  # Deepgram reconnecting/error badge
│   ├── ConfidenceIndicator.tsx # Mic quality bar + % + label
│   ├── ExportTranscriptButton.tsx # Copy all to clipboard
│   ├── ApiKeysSection.tsx    # API key inputs (variant: compact/default)
│   ├── ApiKeyBanner.tsx      # Warning banner when keys missing
│   ├── LoginBanner.tsx       # Prompt to login for cloud save
│   ├── AuthErrorBanner.tsx   # Auth error display (redirect failures)
│   ├── AuthButton.tsx        # Login/logout button
│   ├── InstallPwa.tsx        # PWA install prompt
│   ├── ErrorBoundary.tsx     # React error boundary
│   ├── ThemeSync.tsx         # Sync dark mode class to <html>
│   ├── providers/
│   │   ├── AppProviders.tsx  # Wraps ErrorBoundary + AuthProvider + ThemeSync
│   │   └── AuthProvider.tsx  # Supabase Auth context (Google OAuth)
│   └── ui/
│       ├── Button.tsx        # Reusable button (variant: primary/secondary/danger/ghost)
│       ├── Panel.tsx         # Glass panel container + StatusDot
│       └── Icons.tsx         # SVG icon components
├── hooks/
│   ├── useHydrated.ts        # SSR hydration guard
│   ├── useInterviewStatus.ts # Derive status tone + label from state
│   └── useSessionRealtime.ts # Subscribe to Supabase Realtime questions insert
├── lib/
│   ├── deepgram.ts           # Deepgram WebSocket client (Nova-3, reconnect)
│   ├── audio.ts              # getUserMedia + PCM 16kHz capture (ScriptProcessorNode)
│   ├── translate.ts          # Translation API client (DeepSeek/Google via proxy)
│   ├── classify.ts           # Question type classifier (heuristic + API)
│   ├── ai-answer.ts          # DeepSeek answer streaming client
│   ├── meeting-capture.ts    # getDisplayMedia + surface detection
│   ├── pipeline.ts           # Orchestrator: STT → translate → classify → answer
│   ├── session-export.ts     # Build payload, download JSON/TXT
│   ├── export-transcript.ts  # Format transcript as markdown
│   ├── api-keys.ts           # Key accessors + hasRequiredApiKeys()
│   ├── api-guard.ts          # Rate limit guard for API routes
│   ├── rate-limit.ts         # In-memory bucket rate limiter (120/min)
│   ├── server-api-key.ts     # Extract client API key from request header
│   ├── translation-config.ts # Provider detection + shouldTranslate()
│   └── supabase/
│       ├── client.ts         # Browser client factory
│       ├── server.ts         # Server client factory (cookies)
│       ├── middleware.ts     # SSR session refresh
│       ├── env.ts            # NEXT_PUBLIC_SUPABASE_* accessors
│       ├── sessions.ts       # CRUD: create/end/fetch sessions + questions
│       └── realtime.ts       # Subscribe to questions INSERT events
├── stores/
│   ├── transcript.ts         # Zustand: interim/final text, translation, history, cache
│   ├── settings.ts           # Zustand + persist: API keys, language, style, display
│   ├── answer.ts             # Zustand: current answer + question type + loading state
│   ├── meeting-stream.ts     # Zustand: shared MediaStream reference
│   ├── recap.ts              # Zustand: recap visibility + meta
│   └── interview-session.ts  # Zustand: current Supabase session ID
└── types/
    ├── index.ts              # Core types (QuestionType, Settings, QuestionHistoryItem...)
    ├── database.ts           # Supabase table types (InterviewSession, SessionQuestion...)
    └── supabase.ts           # Generated Database type
```

---

## 14. Known Issues & Technical Debt

### 14.1 Known Issues (cần fix)

| # | Issue | Severity | Root Cause | Fix |
|---|-------|----------|------------|-----|
| 1 | **Rate limit không có tác dụng trên Vercel** | HIGH | `lib/rate-limit.ts` dùng in-memory Map — Vercel serverless mỗi request đến instance khác, bucket không được share | Dùng Upstash Redis rate limit hoặc xoá rate limit (ít user) |
| 2 | **Translation race condition lưu question** | MEDIUM | `pipeline.ts` line 128-131: khi lưu question, dùng `translatedText || cache || text` — nếu translate chưa kịp chạy xong, question lưu text gốc thay vì bản dịch | Await translation promise trước khi lưu, hoặc lưu translatedText riêng sau |
| 3 | **Module-level state leak khi multi-tab** | MEDIUM | `pipeline.ts` dùng let variables global (deepgramClient, audioCapture, answerAbort) — nếu mở 2 tab cùng domain, audio/WebSocket leak | Wrap pipeline vào class instance hoặc dùng Zustand store |
| 4 | **ScriptProcessorNode deprecated** | LOW | `lib/audio.ts` dùng `createScriptProcessor` (deprecated từ 2014). Chrome vẫn hỗ trợ nhưng console warning. Khi Chrome drop, app hỏng | Migrate sang AudioWorklet + AudioWorkletProcessor |
| 5 | **Vercel custom header x-api-key** | MEDIUM | Cần test: Vercel edge có strip custom headers không. Header `x-api-key` gửi từ client đến Next.js API proxy | Dùng prefix `x-hermes-` hoặc gửi trong body, test production deploy |
| 6 | **Transcript dedup quá aggressive** | LOW | `hashText = trim().toLowerCase()` — 2 câu khác nhau bắt đầu giống bị dedup | Thêm độ dài hoặc full string hash vào key |

### 14.2 Technical Debt & Cải tiến

| # | Cải tiến | Priority | Lý do | Cách làm |
|---|----------|----------|-------|----------|
| 1 | **AudioWorklet thay ScriptProcessorNode** | MEDIUM | Ổn định hơn, ít latency, không deprecated | Tạo AudioWorkletProcessor trong worker riêng, pipeline.ts gọi |
| 2 | **Pipeline state isolation** | MEDIUM | Tránh conflict khi mở 2 tab | Wrap module-level let variables vào class PipelineManager, mỗi instance độc lập |
| 3 | **End Session loading state** | LOW | UX: khi end session gọi Supabase update, UI không feedback | Thêm loading spinner + disable nút |
| 4 | **Translation lưu async** | MEDIUM | Translation chạy background, không block AI answer | `saveQuestionToSession` await translation promise hoặc cập nhật sau khi dịch xong |
| 5 | **API key header hardening** | LOW | Tránh bị Vercel edge strip | Đổi header prefix hoặc merge vào body JSON |
| 6 | **Error boundary cho từng panel** | LOW | ErrorBoundary hiện tại bao toàn bộ app — crash 1 panel → crash cả trang | ErrorBoundary riêng cho AnswerPanel, TranscriptPanel, PiPZone |

### 14.3 Security Audit

| Mục | Status | Notes |
|-----|--------|-------|
| **API keys trong localStorage** | ✅ OK | Không gửi lên server — chỉ dùng trong client header |
| **XSS: no dangerouslySetInnerHTML** | ✅ OK | Toàn bộ render dùng React text nodes, ko có innerHTML |
| **Supabase RLS** | ✅ OK | Row Level Security cho profiles, sessions, questions |
| **Auth callback redirect** | ✅ OK | OAuth code exchange — redirect về /, ko open redirect |
| **Rate limit (production)** | ❌ Cần fix | In-memory không hoạt động trên Vercel serverless |
| **API key header trên Vercel** | ⚠️ Cần test | Edge function có thể strip custom headers |

### 14.4 Production Readiness Checklist

- [x] Build sạch, 0 lỗi, 0 warning
- [x] Bundle size: 88.8KB first load
- [x] PWA: service worker + manifest + offline fallback
- [x] Deepgram reconnect: 5 retries, exponential backoff
- [ ] Rate limit: Upstash Redis (thay in-memory)
- [ ] ScriptProcessorNode → AudioWorklet
- [ ] Pipeline state isolation
- [ ] Production deploy + custom header test
- [ ] Error monitoring (Sentry)
- [ ] One-click deploy template (Vercel + Supabase)

---

## 15. Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | - | Initial spec: Vite + Google Translate only |
| v2.0 | - | Transition to Next.js App Router |
| v2.1 | - | Meeting capture (getDisplayMedia) |
| v2.2 | - | Supabase Auth + Realtime sync |
| v2.3 | - | PWA + Polish phase features |
| v2.4 | - | Question type detection, Post-interview summary, Chrome Extension (Phase 4) |
| v2.5 | - | Match source code: dual translation provider, DeepSeek default, full file structure, session states, 3-phase DONE |
| v2.6 | Current | Known Issues & Technical Debt section, Security audit, Production readiness checklist |
| v3.0 | Current | **Layout restructure** — Unified Q&A Flow: gộp transcript + answer vào 1 main panel trung tâm, bottom bar chỉ interim, translation trong card Q&A (ngôn ngữ gốc trước), history panel clickable |

---
