# Interview Copilot — PRD & Technical Specification v2.4

> **Web app hỗ trợ phỏng vấn online bằng AI** — full màn hình, inject webcam/meeting vào góc, real-time dịch + đề xuất câu trả lời.

---

## 1. Mục tiêu (Objectives)

- [ ] Web app full màn hình — dễ đọc transcript, bản dịch và câu trả lời AI
- [ ] Inject màn hình Zoom/Meet/Teams vào 1 góc để anh vẫn nhìn thấy interviewer
- [ ] Capture âm thanh từ mic ngoài → Deepgram STT real-time → dịch En → Vi
- [ ] Upload profile ngắn + JD → AI gợi ý câu trả lời chuẩn context
- [ ] Chạy trên browser (macOS + Windows), không cần cài đặt

## 2. Non-Goals

- [ ] KHÔNG phải desktop app — đây là web app chạy trên browser
- [ ] KHÔNG can thiệp vào Zoom/Meet/Teams (chỉ inject webcam bằng Picture-in-Picture)
- [ ] KHÔNG ghi âm/lưu trữ toàn bộ buổi phỏng vấn
- [ ] KHÔNG làm tính năng luyện tập / mock interview
- [ ] KHÔNG làm desktop overlay (bỏ vì đổi hướng web app)

---

## 3. Core Use Cases

### UC1: Phỏng vấn với người Mỹ (English → Vietnamese)

1. Anh mở app trên browser trước buổi phỏng vấn
2. Chọn: Source = English, Target = Vietnamese
3. Upload profile + JD (nếu có)
4. Anh bắt đầu cuộc gọi Zoom/Meet/Teams — chuyển sang chế độ Picture-in-Picture
5. Kéo cửa sổ PiP vào 1 góc của app
6. Interviewer hỏi → app real-time hiện:
   - **[Transcript]** "Tell me about a time you handled a difficult situation"
   - **[Dịch]** "Hãy kể về một lần bạn xử lý tình huống khó khăn"
   - **[Gợi ý]** Câu trả lời bằng tiếng Anh, format dựa trên loại câu hỏi, dựa trên profile + JD
7. Anh đọc và trả lời theo

### UC2: Phỏng vấn với người Việt (Vietnamese → English)
- Source = Vietnamese, Target = English
- Dùng khi interviewer nói tiếng Việt nhưng anh muốn kiểm tra lại bản dịch
- Câu trả lời gợi ý bằng tiếng Anh để anh reply

---

## 4. UX & Layout (Web App Full Screen)

### Main Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 INTERVIEW COPILOT                              ⚙️ SETTINGS │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────────────────────────────┐  │
│  │ 📹 MEETING    │  │  💬 AI SUGGESTED ANSWER              │  │
│  │  (PiP)        │  │                                      │  │
│  │  ╔══════════╗ │  │  [Behavioral] Question:              │  │
│  │  ║  Zoom/   ║ │  │  "Tell me about a time..."          │  │
│  │  ║  Teams   ║ │  │  ─────────────────────────────────  │  │
│  │  ║  embed   ║ │  │  Answer (STAR):                     │  │
│  │  ╚══════════╝ │  │  Situation: At my previous role...  │  │
│  │              │  │  Task: I needed to...               │  │
│  └──────────────┘  │  Action: I implemented...            │  │
│                     │  Result: Increased...                │  │
│                     │                                      │  │
│                     │  [Copy] [Regenerate] [Speak]         │  │
│                     └──────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🎤 [LISTENING]                                          ││
│  │  EN: Tell me about a time you handled a difficult...    ││
│  │  🌐 [Translated]                                         ││
│  │  VI: Hãy kể về một lần bạn xử lý tình huống khó khăn   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [🎙️ Start Listening]  [Profile: Senior Dev @ ABC]          │
└─────────────────────────────────────────────────────────────┘
```

### Key UX Decisions

| Decision | Why |
|----------|-----|
| Full màn hình | Dễ đọc chữ lớn, transcript + dịch + gợi ý cùng 1 màn hình |
| Meeting inject ở góc trái | Nhìn thấy interviewer + cử chỉ, ko chiếm nhiều space |
| Answer panel bên phải | Phần quan trọng nhất — dễ đọc, dễ copy |
| Bottom bar = transcript + dịch | Dòng chảy tự nhiên: nghe → thấy transcript → thấy dịch |
| Question type badge trên answer | Biết ngay câu này behavioral/technical, đỡ bỡ ngỡ |

### Zoom/Meet/Teams Injection

| Approach | Works? | Notes |
|----------|--------|-------|
| **Picture-in-Picture (PiP)** — browser API | ✅ Best | Zoom/Meet/Teams đều hỗ trợ PiP. Anh click PiP → kéo cửa sổ vào góc app |
| **Screen Capture (getDisplayMedia)** — capture tab | ⚠️ | Phức tạp, cần permission |
| **iframe embed** | ❌ | Zoom/Meet chặn iframe embedding |

**Recommendation:** Dùng **PiP mode**. Zoom/Meet đều có nút Picture-in-Picture. Anh chỉ cần:
1. Mở cuộc gọi trên browser
2. Click PiP button
3. Kéo cửa sổ PiP vào góc trái của app Interview Copilot

→ Không cần hack/code gì, browser tự hỗ trợ.

### Alternative (nếu PiP ko đẹp): Picture Window Overlay

Trên macOS, anh có thể dùng **Amphetamine + cửa sổ Zoom nổi**. Trên Windows, Zoom/Meet có tính năng "Always on Top" sẵn.

---

## 5. Settings Panel (⚙️)

### Language & Style

| Setting | Options | Default | Notes |
|---------|---------|---------|-------|
| Source Language | En, Vi | English | En/Vi đơn giản, ko cần auto-detect |
| Target Language | Vi, En | Vietnamese | Dịch qua lại giữa 2 ngôn ngữ |
| Answer Style | STAR, Professional, Casual, Concise, Technical | STAR | Format câu trả lời |
| Answer Language | Vietnamese, English, Same as target | Same as target | Gợi ý bằng ngôn ngữ nào |

### API Keys (nhập từ web → localStorage)

| Setting | Notes |
|---------|-------|
| Deepgram API Key | Required — nhập 1 lần, browser nhớ |
| DeepSeek API Key | Required — nhập 1 lần, browser nhớ |
| Google Translate API Key | Optional — nếu thiếu sẽ bỏ qua dịch |

### Profile & Hardware

| Setting | Options | Default | Notes |
|---------|---------|---------|-------|
| Mic Device | List detected devices | System default | Chọn mic ngoài |
| Profile Text | Textarea (short) + [Convert DOC/PDF → MD] | Empty | Mô tả ngắn: kinh nghiệm, skills, role |
| JD URL / Text | Textarea (short) + [Convert DOC/PDF → MD] | Empty | Paste hoặc upload — tool external: doctomd.com, lightpdf.com/pdf-to-markdown |
| Confidence Threshold | 0.5 - 1.0 | 0.7 | Deepgram confidence filter |
| Text Size | Small / Medium / Large | Large | Đọc dễ trên màn hình |

---

## 6. Technical Architecture

### Web Stack (No Electron)

```
Layer                    Technology
────────────────────────────────────────────────────
Frontend                 React 18 + TypeScript + Tailwind + Vite
State Management         Zustand (lightweight)
Audio Capture            getUserMedia (browser mic API)
STT Engine               Deepgram Nova-3 (WebSocket real-time)
Translation              Google Cloud Translation API
| AI Answer Generation     | DeepSeek (API — rẻ hơn GPT-4o-mini ~10x, chất lượng tương đương)
Meeting Inject           Browser Picture-in-Picture (manual)
Database + Auth          Supabase (PostgreSQL free tier)
Realtime                 Supabase Realtime subscriptions
Hosting / Deploy         Vercel (free tier — 100h serverless/tháng)
Backend                  Next.js API routes + Supabase SDK
```

### Why Web (not Electron)

| Factor | Web App | Electron |
|--------|---------|----------|
| Setup | Open browser = done | Cài npm, build, package |
| Update | Refresh = update | Cần rebuild |
| Audio capture | getUserMedia ✅ | Cũng getUserMedia |
| Deepgram WS | Browser WebSocket ✅ | Node.js WebSocket |
| PiP injection | Browser native PiP ✅ | Cần custom overlay |
| Accessibility | Any device | Chỉ desktop |
| **Chosen** | ✅ **v1** | ❌ |

### Data Flow (with API key from client)

```
┌───────────┐  audio chunks      ┌───────────────┐  text stream   ┌──────────┐
│ Browser    │ ──────────────────→│ Deepgram       │ ────────────→ │ React    │
│ getUserMedia│  via WebSocket   │ Nova-3 (WS)   │               │ Frontend │
│ (mic ngoài)│   + apiKey header └───────────────┘               └────┬─────┘
└───────────┘                                                          │
                                                                       │
              ┌────────────────────────────────────────────────────────┤
              │                                                        │
         ┌────▼────┐                                         ┌──────────┐
         │ Google   │         x-api-key header               │ DeepSeek │
         │ Translate│ ◄────────────────────────────────────  │   API    │
         └──────────┘       (Next.js proxy nhận từ client)   └──────────┘

API Key Flow:
1. User nhập key trong Settings → localStorage.setItem()
2. Khi gọi API proxy (translate, answer):
   → Fetch("/api/translate", { headers: { "x-api-key": key } })
3. Next.js route handler đọc header → gọi API thật
4. Key không bao giờ lộ trong source/build code
```

### Architecture Decision: Frontend vs Backend Proxy

| Approach | Pro | Con |
|----------|-----|-----|
| **Web app (key từ client → proxy)** | API keys user tự nhập, gửi header → Next.js proxy | Key được forward an toàn, user tự quản lý |
| **Backend proxy (Next.js)** | API keys safe khỏi client inspect, CORS handled | Cần server, extra latency |

**Decision:** **Vercel free tier**. Không cần `.env.local`:
- User nhập API key trực tiếp trên màn hình web (Settings → API Keys)
- Lưu vào localStorage — trình duyệt nhớ cho lần sau
- Next.js API routes proxy nhận key từ request header (ko hardcode)
- Deepgram WebSocket dùng temporary token từ backend proxy
- Deploy public cho bất kỳ ai có link, mỗi người tự nhập key riêng

---

## 7. Detailed Pipeline

### Step-by-step

```
1. SETUP PHASE
   - User mở app trên browser
   - Settings: chọn En→Vi, style STAR
   - Paste profile (3-5 câu) + JD (paste link hoặc text)
   - Nhấn "Start Listening"

2. AUDIO CAPTURE
   - getUserMedia({ audio: { deviceId: selectedMic } })
   - MediaRecorder: chunk 100ms, PCM 16kHz mono
   - Không echo cancellation (cần clear voice)

3. STT (Deepgram WebSocket)
   - Kết nối WebSocket tới Deepgram Nova-3
   - Stream audio chunks → nhận interim + final transcript
   - Interim: hiện text đang nhận dạng (mờ dần...)
   - Final: text chính xác (in đậm)
   - Auto-detect language: chỉ En/Vi nên đơn giản

4. TRANSLATION (Google Cloud Translation)
   - Khi có final transcript → gọi translate API
   - Cache trong session (Map: text → translated)
   - Fallback: nếu API lỗi, hiện "Dịch không khả dụng"

5. QUESTION TYPE DETECTION  ★ MỚI
   - Khi có final transcript, phân loại câu hỏi trước khi gen answer:
     - behavioral (kể về, STAR, tình huống)
     - technical (kiến thức chuyên môn, coding)
     - situational (giả định, nếu...thì)
     - competency (kỹ năng, kinh nghiệm)
   - Dùng DeepSeek gọi nhẹ 1 shot để classify
   - Output: { type, format_hint } → truyền vào prompt bước 6
   - Mục đích: AI trả lời đúng format hơn, câu trả lời chất lượng cao hơn

6. AI ANSWER (DeepSeek API)
   - Auto trigger ngay khi có final transcript từ Deepgram (không cần click)
   - Vì anh đang đối thoại trước màn hình, mọi thao tác click đều bất tiện
   - Context prompt:
     ```
     Bạn là assistant phỏng vấn. Dựa trên:
     - Câu hỏi: [transcript gốc]
     - Loại câu hỏi: [behavioral | technical | situational | competency]
     - Hồ sơ ứng viên: [profile text]
     - JD: [job description text]

     Hãy viết câu trả lời bằng tiếng Anh, format {style}.
     - Nếu behavioral → format STAR
     - Nếu technical → giải thích ngắn gọn + ví dụ thực tế
     - Nếu situational → approach + giải pháp
     - Nếu competency → liệt kê kinh nghiệm liên quan
     Answer:
     ```
   - Streaming response → AnswerPanel (character by character)
   - Streaming: dùng ReadableStream + fetch API
   - Model: deepseek-chat (rẻ ~$0.14/M input tokens, so với GPT-4o-mini ~$0.15/M)

6. UI RENDERING
   - Bottom bar: transcript (dòng 1) + dịch (dòng 2)
   - Right panel: answer streaming + question type badge + nút Copy/Regenerate/Speak
   - Left corner: vùng trống cho PiP window
   - Scroll lock: user có thể pause auto-scroll

7. POST-INTERVIEW SUMMARY  ★ MỚI
   - Khi user bấm "End Session":
     - Lưu session xuống Supabase (profile, JD, source/target lang)
     - Lưu tất cả questions + answers vào Supabase questions
   - Hiện recap screen:
     - Tổng số câu hỏi đã trả lời
     - Danh sách Q&A (scroll được)
     - Nút Download Transcript (JSON + TXT)
     - Nút Copy All
```

### Session Cache Strategy

```typescript
// In-memory cache cho buổi phỏng vấn
const sessionCache = {
  transcriptCache: Map<string, string>(),  // hash(text) → text (tránh duplicate)
  translationCache: Map<string, string>(), // hash(text) → translated
  questionHistory: [],                      // [{original, translated, answer, timestamp, type}]
  currentQuestion: null,
  lastTranscriptEnd: Date.now(),
};
```

---

## 8. Database Schema (Supabase PostgreSQL)

### Tables

```sql
-- users: Supabase Auth quản lý tự động (auth.users)
-- Ta dùng public.users để lưu thêm metadata

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
  profile_text  text,        -- profile paste lúc bắt đầu
  jd_text       text,        -- JD paste lúc bắt đầu
  status        text not null default 'active',  -- active | ended
  started_at    timestamptz default now(),
  ended_at      timestamptz
);

-- questions: từng câu hỏi + câu trả lời trong buổi phỏng vấn
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id),
  question_type   text,                    -- behavioral | technical | situational | competency
  transcript_raw  text not null,          -- câu hỏi gốc (English)
  transcript_vi   text,                   -- bản dịch tiếng Việt
  ai_answer       text,                   -- câu trả lời AI gen
  answer_lang     text default 'en',      -- ngôn ngữ của câu trả lời
  created_at      timestamptz default now()
);

-- Indexes
create index idx_sessions_user on public.sessions(user_id);
create index idx_questions_session on public.questions(session_id);
create index idx_sessions_status on public.sessions(status);
```

### Row Level Security (RLS)

```sql
-- profiles: user chỉ xem profile của mình
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- sessions: user chỉ xem session của mình
alter table public.sessions enable row level security;
create policy "Users can view own sessions"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.sessions for update using (auth.uid() = user_id);

-- questions: user chỉ xem questions thuộc session của mình
alter table public.questions enable row level security;
create policy "Users can view own questions"
  on public.questions for select using (
    exists (select 1 from public.sessions
            where sessions.id = questions.session_id
            and sessions.user_id = auth.uid())
  );
create policy "Users can insert own questions"
  on public.questions for insert with check (
    exists (select 1 from public.sessions
            where sessions.id = questions.session_id
            and sessions.user_id = auth.uid())
  );
```

### Data lưu ở client vs server

| Dữ liệu | Lưu ở đâu | Lý do |
|---------|----------|-------|
| API Keys | localStorage (client) | Mỗi user tự nhập, không lên server |
| Profile + JD text | localStorage + `sessions.profile_text` / `sessions.jd_text` | Client cache + lưu session để xem lại |
| Transcript real-time | Zustand (memory) + Supabase questions | Memory cho hiển thị, DB cho lịch sử |
| Câu trả lời AI | Zustand (memory) + Supabase questions | Tương tự |
| Session list | Supabase sessions | Dashboard xem lại các buổi cũ |

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
| Google Translate | ~1K chars/min (60K/hr) | $1.20 | $24.00 |
| DeepSeek API (deepseek-chat) | ~30 questions × 5K tokens | **~$0.02** | **~$0.40** |
| Supabase | Free tier (500MB DB + Auth) | $0 | $0 |
| Vercel Hosting | Free tier (100h/serverless) | $0 | $0 |
| **Total** | | **~$1.68/hr** | **~$33.60/tháng** |

**Cost reduction options:**
- Dùng Deepgram base model: $0.34/hr → $6.80/tháng
- Chỉ translate khi cần (ko auto translate interim)
- DeepSeek siêu rẻ so với OpenAI — đã tiết kiệm ~$0.04/hr rồi

---

## 10. Development Phases

### Phase 1: MVP (2-3 weeks)
- [ ] Next.js + React + Tailwind project scaffolding
- [ ] Supabase setup: project, Auth (Google login), tables, RLS
- [ ] getUserMedia mic capture (chọn device)
- [ ] Deepgram WebSocket STT → transcript hiển thị real-time
- [ ] Google Cloud Translation → bản dịch
- [ ] Question type detection (behavioral/technical/situational/competency) ★ MỚI
- [ ] DeepSeek answer generation với type-specific prompt
- [ ] Settings panel: API keys (Deepgram, DeepSeek, Google), En/Vi language, mic selection, answer style
- [ ] Profile + JD input textarea
- [ ] Post-interview: lưu Supabase + recap screen + download transcript (JSON + TXT) ★ MỚI
- [ ] Copy answer button
- [ ] Deploy lên Vercel

### Phase 2: Polish (1-2 weeks)
- [ ] Streaming AI response (ReadableStream)
- [ ] Regenerate + Speak (Web Speech API TTS) buttons
- [ ] Question history (scroll qua các câu hỏi trước)
- [ ] Answer language selection (En vs Vi)
- [ ] Auto-scroll + pause scroll
- [ ] Dark mode
- [ ] Responsive layout (laptop vs external monitor)
- [ ] Loading/skeleton states

### Phase 3: Advanced (1-2 weeks)
- [ ] Export transcript (copy all questions + answers)
- [ ] Confidence visual indicator (mic quality)
- [ ] Keyboard shortcuts (Space = toggle mic, R = regenerate)
- [ ] PWA (install as app, offline fallback)
- [ ] Error handling + reconnection logic (Deepgram WS dropout)

### Phase 4: Production (1 week)
- [ ] Chrome Extension — capture system audio tự động (không cần mic ngoài) ★ MỚI
- [ ] Rate limiting (prevent API abuse)
- [ ] Error monitoring (Sentry)
- [ ] One-click deploy template
- [ ] Manual setup guide for PiP + mic

---

## 11. Success Criteria

- [ ] Mở browser → load app → chọn mic → Start Listening → transcript xuất hiện <2 giây
- [ ] Deepgram transcript accuracy >90% (mic ngoài, English)
- [ ] Dịch En→Vi chính xác >85%
- [ ] AI answer chất lượng, bám sát profile + JD
- [ ] PiP window ở góc app, ko bị che
- [ ] Không crash/sập trang trong 2h liên tục
- [ ] Tổng latency: speech → transcript → dịch → answer <3 giây
- [ ] Question type detection: behavioral/technical chính xác >90% ★ MỚI
- [ ] Post-interview: lưu Supabase + download transcript JSON/TXT trong <5 giây ★ MỚI

---

## 12. Confirmed Decisions

| Decision | Result |
|----------|--------|
| **Deploy** | Vercel free tier ✅ |
| **AI answer trigger** | Auto gen khi có final transcript, không cần click ✅ |
| **Question type detection** | Phân loại behavioral/technical/situational/competency trước gen answer ✅ ★ |
| **Post-interview summary** | Lưu Supabase + recap + download JSON/TXT ✅ ★ |
| **Profile + JD** | Paste tay (textarea) + tool external: doctomd.com, lightpdf.com/pdf-to-markdown ✅ |
| **API keys** | Nhập từ màn hình web → localStorage, anh tự nhập, browser nhớ ✅ |
| **Supabase** | PostgreSQL free tier + Auth (Google login) + Realtime ✅ |
| **Chrome Extension** | Phase 4 — capture system audio tự động, không cần mic ngoài ✅ ★ |

★ = Bổ sung mới từ v2.3

---

## 13. Project File Structure

```
interview-copilot-web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local              # API keys (gitignored)
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main interview page
│   ├── api/
│   │   ├── translate/route.ts    # Google Translate proxy
│   │   ├── answer/route.ts       # DeepSeek proxy (streaming)
│   │   ├── classify-question/route.ts  # Question type detection
│   │   └── deepgram-token/route.ts  # Deepgram temp token
│   └── globals.css
├── components/
│   ├── InterviewPage.tsx   # Main layout orchestrator
│   ├── MicControl.tsx      # Start/Stop + device selector
│   ├── TranscriptPanel.tsx # Bottom bar: transcript + translation
│   ├── AnswerPanel.tsx     # Right panel: AI answer + question type badge
│   ├── PiPZone.tsx         # Left corner placeholder for PiP
│   ├── SettingsModal.tsx   # Settings panel
│   ├── ProfileInput.tsx    # Profile + JD textarea
│   ├── RecapScreen.tsx     # Post-interview summary + download
│   └── HistoryPanel.tsx    # Question history sidebar
├── lib/
│   ├── deepgram.ts         # Deepgram WebSocket client
│   ├── translate.ts        # Translation API client
│   ├── ai-answer.ts        # DeepSeek answer generation
│   ├── classify.ts         # Question type classifier
│   └── audio.ts            # getUserMedia + MediaRecorder utils
├── stores/
│   ├── transcript.ts       # Zustand: transcript + translation
│   ├── settings.ts         # Zustand: settings
│   └── answer.ts           # Zustand: AI answer state
└── types/
    └── index.ts            # TypeScript types
```
