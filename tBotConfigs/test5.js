const { Telegraf, session } = require('telegraf');
const { Scenes, Markup } = require('telegraf');
// const { GoogleSpreadsheet } = require('google-spreadsheet');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');


// Initialize session middleware
dotenv.config();

// Initialize session middleware

const MONGO_URI = process.env.mongoDB_uri;
const client = new MongoClient(MONGO_URI);
const db = client.db("nutCracker");
const videoCollection = db.collection("videosRecord");
const userCollection = db.collection("userRecord");
const withdrawalCollection = db.collection("bankRecord");

const bot = new Telegraf('6419718020:AAHrsd2wps0Uh-1l51W9KFYJmmyULUilMfE');

bot.use(session());


// Handle commands
bot.command("start", async (ctx) => {
    const user_id = ctx.message.from.id;
    const user_name = ctx.message.from.username || " ";
    const user_record = await get_user_record(user_id);
    const first = ctx.message.from.first_name;
    if (user_record) {
        ctx.reply(`Welcome back! ....\n\nThis is NutCracker Finance bot.\n\n<b>Info:</b>\n1. <b>Earnings are calculated on the basis on $0.6/1000 views.</b>\n2. <b>You can add/edit bank details (fill carefully) for withdrawal using /editbankdetails command.</b>`, { parse_mode: "HTML" });
    } else {
        console.log("new");
        await insert_user_record(user_id, user_name);
        ctx.reply(
            `Welcome! ${first}\n\nWe're glad you're here.\nThis is NutCracker Finance bot.\n\n<b>Info:</b>\n1. <b>Earnings are calculated on the basis on $0.6/1000 views.</b>\n2. <b>You can add/edit bank details (fill carefully) for withdrawal using /editbankdetails command.</b>`, { parse_mode: "HTML" }
        );
    }
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

bot.command("getmyid", async (ctx) => {
    const user_id = ctx.message.from.id;
    await ctx.reply(`Here is your 👤 user id:\n\n ${user_id}`);
});

bot.command("checktotalviews", async (ctx) => {
    const user_id = ctx.message.from.id;
    const user_record = await get_user_record(user_id);
    const total_views = user_record.totalViews || 0;
    const total_earning = user_record.currentEarnings;
    await ctx.reply(`Total views for your videos: ${total_views}\n\nYour Total Earnings: $${total_earning}`);
});

bot.command("viewshistory", async (ctx) => {
    const user_id = ctx.message.from.id;

    // Retrieve user's record from the database
    const userRecord = await userCollection.findOne({ userId: user_id });

    let response_message = "";

    if (userRecord && userRecord.tenDaysViews && userRecord.tenDaysViews.length > 0) {
        response_message = "Last 10 days views:\n\n";
        userRecord.tenDaysViews.forEach((entry) => {
            response_message += `Date: ${entry.date}, Total views: ${entry.views}\n`;
        });
    } else {
        response_message = "You haven't watched any videos yet.";
    }

    await ctx.reply(response_message);
});






// Create a new scene for editing bank details
const editBankDetailsScene = new Scenes.BaseScene('editBankDetailsScene');

// Step 1: Prompt user with confirmation message and buttons
editBankDetailsScene.enter(async (ctx) => {
    await ctx.reply('Are you sure you want to add/edit your bank account details?', Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'edit_bank_details_yes'),
        Markup.button.callback('No', 'edit_bank_details_no')
    ]));
});

// Step 2: Handle user response to confirmation message
editBankDetailsScene.action('edit_bank_details_yes', async (ctx) => {
    await ctx.reply('Please provide your bank name:');
    ctx.scene.state.step = 1; // Set the current step to 1
    ctx.scene.state.bankDetails = {}; // Initialize bankDetails object to store user input
});

editBankDetailsScene.action('edit_bank_details_no', async (ctx) => {
    await ctx.reply('Bank account details update cancelled.');
    ctx.scene.leave(); // Leave the scene
});

// Step 3: Handle user input for bank details
editBankDetailsScene.on('text', async (ctx) => {
    const step = ctx.scene.state.step;
    const bankDetails = ctx.scene.state.bankDetails;

    if (step === 1) {
        bankDetails.bankName = ctx.message.text;
        await ctx.reply('Please provide your account number:');
        ctx.scene.state.step = 2; // Move to next step
    } else if (step === 2) {
        bankDetails.accountNo = ctx.message.text;
        await ctx.reply('Please provide your IFSC:');
        ctx.scene.state.step = 3; // Move to next step
    } else if (step === 3) {
        bankDetails.ifsc = ctx.message.text;
        await ctx.reply('Please provide your account holder name:');
        ctx.scene.state.step = 4; // Move to next step
    } else if (step === 4) {
        bankDetails.accountHolderName = ctx.message.text;

        // Save bank details to the database (you'll need to implement this)
        const success = await saveBankDetails(ctx.message.from.id, bankDetails);

        if (success) {
            await ctx.reply('Bank account updated successfully.');
        } else {
            await ctx.reply('Failed to update bank account details. Please try again later.');
        }

        ctx.scene.leave(); // Leave the scene after updating bank details
    }
});

// Function to save bank details to the database
async function saveBankDetails(userId, bankDetails) {
    try {
        const db = client.db('nutCracker');
        const collection = db.collection('bankRecord');
        const collection2 = db.collection('userRecord');

        // Specify upsert option as true to insert if document not found
        const options = { upsert: true };

        // Update the bank details in the collection or insert if not found
        const result = await collection.updateOne(
            { userId: userId },
            { $set: { bankDetails: bankDetails } },
            options
        );
        const result2 = await collection2.updateOne(
            { userId: userId },
            { $set: { bankDetails: bankDetails } },
            options
        );

        if (result.upsertedCount === 1 || result.modifiedCount === 1) {
            console.log('Bank details saved successfully');
            return true; // Success
        } else {
            console.log('No documents matched the query to update or insert');
            return false; // Failure
        }
    } catch (error) {
        console.error('Error saving bank details:', error);
        return false; // Failure
    }
}


// Register the scene with Telegraf
// const stage = new Scenes.Stage([editBankDetailsScene]);
const stage = new Scenes.Stage();
bot.use(stage.middleware());

// Command handler for /editbankdetails
bot.command('editbankdetails', async (ctx) => {
    // Enter the editBankDetailsScene
    await ctx.scene.enter('editBankDetailsScene');
});
stage.register(editBankDetailsScene);

bot.command("withdraw", async (ctx) => {
    const user_id = ctx.message.from.id;
    const user_record = await get_user_record(user_id);

    if (!user_record) {
        await ctx.reply("You don't have a user record. Please contact support for assistance.");
        return;
    }

    // const bankRecord = await bankCollection.findOne({ userId: user_id });

    // if (!bankRecord) {
    //     await ctx.reply("Please add your bank details first using the /addbank command.");
    //     return;
    // }

    const withdrawal_record = await withdrawalCollection.findOne({ userId: user_id });

    if (withdrawal_record) {
        await ctx.reply("Enter the withdrawal amount in dollars:");
        ctx.session.withdrawalRecord = withdrawal_record; // Store the withdrawal record in the session
        ctx.session.expectingWithdrawalAmount = true; // Set a flag to expect withdrawal amount
    } else {
        await ctx.reply("Please add your bank details first using the /editbankdetails command.");
        return;
    }
});

bot.on("text", async (ctx) => {
    const user_id = ctx.message.from.id;
    const { withdrawalRecord, expectingWithdrawalAmount } = ctx.session;

    if (expectingWithdrawalAmount) {
        const withdrawalAmount = parseFloat(ctx.message.text);
        if (isNaN(withdrawalAmount) || withdrawalAmount < 20) {
            await ctx.reply("Minimum withdrawal amount is 20.");
            return;
        }

        const userRecord = await userCollection.findOne({ userId: user_id });
        const userEarnings = userRecord.currentEarnings || 0;

        if (withdrawalAmount > userEarnings) {
            await ctx.reply(`Your Total Earnings : ${userEarnings} $\nWithdrawal amount exceeds your earnings.\nPlease enter a valid withdrawal amount.`);
            return;
        }
        const bankDetails = userRecord.bankDetails;

        const success = await sendWithdrawalDataToGoogleScript(user_id, withdrawalAmount, bankDetails);
        const success3 = await update_withdrawal_amount(withdrawalRecord, withdrawalAmount);
        const success2 = await updateEarnings(user_id, withdrawalAmount, userRecord);

        if (success) {
            try {
                await ctx.reply("Your withdrawal request has been processed successfully. It will be processed in 48 hours.");
            } catch (error) {
                console.error('Error sending withdrawal request to the dashboard:', error);
                // await ctx.reply("Your withdrawal request has been processed successfully.");
            }
        } else {
            await ctx.reply("Failed to process your withdrawal request. Please try again later.");
        }

        delete ctx.session.expectingWithdrawalAmount;
    }
});


async function sendWithdrawalDataToGoogleScript(userId, withdrawalAmount, bankDetails) {
    try {
        const response = await axios.post('https://script.google.com/macros/s/AKfycbwEGfdStc5_tPIb3q4LZU9smyTH1DU8RPufg4poTPhpR8SnKm7TAMm4tYR4Be2ebeFGGA/exec', {
            userId: userId,
            withdrawalAmount: withdrawalAmount,
            bankDetails: JSON.stringify(bankDetails)
        });
        console.log(response.data);
        return true
    } catch (error) {
        console.error('Error sending withdrawal request data to Google Apps Script:', error);
    }
}



async function updateEarnings(user_id, withdrawalAmount, userRecord) {
    try {
        const userEarnings = userRecord.currentEarnings;
        const userTotalEarnings = userRecord.totalEarnings; // Corrected: using totalEarnings
        await userCollection.updateOne(
            { userId: user_id },
            { $set: { currentEarnings: userEarnings - withdrawalAmount, totalEarnings: userTotalEarnings - withdrawalAmount } } // Merged $set operations
        );
        return true;
    } catch (error) {
        console.error('Error saving withdrawal request to withdrawal collection:', error);
        return false;
    }
}



async function update_withdrawal_amount(withdrawalRecord, withdrawalAmount) {
    try {
        const currentWithdrawalAmount = withdrawalRecord.withdrawalAmount;

        const newWithdrawalAmount = currentWithdrawalAmount + withdrawalAmount;
        await withdrawalCollection.updateOne(
            { _id: withdrawalRecord._id },
            { $set: { withdrawalAmount: newWithdrawalAmount } }
        );
        return true; // Success
    } catch (error) {
        console.error('Error updating withdrawal amount:', error);
        return false; // Failure
    }
}


async function get_user_record(user_id) {
    const user_information = await userCollection.findOne({
        userId: user_id
    });
    return user_information;
}

async function insert_user_record(user_id, user_name) {
    await userCollection.insertOne({
        userId: user_id,
        userName: user_name,
        totalViews: 0,
        bankDetails: "",
        currentEarning: "",
        totalEarnings: "",
        createdAt: new Date()
    });
}

// Initialize the bot
bot.launch();
console.log("Bot Started");

