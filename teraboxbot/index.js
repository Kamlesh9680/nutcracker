async function main() {
  const { Telegraf, Markup } = require("telegraf");
  const { getDetails } = require("./api");
  const { sendFile } = require("./utils");
  const express = require("express");

  const bot = new Telegraf('6316816141:AAGgzYw78paDGpIsLTWOWTc6dAqFwUBC5_8');

  bot.start(async (ctx) => {
    try {
      ctx.reply(
        `<b>Hi ${ctx.message.from.first_name},</b>\n\n<b>I can Download Files from Terabox.</b>\n\n<b>Send any terabox link to download.</b>\n\n<b>Usage:</b>\n1. <b>Please send one link at once.</b>\n2. <b>It converts links which contain videos up to 50MB. You can manually download larger videos from the following:</b> <code>https://terabox-dl-arman.vercel.app/</code> <b>and upload them to our @nutcracker_video_convert_bot to get a direct playing link.</b>\n\n<b>Offical Channel - https://t.me/Nutcracker_live</b>\n\n<b>Discussion group - https://t.me/NutCracker_Discussion</b>`,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      console.error(e);
    }
  });
  
  

  bot.command('help', (ctx) => {
    ctx.reply(`You can connect on following link for any kind of help.\n\nSupport Team - https://t.me/NetCracker_live`);
  });

  bot.command("availablebots", async (ctx) => {
    const bot_list = [
      [
        "Nutcracker video convert bot.",
        "https://t.me/nutcracker_video_convert_bot",
      ],
      [
        "NutCracker Link Convert Bot",
        "https://t.me/NutCracker_Link_Convert_Bot",
      ],
      [
        "NutCracker Finance Bot",
        "https://t.me/NutCracker_Finance_Bot",
      ],
      [
        "NutCracker - Terabox Links to video",
        "https://t.me/Terabox_Link_to_Nutcracker_bot",
      ],
    ];

    const keyboard = bot_list.map((bot) => [{
      text: bot[0],
      url: bot[1]
    }]);

    await ctx.reply("Available Bots: 👇👇", {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
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
