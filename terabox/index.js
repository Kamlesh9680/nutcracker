const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

// Define MongoDB schema for video records
const videoSchema = new mongoose.Schema({
  title: String,
  direct_link: String,
  filename: String,
  // fileLocalPath: String,
  // file_size: Number,
  // duration: Number,
  // mime_type: String,
  uniqueLink: String,
  relatedUser: String,
  userName: String,
  viewCount: { type: Number, default: 0 }
});

const VideoRecord = mongoose.model("videosRecord", videoSchema, "videosRecord");

async function main() {
  const { Telegraf, Markup } = require("telegraf");
  const { getDetails } = require("./api");

  const bot = new Telegraf("6316816141:AAGgzYw78paDGpIsLTWOWTc6dAqFwUBC5_8");

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
    ctx.reply(`Please Wait.!!`);

    if (ctx.message && ctx.message.text) {
      const messageText = ctx.message.text;
      if (
        messageText.includes("terabox.com") ||
        messageText.includes("teraboxapp.com")
      ) {
        const details = await getDetails(messageText);
        if (details && details.direct_link) {
          try {
            const user_id = ctx.from.id
            ctx.reply(`Sending Link Please Wait.!!`);
            const filePath = await downloadAndSave(details.direct_link);
            const videoUrl = await saveVideoInfo(details, user_id);
            await ctx.reply(`Your video has been uploaded successfully...\n\n😊😊Now you can start using the link:\n\n${videoUrl}`);
            // ctx.replyWithVideo({ source: filePath });
            // await ctx.reply(`Forward this video to @nutcracker_video_convert_bot.\n\nAnd get a direct playing link.`);
          } catch (e) {
            console.error(e); // Log the error for debugging
          }
        } else {
          ctx.reply('Something went wrong 🙃');
        }
      } else {
        ctx.reply("Please send a valid Terabox link.");
      }
    } else {
      ctx.reply("No message text found.");
    }
  });

  // Connect to MongoDB
  await mongoose.connect("mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "nutCracker"
  });
  console.log("Connected to MongoDB");

  bot.launch();
  console.log("Bot Started");

  async function downloadAndSave(url) {
    // Download video and save to "uploads" folder
    const fileName = 'video552456.mp4';
    const filePath = path.join(__dirname, "..", "uploads", fileName);
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", (err) => {
        reject(err);
      });
      fileStream.on("finish", function () {
        resolve();
      });
    });
    return filePath;
  }

  async function saveVideoInfo(videoDetails, user_id) {
    try {
      const videoId = generateRandomHex(24);
      const videoInfo = {
        filename: 'video552456.mp4',
        // fileLocalPath: `../uploads/${original_filename || 'video.mp4'}`,
        // file_size: message.video.file_size,
        // duration: message.video.duration,
        // mime_type: message.video.mime_type,
        uniqueLink: videoId,
        relatedUser: user_id,
        // userName: message.from.username || "",
        viewCount: 0
      };
      await VideoRecord.create(videoInfo);
      const videoUrl = `http://nutcracker.live/plays/${videoId}`;
      return videoUrl;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  // Helper function to generate a random hexadecimal string
  function generateRandomHex(length) {
    const characters = "abcdef0123456789";
    let randomHex = "";
    for (let i = 0; i < length; i++) {
      randomHex += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomHex;
  }
  function generateRandomFilename(length = 12) {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }
}

main();
