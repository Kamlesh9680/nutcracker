const { Telegraf } = require('telegraf');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffmpeg-installer/ffprobe');
const fluentFfmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const nsfw = require('nsfwjs');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Replace with your bot token
const token = '6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE';
const bot = new Telegraf(token);

// Set ffmpeg and ffprobe paths
fluentFfmpeg.setFfmpegPath(ffmpeg.path);
fluentFfmpeg.setFfprobePath(ffprobe.path);

// Ensure temp directory exists
const tempDir = './temp';
if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir);
}

// Load NSFW model
let nsfwModel;
nsfw.load().then((model) => {
    nsfwModel = model;
});

// Function to download video
const downloadVideo = async (url, filePath) => {
    const response = await axios({
        url,
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        response.data.pipe(stream);
        stream.on('finish', () => resolve(filePath));
        stream.on('error', (error) => reject(error));
    });
};

// Function to extract thumbnail
const extractThumbnail = (videoPath, thumbnailPath) => {
    return new Promise((resolve, reject) => {
        fluentFfmpeg(videoPath)
            .screenshots({
                count: 1,
                folder: path.dirname(thumbnailPath),
                filename: path.basename(thumbnailPath),
                size: '320x240'
            })
            .on('end', () => resolve(thumbnailPath))
            .on('error', (error) => reject(error));
    });
};

// Function to check and censor nudity
const censorNudity = async (thumbnailPath) => {
    const img = await loadImage(thumbnailPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const predictions = await nsfwModel.classify(canvas);
    if (predictions.some(p => p.className === 'Porn' && p.probability > 0.5)) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, img.width, img.height);  // Censor the whole image for simplicity
    }
    const censoredPath = thumbnailPath.replace('.jpg', '_censored.jpg');
    fs.writeFileSync(censoredPath, canvas.toBuffer());
    return censoredPath;
};

// Bot message handler
bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text && text.startsWith('http')) {
        const videoUrl = text;
        const videoPath = path.join(tempDir, 'video.mp4');
        const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

        try {
            await downloadVideo(videoUrl, videoPath);
            await extractThumbnail(videoPath, thumbnailPath);
            const censoredThumbnailPath = await censorNudity(thumbnailPath);

            await ctx.replyWithPhoto({ source: censoredThumbnailPath });
        } catch (error) {
            console.error(error);
            await ctx.reply('Failed to process the video. Please try again.');
        } finally {
            // Clean up files
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
            const censoredThumbnailPath = thumbnailPath.replace('.jpg', '_censored.jpg');
            if (fs.existsSync(censoredThumbnailPath)) fs.unlinkSync(censoredThumbnailPath);
        }
    } else {
        await ctx.reply('Please send a valid video URL.');
    }
});

bot.launch();
console.log('Bot is running...');
