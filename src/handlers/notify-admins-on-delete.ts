import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getGroupSettings, saveGroupSettings, isAdmin } from "../storage.js";

registerMainMenuItem({ label: "🔔 Alerts", data: "cmd:notify_admins", order: 12 });

const composer = new Composer<Ctx>();

composer.command("notify_admins_on_delete", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change notification settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.admin_notifications = !settings.admin_notifications;
  await saveGroupSettings(chatId, settings);
  const status = settings.admin_notifications ? "ON" : "OFF";
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.reply(`Admin notifications are now ${status}.`, {
    reply_markup: kb,
  });
});

composer.callbackQuery("cmd:notify_admins", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change notification settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.admin_notifications = !settings.admin_notifications;
  await saveGroupSettings(chatId, settings);
  const status = settings.admin_notifications ? "ON" : "OFF";
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.editMessageText(`Admin notifications are now ${status}.`, {
    reply_markup: kb,
  });
});

export default composer;
