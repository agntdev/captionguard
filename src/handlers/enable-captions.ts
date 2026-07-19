import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getGroupSettings, saveGroupSettings, isAdmin } from "../storage.js";

registerMainMenuItem({ label: "✅ Enable", data: "cmd:enable_captions", order: 10 });

const composer = new Composer<Ctx>();

composer.command("enable_captions", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change enforcement settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.enforcement_enabled = true;
  await saveGroupSettings(chatId, settings);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.reply("Caption enforcement is now ON for this group.", {
    reply_markup: kb,
  });
});

composer.callbackQuery("cmd:enable_captions", async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (!isAdmin(ctx)) {
    await ctx.reply("Only admins can change enforcement settings.");
    return;
  }
  const settings = await getGroupSettings(chatId);
  settings.enforcement_enabled = true;
  await saveGroupSettings(chatId, settings);
  const kb = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
  await ctx.editMessageText("Caption enforcement is now ON for this group.", {
    reply_markup: kb,
  });
});

export default composer;
