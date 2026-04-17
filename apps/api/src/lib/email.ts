import { Resend } from "resend";

let _resend: Resend | null | undefined;
function getResend(): Resend | null {
  if (_resend === undefined) {
    _resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;
  }
  return _resend;
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM ?? "GhanaDeals <notifications@ghanadeals.com>";
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] Resend not configured — RESEND_API_KEY is missing");
    return false;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[email] Resend API error:", error);
      return false;
    }
    console.log("[email] Sent to", opts.to, "id:", data?.id);
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

// ---- Templates ----

function layout(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:8px;padding:32px;border:1px solid #e4e4e7">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="margin:0;font-size:20px;color:#18181b">🏠 GhanaDeals</h1>
      </div>
      ${body}
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
      <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center">
        GhanaDeals — Ghana's Premier Property Marketplace
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ---- Notification Functions ----

/** Notify agent when a new inquiry is received on their listing */
export async function notifyAgentNewInquiry(agent: {
  email: string;
  name: string;
}, inquiry: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}, property: {
  title: string;
  id: string;
}): Promise<boolean> {
  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

  return sendEmail({
    to: agent.email,
    subject: `New inquiry on "${property.title}"`,
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${agent.name},</p>
      <p style="margin:0 0 16px;color:#52525b">You have a new inquiry on your listing:</p>
      <div style="background:#f4f4f5;border-radius:6px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-weight:600;color:#18181b">${property.title}</p>
        <p style="margin:0;font-size:14px;color:#52525b"><strong>From:</strong> ${inquiry.name} (${inquiry.email})</p>
        ${inquiry.phone ? `<p style="margin:4px 0 0;font-size:14px;color:#52525b"><strong>Phone:</strong> ${inquiry.phone}</p>` : ""}
      </div>
      <div style="background:#fafafa;border-left:3px solid #3b82f6;padding:12px 16px;margin-bottom:16px;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:14px;color:#374151;white-space:pre-line">${inquiry.message}</p>
      </div>
      <p style="margin:0">
        <a href="${webUrl}/property/${property.id}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">View Listing</a>
      </p>
    `),
  });
}

/** Notify agent when their listing is approved */
export async function notifyAgentListingApproved(agent: {
  email: string;
  name: string;
}, property: {
  title: string;
  id: string;
}): Promise<boolean> {
  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

  return sendEmail({
    to: agent.email,
    subject: `Your listing "${property.title}" has been approved`,
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${agent.name},</p>
      <p style="margin:0 0 16px;color:#52525b">Great news! Your listing has been approved and is now live on GhanaDeals.</p>
      <div style="background:#f0fdf4;border-radius:6px;padding:16px;margin-bottom:16px;border:1px solid #bbf7d0">
        <p style="margin:0;font-weight:600;color:#166534">✅ ${property.title}</p>
      </div>
      <p style="margin:0">
        <a href="${webUrl}/property/${property.id}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">View Live Listing</a>
      </p>
    `),
  });
}

/** Notify agent when their listing is flagged */
export async function notifyAgentListingFlagged(agent: {
  email: string;
  name: string;
}, property: {
  title: string;
  id: string;
}): Promise<boolean> {
  const agentsUrl = process.env.AGENTS_URL ?? "http://localhost:3002";

  return sendEmail({
    to: agent.email,
    subject: `Your listing "${property.title}" has been flagged`,
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${agent.name},</p>
      <p style="margin:0 0 16px;color:#52525b">Your listing has been flagged by our moderation team and is no longer visible to buyers.</p>
      <div style="background:#fef2f2;border-radius:6px;padding:16px;margin-bottom:16px;border:1px solid #fecaca">
        <p style="margin:0;font-weight:600;color:#991b1b">⚠️ ${property.title}</p>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#52525b">Please review your listing and make any necessary corrections, then resubmit for approval.</p>
      <p style="margin:0">
        <a href="${agentsUrl}/listings" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">Review Listings</a>
      </p>
    `),
  });
}

/** Notify agent when their KYC verification is approved */
export async function notifyAgentVerificationApproved(agent: {
  email: string;
  name: string;
}): Promise<boolean> {
  const agentsUrl = process.env.AGENTS_URL ?? "http://localhost:3002";

  return sendEmail({
    to: agent.email,
    subject: "Your seller account has been verified!",
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${agent.name},</p>
      <p style="margin:0 0 16px;color:#52525b">Congratulations! Your seller account on GhanaDeals has been verified. You now have a verified badge on your profile.</p>
      <div style="background:#f0fdf4;border-radius:6px;padding:16px;margin-bottom:16px;border:1px solid #bbf7d0;text-align:center">
        <p style="margin:0;font-size:24px">🎉</p>
        <p style="margin:8px 0 0;font-weight:600;color:#166534">Account Verified</p>
      </div>
      <p style="margin:0">
        <a href="${agentsUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">Go to Dashboard</a>
      </p>
    `),
  });
}

/** Notify agent when their KYC verification is rejected */
export async function notifyAgentVerificationRejected(agent: {
  email: string;
  name: string;
}, reason: string): Promise<boolean> {
  const agentsUrl = process.env.AGENTS_URL ?? "http://localhost:3002";

  return sendEmail({
    to: agent.email,
    subject: "Seller verification update",
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${agent.name},</p>
      <p style="margin:0 0 16px;color:#52525b">Unfortunately, your seller verification could not be completed at this time.</p>
      <div style="background:#fef2f2;border-radius:6px;padding:16px;margin-bottom:16px;border:1px solid #fecaca">
        <p style="margin:0 0 8px;font-weight:600;color:#991b1b">Reason:</p>
        <p style="margin:0;font-size:14px;color:#374151">${reason}</p>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#52525b">You can update your documents and resubmit for verification.</p>
      <p style="margin:0">
        <a href="${agentsUrl}/verification" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">Update Documents</a>
      </p>
    `),
  });
}

/** Send OTP verification code to the user's email */
export async function sendOtpEmail(to: string, name: string, code: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `${code} is your GhanaDeals verification code`,
    html: layout(`
      <p style="margin:0 0 16px;color:#18181b">Hi ${name},</p>
      <p style="margin:0 0 16px;color:#52525b">Use the code below to verify your email address. This code expires in 10 minutes.</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:16px;text-align:center">
        <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b">${code}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#a1a1aa">If you didn't request this code, you can safely ignore this email.</p>
    `),
  });
}
