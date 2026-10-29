# Implementation Plan: 'Create with Agent' UI Refinement & Competition Proposal Architecture

## Executive Summary
This plan covers two major deliverables:
1. **Frontend Refinement**: Eliminating the legacy single-prompt "Generate with AI" feature from `ProfessorModal.tsx`, rebranding the multi-agent system to **"Create with Agent"**, and restyling it using the app's native **system colors** (clean zinc/neutral monochrome with emerald accents, replacing custom purple styling).
2. **Competition-Grade Proposal & Architecture Artifact**: Creating an exhaustive, publication-grade document (`project_proposal_and_architecture.md`) and updating `README.md` with deep technical explanations, code walkthroughs (regex parsing, LangGraph agents, school distribution, SQLite compilation), and an Ethiopian EdTech competitive analysis highlighting competitor limitations.

---

## 1. UI Refinements in `ProfessorModal.tsx` & `ManualView.tsx`

### A. Eliminate Legacy "Generate with AI"
- Remove the legacy `activeView === 'generate'` tab and its associated sub-views.
- Simplify `ActiveView` to:
  ```typescript
  type ActiveView = 'prompt' | 'agent' | 'txt_preview';
  ```
  - `'prompt'`: Holistic Prompt (copyable prompt for external LLMs)
  - `'agent'`: **Create with Agent** (the autonomous 3-agent LangGraph pipeline)
  - `'txt_preview'`: Format Preview (standardized text format reference)

### B. Rebrand to "Create with Agent" & System Styling
- Rebrand all labels, buttons, and badges from "LangGraph Agent Studio" to **"Create with Agent"**.
- Align all visual elements with the platform's native design constitution:
  - Backgrounds: `bg-zinc-50 dark:bg-[#0c182b]`
  - Borders: `border-zinc-200 dark:border-white/10`
  - Active tab / CTA buttons: `bg-zinc-950 text-white dark:bg-white dark:text-zinc-950`
  - Badges: Clean unboxed metadata and subtle neutral badges with emerald verification highlights (`text-emerald-600 dark:text-emerald-400`).
  - Progress indicators & nodes: Styled using native monochrome and emerald status icons.

---

## 2. Competition Defense & Architectural Proposal Artifact

A dedicated comprehensive artifact will be written to `project_proposal_and_architecture.md` containing full theoretical and code-level breakdowns:

### Chapter 1: Project Identity & Executive Problem Statement
- **The Challenge**: Ethiopian Grade 12 National University Entrance Exam (ESLCE/ESSLCE) pass-rate crisis (recent nationwide pass rates dropped below 5%).
- **The Divide**: Urban concentration of quality tutorial centers and updated curriculum materials vs. regional and rural access barriers.
- **The Solution**: A localized, offline-resilient, agentic exam portal designed for Ethiopian secondary school curricula.

### Chapter 2: Technology Stack Rationale
- **React 19 + TypeScript**: Strict type safety across complex mathematical and exam schemas; concurrent UI rendering.
- **Tailwind CSS v4**: High-performance, zero-pill design discipline conforming to WCAG AA accessibility.
- **LangGraph.js + Google Gemini (`gemini-3.8-flash`)**: Autonomous multi-agent state graph with cyclic reflection loops; eliminates hallucinations and math errors common in naive single-prompt architectures.
- **Firebase Firestore & Auth**: Real-time multi-tenant document storage, school-based exam distribution, and hardened Attribute-Based Access Control (ABAC).
- **WebAssembly SQLite (`sql.js`)**: Binary `.sqlite` database generation directly in the browser and Node without requiring native C++ compilers; ideal for zero-connectivity school labs.
- **Telebirr & Chapa**: Hyper-localized Ethiopian fintech integration supporting direct mobile money wallets (Telebirr, CBE Birr) in Ethiopian Birr (ETB).

### Chapter 3: Regex Extraction & Question Normalization Pipeline
- **Problem**: Raw questions from past papers, Telegram groups, or scanned PDFs arrive in chaotic formats.
- **Code & Regex Deep Dive**:
  - Explaining the multi-pass regular expressions:
    - Question boundary detector: `/(?:^|\n)(?:Q?\d+[\.\)\:\-]\s*|Question\s+\d+[\.\:\-]\s*)([\s\S]*?)(?=(?:\n(?:Q?\d+[\.\)\:\-]|Question\s+\d+[\.\:\-])|$))/gi`
    - Option splitter: `/(?:^|\n)\s*([A-D])[\.\)\:\-]\s*([\s\S]*?)(?=(?:\n\s*[A-D][\.\)\:\-]|$))/gi`
    - Answer key & explanation extractor: `/(?:Answer|Ans|Key|Correct)\s*[\:\-]?\s*([A-D])/i`
  - Normalization into the app's standard `Question` schema:
    ```typescript
    interface Question {
      id: string;
      text: string;
      options: string[]; // exactly 4 choices
      correct: number;   // 0-3 index
      explanation?: string;
    }
    ```

### Chapter 4: Multi-Agent Question Creation with Explaining Code
- **The 3-Agent State Graph Architecture**:
  - **Agent A (Syllabus & Competencies Curator)**: Deconstructs unit competencies, Bloom's cognitive tiers, and bounds.
  - **Agent B (STEM & KaTeX Problem Author)**: Crafts multi-step problem statements with phone-wrapped KaTeX formulas (`\frac{...}{...}`, `\sqrt{...}`) and plausible distractors.
  - **Agent C (Adversarial Critic & Auditor)**: Blind-solves each candidate, verifies KaTeX bracket pairing, audits for hallucinations, and scores quality ($0$–$100$).
  - **Conditional Reflection Loop**: Routes flawed drafts back to Agent B with structured critique notes until quality score $\ge 85\%$.
- Code walkthrough of `PipelineStateAnnotation`, node functions, and `shouldContinueRouter`.

### Chapter 5: Teacher Upload & School-Based Student Distribution
- **Multi-Tenant Architecture**:
  - Teachers register with their school credentials (e.g. *Bole Secondary School*, *Menelik II School*).
  - Admins verify teachers via 1-click email deep links (`?admin_tab=teachers&verify_id=...`).
  - Verified teachers upload curriculum exams tagged with `school: cleanSchool` and `createdType: 'teacher'`.
  - When students log in, real-time Firestore listeners automatically query exams matching their enrolled school, providing curated classroom assessments alongside national past papers.

### Chapter 6: Offline Storage & SQLite Compilation
- **Dual-Persistence Mechanism**:
  - Real-time cloud sync to Firestore `/exams` and `/questions`.
  - Client-side WebAssembly SQLite generation via `sql.js`.
  - Binary `.sqlite` database structure with relational tables (`exams` and `questions`).
  - Offline PWA Service Worker caching ensuring zero-connectivity practice.

### Chapter 7: Ethiopian Competitive Analysis & Competitor Limitations
- Comprehensive comparison matrix against existing Ethiopian alternatives:
  - **Kuraz Technologies / Kuraz Exam**: Static PDF viewer, no AI generation, no KaTeX rendering, no offline SQLite export.
  - **Fetena.net**: Web-only MCQ quizzes, static questions, no multi-agent verification, high rate of answer-key typos, no mobile money automation.
  - **Telegram Quiz Bots (Ethiopian Matric Channels)**: Unstructured text quizzes, text-overflow math formulas, no progress tracking, no teacher management.
  - **SinaHard (ExamMaster Pro)**: Autonomous 3-agent self-correcting generation, phone-optimized KaTeX math, native Telebirr/Chapa integration, school-based teacher publishing, offline SQLite export, and 1-click administrative verification.
- **Why Competitors Fail**: Lack of agentic self-reflection (LangGraph), inability to normalize unstructured text (Regex), and absence of mobile mathematical formatting.

---

## 3. Verification Plan
- Validate TypeScript compilation using `lint_applet` (`tsc --noEmit`).
- Verify production bundle build using `compile_applet`.
- Verify the refreshed "Create with Agent" UI in `ProfessorModal.tsx` and `ManualView.tsx`.
