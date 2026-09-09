import type { StoredBooking, StoredQuote } from "./formStorage";

function getBotToken(): string {
  return (
    (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined)?.trim() ??
    ""
  );
}

function getChatId(): string {
  return (
    (import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined)?.trim() ?? ""
  );
}

export function isFormNotifyConfigured(): boolean {
  return getBotToken().length > 0 && getChatId().length > 0;
}

type NotifyResult = { ok: true } | { ok: false; message: string };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function sendTelegramMessage(text: string): Promise<NotifyResult> {
  const token = getBotToken();
  const chatId = getChatId();

  if (!token || !chatId) {
    return {
      ok: false,
      message:
        "Telegram notifications are not configured yet. Add bot token and chat id.",
    };
  }

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
