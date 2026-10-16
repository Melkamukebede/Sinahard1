# AI Prompt Studio Optimization, Direct In-App Question Generation & Cross-Platform LaTeX

## Summary
Transform the **AI Prompt Studio** into a streamlined, high-impact prompt generator and in-app question creation engine. The studio generates brief, holistic, and mathematically rigorous prompts for external AI tools (ChatGPT, Claude, Gemini, DeepSeek) while adding a direct **1-click "Generate with Gemini"** engine that creates formatted questions with step-by-step LaTeX explanations directly in-app. In addition, exam practice mode introduces **dynamic answer choice shuffling** to randomize options for students, while the KaTeX rendering engine is hardened for seamless display and copy resilience across both PC and mobile phones.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in Phase 1:

- **Confirmed Decision 1 (In-App AI + Copy Prompt)**: The prompt page will feature dual capabilities: a one-click **"Generate Exam with AI"** action powered by server-side Gemini API (`gemini-3.8-flash`) that parses and stages questions directly for immediate practice or saving, alongside the pristine **"Copy Prompt"** button for external AI platforms.
- **Confirmed Decision 2 (Dynamic Option Shuffling)**: Option choices (A, B, C, D) will be shuffled dynamically when students enter **Practice Mode**, with automated re-indexing of the correct answer and explanations so students cannot memorize fixed letter positions.
- **Confirmed Decision 3 (Brief Holistic Prompt Format)**: The default prompt format is optimized into a laser-focused, brief holistic specification with strict LaTeX rules (exact `$...$` inline math, isolated `[ equation ]` display formulas, bold thematic headers without numbered steps, and distractor plausibility rules).

---

## 1. Overview & Core Concept

### What It Delivers

1. **Holistic & Brief AI Prompt Engine**:
   - Re-architects the prompt generator in `ProfessorModal.tsx` to produce concise yet thorough prompts that guide any AI (ChatGPT, Claude, Gemini, DeepSeek) to generate pristine multiple-choice questions without preamble or formatting errors.
   - Built-in curriculum standards: grade levels (7–12, Freshman, University), subjects (Physics, Math, Chemistry, Biology, Social Sciences), topic specifications, time limits, and calibrated difficulty tiers.
   - Enforces balanced answer keys ($A, B, C, D$) to eliminate letter bias.

2. **Server-Side In-App AI Question Generator**:
   - Implements a dedicated full-stack Express endpoint (`POST /api/gemini/generate-questions`) using the `@google/genai` TypeScript SDK and `gemini-3.8-flash` with JSON schema enforcement.
   - Users can generate 5–20 questions in seconds without leaving the app.
   - Renders a live visual review deck inside `ProfessorModal.tsx` displaying the generated questions, answer keys, and KaTeX step-by-step solutions with 1-click actions: **"Add to Exam Wizard"** or **"Start Practice Now"**.

3. **Dynamic Practice Option Shuffling**:
   - In `PracticeModal.tsx`, each question's option choices are dynamically randomized upon starting a practice session.
   - Correct answer pointers and explanation references are updated accurately to preserve exact grading integrity.
   - Includes a user-visible "🔀 Shuffled Choices" indicator with an optional toggle in session controls.

4. **Cross-Platform LaTeX Resilience (PC & Phones)**:
   - Enhances `MathRenderer.tsx` and `latexClipboardService.ts` to flawlessly handle mobile phone touchscreens and desktop viewports:
     - Handles display brackets `[ formula ]`, inline delimiters `$...$` and `\(...\)`, and display blocks `$$...$$` or `\[...\]`.
     - Preserves backslashes (`\frac`, `\sqrt`, `\times`, `\cdot`, `\Delta`, `\Omega`, `\theta`, `\pi`).
     - Auto-wraps long equations in smooth touch-scrolling containers (`overflow-x-auto`) to eliminate mobile layout breaks.
     - Maintains pristine clipboard copy interception for both phone long-press copy bars and PC keyboard shortcuts.

---

## 2. User Experience & Visual Design

### User Flows & Interaction Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AI PROMPT STUDIO (Modal)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Bar: [Sparkles] AI Prompt Studio  ·  📱 Phone LaTeX Mode  ·  [Close X] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Subject Selector: Physics / Math / Chemistry / Biology / Custom            │
│  Grade Stepper: [-] Grade 12 [+]  ·  Questions: [-] 10 [+]  ·  Time: 20 min │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Tab: Brief Holistic Prompt ]       [ Tab: Direct AI Preview & Generate ] │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │ Standardized .TXT Prompt Box    │   │ "Generate 10 Questions with     │  │
│  │ - Exact LaTeX formatting rules  │   │  Gemini 3.8 Flash"              │  │
│  │ - Formula bracket isolation     │   │                                 │  │
│  │ - Distractor balance            │   │ [Live Progress & KaTeX Review]  │  │
│  └─────────────────────────────────┘   └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Bottom Actions:                                                            │
│  [Copy Prompt for ChatGPT/Claude]  ·  [✨ Generate In-App with Gemini]       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ (Direct Generation Complete)
┌─────────────────────────────────────────────────────────────────────────────┐
│  Generated Exam Preview Deck:                                               │
│  • 10 Questions formatted with KaTeX math on PC & Mobile                   │
│  • Explanations with isolated formulas                                      │
│  • Buttons: [Add Questions to Exam]  ·  [Start Practice Immediately]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Practice Mode Dynamic Shuffling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRACTICE MODE (Student)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Timer: 19:42  ·  Batch 1/2  ·  [🔀 Shuffled Options Active]  ·  [Pause]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Question 1: A vehicle accelerates from $u = 5\text{ m/s}$...              │
│    A) $60\text{ m}$   (Shuffled from original position B)                   │
│    B) $30\text{ m}$   (Shuffled from original position D)                   │
│    C) $120\text{ m}$  (Shuffled from original position A)                   │
│    D) $50\text{ m}$   (Shuffled from original position C)                   │
│                                                                             │
│  [View Explanation] -> Step-by-step KaTeX formula with correct answer check │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual & Ergonomic Design Guidelines (60-30-10 Rule)
- **Palette**: Clean slate canvas (60%), structural card surfaces with hairline dividers (30%), vibrant brand accents (10%) for primary actions.
- **Mobile First Ergonomics**: Touch targets $\ge 44\text{px}$, sticky bottom CTA buttons on mobile, and horizontal scrollbars with touch inertia for wide math equations.
- **Anti-Slop Discipline**: No decorative pulsing dots, no fake version tags, unboxed text metadata with `·` separators, and natural title case.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Server-Side Gemini API via Express (`server.ts`)
- **Chosen Approach**: Create a dedicated Express entry point `server.ts` with Vite middlewares in development (`"dev": "tsx server.ts"`), hosting `/api/gemini/generate-questions`.
- **Why**: Strictly adheres to the AI Studio security constitution (no API keys exposed to browser) while enabling fast structured JSON responses using the `@google/genai` TypeScript SDK.
- **Alternatives Considered**: Direct client-side SDK calls (rejected due to API key leakage and security policy violations).

### Decision 2: Dynamic Option Shuffling with Deterministic Tracking
- **Chosen Approach**: Shuffle question options at session initialization in `PracticeModal.tsx`, mapping the new choice positions to the original index so that scoring and explanation references remain 100% accurate.
- **Why**: Prevents students from simply memorizing answer letters (e.g. "Question 3 is B") and forces true conceptual mastery.
- **Alternatives Considered**: Permanently mutating the exam data in database (rejected: author's original source exam should remain intact; only practice sessions should shuffle).

### Decision 3: Robust Dual-Delimited LaTeX Parsing
- **Chosen Approach**: Enhance `MathRenderer.tsx` regex tokenizers to support bracketed equations `[ formula ]`, inline `$...$`, inline `\(...\)`, display `$$...$$`, and naked unit strings like `1200\text{ kg}`.
- **Why**: Mobile AI apps and chat clipboards frequently strip backslashes or convert `\[` to bare `[`. Parsing both standard and phone-simplified formats ensures zero broken math rendering on phones.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────┐
│                           Client Browser                              │
│                                                                       │
│  ┌──────────────────────┐   ┌───────────────────┐   ┌───────────────┐ │
│  │  ProfessorModal.tsx  │   │ PracticeModal.tsx │   │ MathRenderer  │ │
│  │  - Brief Prompt Gen  │   │ - Dynamic Shuffle │   │ - KaTeX Cache │ │
│  │  - AI Exam Trigger   │   │ - Accurate Score  │   │ - Touch Scroll│ │
│  └──────────┬───────────┘   └───────────────────┘   └───────────────┘ │
└─────────────┼─────────────────────────────────────────────────────────┘
              │ POST /api/gemini/generate-questions
              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      Express Backend (server.ts)                      │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  @google/genai SDK (GoogleGenAI)                                │  │
│  │  - Model: gemini-3.8-flash                                      │  │
│  │  - User-Agent: 'aistudio-build'                                 │  │
│  │  - Response Schema: Type.OBJECT (Exam & Questions)              │  │
│  │  - Strict LaTeX Formatting System Instructions                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Vite Dev Middlewares + Chapa / Telebirr Payment Proxies               │
└───────────────────────────────────────────────────────────────────────┘
```

### Question Data Schema (Enforced by Gemini JSON Schema)
```typescript
interface GeneratedQuestion {
  text: string;           // E.g. "A car of mass $m = 1200\\text{ kg}$ accelerates..."
  options: string[];      // Array of 4 options with exact LaTeX math
  correct: number;        // Index of correct option (0, 1, 2, or 3)
  explanation: string;    // Vertically structured solution with [ formula ] brackets
}
```

---

## Verification Plan

### Automated Build & Compilation
- Run `compile_applet` to verify TypeScript typings across `server.ts`, `ProfessorModal.tsx`, `PracticeModal.tsx`, and `MathRenderer.tsx`.
- Run `lint_applet` to confirm clean imports and syntax.

### Manual & Interactive Validation
1. **Prompt Page Generation**: Open AI Prompt Studio, verify brief holistic prompt text, test copy to clipboard on desktop and mobile viewport.
2. **In-App Gemini Generation**: Trigger "Generate with Gemini", verify loader state, KaTeX rendering in the preview deck, and 1-click addition to exam wizard.
3. **Practice Option Shuffling**: Launch practice mode, verify options A–D are randomized compared to the original exam order, verify selecting the correct answer scores properly, and verify explanations match the selected choice.
4. **Mobile & PC LaTeX Verification**: Test formulas on narrow mobile width (375px) and desktop (1440px), checking equation scrolling, KaTeX font crispness, and clipboard copy.
