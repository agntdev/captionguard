import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getGroupSettings, saveGroupSettings, isAdmin } from "../storage.js";

registerMainMenuItem({ label: "⛔ Disable", data: "cmd:disable_captions", order: 11 });

const composer = new Composer<Ctx>();

composer.command("disable_captions", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change enforcement settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.enforcement_enabled = false;
  await saveGroupSettings(chatId, settings);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.reply("Caption enforcement is now OFF.", {
    reply_markup: kb,
  });
});

composer.callbackQuery("cmd:disable_captions", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change enforcement settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.enforcement_enabled = false;
  await saveGroupSettings(chatId, settings);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.editMessageText("Caption enforcement is now OFF.", {
    reply_markup: kb,
  });
});

export default composer;
