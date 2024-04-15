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
    const messageText = ctx.message.text || '';
    const photo = ctx.message.photo || [];
    const caption = ctx.message.caption || ''; // Check for caption when a photo is present

    console.log("Message Text:", messageText);
    console.log("Photo:");

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
        await handleVideoLinks(ctx, messageText);
    }
    else {
        console.log("Empty message.");
    }
});





async function handleVideoLinks(ctx, messageText = '') {
    console.log('Message Text:', messageText); // Log the message text

    // Regular expression pattern to match the video ID
    const videoIdPattern = /[0-9a-f]{24}/gi;
    const videoIdMatches = messageText.match(videoIdPattern);

    console.log('Video ID Matches:', videoIdMatches); // Log the video ID matches

    if (videoIdMatches && videoIdMatches.length > 0) {
        const videoId = videoIdMatches[0]; // Take the first match
        console.log('Video ID:', videoId); // Log the extracted video ID

        // Check the user's settings in the linkConvertor collection
        const userSettings = await collection.findOne({ chatId: ctx.from.id });
        console.log('User Settings:', userSettings); // Log the user settings

        let modifiedMessage = messageText;
        const videoLinks = `https://nutcracker.live/plays/${videoId}`;

        console.log('Video Links:', videoLinks); // Log the constructed video links

        if (userSettings && userSettings.enableText === 'yes') {
            // If enableText is "yes", modify the message based on user's settings

            let userMessage = '';

            // Construct the message with user's texts and the converted video link
            if (userSettings.headerText) userMessage += `${userSettings.headerText}\n\n`;
            userMessage += `${videoLinks}\n\n`; // Replace this with the converted link
            if (userSettings.channelLink) userMessage += `${userSettings.channelLink}\n\n`;
            if (userSettings.footerText) userMessage += `${userSettings.footerText}`;

            console.log('User Message:', userMessage); // Log the constructed user message

            // Update the message if any part is present in user's settings
            if (userSettings.headerText || userSettings.channelLink || userSettings.footerText) {
                modifiedMessage = userMessage;
            }
        } else {
            // If enableText is "no", remove all text from the user's message except the link
            modifiedMessage = videoLinks; // Only keep the video link
        }

        console.log('Modified Message:', modifiedMessage); // Log the modified message

        const convertRecord = await videosRecordCollection.findOne({ convertedFrom: videoId });

        if (convertRecord) {
            const originalVideoId = convertRecord.uniqueLink;
            console.log('Original Video ID:', originalVideoId); // Log the original video ID

            // Generate a new video link using the original video ID
            const modifiedLink = modifiedMessage.replace(videoId, originalVideoId);

            console.log('Modified Link:', modifiedLink); // Log the modified link

            // Reply to the user with the modified message and keep the photo if present
            ctx.reply(modifiedLink, { caption: ctx.message.caption, photo: ctx.message.photo });
        } else {
            // Search for the video ID in the videosRecord collection
            const videoRecord = await videosRecordCollection.findOne({ uniqueLink: videoId });

            console.log('Video Record:', videoRecord); // Log the video record

            if (videoRecord) {
                // Generate a new video ID for the user
                const newVideoId = generateRandomHex(24);

                console.log('New Video ID:', newVideoId); // Log the new video ID

                // Create a new video record with updated fields
                const newVideoRecord = {
                    ...videoRecord,
                    uniqueLink: newVideoId,
                    relatedUser: ctx.from.id, // Set the related user to the user who sent the message
                    convertedFrom: videoId
                };

                // Remove the _id field to prevent duplicate key error
                delete newVideoRecord._id;

                console.log('New Video Record:', newVideoRecord); // Log the new video record

                // Store the new video record in the videosRecord collection
                await videosRecordCollection.insertOne(newVideoRecord);

                // Generate a new video link using the updated video ID
                const modifiedLink = modifiedMessage.replace(videoId, newVideoId);

                console.log('Modified Link:', modifiedLink); // Log the modified link

                // Reply to the user with the modified message and keep the photo if present
                ctx.reply(modifiedLink, { caption: ctx.message.caption, photo: ctx.message.photo });

                await storeConvertedLinks(ctx.from.id, videoIdMatches.length);

                // Update the convertedLinksMap for this user
                if (!convertedLinksMap.has(ctx.from.id)) {
                    convertedLinksMap.set(ctx.from.id, []);
                }
                convertedLinksMap.get(ctx.from.id).push(videoId);
            } else {
                ctx.reply('Video not found.');
            }
        }

    }
}


async function storeConvertedLinks(user_id, linksCount) {
    try {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
        const linksRecord = await collection.findOne({ chatId: user_id });

        if (!linksRecord) {
            // If the user record doesn't exist, insert a new record
            await collection.insertOne({
                chatId: user_id,
                convertedLinks: [{ date: today, count: linksCount }]
            });
        } else {
            // If the user record exists, update the record
            const convertedLinks = linksRecord.convertedLinks || [];

            // Check if there is already a record for today
            const todayIndex = convertedLinks.findIndex(entry => entry.date === today);

            if (todayIndex === -1) {
                // If there is no record for today, add a new entry
                convertedLinks.unshift({ date: today, count: linksCount });

                // Keep only the last 10 days data
                if (convertedLinks.length > 10) {
                    convertedLinks.pop();
                }
            } else {
                // If there is a record for today, update the count
                convertedLinks[todayIndex].count += linksCount;
            }

            // Update the user record in the database
            const result = await collection.updateOne(
                { chatId: user_id },
                { $set: { convertedLinks: convertedLinks } }
            );

            if (result.modifiedCount === 0) {
                console.log('No documents matched the filter or the modification operation resulted in no change.');
            } else {
                console.log('Document updated successfully.');
            }
        }
    } catch (error) {
        console.error('Error storing converted links:', error);
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
