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
const userSettings  = db.collection('linkConvertor');
const videosRecordCollection = db.collection('videosRecord');


bot.start((ctx) => {
    const user_id = ctx.message.from.id;
    const user_name = ctx.message.from.username || " ";
    getUserRecord(user_id)
        .then((user_record) => {
            const first = ctx.message.from.first_name;
            if (user_record) {
                ctx.reply(`Welcome back! ....`);
            } else {
                console.log("new");
                insertUserRecord(user_id, user_name)
                    .then(() => {
                        ctx.reply(`Welcome! ${first}\n\nWe're glad you're here.\nTo start using our platform\nYou can start sharing videos directly\n\n Note: If anything went wrong don't worry about it as we are on testing phase`);
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
    const messageText = ctx.message.text;

    // Regular expression pattern to match the video ID
    const videoIdPattern = /[0-9a-f]{24}/gi;
    const videoIdMatches = messageText.match(videoIdPattern);

    if (videoIdMatches && videoIdMatches.length > 0) {
        const videoId = videoIdMatches[0]; // Take the first match

        // Check the user's settings in the linkConvertor collection
        const userSettings = await collection.findOne({ chatId: ctx.from.id });

        let modifiedMessage = messageText; 
        const videoLinks = `https://nutcracker.live/play/${videoId}`;

        if (userSettings && userSettings.enableText === 'yes') {
            // If enableText is "yes", modify the message based on user's settings
            
            let userMessage = '';

            // Construct the message with user's texts and the converted video link
            if (userSettings.headerText) userMessage += `${userSettings.headerText}\n\n`;
            userMessage += `${videoLinks}\n\n`; // Replace this with the converted link
            if (userSettings.channelLink) userMessage += `${userSettings.channelLink}\n\n`;
            if (userSettings.footerText) userMessage += `${userSettings.footerText}`;

            // Update the message if any part is present in user's settings
            if (userSettings.headerText || userSettings.channelLink || userSettings.footerText) {
                modifiedMessage = userMessage;
            }
        } else {
            // If enableText is "no", remove all text from the user's message except the link
            modifiedMessage = videoLinks; // Only keep the video link
        }

        // Search for the video ID in the videosRecord collection
        const videoRecord = await videosRecordCollection.findOne({ fileUniqueId: videoId });

        if (videoRecord) {
            // Generate a new video ID for the user
            const newVideoId = generateRandomHex(24);

            // Create a new video record with updated fields
            const newVideoRecord = {
                ...videoRecord,
                fileUniqueId: newVideoId,
                relatedUser: ctx.from.id, // Set the related user to the user who sent the message
                convertedFrom: videoId // Store the original videoId from the message
            };

            // Remove the _id field to prevent duplicate key error
            delete newVideoRecord._id;

            // Store the new video record in the videosRecord collection
            await videosRecordCollection.insertOne(newVideoRecord);

            // Generate a new video link using the updated video ID
            const modifiedLink = modifiedMessage.replace(videoId, newVideoId);

            // Reply to the user with the modified message
            ctx.reply(modifiedLink);

            // Update the convertedLinksMap for this user
            if (!convertedLinksMap.has(ctx.from.id)) {
                convertedLinksMap.set(ctx.from.id, []);
            }
            convertedLinksMap.get(ctx.from.id).push(videoId);
        } else {
            ctx.reply('Video not found.');
        }
    }
});


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
