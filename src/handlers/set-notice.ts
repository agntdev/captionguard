import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getGroupSettings, saveGroupSettings, isAdmin } from "../storage.js";

registerMainMenuItem({ label: "📢 Notices", data: "cmd:set_notice", order: 13 });

const composer = new Composer<Ctx>();

composer.command("set_notice", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change notice settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.in_group_notices = !settings.in_group_notices;
  await saveGroupSettings(chatId, settings);
  const status = settings.in_group_notices ? "ON" : "OFF";
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.reply(`In-group deletion notices are now ${status}.`, {
    reply_markup: kb,
  });
});

composer.callbackQuery("cmd:set_notice", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change notice settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.in_group_notices = !settings.in_group_notices;
  await saveGroupSettings(chatId, settings);
  const status = settings.in_group_notices ? "ON" : "OFF";
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.editMessageText(`In-group deletion notices are now ${status}.`, {
    reply_markup: kb,
  });
});

export default composer;
