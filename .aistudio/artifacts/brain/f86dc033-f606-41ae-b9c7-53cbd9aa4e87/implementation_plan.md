# Automated Email Notifications for Student Payments & Teacher Registrations

## Summary
Implement automated email notifications delivered to `melkamukebede11@gmail.com` (with configurable in-app admin settings) whenever a student submits a payment or a new teacher registers. Each notification email delivers full transactional details, student/teacher context, and a 1-click verification link directly targeting the item inside the Admin Verification Panel. The solution supports full-stack Express development, automated Cloudflare Pages Functions, and client-side fallback.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:

- **Confirmed Decision 1 (Recipient)**: Notifications will be sent to `melkamukebede11@gmail.com` by default, with an in-app Admin Notification Settings tab in the Admin Panel to update the recipient email or toggle payment/teacher alerts.
- **Confirmed Decision 2 (Email Architecture)**: Automated email service supported across both Node.js Express (`server.ts`) and Cloudflare Pages Functions (`/functions/api/notify-admin.ts`), with resilient client fallback and simulated logging if an external email key is not configured.
- **Confirmed Decision 3 (Notification Content)**: Rich HTML and plain-text emails providing complete student/teacher metadata, amounts, payment reference numbers, and a direct 1-click deep link to open and verify inside the Admin Panel.

---

## 1. Overview & Core Concept

- **What It Does**: Whenever a student initiates/completes a subscription payment (via Telebirr, Chapa, CBE, or manual receipt upload) or an educator registers with the Teacher role, the system immediately pushes an alert email to the admin. The email contains all relevant details and an action button to open the application with the exact pending record highlighted for instantaneous 1-click approval or rejection.
- **Target Audience**: App administrator (`melkamukebede11@gmail.com`) overseeing Ethiopian secondary school curriculum access, teacher authorizations, and premium student subscriptions.
- **Key Value**: Eliminates manual checking of the admin dashboard; guarantees instant response time for pending payments and teacher onboarding, directly unblocking students preparing for national exams.

---

## 2. User Experience & Visual Design

### A. Key User Flows

1. **Student Payment Flow**:
   - Student selects a subscription pass (Starter, Monthly, Semester, Annual).
   - Student submits payment via Telebirr, Chapa, or CBE bank transfer proof.
   - App stores the pending record in Firestore `subscriptions` and fires an automated alert to `/api/notify-admin`.
   - Admin receives an email titled: `🔔 Action Required: Verify Student Payment (Student Name - Amount ETB)`.
   - Admin clicks **"Verify Payment in Admin Panel"** in the email, which deep-links directly into the Admin Subscriptions tab with the pending transaction highlighted.
   - Admin clicks **"Verify & Activate"** in 1 click; the student's status updates immediately via real-time Firestore listeners.

2. **Teacher Registration Flow**:
   - An educator signs up and fills out their teacher profile (Name, School, Teaching Subject, Phone, Region).
   - Upon submission, app flags `role: 'teacher'` with `isVerifiedTeacher: false`.
   - Automated notification dispatches to the admin: `🔔 Action Required: Verify New Teacher Registration (Teacher Name - School)`.
   - Admin clicks **"Review & Verify Teacher"** in the email, landing on the Admin Teachers verification list.
   - Admin clicks **"Approve Teacher"**, unlocking class exam publishing permissions for that teacher.

3. **Admin Settings & Test Notification Panel**:
   - Located inside `AdminSubscriptionsView`: a dedicated **"Notification Alerts"** tab or header control.
   - Allows changing the alert email address (stored in Firestore / local cache).
   - Checkboxes to toggle:
     - `Email on Student Payment Submission` (Default: ON)
     - `Email on Teacher Registration` (Default: ON)
   - **"Send Test Notification Email"** button: Sends a real test email with live loading and success feedback so the admin can verify their inbox settings immediately.

### B. Visual Identity & Design Discipline

- **Admin Tab Navigation**: Clean segmented control styling (`Teachers`, `Payments`, and `Email Alerts`).
- **Deep-Link Highlight**: When the admin arrives from an email link with query parameters (e.g. `?admin_tab=payments&verify_id=sub_123` or `?admin_tab=teachers&verify_id=uid_456`), the targeted card pulses smoothly with a soft blue highlight (`ring-2 ring-blue-500/40`), automatically scrolls into view, and displays a prominent **"Approve / Verify Now"** button.
- **Email Design**: Clean, modern email template with high legibility, mobile-responsive layout, tabular financial metadata, and a high-contrast primary CTA button (`#0f172a` background with white text).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Environment Dispatch (Cloudflare Pages + Express)**
  - *Chosen Approach*: Implement `POST /api/notify-admin` in `server.ts` for AI Studio/Express and `/functions/api/notify-admin.ts` for Cloudflare Pages.
  - *Why*: Ensures zero configuration breakage whether running in AI Studio dev, full-stack server deployment, or Cloudflare Pages static/edge hosting.
- **Decision 2: Resilient Email Transport with Fallback**
  - *Chosen Approach*: The dispatch endpoint supports standard transactional email providers (Resend / SendGrid / SMTP / Webhook) via environment variables (`ADMIN_NOTIFICATION_EMAIL`, `EMAIL_API_KEY` / `RESEND_API_KEY`), with automated console/audit logging and in-app admin alert fallback if external email credentials are not yet configured in production hosting.
  - *Why*: Prevents student payment or teacher registration flows from ever failing or hanging if email services encounter network blips or missing API keys.
- **Decision 3: Non-Blocking Async Notification**
  - *Chosen Approach*: Fire-and-forget background execution from the client (`createSubscriptionRecord` and `UserRegistrationModal`) so student payments and teacher profile saves complete with zero UI latency.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Student / Teacher Client                       │
│  - Payment Submission (SubscriptionModal)                             │
│  - Teacher Registration (UserRegistrationModal)                        │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ 1. Save to DB                   │ 2. Trigger Email Alert
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          Firestore Database          │  │ adminNotificationService     │
│  - collections:                      │  │  - sendPaymentNotification() │
│     • subscriptions                  │  │  - sendTeacherNotification() │
│     • users (role: teacher)          │  │  - sendTestNotification()    │
│     • admin_settings/notifications   │  └──────────────┬───────────────┘
└──────────────────┬───────────────────┘                 │
                   │ Real-time Sync                      │ POST /api/notify-admin
                   ▼                                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Admin Verification Panel       │  │ API Endpoint                 │
│  - Teachers Check & Verification     │  │  - Express: server.ts        │
│  - Subscriptions Approval Panel      │  │  - Cloudflare: /functions/   │
│  - Notification Email Settings       │  └──────────────┬───────────────┘
│  - 1-Click Verification Deep-Links   │                 │ Sends Email
└──────────────────▲───────────────────┘                 ▼
                   │                      ┌──────────────────────────────┐
                   │ Link in Email        │ melkamukebede11@gmail.com     │
                   └──────────────────────┤ - Student Payment Details    │
                                          │ - Teacher Registration Info  │
                                          │ - 1-Click "Verify" Button    │
                                          └──────────────────────────────┘
```

### Data Model & Endpoints

1. **Firestore Collections**:
   - `subscriptions/{subId}`: Student payment records with `paymentStatus: 'pending' | 'verified' | 'rejected'`, `amount`, `paymentMethod`, `transactionReference`, `userEmail`, `userName`.
   - `users/{uid}`: Teacher records with `role: 'teacher'`, `isVerifiedTeacher: boolean`, `schoolName`, `teachingSubject`, `phoneNumber`.
   - `admin_settings/notifications`: Admin alert configurations:
     ```typescript
     interface AdminNotificationSettings {
       recipientEmail: string; // default: 'melkamukebede11@gmail.com'
       notifyOnStudentPayment: boolean; // default: true
       notifyOnTeacherRegistration: boolean; // default: true
       updatedAt?: string;
     }
     ```

2. **Endpoints**:
   - `POST /api/notify-admin`:
     - Payload:
       ```typescript
       interface NotifyAdminPayload {
         type: 'student_payment' | 'teacher_registration' | 'test';
         recipientEmail?: string;
         data: {
           studentName?: string;
           studentEmail?: string;
           studentPhone?: string;
           planName?: string;
           amount?: number;
           paymentMethod?: string;
           transactionReference?: string;
           subscriptionId?: string;
           teacherName?: string;
           teacherEmail?: string;
           teacherPhone?: string;
           schoolName?: string;
           teachingSubject?: string;
           teacherUid?: string;
           verifyUrl: string;
         };
       }
       ```

3. **Components to Update**:
   - `src/services/adminNotificationService.ts`: Central notification dispatcher with client-side error handling, storage of admin email preference, and deep-link generation.
   - `server.ts`: Handle `POST /api/notify-admin` with HTML email rendering and delivery.
   - `/functions/api/notify-admin.ts`: Cloudflare Pages Function counterpart for edge deployment.
   - `src/components/SubscriptionModal.tsx`: Call `sendPaymentNotification()` upon student payment submission.
   - `src/components/UserRegistrationModal.tsx`: Call `sendTeacherNotification()` upon new teacher profile submission.
   - `src/components/AdminSubscriptionsView.tsx`: Add Email Alert Settings tab, test email sender, and query parameter deep-link verification auto-highlighting.
   - `src/App.tsx`: Parse incoming URL verification parameters (`?admin=verify&...`) and navigate directly to the target record in the Admin Panel.
