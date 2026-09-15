# Telegram webhook for Gloss & Detail booking admin commands.
# Deploy: see supabase/TELEGRAM_BOT.md
# verify_jwt must be false — Telegram does not send a Supabase JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAllowedChatIds(): Set<string> {
  const raw = Deno.env.get("TELEGRAM_ALLOWED_CHAT_IDS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

function formatBookingLine(row: {
  id: string;
  package_name: string;
  first_name: string;
  last_name: string;
  start_at: string;
  end_at: string;
}): string {
  const start = new Date(row.start_at).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const end = new Date(row.end_at).toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
  return [
    `<b>${row.package_name}</b>`,
    `${start} → ${end} ET`,
    `${row.first_name} ${row.last_name}`.trim(),
    `<code>${row.id}</code>`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!botToken || !supabaseUrl || !serviceKey) {
    return jsonResponse({ ok: false, error: "Missing server secrets" }, 500);
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
  }

  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? "").trim();

  if (!chatId || !text) {
    return jsonResponse({ ok: true, ignored: true });
  }

  const allowed = getAllowedChatIds();
  if (allowed.size > 0 && !allowed.has(String(chatId))) {
    return jsonResponse({ ok: true, unauthorized: true });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const reply = (message: string) =>
    sendTelegramMessage(botToken, chatId, message);

  try {
    if (text === "/help" || text === "/start") {
      await reply(
        [
          "<b>Gloss &amp; Detail booking bot</b>",
          "",
          "/list — upcoming bookings",
          "/cancel &lt;id&gt; — free a slot (delete booking)",
          "/help — this message",
        ].join("\n"),
      );
      return jsonResponse({ ok: true });
    }

    if (text === "/list") {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, package_name, first_name, last_name, start_at, end_at",
        )
        .gte("end_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(20);

      if (error) {
        await reply(`Failed to list bookings: ${error.message}`);
        return jsonResponse({ ok: false });
      }

      if (!data?.length) {
        await reply("No upcoming bookings.");
        return jsonResponse({ ok: true });
      }

      const body = data
        .map((row, index) => `${index + 1}. ${formatBookingLine(row)}`)
        .join("\n\n");
      await reply(
        `<b>Upcoming bookings</b>\n\n${body}\n\nCancel with:\n/cancel &lt;id&gt;`,
      );
      return jsonResponse({ ok: true });
    }

    const cancelMatch = text.match(/^\/cancel(?:@\w+)?\s+(.+)$/i);
    if (cancelMatch) {
      const id = cancelMatch[1].trim();
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRe.test(id)) {
        await reply("Invalid id. Use:\n/cancel &lt;booking-uuid&gt;");
        return jsonResponse({ ok: true });
      }

      const { data: existing, error: findError } = await supabase
        .from("bookings")
        .select(
          "id, package_name, first_name, last_name, start_at, end_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (findError) {
        await reply(`Lookup failed: ${findError.message}`);
        return jsonResponse({ ok: false });
      }

      if (!existing) {
        await reply("Booking not found (already cancelled?).");
        return jsonResponse({ ok: true });
      }

      const { error: deleteError } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (deleteError) {
        await reply(`Cancel failed: ${deleteError.message}`);
        return jsonResponse({ ok: false });
      }

      await reply(
        `<b>Slot freed</b>\n\n${formatBookingLine(existing)}\n\nThis time is available again on the site.`,
      );
      return jsonResponse({ ok: true });
    }

    if (text.startsWith("/cancel")) {
      await reply(
        "Usage:\n/cancel &lt;booking-uuid&gt;\n\nGet ids from /list or the booking notification.",
      );
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: true, ignored: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    try {
      await reply(`Bot error: ${message}`);
    } catch {
      /* ignore */
    }
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
