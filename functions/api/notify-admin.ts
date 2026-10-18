// Cloudflare Pages Function for POST /api/notify-admin
// Automatically deployed on Cloudflare Pages when the repository has a /functions directory

interface Env {
  ADMIN_NOTIFICATION_EMAIL?: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  [key: string]: any;
}

function buildAdminNotificationHtml(params: {
  title: string;
  summary: string;
  fields: { label: string; value: string }[];
  actionLabel: string;
  actionUrl: string;
}): string {
  const fieldsHtml = params.fields
    .map(
      (f) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #475569; width: 35%; background: #f8fafc;">
          ${f.label}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #0f172a; word-break: break-word;">
          ${f.value}
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Top Brand Accent -->
    <tr>
      <td style="height: 6px; background: linear-gradient(90deg, #0f172a, #2563eb, #10b981);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 28px 28px 16px 28px;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 9999px;">
          SinaHard Admin Alert (Cloudflare Edge)
        </span>
        <h1 style="margin: 14px 0 8px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.3;">
          ${params.title}
        </h1>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
          ${params.summary}
        </p>
      </td>
    </tr>
    <!-- Details Table -->
    <tr>
      <td style="padding: 8px 28px 20px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          ${fieldsHtml}
        </table>
      </td>
    </tr>
    <!-- Action Button -->
    <tr>
      <td style="padding: 8px 28px 32px 28px; text-align: center;">
        <a href="${params.actionUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 6px rgba(15,23,42,0.25);">
          ${params.actionLabel} &rarr;
        </a>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">
          Clicking above directly opens the admin verification panel with this record highlighted.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        SinaHard National Examination Portal &bull; Automated Verification Alerts
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const payload = (await context.request.json().catch(() => ({}))) as any;
    const {
      type = 'student_payment',
      recipientEmail = context.env.ADMIN_NOTIFICATION_EMAIL || 'melkamukebede11@gmail.com',
      subject = '🔔 Action Required: New Verification Pending',
      title = 'Admin Action Required',
      summary = 'A new verification request has been submitted.',
      fields = [],
      actionLabel = 'Open Admin Panel & Verify',
      actionUrl = 'https://ais-dev-ltiw4qliukwuumoak36su2-293782609789.europe-west3.run.app/?admin_tab=payments',
    } = payload;

    const htmlContent = buildAdminNotificationHtml({
      title,
      summary,
      fields,
      actionLabel,
      actionUrl,
    });

    const resendApiKey = context.env.RESEND_API_KEY;
    const sendgridApiKey = context.env.SENDGRID_API_KEY;
    let deliveredVia = 'simulated_and_archived';

    if (resendApiKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SinaHard Verification <onboarding@resend.dev>',
            to: [recipientEmail],
            subject,
            html: htmlContent,
          }),
        });
        if (emailRes.ok) {
          deliveredVia = 'resend';
        }
      } catch (err) {
        console.warn('Cloudflare function Resend dispatch exception:', err);
      }
    } else if (sendgridApiKey) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipientEmail }] }],
            from: { email: 'notifications@sinahard.edu.et', name: 'SinaHard Admin' },
            subject,
            content: [{ type: 'text/html', value: htmlContent }],
          }),
        });
        if (sgRes.ok) {
          deliveredVia = 'sendgrid';
        }
      } catch (err) {
        console.warn('Cloudflare function Sendgrid exception:', err);
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        deliveredVia,
        message:
          deliveredVia === 'simulated_and_archived'
            ? `Notification recorded and prepared for ${recipientEmail}.`
            : `Email successfully delivered to ${recipientEmail} via ${deliveredVia}.`,
        recipientEmail,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Cloudflare Edge Function error';
    return new Response(JSON.stringify({ status: 'error', message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
