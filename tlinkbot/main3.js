const { Telegraf } = require('telegraf');
const { Markup } = require('telegraf');
const { Extra } = require('telegraf');
const fs = require('fs');
const { spawn } = require('child_process');
const { time } = require('console');
const { Worker } = require('worker_threads');
// const { extractUrls } = require('./util');

// Load configuration data from JSON file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Create a new Telegraf instance with your bot token
const bot = new Telegraf('6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE');

// Handle ineex
async function handleIndex(ele, message, msg) {
    const result = await bypasser.scrapeIndex(ele);
    try {
        await app.deleteMessages(message.chat.id, [msg.id]);
    } catch (error) {
        console.error(error);
    }
    for (const page of result) {
        await app.sendMessage(message.chat.id, page, {
            replyToMessageId: message.message_id,
            disableWebPagePreview: true
        });
    }
}

// Loop thread
async function loopthread(message, otherss = false) {
    const urls = urls = [];

    if (urls.length === 0) return;

    let msg;
    if (bypasser.ispresent(bypasser.ddl.ddllist, urls[0])) {
        msg = await app.sendMessage(message.chat.id, "⚡ __generating...__", {
            replyToMessageId: message.message_id
        });
    } else if (freewall.pass_paywall(urls[0], true)) {
        msg = await app.sendMessage(message.chat.id, "🕴️ __jumping the wall...__", {
            replyToMessageId: message.message_id
        });
    } else {
        if (urls[0].includes("https://olamovies") || urls[0].includes("https://psa.wf/")) {
            msg = await app.sendMessage(message.chat.id, "⏳ __this might take some time...__", {
                replyToMessageId: message.message_id
            });
        } else {
            msg = await app.sendMessage(message.chat.id, "🔎 __bypassing...__", {
                replyToMessageId: message.message_id
            });
        }
    }

    const strt = time();
    let links = "";
    let temp = null;

    for (const ele of urls) {
        if (/https?:\/\/(?:[\w.-]+)?\.\w+\/\d+:/.test(ele)) {
            await handleIndex(ele, message, msg);
            return;
        } else if (bypasser.ispresent(bypasser.ddl.ddllist, ele)) {
            try {
                temp = bypasser.ddl.direct_link_generator(ele);
            } catch (error) {
                temp = "**Error**: " + error;
            }
        } else if (freewall.pass_paywall(ele, true)) {
            const freefile = freewall.pass_paywall(ele);
            if (freefile) {
                try {
                    await app.sendDocument(message.chat.id, freefile, {
                        replyToMessageId: message.message_id
                    });
                    fs.unlinkSync(freefile);
                    await app.deleteMessages(message.chat.id, [msg.id]);
                    return;
                } catch (error) {
                    console.error(error);
                }
            } else {
                await app.sendMessage(message.chat.id, "__Failed to Jump", {
                    replyToMessageId: message.message_id
                });
            }
        } else {
            try {
                temp = bypasser.shortners(ele);
            } catch (error) {
                temp = "**Error**: " + error;
            }
        }
        console.log("bypassed:", temp);
        if (temp !== null) {
            links += temp + "\n\n";
        }
    }
    const end = time();
    const took = "Took " + ((end - strt) / 1000).toFixed(2) + "sec";
    console.log(took);

    if (otherss) {
        try {
            await app.sendPhoto(message.chat.id, message.photo.file_id, `${links}**\n${took}**`, {
                replyToMessageId: message.message_id
            });
            await app.deleteMessages(message.chat.id, [msg.id]);
            return;
        } catch (error) {
            console.error(error);
        }
    }

    try {
        const final = [];
        let tmp = "";
        for (const ele of links.split("\n\n")) {
            tmp += ele + "\n\n";
            if (tmp.length > 4000) {
                final.push(tmp);
                tmp = "";
            }
        }
        final.push(tmp);
        await app.deleteMessages(message.chat.id, msg.id);
        let tmsgid = message.message_id;
        for (const ele of final) {
            const tmsg = await app.sendMessage(message.chat.id, `${ele}**${took}**`, {
                replyToMessageId: tmsgid,
                disableWebPagePreview: true
            });
            tmsgid = tmsg.message_id;
        }
    } catch (error) {
        console.error(error);
        await app.sendMessage(message.chat.id, `__Failed to Bypass : ${error}__`, {
            replyToMessageId: message.message_id
        });
    }
}
// Start command
bot.command('start', async (ctx) => {
    ctx.reply("Hello");
    try {
        // Execute loopthread asynchronously
        await loopthread(ctx.message);
    } catch (error) {
        console.error('Error in loopthread:', error);
    }
});
// Help command
bot.command('help', (ctx) => {
    ctx.replyWithMarkdown(HELP_TEXT);
});

// Links
bot.on('text', async (ctx) => {
    const bypass = new Thread(() => loopthread(ctx.message), { daemon: true });
    bypass.start();
});

// Document thread
function docthread(message) {
    const msg = app.sendMessage(message.chat.id, '🔎 __bypassing...__', {
        replyToMessageId: message.message_id
    });
    console.log('sent DLC file');
    const dlccont = fs.readFileSync(file, 'utf8');
    const links = bypasser.getlinks(dlccont);
    app.editMessageText(message.chat.id, msg.id, `__${links}__`, {
        disableWebPagePreview: true
    });
    fs.unlinkSync(file);
}

// Files
bot.on(['document', 'photo', 'video'], async (ctx) => {
    try {
        if (ctx.message.document.file_name.endsWith('dlc')) {
            const bypass = new Thread(() => docthread(ctx.message), { daemon: true });
            bypass.start();
            return;
        }
    } catch (error) {
        console.error(error);
    }

    const bypass = new Thread(() => loopthread(ctx.message, true), { daemon: true });
    bypass.start();
});

// Server loop
console.log('Bot Starting');
bot.launch().then(() => console.log('Bot started'));