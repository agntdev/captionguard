import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getAuditLog, isAdmin } from "../storage.js";

registerMainMenuItem({ label: "📋 History", data: "cmd:deletions", order: 14 });

const composer = new Composer<Ctx>();

function formatEntry(e: {
  timestamp: number;
  username: string;
  message_id: number;
  appeal_requested?: boolean;
}): string {
  const t = new Date(e.timestamp);
  const ts = `${t.getUTCHours().toString().padStart(2, "0")}:${t.getUTCMinutes().toString().padStart(2, "0")}`;
  const appeal = e.appeal_requested ? " [appealed]" : "";
  return `${ts} — ${e.username} (msg #${e.message_id})${appeal}`;
}

composer.command("deletions", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can view deletion history.");
    return;
  }
  const entries = await getAuditLog(chatId, 10);
  if (entries.length === 0) {
    const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
    await ctx.reply("No deletions recorded yet.", { reply_markup: kb });
    return;
  }
  const lines = entries.map((e, i) => `${i + 1}. ${formatEntry(e)}`);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.reply(`Recent deletions:\n\n${lines.join("\n")}`, { reply_markup: kb });
});

composer.callbackQuery("cmd:deletions", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can view deletion history.");
    return;
  }
  const entries = await getAuditLog(chatId, 10);
  if (entries.length === 0) {
    const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
    await ctx.editMessageText("No deletions recorded yet.", { reply_markup: kb });
    return;
  }
  const lines = entries.map((e, i) => `${i + 1}. ${formatEntry(e)}`);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.editMessageText(`Recent deletions:\n\n${lines.join("\n")}`, { reply_markup: kb });
});

export default composer;
