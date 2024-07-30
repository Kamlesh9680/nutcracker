const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Replace with your bot token
const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');

// Function to download video from Terabox
const downloadTeraboxVideo = async (url, filePath) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    let error = null;
    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) {
        resolve(filePath);
      }
    });
  });
};

// Function to handle Terabox video links
const handleTeraboxLink = async (ctx) => {
  const link = ctx.message.text;
  const videoUrl = await getTeraboxDownloadLink(link); // You'll need to implement this function
  const filePath = path.join(__dirname, 'downloaded_video.mp4');

  try {
    await downloadTeraboxVideo(videoUrl, filePath);
    await ctx.replyWithVideo({ source: filePath });
  } catch (error) {
    console.error('Error downloading video:', error);
    ctx.reply('Failed to download video.');
  }
};

// Implement this function to retrieve the direct download link from Terabox
const getTeraboxDownloadLink = async (link) => {
  // Implement the logic to get the direct video download link
  // You may need to scrape the Terabox page or use any available API
  // For example purposes, let's assume you get the direct link directly
  return 'https://direct.video.link/from/terabox';
};

// Listen for messages
bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  if (messageText.startsWith('https://teraboxapp.com/')) {
    await handleTeraboxLink(ctx);
  } else {
    ctx.reply('Please send a valid Terabox video link.');
  }
});

// Start the bot
bot.launch();
