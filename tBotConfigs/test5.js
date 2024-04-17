const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const FileType = require('file-type');
const puppeteer = require('puppeteer');


// Telegram bot token
const token = '6419718020:AAHrsd2wps0Uh-1l51W9KFYJmmyULUilMfE';

// Directory to save downloaded videos
const UPLOADS_DIR = '../uploads';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Function to handle the /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! Send me a direct download link for a video file.');
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const downloadLink = msg.text;

    try {
        console.log(`Downloading video from: ${downloadLink}`);

        // Download the video using Puppeteer
        const filepath = await downloadVideo(downloadLink);

        if (filepath) {
            console.log('Video downloaded successfully and saved.');
            bot.sendMessage(chatId, 'Video downloaded successfully and saved.');
        } else {
            console.error('Failed to download video.');
            bot.sendMessage(chatId, 'Failed to download video. Please try again later.');
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        bot.sendMessage(chatId, `An error occurred: ${error.message}`);
    }
});

// Function to download video using Puppeteer
async function downloadVideo(url) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent('Chrome/100.0.0.0 Safari/537.36');
        await page.goto(url);

        // Simulate click action on the download link
        //   await page.click('#download-button'); // Replace with the actual download button selector

        // Wait for the download to complete (you might need to adjust this depending on the file size)
        await page.waitForTimeout(500000); // Wait for 5 seconds

        await browser.close();

        const filename = `video_${Date.now()}.mp4`; // Example filename (you can use a more meaningful name)
        const filepath = `../uploads/${filename}`; // Relative path to the uploads folder

        // Return the filepath if the download is successful
        return filepath; // Replace with the actual path where the file is saved
    } catch (error) {
        console.error(`Failed to download video: ${error.message}`);
        return null;
    }
}