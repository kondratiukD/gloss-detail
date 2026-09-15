# Telegram cancel bot (Supabase Edge Function)

Commands (only from allowed chat ids):

- `/list` — upcoming bookings with ids
- `/cancel <id>` — delete booking and free the slot
- `/help` — help

## 1. Deploy the function

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy telegram-webhook --no-verify-jwt
```

`YOUR_PROJECT_REF` is the subdomain of your Supabase URL.

## 2. Set function secrets

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token
npx supabase secrets set TELEGRAM_ALLOWED_CHAT_IDS=111,222
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## 3. Point Telegram webhook to the function

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-webhook"
```

## 4. Use it

1. Open your bot in Telegram
2. Send `/list`
3. Copy an id and send `/cancel <uuid>`
