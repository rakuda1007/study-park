import { billingSiteUrl } from "./config";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = { sent: boolean; mode: "resend" | "log" };

function getMailFrom(): string {
  return process.env.BILLING_MAIL_FROM?.trim() || "Study Park <noreply@study.tennis-park-community.com>";
}

export async function sendBillingMail(payload: MailPayload): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[billing-mail:log]", {
      to: payload.to,
      subject: payload.subject,
      preview: payload.text.slice(0, 200),
    });
    return { sent: true, mode: "log" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getMailFrom(),
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? textToSimpleHtml(payload.text),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  return { sent: true, mode: "resend" };
}

function textToSimpleHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre style="font-family:sans-serif;white-space:pre-wrap">${escaped}</pre>`;
}

export function starterCtaUrl(): string {
  return billingSiteUrl("/creator/usage");
}
