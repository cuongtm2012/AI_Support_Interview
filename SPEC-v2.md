# Interview Copilot — PRD & Technical Specification v4.1

> **Web app hỗ trợ phỏng vấn online bằng AI** — full màn hình, capture tab cuộc gọi (system audio), real-time STT + dịch tùy chọn + gợi ý câu trả lời theo loại câu hỏi. Hỗ trợ **nhiều bộ Profile + JD** (presets), upload CV/JD, và phân tích AI trước buổi phỏng vấn.

**Source of truth:** commit `60751a6` trên branch `main`.

---

## 1. Mục tiêu (Objectives)

- [ ] Web app full màn hình — dễ đọc transcript, bản dịch và câu trả lời AI
- [ ] Capture tab YouTube/Meet/Teams bằng Screen Capture API (getDisplayMedia) — lấy cả audio hệ thống, không cần mic ngoài
- [ ] Capture âm thanh từ microphone làm fallback → Deepgram Nova-3 STT real-time → dịch En↔Vi
- [x] Upload profile + JD — paste, **upload PDF/DOCX/TXT/MD**, hoặc nhiều **preset** (mỗi buổi PV một bộ)
- [x] **Phân tích Profile ↔ JD** (DeepSeek) trước buổi phỏng vấn — match, gap, câu hỏi dự đoán
- [x] **Bắt buộc** Profile + JD đủ trước khi Start Listening (tránh nhầm bộ / quên nhập)
- [ ] Chạy trên browser (macOS + Windows), không cần cài đặt
- [ ] Auth + lưu lịch sử phỏng vấn qua Supabase (Google login)
- [ ] PWA — install như app desktop

## 2. Non-Goals

- [ ] KHÔNG phải desktop app — đây là web app chạy trên browser
- [ ] KHÔNG can thiệp vào Zoom/Meet/Teams (chỉ capture tab audio)
- [ ] KHÔNG ghi âm/lưu trữ raw audio — chỉ transcript + answer
- [ ] KHÔNG làm tính năng luyện tập / mock interview
- [ ] Chrome Extension **không phải luồng chính** — có MVP stub (`extension/`) nhưng web app vẫn dùng Share tab audio thủ công

---

## 3. Core Use Cases

### UC1: Phỏng vấn với người Mỹ (English → Vietnamese)

1. Mở app trên browser trước buổi phỏng vấn
2. Settings → **Profile & JD**: chọn hoặc tạo preset (vd: "AWS SAA"), paste/upload Profile + JD
3. Bấm **Phân tích** (cần DeepSeek key) → xem match/gap/câu hỏi dự đoán
4. Settings → Keys: Deepgram (bắt buộc), DeepSeek (AI answer + phân tích)
5. Settings → Interview: Source = English, Target = Vietnamese, Answer lang = **Same as source**
6. Optional: bấm "Chọn tab" → chọn tab cuộc gọi → bật "Share tab audio"
7. Bấm "Start Listening" (chặn nếu thiếu Profile/JD hoặc Deepgram key) → Supabase session + Deepgram WS
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

Modal full-screen capable: **sidebar nav** (desktop) + tab strip (mobile), nút **Phóng to / Thu nhỏ**, footer trạng thái theo tab. Mặc định mở tab **Profile & JD** khi đã có Deepgram key.

### Tab: API Keys — localStorage (Zustand persist v6)

| Setting | Required | Notes |
|---------|----------|-------|
| Deepgram API Key | ✅ Bắt buộc | Cho STT real-time (Nova-3) |
| DeepSeek API Key | ❌ Tùy chọn | Cho AI answer + dịch (mặc định) + **Phân tích Profile↔JD** |

DeepSeek key vừa dùng cho AI answer, translation mặc định, và phân tích preset.
Google Translate key: chỉ hiện khi user chọn `google` trong Translation Provider.

### Tab: Profile & JD — Interview Presets ★ (v4.1)

| Feature | Notes |
|---------|-------|
| **Interview Presets** | Nhiều bộ `{ name, profileText, jdText, analysis, analyzedAt }` — mỗi buổi PV một bộ |
| Preset selector | Chip/pill chọn bộ; **+ Mới**, **Xóa**, đổi tên inline |
| Workflow steps | Chọn bộ → Profile → JD → Phân tích (badge OK/Trống từng ô) |
| Profile / JD | 2 cột (desktop); textarea + **Upload PDF / DOCX / TXT / MD** |
| **Phân tích** | `POST /api/analyze-profile` — match, điểm mạnh, gap, câu hỏi dự đoán, STAR (tiếng Việt) |
| Readiness gate | `presetReadiness()` — thiếu Profile hoặc JD → banner + **MicControl chặn Start** |
| Maximize modal | Full viewport — textarea + kết quả phân tích cao hơn |

Denormalized: `settings.profileText` / `settings.jdText` luôn sync với **active preset** — pipeline & AI đọc từ đây.

**Type `InterviewPreset`** (`types/index.ts`):

```typescript
interface InterviewPreset {
  id: string;
  name: string;
  profileText: string;
  jdText: string;
  analysis: string | null;
  analyzedAt: number | null;
  updatedAt: number;
}
```

Zustand persist **version 6**: migrate từ single profile/jd → `interviewPresets[]` + `activePresetId`.

External fallback: [doctomd.com](https://doctomd.com) cho convert phức tạp.

### Tab: Interview — Language & Style

| Setting | Options | Default | Notes |
|---------|---------|---------|-------|
| Translation Provider | none / deepseek / google | deepseek | Mặc định DeepSeek (dùng chung key AI) |
| Source Language | En, Vi | English | Ngôn ngữ interviewer nói (STT) |
| Target Language | Vi, En | Vietnamese | Ngôn ngữ dịch sang |
| Answer Style | STAR, Professional, Casual, Concise, Technical | STAR | Format câu trả lời AI |
| Answer Language | Vietnamese, English, Same as target, **Same as source** | **Same as source** | Ngôn ngữ gợi ý trả lời — mặc định theo STT lang |
| Confidence Threshold | 0.5 - 1.0 | 0.70 | Lọc final transcript trước khi gen AI answer |

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
   - Settings → Profile & JD: chọn/tạo preset, paste hoặc upload Profile + JD
   - Optional: Phân tích Profile↔JD (DeepSeek)
   - Settings → Keys: Deepgram (bắt buộc), DeepSeek (AI + dịch + phân tích)
   - Settings → Interview: ngôn ngữ, style, answer lang (default Same as source)
   - Optional: chọn tab cuộc gọi → bật Share tab audio
   - Bấm "Start Listening" (gate: keys OK + preset có đủ profile & jd)

2. AUDIO CAPTURE
   - Kiểm tra meeting stream có audio không
     - Có → createAudioCaptureFromStream (system audio từ tab)
     - Không → getUserMedia({ audio: { deviceId } }) (mic)
   - PCM 16kHz mono, chunk 4096 samples
   - **AudioWorklet** (`pcm-processor`) ưu tiên; fallback **ScriptProcessorNode** nếu Worklet fail
   - `audioContext.resume()` khi browser suspend context
   - Echo cancellation OFF (cần clear voice)

3. STT (Deepgram WebSocket)
   - fetch /api/deepgram-token → nhận temporary token
   - WebSocket wss://api.deepgram.com/v1/listen?model=nova-3&language=...
   - Stream audio chunks → nhận interim + final transcript
   - Interim: hiện text đang nhận dạng (bottom bar) + interim translation
   - Final segments → **merge buffer** (debounced), không flush ngay từng segment
   - Deepgram params tuning (lecture/video friendly):
     - `endpointing: "2200"` — chờ lâu hơn trước end-of-phrase
     - `utterance_end_ms: "4500"` — utterance-level pause
     - `vad_events: "true"` — VAD events cho client logic
   - Auto reconnect: 5 lần retry, exponential backoff (1s base)
   - keepAliveInterval mỗi 10s → ping WebSocket

4. TRANSLATION (tùy chọn, background)
   - Khi có final transcript → gọi translate API
   - Provider: DeepSeek (default) hoặc Google Translate
   - Cache trong session (Map: hash(text) → translated)
   - Fallback: nếu API lỗi, hiện translated = "" (im lặng bỏ qua)
   - Translation cache key = hash(finalText)
   - Bỏ qua nếu source === target hoặc provider === "none"
   - Không chặn pipeline — chạy background song song với classify

5. QUESTION EXTRACTION & FILTER  ★ (v4.1)
   - Trước classify/answer, gom merge buffer → `extractPrimaryQuestion()`:
     - Regex tìm câu có `?` + question starter (what/how/tell me about/…)
     - Loại lecture/promo noise (`isLectureMonologue()` — YouTube, "never give up", v.v.)
   - **Không phải câu hỏi PV** → chỉ dịch (nếu bật), lưu transcript, **skip AI answer**
   - **Là câu hỏi PV** → tiếp classify + gen answer
   - Heuristic + DeepSeek classify (behavioral/technical/situational/competency) — giữ nguyên v2.4

6. AI ANSWER (DeepSeek API) — tùy chọn
   - Auto trigger sau question extract (không cần click)
   - Skip nếu không có DeepSeek key, confidence < threshold, hoặc không extract được câu hỏi
   - Dedup: hash text → trùng thì bỏ
   - Abort controller: câu hỏi mới → abort câu cũ đang gen
   - Answer language: `resolveAnswerLanguageLabel()` — **Same as source** = ngôn ngữ STT
   - Prompt hardening: trả lời bằng ngôn ngữ đích, giọng ứng viên (first person), bám profile + JD
   - Context prompt:
     ```
     Bạn là assistant phỏng vấn. Dựa trên:
     - Câu hỏi: [extracted question]
     - Loại câu hỏi: [behavioral | technical | situational | competency]
     - Hồ sơ ứng viên: [profile text — active preset]
     - JD: [job description — active preset]

     Viết câu trả lời bằng [ngôn ngữ], format [style].
     Answer:
     ```
   - Streaming SSE: fetch POST /api/answer → ReadableStream
   - DeepSeek model: deepseek-chat, temp 0.7, max_tokens 1500
   - Khi answer xong → await translation → lưu Supabase (nếu có session)

7. POST-INTERVIEW SUMMARY  ★ (v2.4, unchanged)
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

### Q&A Card Flow (v4.1 — Debounced Merge + Question Extract)

Khi **final segment** đến từ Deepgram:

1. Segment append vào **merge buffer** của card hiện tại (`mergeTranscriptFragments` — overlap-aware)
2. **Không** flush ngay — schedule debounce:
   - Idle **8s** (bài giảng / câu dài) hoặc **5.5s** sau câu kết thúc `?`
   - Force flush sau **18s** silence hoặc **≥180 từ**
   - Min **12 từ** trước khi flush (tránh card rác)
3. `UtteranceEnd` / VAD: reschedule debounce, **không** flush ngay lập tức
4. Khi flush → `processQnaCard()`:
   - `extractPrimaryQuestion()` → hiển thị câu hỏi đã extract (hoặc full text)
   - Monologue / không phải câu hỏi → translate only, status `complete`, no answer
   - Câu hỏi PV → classify → stream answer; **await translation** trước save Supabase
5. Auto-scroll đến card mới nhất
6. Bottom bar interim chạy độc lập

**Pipeline state:** per-tab isolation qua `lib/pipeline-state.ts` (`global.__icPipelineStates`)

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
| API Keys | localStorage (Zustand persist v6) | Mỗi user tự nhập, không lên server |
| **Interview presets** | localStorage `interviewPresets[]` + `activePresetId` | Nhiều bộ Profile/JD/analysis |
| Profile + JD text | localStorage (active preset) + `sessions.profile_text` / `sessions.jd_text` | Client cache + lưu session để xem lại |
| Preset analysis | localStorage trên preset (`analysis`, `analyzedAt`) | Không sync Supabase — chỉ local |
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
- [x] Create QnaCard component (question gốc + dịch + answer + actions)
- [x] Create QnaMainPanel component (scrollable card list + auto-scroll)
- [x] Restructure InterviewPage layout (sidebar | main panel | bottom interim bar)
- [x] Update TranscriptPanel: chỉ hiển thị interim text + interim translation
- [x] Update pipeline.ts: final transcript → push card vào QnaMainPanel thay vì setState riêng
- [x] HistoryPanel: click → scroll đến card tương ứng
- [x] Meeting preview: collapse khi không capture
- [x] Remove deprecated AnswerPanel (replace by QnaMainPanel)

### Phase 5: Production (DONE)
- [x] Rate limiting (Upstash Redis + in-memory fallback, 120 req/min/IP)
- [x] Error monitoring (Sentry — optional via `NEXT_PUBLIC_SENTRY_DSN`)
- [x] One-click deploy template (`docs/DEPLOY.md`)
- [x] Manual setup guide for tab capture + mic (`docs/DEPLOY.md` §4)
- [x] Chrome Extension MVP stub (`extension/` — tabCapture popup)
- [x] AudioWorklet + ScriptProcessor fallback (`lib/audio.ts`)
- [x] Pipeline per-tab state (`lib/pipeline-state.ts`)

### Phase 6: Profile Presets & Smart Pipeline (DONE) ★ v4.1
- [x] Interview presets — multi Profile+JD sets (`stores/settings.ts` v6 migrate)
- [x] Document upload PDF/DOCX/TXT/MD (`lib/document-import.ts`)
- [x] Profile↔JD analysis API + UI (`/api/analyze-profile`, `AnalysisPanel`)
- [x] Settings modal redesign — sidebar, workflow steps, maximize mode
- [x] Preset readiness gate — banner + MicControl block Start
- [x] Question extract + lecture/monologue filter (`lib/question-extract.ts`)
- [x] Debounced transcript merge — lecture-friendly (`lib/transcript-merge.ts`, `lib/pipeline.ts`)
- [x] Answer language **Same as source** default + `lib/answer-language.ts`
- [x] AI prompt hardening — candidate voice, source language

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
- [x] Nhiều preset Profile+JD — chọn đúng bộ, upload document, phân tích trước PV
- [x] Lecture/monologue STT không trigger AI answer nhầm

---

## 12. Confirmed Decisions

| Decision | Result |
|----------|--------|
| **Framework** | Next.js 14 App Router ✅ (không Vite) |
| **Deploy** | Vercel free tier ✅ |
| **AI answer trigger** | Auto gen khi có final transcript, không cần click ✅ |
| **Question type detection** | Phân loại behavioral/technical/situational/competency trước gen answer ✅ |
| **Post-interview summary** | Lưu Supabase + recap + download JSON/TXT ✅ |
| **Profile + JD** | Paste + **upload PDF/DOCX/TXT/MD** + **nhiều preset** + phân tích AI ✅ |
| **Start Listening gate** | Bắt buộc Profile + JD đủ trên active preset ✅ |
| **Answer language default** | Same as source (STT lang) ✅ |
| **API keys** | Nhập từ Settings → localStorage (Zustand persist v6) ✅ |
| **Supabase** | PostgreSQL + Auth (Google) + Realtime ✅ |
| **Translation default** | DeepSeek (dùng chung key AI) ✅ |
| **Meeting capture** | getDisplayMedia + Share tab audio ✅ |
| **Session states** | Stop Listening = pause; End Session = kết thúc ✅ |
| **PWA** | Install as app + offline fallback ✅ |
| **Chrome Extension** | MVP stub only — web Share tab audio vẫn là luồng chính ✅ |

---

## 13. Project File Structure

```
interview-copilot-web/
├── package.json              # Next 14, React 18, Zustand 5, pdfjs-dist, mammoth, Supabase SSR
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── extension/                # Chrome Extension MVP stub (tabCapture — chưa tích hợp web app)
├── public/
│   ├── manifest.webmanifest  # PWA manifest
│   └── sw.js                 # Service worker (precache + offline fallback)
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
│       ├── analyze-profile/route.ts   # ★ Profile↔JD analysis (DeepSeek, Vietnamese MD)
│       ├── classify-question/route.ts # Question type classifier
│       └── deepgram-token/route.ts    # Deepgram temp token
├── components/
│   ├── InterviewPage.tsx     # Main layout orchestrator (v3.0 — 3-column: menu | Q&A main | controls)
│   ├── MicControl.tsx        # Start/Stop/End + mic selector + preset readiness gate
│   ├── TranscriptPanel.tsx   # Bottom bar: interim + interim translation only
│   ├── QnaCard.tsx           # 1 card = question (gốc + dịch) + answer + actions
│   ├── QnaMainPanel.tsx      # Scrollable QnaCard list, auto-scroll
│   ├── PiPZone.tsx           # Meeting capture: getDisplayMedia + preview + PiP
│   ├── SettingsModal.tsx     # Sidebar nav, maximize, tabs: Keys / Profile&JD / Interview / Display
│   ├── ProfileInput.tsx      # Presets, upload, workflow steps, AnalysisPanel
│   ├── ProfilePresetBanner.tsx # Banner when active preset missing profile/JD
│   ├── RecapScreen.tsx       # Post-interview summary + download JSON/TXT
│   ├── HistoryPanel.tsx      # Question history sidebar (click → scroll to card)
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
│   ├── PanelErrorBoundary.tsx # Per-panel error boundaries
│   ├── ServiceWorkerRegister.tsx # PWA SW (production only)
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
│   ├── audio.ts              # AudioWorklet (preferred) + ScriptProcessor fallback, PCM 16kHz
│   ├── translate.ts          # Translation API client (DeepSeek/Google via proxy)
│   ├── classify.ts           # Question type classifier (heuristic + API)
│   ├── ai-answer.ts          # DeepSeek answer streaming client
│   ├── analyze-profile.ts    # Client helper → POST /api/analyze-profile
│   ├── answer-language.ts    # resolveAnswerLanguageLabel / resolveAnswerLangCode
│   ├── question-extract.ts   # extractPrimaryQuestion, lecture/monologue filter
│   ├── document-import.ts    # PDF (pdfjs-dist), DOCX (mammoth), TXT/MD extract
│   ├── interview-preset-utils.ts # createInterviewPreset, presetReadiness
│   ├── transcript-merge.ts   # mergeTranscriptFragments, wordCount, endsWithQuestion
│   ├── pipeline-state.ts     # Per-tab PipelineState + merge debounce timers
│   ├── interim-translate.ts  # Debounced interim translation for bottom bar
│   ├── monitoring.ts         # Sentry browser init + captureError
│   ├── meeting-capture.ts    # getDisplayMedia + surface detection
│   ├── pipeline.ts           # Orchestrator: STT → merge → extract → translate → classify → answer
│   ├── session-export.ts     # Build payload, download JSON/TXT
│   ├── export-transcript.ts  # Format transcript as markdown
│   ├── api-keys.ts           # Key accessors + hasRequiredApiKeys()
│   ├── api-guard.ts          # Rate limit guard for API routes
│   ├── rate-limit.ts         # Upstash Redis sliding window + in-memory fallback
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
│   ├── transcript.ts         # Zustand: qnaCards, interim, translation cache
│   ├── settings.ts           # Zustand v6 persist: keys, presets, activePresetId, language, style
│   ├── meeting-stream.ts     # Zustand: shared MediaStream reference
│   ├── recap.ts              # Zustand: recap visibility + meta
│   └── interview-session.ts  # Zustand: current Supabase session ID
└── types/
    ├── index.ts              # Core types (InterviewPreset, Settings, QnaCard, TranslationProvider...)
    ├── database.ts           # Supabase table types (InterviewSession, SessionQuestion...)
    └── supabase.ts           # Generated Database type
```

---

## 14. Known Issues & Technical Debt

### 14.1 Known Issues (cần fix)

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | **Rate limit trên Vercel** | HIGH | ✅ Fixed | Upstash Redis khi có `UPSTASH_*` env; fallback in-memory dev |
| 2 | **Translation race khi lưu question** | MEDIUM | ✅ Fixed | `processQnaCard` await `translatedPromise` trước `saveQuestionToSession` |
| 3 | **Pipeline state leak multi-tab** | MEDIUM | ✅ Fixed | Per-tab `PipelineState` trong `lib/pipeline-state.ts` |
| 4 | **ScriptProcessorNode deprecated** | LOW | ✅ Mitigated | AudioWorklet ưu tiên; ScriptProcessor fallback |
| 5 | **Vercel custom header x-api-key** | MEDIUM | ⚠️ Open | Header + body `apiKey` fallback — cần test production deploy |
| 6 | **Deepgram cắt câu (lecture/video)** | HIGH | ✅ Fixed | endpointing 2200ms, utterance_end 4500ms + debounced merge + question extract |
| 7 | **Monologue YouTube treated as questions** | MEDIUM | ✅ Fixed | `question-extract.ts` + skip AI answer for non-questions |
| 8 | **Preset analysis không sync cloud** | LOW | Open | Analysis chỉ localStorage — chưa lưu Supabase |

### 14.2 Technical Debt & Cải tiến

| # | Cải tiến | Priority | Status | Notes |
|---|----------|----------|--------|-------|
| 1 | **End Session loading state** | LOW | Open | Spinner + disable nút khi gọi Supabase |
| 2 | **Production deploy + header test** | MEDIUM | Open | Verify `x-api-key` trên Vercel production |
| 3 | **Preset sync Supabase** | LOW | Open | Lưu presets theo user_id trên cloud |
| 4 | **Chrome Extension integration** | LOW | Open | Stub `extension/` chưa nối web app |

### 14.3 Security Audit

| Mục | Status | Notes |
|-----|--------|-------|
| **API keys trong localStorage** | ✅ OK | Không gửi lên server — chỉ dùng trong client header |
| **XSS: no dangerouslySetInnerHTML** | ✅ OK | Toàn bộ render dùng React text nodes, ko có innerHTML |
| **Supabase RLS** | ✅ OK | Row Level Security cho profiles, sessions, questions |
| **Auth callback redirect** | ✅ OK | OAuth code exchange — redirect về /, ko open redirect |
| **Rate limit (production)** | ✅ OK | Upstash Redis khi có env; fallback in-memory dev |
| **API key header trên Vercel** | ✅ OK | Header + body `apiKey` fallback |

### 14.4 Production Readiness Checklist

- [x] Build sạch, 0 lỗi, 0 warning
- [x] Bundle size: 88.8KB first load
- [x] PWA: service worker + manifest + offline fallback
- [x] Deepgram reconnect: 5 retries, exponential backoff
- [x] Rate limit: Upstash Redis (thay in-memory)
- [x] ScriptProcessorNode → AudioWorklet (fallback ScriptProcessor)
- [x] Pipeline state isolation (per-tab `pipeline-state.ts`)
- [ ] Production deploy + custom header test
- [x] Error monitoring (Sentry)
- [x] One-click deploy template (Vercel + Supabase)

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
| v3.0 | - | **Layout restructure** — Unified Q&A Flow: gộp transcript + answer vào main panel, bottom bar chỉ interim |
| v4.0 | - | **STT tuning + debounced merge** — endpointing 2200ms, utterance_end 4500ms, lecture-friendly flush |
| v4.1 | **Current** | **Interview presets**, document upload, Profile↔JD analysis, Settings modal redesign + maximize, question extract + monologue filter, Same as source default, AI prompt hardening |

---
