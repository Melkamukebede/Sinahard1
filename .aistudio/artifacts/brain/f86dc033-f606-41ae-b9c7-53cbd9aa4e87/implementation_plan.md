# Automated Home Page Launch & Seamless Registration Flow

## Summary
Update the authentication and registration flow so that whenever a user signs in with Google or registers/logs in via email, the registration modal automatically closes and launches the user straight to the **Home page** (or directly into Practice Mode if opening a shared exam link). For first-time Google sign-ins, provide an intuitive, 1-click profile confirmation ("Confirm & Go to Home") before seamlessly launching into the Home dashboard.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed in Phase 1:

- **Confirmed Decision 1 (Immediate Navigation)**: After connecting with Google or signing in with email, returning/registered users will immediately have the modal dismissed and launch straight into the Home view (`activeTab = 'home'`).
- **Confirmed Decision 2 (First-Time Google Sign-Ins)**: First-time Google accounts without a completed profile will be shown a quick 1-click confirmation card with intelligent defaults (Grade 12, Natural Science, School Name) and a prominent **"Confirm & Go to Home"** primary action, eliminating multi-step friction.
- **Confirmed Decision 3 (Shared Exam Deep Links)**: If an unauthenticated student arrived via a shared exam link (`/?id=...`), successful authentication will immediately launch that shared exam in **Practice Mode**, with subsequent completion or exit returning to Home.

---

## 1. Overview & Core Concept

### What It Does
1. **Instant Google Sign-In to Home**: When an existing user signs in with Google, Firebase Auth identifies their existing profile in Firestore (`/users/{uid}`). The modal closes instantly, triggers a welcoming toast, and switches `activeTab` to `'home'`.
2. **Streamlined 1-Click First-Time Setup**: If a user is connecting to Google for the first time, instead of being trapped in a complex multi-field questionnaire, they are presented with a streamlined 1-click profile confirmation with sensible defaults:
   - Name populated from Google account
   - Default Grade 12 & Natural Science (customizable with quick spinner/chips)
   - One-tap **"Confirm & Go to Home"** button.
   - Upon click, the profile is saved to Firestore, marked as registered (`isRegistered: true`), the modal closes, and the Home dashboard opens immediately.
3. **No Unwanted Re-Prompts**: Prevent the registration modal from lingering or re-appearing on reload once Google authentication is established.
4. **Shared Link Preservation**: Respects incoming exam links by routing directly into practice mode for the intended exam.

---

## 2. User Experience & Visual Design

### User Flows
1. **Returning User Google Sign-In Flow**:
   ```
   [User clicks "Sign in with Google"]
                │
                ▼
   [Google OAuth Popup Completes]
                │
                ▼
   [Firestore finds existing user / isRegistered = true]
                │
                ▼
   [Close Registration Modal & setActiveTab('home')]
                │
                ▼
   [Toast: "Welcome back, {Name}! Ready to study."]
   ```

2. **First-Time User Google Sign-In Flow**:
   ```
   [User clicks "Sign in with Google"]
                │
                ▼
   [Google OAuth Popup Completes]
                │
                ▼
   [New user created in Firebase]
                │
                ▼
   [Step 2 shows Quick 1-Click Confirmation Card]
   • Google Name pre-filled & avatar shown
   • Default: Grade 12 • Natural Science
   • Optional quick school input
                │
                ▼
   [User taps "Confirm & Go to Home"]
                │
                ▼
   [Profile saved to Firestore & Local Storage]
   [Modal closes & App transitions to Home View]
   ```

3. **Shared Exam Link Flow**:
   ```
   [Student clicks shared link ?id=exam_123]
                │
                ▼
   [Prompt: "Login first to access this exam"]
                │
                ▼
   [User signs in with Google / Email]
                │
                ▼
   [Launch directly into Practice Mode for exam_123]
   [Upon finishing or exiting practice -> lands on Home]
   ```

### Visual & Component Styling
- **Clean 1-Click Confirmation Card**: Replaces overwhelming nested settings with a focused, celebratory profile card:
  - Displays user's Google avatar and display name with verified status badge.
  - Compact level selector (Grade 12 default).
  - High-contrast primary action button: `Confirm & Go to Home` with right arrow icon (`ArrowRight`).
- **Smooth Dismissal**: Animate modal exit with clean fade and zoom (`exit={{ opacity: 0, scale: 0.96 }}`) without visual flicker.
- **Feedback**: Immediate success toast (`Welcome back to Sinahard!` or `Profile saved! Welcome to your Home dashboard`).

---

## 3. Key Product Decisions & Trade-Offs

- **Automatic Dismissal vs. Mandatory Deep Form**:
  - *Chosen Approach*: Streamlined 1-click confirmation with intelligent defaults.
  - *Rationale*: Users connecting with Google expect instant entry. Forcing a 6-field questionnaire causes drop-off. Defaults can always be edited anytime from the top bar profile / settings modal.
- **Handling of Existing vs. New Users in `AuthContext`**:
  - *Chosen Approach*: Inspect `isRegistered` flag and Firestore document on auth state change. If an existing registered user logs in, `isRegistrationModalOpen` is set to `false`, and `App.tsx` navigates to `'home'`.
- **Shared Exam Link Continuity**:
  - *Chosen Approach*: Check `pendingSharedExamId`. If present, launch the shared exam first; if absent, navigate to `'home'`.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Flow
```
┌──────────────────────────────────────────────────────────┐
│                   User Interaction                       │
│      Google Sign-In Popup  /  Email Auth Submit          │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│              AuthContext (Authentication)                │
│  - signInWithGoogle() / signInWithEmail()                │
│  - onAuthStateChanged syncs with Firestore /users/{uid}  │
│  - Sets firebaseUser & user                              │
│  - Automatically sets isRegistrationModalOpen = false     │
│    for registered returning users                        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│         UserRegistrationModal (Presentation)             │
│  - If existing user: calls onSuccess() and onClose()     │
│  - If new user: shows 1-click confirmation card          │
│    ("Confirm & Go to Home")                              │
│  - executeSaveProfile() -> calls onSuccess() & onClose() │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    App.tsx (Routing)                     │
│  - onSuccess handler:                                    │
│      • If pendingSharedExamId -> launch exam             │
│      • Else -> setActiveTab('home')                      │
│  - Ensures activeTab switches to 'home' smoothly         │
└──────────────────────────────────────────────────────────┘
```

### Key Changes by Component

1. **`src/components/UserRegistrationModal.tsx`**:
   - In `handleGoogleConnect`:
     - After successful `signInWithGoogle()`, check if the user is already registered (`isRegistered: true` or has saved role/grade).
     - If already registered, immediately trigger `onSuccess` and `onClose()` without forcing Step 2.
     - If brand new user, present a clean 1-click confirmation card with Google details pre-filled and an explicit **"Confirm & Go to Home"** button.
   - In `handleEmailAuthSubmit`:
     - If signing in with existing email credentials, automatically trigger `onSuccess` and `onClose()`.
   - In `executeSaveProfile`:
     - Once saved, ensure `onSuccess` is called, modal closed, and notification displayed.

2. **`src/App.tsx`**:
   - In `<UserRegistrationModal>`'s `onSuccess` callback:
     - Clear `requiresLoginForSharedExam` and `setRequiresLoginForSharedExam(false)`.
     - If `pendingSharedExamId` is present, call `handleLaunchSharedExam(pendingSharedExamId)`.
     - Otherwise, call `setActiveTab('home')` to guarantee the user lands on the Home dashboard.
   - In `onAuthStateChanged` or user state listener: when an existing user is detected as logged in and not accessing a shared link, ensure `activeTab` is set to `'home'` and `closeRegistrationModal()` is triggered.

3. **`src/context/AuthContext.tsx`**:
   - When `onAuthStateChanged` resolves an existing registered user (`resolvedIsRegistered === true`), ensure `isRegistrationModalOpen` is set to `false` and not re-opened.
   - Ensure local storage keys (`student_is_registered`, `has_completed_role_onboarding`) are synchronized accurately so page refreshes stay on the Home view.
