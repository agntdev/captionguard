import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import {
  getGroupSettings,
  addAuditEntry,
  type AuditEntry,
} from "../storage.js";

const composer = new Composer<Ctx>();

composer.on("message:photo", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId || ctx.chat?.type === "private") return;

  const settings = await getGroupSettings(chatId);
  if (!settings.enforcement_enabled) return;

  const msg = ctx.message;
  if (!msg) return;

  const hasCaption = !!msg.caption && msg.caption.trim().length > 0;
  if (hasCaption) return;

  const from = msg.from;
  const username = from
    ? from.username
      ? `@${from.username}`
      : from.first_name ?? "Unknown"
    : "Unknown";

  const auditEntry: AuditEntry = {
    timestamp: Date.now(),
    user_id: from?.id ?? 0,
    username,
    message_id: msg.message_id,
    caption_present: false,
    group_id: chatId,
  };
  await addAuditEntry(chatId, auditEntry);

  try {
    await ctx.api.deleteMessage(chatId, msg.message_id);
  } catch {
    return;
  }

  if (settings.in_group_notices) {
    const kb = inlineKeyboard([
      [inlineButton("Appeal", `appeal:request:${chatId}:${msg.message_id}`)],
    ]);
    await ctx.reply(
      `Photo by ${username} was removed — captions are required in this group.`,
      { reply_markup: kb },
    );
  }

  if (settings.admin_notifications) {
    try {
      const appealKb = inlineKeyboard([
        [inlineButton("Appeal", `appeal:request:${chatId}:${msg.message_id}`)],
      ]);
      await ctx.api.sendMessage(
        chatId,
        `Deleted uncaptioned photo from ${username} (msg #${msg.message_id}).`,
        { reply_markup: appealKb },
      );
    } catch {
      // best-effort
    }
  }
});

export default composer;
