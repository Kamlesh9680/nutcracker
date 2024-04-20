async function main() {
  const { Telegraf, Markup } = require("telegraf");
  const { getDetails } = require("./api");
  const { sendFile } = require("./utils");
  const express = require("express");

  const bot = new Telegraf('6316816141:AAGgzYw78paDGpIsLTWOWTc6dAqFwUBC5_8');

  bot.start(async (ctx) => {
    try {
      ctx.reply(
        `Hi ${ctx.message.from.first_name},\n\nI can Download Files from Terabox.\n\nSend any terabox link to download.`,
        // Markup.inlineKeyboard([
        //   Markup.button.url(" Channel", "https://t.me/botcodes123"),
        //   Markup.button.url("Report bug", "https://t.me/Armanidrisi_bot"),
        // ]),
      );
    } catch (e) {
      console.error(e);
    }
  });

  bot.on("message", async (ctx) => {
    if (ctx.message && ctx.message.text) {
      const messageText = ctx.message.text;
      if (
        messageText.includes("terabox.com") ||
        messageText.includes("teraboxapp.com")
      ) {
        //const parts = messageText.split("/");
        //const linkID = parts[parts.length - 1];

        // ctx.reply(linkID)

        const details = await getDetails(messageText);
        if (details && details.direct_link) {
          try {
            ctx.reply(`Sending Link Please Wait.!!`);
            sendFile(details.direct_link, ctx);
          } catch (e) {
            console.error(e);
          }
        } else {
          ctx.reply('Something went wrong 🙃');
        }
        console.log(details);
      } else {
        ctx.reply("Please send a valid Terabox link.");
      }
    } else {
      //ctx.reply("No message text found.");
    }
  });


  bot.launch();
  console.log("bot started")

  // const app = express();
  // Set the bot API endpoint
  // app.use(await bot.createWebhook({ domain: process.env.WEBHOOK_URL }));

  // app.listen(process.env.PORT || 3000, () => console.log("Server Started"));
}

main();
