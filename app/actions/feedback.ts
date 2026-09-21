"use server";

import * as z from "zod";
import { requireUser } from "@/lib/dal";
import { sendFeedbackEmail } from "@/lib/email";

export type FeedbackState = { error: string } | { success: true } | undefined;

const FeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { error: "Skriv något innan du skickar." })
    .max(4000, { error: "Meddelandet är för långt." }),
});

export async function submitFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const user = await requireUser();

  const parsed = FeedbackSchema.safeParse({ message: formData.get("message") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltigt meddelande." };
  }

  await sendFeedbackEmail({ name: user.name, email: user.email }, parsed.data.message);

  return { success: true };
}
