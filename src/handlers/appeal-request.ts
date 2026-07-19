import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { addAuditEntry, getAuditLog, type AuditEntry } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("appeal:request", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Appeal request received. An admin will review this shortly.");
});

composer.callbackQuery(/^appeal:request:(-?\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const match = ctx.match;
  if (!match) return;
  const groupId = Number(match[1]);
  const messageId = Number(match[2]);

  const entries = await getAuditLog(groupId, 50);
  const entry = entries.find(
    (e) => e.message_id === messageId && e.group_id === groupId,
  );

  const username = entry?.username ?? "Unknown user";

  const appealEntry: AuditEntry = {
    timestamp: Date.now(),
    user_id: entry?.user_id ?? 0,
    username,
    message_id: messageId,
    caption_present: false,
    group_id: groupId,
    appeal_requested: true,
  };
  await addAuditEntry(groupId, appealEntry);

  const kb = inlineKeyboard([
    [inlineButton("✅ Restore", `appeal:restore:${groupId}:${messageId}`)],
    [inlineButton("❌ Deny", `appeal:deny:${groupId}:${messageId}`)],
  ]);

  await ctx.reply(
    `Appeal request from ${username} for deleted message #${messageId}.\n\nTap to approve or deny.`,
    { reply_markup: kb },
  );
});

composer.callbackQuery(/^appeal:restore:(-?\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery("Appeal noted — restore the message manually if needed.");
  await ctx.editMessageText("Appeal recorded. Restore the message manually if appropriate.");
});

composer.callbackQuery(/^appeal:deny:(-?\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery("Appeal denied.");
  await ctx.editMessageText("Appeal denied.");
});

export default composer;
