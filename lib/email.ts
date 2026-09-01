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
