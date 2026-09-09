import type { StoredBooking, StoredQuote } from "./formStorage";

function getBotToken(): string {
  return (
    (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined)?.trim() ??
    ""
  );
}

/** Supports one or more chat ids, separated by comma. */
function getChatIds(): string[] {
  const raw =
    (import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined)?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isFormNotifyConfigured(): boolean {
  return getBotToken().length > 0 && getChatIds().length > 0;
}

type NotifyResult = { ok: true } | { ok: false; message: string };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendToChat(
  token: string,
  chatId: string,
  text: string,
): Promise<NotifyResult> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    const data = (await response.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        message:
          data.description ||
          "Failed to send Telegram notification. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

async function sendTelegramMessage(text: string): Promise<NotifyResult> {
  const token = getBotToken();
  const chatIds = getChatIds();

  if (!token || chatIds.length === 0) {
    return {
      ok: false,
      message:
        "Telegram notifications are not configured yet. Add bot token and chat id.",
    };
  }

  const results = await Promise.all(
    chatIds.map((chatId) => sendToChat(token, chatId, text)),
  );

  const failed = results.filter((result) => !result.ok);
  if (failed.length === results.length) {
    return failed[0] ?? {
      ok: false,
      message: "Failed to send Telegram notification. Please try again.",
    };
  }

  // At least one recipient got the message — treat as success.
  return { ok: true };
}

export async function notifyBooking(
  booking: StoredBooking,
): Promise<NotifyResult> {
  const text = [
    "<b>New Booking Request</b>",
    "",
    `<b>Package:</b> ${escapeHtml(booking.packageName)} — $${booking.packagePrice}`,
    `<b>Name:</b> ${escapeHtml(`${booking.firstName} ${booking.lastName}`.trim())}`,
    `<b>Phone:</b> ${escapeHtml(booking.phone)}`,
    `<b>Address:</b> ${escapeHtml(`${booking.street}, ${booking.city}, ${booking.state} ${booking.zip}`)}`,
    `<b>Car:</b> ${escapeHtml(`${booking.carMake} ${booking.modelYear}`.trim())}`,
    `<b>ID:</b> ${escapeHtml(booking.id)}`,
    `<b>Time:</b> ${escapeHtml(booking.createdAt)}`,
  ].join("\n");

  return sendTelegramMessage(text);
}

export async function notifyQuote(quote: StoredQuote): Promise<NotifyResult> {
  const text = [
    "<b>New Quote Request</b>",
    "",
    `<b>Name:</b> ${escapeHtml(`${quote.firstName} ${quote.lastName}`.trim())}`,
    `<b>Email:</b> ${escapeHtml(quote.email)}`,
    `<b>Phone:</b> ${escapeHtml(quote.phone)}`,
    `<b>Message:</b>`,
    escapeHtml(quote.message),
    "",
    `<b>ID:</b> ${escapeHtml(quote.id)}`,
    `<b>Time:</b> ${escapeHtml(quote.createdAt)}`,
  ].join("\n");

  return sendTelegramMessage(text);
}
