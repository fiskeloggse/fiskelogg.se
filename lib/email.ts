import "server-only";
import { Resend } from "resend";

// Falls back to the production domain so the link in an email is always a
// real, clickable URL even if SITE_URL isn't set locally.
const SITE_URL = process.env.SITE_URL ?? "https://fisklogg.se";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY saknas i miljövariablerna.");
  }
  return new Resend(apiKey);
}

// Fixed inbox for the app's own owner -- feedback has nowhere else to go
// yet (no in-app storage), so it's mailed straight there.
const FEEDBACK_TO = "fastreg.se@gmail.com";

// Free-text feedback (and, in principle, a user's own name) ends up
// interpolated straight into an HTML email body -- escape it first so
// neither can inject markup into what the owner's mail client renders.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendFeedbackEmail(
  from: { name: string; email: string },
  message: string
): Promise<void> {
  await getResend().emails.send({
    from: "Fisklogg <noreply@fisklogg.se>",
    to: FEEDBACK_TO,
    replyTo: from.email,
    subject: `Feedback från ${from.name}`,
    text: `${message}\n\n— ${from.name} (${from.email})`,
    html: `
      <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
      <p>— ${escapeHtml(from.name)} (${escapeHtml(from.email)})</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${SITE_URL}/aterstall-losenord?token=${token}`;

  await getResend().emails.send({
    from: "Fisklogg <noreply@fisklogg.se>",
    to,
    subject: "Återställ ditt lösenord",
    text: `Klicka på länken för att välja ett nytt lösenord (giltig i 1 timme):\n\n${resetUrl}\n\nBad du inte om detta? Då kan du ignorera mejlet.`,
    html: `
      <p>Klicka på länken för att välja ett nytt lösenord (giltig i 1 timme):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bad du inte om detta? Då kan du ignorera mejlet.</p>
    `,
  });
}
