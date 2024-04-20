const { Telegraf, Scenes, session } = require('telegraf');
const MongoClient = require('mongodb').MongoClient;
// const secrets = require('secrets');


// Replace 'YOUR_BOT_TOKEN' with your actual Telegram Bot API token
const token = '6969140689:AAFnyN8u5lS4C8zbxCFc30sft8ENwtZgXEA';
const bot = new Telegraf(token);
const stage = new Scenes.Stage();

// Register the stage with the bot
bot.use(session());
bot.use(stage.middleware());
// MongoDB Connection URL
const mongoURI = 'mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker';

const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = client.db('nutCracker');
const collection = db.collection('linkConvertor');
const userSettings = db.collection('linkConvertor');
const videosRecordCollection = db.collection('videosRecord');


bot.start((ctx) => {
    const user_id = ctx.message.from.id;
    const user_name = ctx.message.from.username || " ";
    getUserRecord(user_id)
        .then((user_record) => {
            const first = ctx.message.from.first_name;
            if (user_record) {
                ctx.reply(`Welcome back!...\n\nShare any link of our platform, I will create a new unique link for you.\n\nNote: There are several commands available in menu option to reduce your workload.`);
            } else {
                console.log("new");
                insertUserRecord(user_id, user_name)
                    .then(() => {
                        ctx.reply(`Welcome! ${first}\nWe're glad you're here.\n\nShare any link of our platform, I will create a new unique link for you.\n\nNote: There are several commands available in menu option to reduce your workload.`);
                    })
                    .catch((err) => console.error(err));
            }
        })
        .catch((err) => console.error(err));
});

bot.command('availablebots', (ctx) => {
    const bot_list = [
        {
            name: "Nutcracker video convert bot.",
            link: "https://t.me/nutcracker_video_convert_bot"
        },
        {
            name: "NutCracker Link Convert Bot",
            link: "https://t.me/NutCracker_Link_Convert_Bot"
        },
        {
            name: "NutCracker Finance Bot",
            link: "https://t.me/NutCracker_Finance_Bot"
        }
    ];

    const keyboard = bot_list.map((bot) => [{ text: bot.name, url: bot.link }]);

    ctx.reply(`Available Bots: 👇👇`, {
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});


bot.command('getmyid', (ctx) => {
    const user_id = ctx.message.from.id;
    ctx.reply(`Here is your 👤 user id:\n\n ${user_id}`);
});



// /channel command
bot.command('channel', (ctx) => {
    ctx.scene.enter('addChannelScene');
});
const addChannelScene = new Scenes.BaseScene('addChannelScene');
addChannelScene.enter((ctx) => {
    ctx.reply('Please provide the channel link.');
});
addChannelScene.on('text', async (ctx) => {
    const channelLink = ctx.message.text;

    try {
        await collection.updateOne(
            { chatId: ctx.chat.id }, // Filter
            { $set: { channelLink } }, // Update
            { upsert: true } // Options: Insert if document does not exist
        );
        ctx.reply('Channel link saved successfully!');
    } catch (err) {
        console.error('Error saving channel link to database:', err);
        ctx.reply('An error occurred while saving the channel link. Please try again later.');
    }
    // Return to stop further processing of text messages
    ctx.scene.leave();
});
stage.register(addChannelScene);

// bot.command('channel', (ctx) => {
//     ctx.reply('Please provide the channel link.');
//     bot.on('text', async (ctx) => {
//         const channelLink = ctx.message.text;

//         try {
//             await collection.updateOne(
//                 { chatId: ctx.chat.id }, // Filter
//                 { $set: { channelLink } }, // Update
//                 { upsert: true } // Options: Insert if document does not exist
//             );
//             ctx.reply('Channel link saved successfully!');
//         } catch (err) {
//             console.error('Error saving channel link to database:', err);
//             ctx.reply('An error occurred while saving the channel link. Please try again later.');
//         }
//         // Return to stop further processing of text messages
//         ctx.scene.leave();

//     });
// });

bot.command('addfooter', (ctx) => {
    ctx.scene.enter('addFooterScene');
});
const addFooterScene = new Scenes.BaseScene('addFooterScene');

addFooterScene.enter((ctx) => {
    ctx.reply('Please provide the footer text.');
});

addFooterScene.on('text', async (ctx) => {
    const footerText = ctx.message.text;

    try {
        await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { footerText } },
            { upsert: true }
        );
        ctx.reply('Footer text saved successfully!');
    } catch (err) {
        console.error('Error saving footer text to database:', err);
        ctx.reply('An error occurred while saving the footer text. Please try again later.');
    }
    // Leave the current scene to stop further processing of text messages
    ctx.scene.leave();
});
stage.register(addFooterScene);

// /addheader command
bot.command('addheader', (ctx) => {
    ctx.scene.enter('addHeaderScene');
});

// Define the scene
const addHeaderScene = new Scenes.BaseScene('addHeaderScene');

addHeaderScene.enter((ctx) => {
    ctx.reply('Please provide the header text.');
});

addHeaderScene.on('text', async (ctx) => {
    const headerText = ctx.message.text;

    try {
        await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { headerText } },
            { upsert: true }
        );
        ctx.reply('Header text saved successfully!');
    } catch (err) {
        console.error('Error saving header text to database:', err);
        ctx.reply('An error occurred while saving the header text. Please try again later.');
    }
    // Leave the current scene to stop further processing of text messages
    ctx.scene.leave();
});

// Register the scene with the stage
stage.register(addHeaderScene);
// /removechannel command
bot.command('removechannel', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $unset: { channelLink: '' } }
        );
        if (result.deletedCount > 0) {
            ctx.reply('Channel link removed successfully!');
        } else {
            ctx.reply('Channel link removed successfully!');
        }
    } catch (err) {
        console.error('Error removing channel link from database:', err);
        ctx.reply('An error occurred while removing the channel link. Please try again later.');
    }
});

// /removefooter command
bot.command('removefooter', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $unset: { footerText: '' } }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Footer text removed successfully!');
        } else {
            ctx.reply('No footer text saved.');
        }
    } catch (err) {
        console.error('Error removing footer text from database:', err);
        ctx.reply('An error occurred while removing the footer text. Please try again later.');
    }
});

// /removeheader command
bot.command('removeheader', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $unset: { headerText: '' } }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Header text removed successfully!');
        } else {
            ctx.reply('No header text saved.');
        }
    } catch (err) {
        console.error('Error removing header text from database:', err);
        ctx.reply('An error occurred while removing the header text. Please try again later.');
    }
});
// /enabletext command
bot.command('enabletext', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { enableText: 'yes' } },
            { upsert: true }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Text enabled successfully!');
        } else {
            ctx.reply('Text already enabled.');
        }
    } catch (err) {
        console.error('Error enabling text in database:', err);
        ctx.reply('An error occurred while enabling text. Please try again later.');
    }
});

// /disabletext command
bot.command('disabletext', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { enableText: 'no' } },
            { upsert: true }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Text disabled successfully!');
        } else {
            ctx.reply('Text already disabled.');
        }
    } catch (err) {
        console.error('Error disabling text in database:', err);
        ctx.reply('An error occurred while disabling text. Please try again later.');
    }
});
// /addpicture command
bot.command('addpicture', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { enablePicture: true } },
            { upsert: true }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Picture enabled successfully!');
        } else {
            ctx.reply('Picture already enabled.');
        }
    } catch (err) {
        console.error('Error enabling link preview in database:', err);
        ctx.reply('An error occurred while enabling picture. Please try again later.');
    }
});

// /disablepicture command
bot.command('disablepicture', async (ctx) => {
    try {
        const result = await collection.updateOne(
            { chatId: ctx.chat.id },
            { $set: { enablePicture: false } },
            { upsert: true }
        );
        if (result.modifiedCount > 0) {
            ctx.reply('Picture disabled successfully!');
        } else {
            ctx.reply('Picture already disabled.');
        }
    } catch (err) {
        console.error('Error disabling picture in database:', err);
        ctx.reply('An error occurred while disabling picture. Please try again later.');
    }
});

const convertedLinksMap = new Map();

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text || '';
    const photo = ctx.message.photo || [];
    const caption = ctx.message.caption || ''; // Check for caption when a photo is present

    console.log("Message Text:", messageText);
    // console.log("Photo:");

    // If the message contains a photo
    if (photo.length > 0) {
        console.log("Handling message with a photo...");
        // Handle the photo (if needed)

        // If there is also message text or caption, handle it
        if (messageText !== '' || caption !== '') {
            console.log("Handling message text or caption as well...");
            // Use caption if available, otherwise fallback to message text
            const textToHandle = caption !== '' ? caption : messageText;
            // Call the function to handle video links with the text
            await handleVideoLinks(ctx, textToHandle);
        }
    }
    // If the message contains only text
    else if (messageText !== '') {
        console.log("Handling message with only text...");
        // Call the function to handle video links with the text
        await handleVideoLinks(ctx, messageText, photo);
    }
    else {
        console.log("Empty message.");
    }
});

// Function to extract video IDs from the message text
function extractVideoIds(messageText) {
    const videoIdPattern = /[0-9a-f]{24}/gi;
    return messageText.match(videoIdPattern) || [];
}

function generateUserMessage(videoLinks, modifiedLinks, userSettings, originalMessage) {
    // Check if headerText, channelLink, and footerText are empty or not present
    const isHeaderTextEmpty = !userSettings || (!userSettings.headerText || userSettings.headerText.trim() === '');
    const isChannelLinkEmpty = !userSettings || (!userSettings.channelLink || userSettings.channelLink.trim() === '');
    const isFooterTextEmpty = !userSettings || (!userSettings.footerText || userSettings.footerText.trim() === '');

    if (isHeaderTextEmpty && isChannelLinkEmpty && isFooterTextEmpty) {
        return originalMessage;
    }

    let modifiedMessage = originalMessage;

    // Replace original links with modified links
    for (const videoId in modifiedLinks) {
        if (modifiedLinks.hasOwnProperty(videoId)) {
            const originalLink = `https://nutcracker.live/plays/${videoId}`;
            const modifiedLink = modifiedLinks[videoId];
            modifiedMessage = modifiedMessage.replace(originalLink, modifiedLink);
        }
    }

    // Replace original links with modified links in case any remaining
    for (const videoId in videoLinks) {
        if (videoLinks.hasOwnProperty(videoId)) {
            const originalLink = `https://nutcracker.live/plays/${videoId}`;
            const modifiedLink = modifiedLinks[videoId];
            modifiedMessage = modifiedMessage.replace(originalLink, modifiedLink);
        }
    }

    return modifiedMessage;
}







async function modifyVideoLinks(videoId, videoLinks, userSettings, videosRecordCollection, ctx) {
    try {
        const convertRecord = await videosRecordCollection.findOne({ convertedFrom: videoId });
        if (convertRecord) {
            const originalVideoId = convertRecord.uniqueLink;
            return videoLinks.replace(`https://nutcracker.live/plays/${videoId}`, `https://nutcracker.live/plays/${originalVideoId}`);
        } else {
            const videoRecord = await videosRecordCollection.findOne({ uniqueLink: videoId });

            if (videoRecord) {
                const newVideoId = generateRandomHex(24);
                const newVideoRecord = {
                    ...videoRecord,
                    uniqueLink: newVideoId,
                    relatedUser: ctx.from.id,
                    convertedFrom: videoId
                };
                delete newVideoRecord._id;
                await videosRecordCollection.insertOne(newVideoRecord);
                return videoLinks.replace(`https://nutcracker.live/plays/${videoId}`, `https://nutcracker.live/plays/${newVideoId}`);
            } else {
                return 'Video not found.';
            }
        }
    } catch (error) {
        console.error('Error modifying video links:', error);
        return 'Error modifying video links'; // Return error message
    }
}

function prepareReplyMessage(videoIdMatches, modifiedLinks) {
    let replyMessage = '';
    for (const videoId of videoIdMatches) {
        // Check if modifiedLinks[videoId] is defined
        if (modifiedLinks[videoId]) {
            // Append the modified link to the reply message
            replyMessage += modifiedLinks[videoId] + "\n";
        } else {
            console.error(`Modified link for video ID ${videoId} is undefined.`);
        }
    }
    return replyMessage.trim(); // Trim whitespace before returning
}


async function handleVideoLinks(ctx, messageText = '') {
    console.log('Message Text:', messageText);

    const videoIdMatches = extractVideoIds(messageText);
    console.log('Video ID Matches:', videoIdMatches);

    if (videoIdMatches.length > 0) {
        const modifiedLinks = {};
        const userSettings = await collection.findOne({ chatId: ctx.from.id });
        console.log('User Settings:', userSettings);

        const videoLinks = {};

        for (const videoId of videoIdMatches) {
            const videoLinks = `https://nutcracker.live/plays/${videoId}`;
            console.log('Video Links:', videoLinks);

            modifiedLinks[videoId] = await modifyVideoLinks(videoId, videoLinks, userSettings, videosRecordCollection, ctx);
            if (modifiedLinks[videoId] === 'Error modifying video links') {
                console.error('Error modifying video links:', videoId);
                // Handle error condition here
                // For now, let's continue with the loop
            }
        }

        const modifiedUserMessage = generateUserMessage(videoLinks, modifiedLinks, userSettings, messageText);
        console.log('Modified User Message:', modifiedUserMessage);
        
        

        if (userSettings && userSettings.enableText !== false) {
            ctx.reply(modifiedUserMessage);
        } else {
            const originalMessage = `Original Message: ${messageText}\n\n`;
            const replyMessage = prepareReplyMessage(videoIdMatches, modifiedLinks);
            if (ctx.message.photo && ctx.message.photo.length > 0) {
                ctx.replyWithPhoto({ source: ctx.message.photo[0].file_id }, { caption: `${originalMessage}${replyMessage}` });
            } else {
                ctx.reply(`${originalMessage}${replyMessage}`);
            }
        }
    }
}



function replaceVideoLinks(originalMessage, modifiedMessage, modifiedLinks) {
    let replacedMessage = modifiedMessage;
    for (const videoId in modifiedLinks) {
        if (modifiedLinks.hasOwnProperty(videoId)) {
            const originalLink = `https://nutcracker.live/plays/${videoId}`;
            const modifiedLink = modifiedLinks[videoId];
            replacedMessage = replacedMessage.replace(originalLink, modifiedLink);
        }
    }
    return replacedMessage;
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


async function getUserRecord(user_id) {
    try {
        await client.connect();
        const db = client.db("nutCracker");
        const userCollection = db.collection("userRecord");
        const user_information = await userCollection.findOne({ userId: user_id });
        return user_information;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function insertUserRecord(user_id, user_name) {
    try {
        const db = client.db("nutCracker");
        const userCollection = db.collection("userRecord");
        const result = await userCollection.insertOne({
            userId: user_id,
            userName: user_name,
            upiNumber: 0,
            uploadedVideos: 0,
            createdAt: moment().toDate()
        });
        console.log("User record inserted successfully.");
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
// Start polling
bot.launch().then(() => console.log('Bot started'));
