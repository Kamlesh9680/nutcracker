const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const ejs = require('ejs');
const cron = require('node-cron');

let withdrawalRequests = [];
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker';
const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use('/assets/images', express.static('images'));
// app.use(express.static('public'));

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}
connectToDatabase();

// MongoDB connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'nutCracker'
});

// Define video schema and model
const videoSchema = new mongoose.Schema({
    title: String,
    filename: String,
    uniqueLink: String
});
// Define video playback schema
const playbackSchema = new mongoose.Schema({
    uniqueLink: String,
    filename: String,
    viewCount: { type: Number, default: 0 },
    relatedUser: { type: Number }
});

const Video = mongoose.model('Video', videoSchema, 'tmpRecord');
const PlaybackVideo = mongoose.model('PlaybackVideo', playbackSchema, 'videosRecord');


// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'tmpvideos/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

function generateUniqueLink(length) {
    const characters = "abcdef0123456789";
    let randomHex = "";
    for (let i = 0; i < length; i++) {
        randomHex += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomHex;
}

// Handle file upload
app.post('/upload', upload.single('video'), async (req, res) => {
    try {
        const { originalname, path } = req.file;
        const video = new Video({
            filename: originalname,
            uniqueLink: generateUniqueLink(24)
        });
        console.log(video);
        await video.save();
        res.json({ link: video.uniqueLink }); // Send JSON data with the unique link
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
});


// Serve videos based on unique link
// app.get('/play/:uniqueLink', async (req, res) => {
//     try {
//         // Find the video with the specified unique link
//         const video = await Video.findOne({ uniqueLink: req.params.uniqueLink });
//         if (!video) {
//             return res.status(404).send('Video not found.'); // Send 404 response if video is not found
//         }

//         // Construct the path to the video file
//         const videoPath = path.join(__dirname, 'uploads', video.filename);

//         // Check if the video file exists
//         if (!fs.existsSync(videoPath)) {
//             return res.status(404).send('Video file not found.'); // Send 404 response if video file is not found
//         }

//         // Get file stats to determine content length
//         const stat = fs.statSync(videoPath);
//         const fileSize = stat.size;

//         // Set response headers
//         const head = {
//             'Content-Length': fileSize,
//             'Content-Type': 'video/mp4',
//         };

//         // Stream the video file to the response
//         res.writeHead(200, head);
//         fs.createReadStream(videoPath).pipe(res);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal server error.');
//     }
// });


app.get('/play/:uniqueLink', async (req, res) => {
    try {
        const uniqueLink = req.params.uniqueLink;
        // Find the video based on unique link from MongoDB
        const video = await PlaybackVideo.findOne({ uniqueLink });

        if (!video) {
            return res.status(404).send('Video not found');
        }


        // Render the HTML page with video filename and additional text content
        res.render('video_page', { filename: video.filename, relatedUser: video.relatedUser, uniqueLink: video.uniqueLink });
    } catch (error) {
        console.error('Error updating view count:', error);
        res.status(500).send('Internal server error.');
    }
});


// Define a route to handle updating the view count
app.get('/update-view/:uniqueLink', async (req, res) => {
    try {
        const uniqueLink = req.params.uniqueLink;
        // Find the video based on unique link from MongoDB
        const updatedVideo = await PlaybackVideo.findOneAndUpdate(
            { uniqueLink },
            { $inc: { viewCount: 1 } },
            { new: true }
        );
        console.log('Updated Video:', updatedVideo);
        console.log('Related User:', updatedVideo.relatedUser);


        if (!updatedVideo) {
            return res.status(404).send('Video not found');
        }

        await updateUserTotalViews(updatedVideo.relatedUser);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating view count:', error);
        res.status(500).send('Internal server error.');
    }
});

async function updateTenDaysViews(userId) {
    try {
        const db = client.db("nutCracker");
        const userCollection = db.collection("userRecord");

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Find the user record
        const user = await userCollection.findOne({ userId });
        console.log("User:", user);

        if (!user) {
            console.error(`User with ID ${userId} not found.`);
            return;
        }

        // Calculate total views for the last 10 days
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);
        const tenDaysViews = user.tenDaysViews || [];

        // Remove entries older than 10 days
        const updatedTenDaysViews = tenDaysViews.filter(entry => entry.date >= tenDaysAgo.toISOString().split('T')[0]);

        // Check if there is an entry for today
        const todayEntryIndex = updatedTenDaysViews.findIndex(entry => entry.date === today);

        if (todayEntryIndex !== -1) {
            // If there is an entry for today, increment the view count
            updatedTenDaysViews[todayEntryIndex].views += 1;
        } else {
            // If there is no entry for today, add a new entry
            updatedTenDaysViews.push({ date: today, views: 1 });
        }

        // Update the tenDaysViews field in the user record
        await userCollection.updateOne(
            { userId: userId },
            { $set: { tenDaysViews: updatedTenDaysViews } }
        );

        console.log(`Ten days views updated for user ${userId}.`);
    } catch (error) {
        console.error('Error updating ten days views:', error);
    }
}

async function updateUserTotalViews(userId) {
    // console.log('Updating totalViews and totalEarnings for user:', userId);
    const db = client.db("nutCracker");
    const userCollection = db.collection("userRecord");

    // Increment totalViews for the user
    const result = await userCollection.findOneAndUpdate(
        { userId: userId },
        { $inc: { totalViews: 1 } },
        { returnOriginal: false }
    );

    // console.log('Update result:', result);

    const eviews = await userCollection.findOne({ userId });
    // console.log("eviews:", eviews);

    // Calculate earnings based on views (1.6$ per 1000 views)
    const earningsPerView = 1.6 / 1000;
    const totalEarnings = earningsPerView * eviews.totalViews;
    // Update totalEarnings for the user
    const updateResult = await userCollection.updateOne(
        { userId: userId },
        { $set: { totalEarnings } }
    );
    console.log('Update totalEarnings result:', updateResult);
    console.log(`Total earnings updated for user ${userId}: ${totalEarnings}`);
    updateTenDaysViews(userId);
}



async function updateCurrentEarningsWithDelay() {
    // Schedule a task to update currentEarnings every two days
    cron.schedule(
        '0 0 */2 * *',
        async () => {
            // Fetch all user records from the database
            const db = client.db("nutCracker");
            const userCollection = db.collection("userRecord");
            const users = await userCollection.find().toArray();

            // Iterate over each user record
            for (const user of users) {
                const { userId, totalEarnings } = user;

                // Update currentEarnings for the user
                await userCollection.updateOne(
                    { userId: userId },
                    { $set: { currentEarnings: totalEarnings } }
                );
                // console.log(`Updated currentEarnings for user ${userId} to ${totalEarnings} with a delay of two days`);
            }
        },
        { scheduled: true }
    );
}

updateCurrentEarningsWithDelay();


app.get('/plays/:uniqueLink', async (req, res) => {
    try {
        const uniqueLink = req.params.uniqueLink;
        const video = await PlaybackVideo.findOne({ uniqueLink });

        if (!video) {
            return res.status(404).send('Video not found');
        }

        res.render('plays', { filename: video.filename, uniqueLink: uniqueLink });
    } catch (error) {
        console.error('Error rendering plays page:', error);
        res.status(500).send('Internal server error.');
    }
});



// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Function to retrieve bank details for a user from the database
async function getBankDetails(userId) {
    const db = client.db("nutCracker");
    const userCollection = db.collection("bankRecord");
    const userRecord = await userCollection.findOne({ userId });

    if (userRecord && userRecord.bankDetails) {
        return userRecord.bankDetails;
    } else {
        return null; // If bank details not found or bankDetails field is missing
    }
}

// Endpoint to receive withdrawal requests from the bot
app.post('/withdrawal-request', async (req, res) => {
    // Retrieve bank details from the database
    const { userId, withdrawalAmount } = req.body;
    const bankRecord = await getBankDetails(userId);

    if (!bankRecord) {
        res.status(404).send("Bank details not found for the user");
        return;
    }

    // Process the withdrawal request data and store it temporarily
    withdrawalRequests.push({ userId, bankRecord, withdrawalAmount, status: 'pending' });
    console.log('Received withdrawal request:', req.body);
    res.sendStatus(200);
});

// Endpoint to retrieve withdrawal requests for the dashboard
app.get('/withdrawal-requests', (req, res) => {
    res.json(withdrawalRequests);
});

// Update withdrawal request status (for demonstration purposes)
app.post('/withdrawal-requests/:userId/success', (req, res) => {
    const userId = req.params.userId;
    const index = withdrawalRequests.findIndex(request => request.userId === userId);
    if (index !== -1) {
        withdrawalRequests[index].status = 'success';
        res.sendStatus(200);
    } else {
        res.status(404).send('Withdrawal request not found');
    }
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/about.html'));
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/upload.html'));
});
app.get('/downloads', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/downloads.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/terms.html'));
});

app.get('/play/:uniqueLink', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/plays/:uniqueLink', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'plays.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/views/contact.html');
});

app.get('/blog', (req, res) => {
    res.sendFile(__dirname + '/views/blog.html');
});

app.get('/privacy-policy', (req, res) => {
    res.sendFile(__dirname + '/views/privacy-policy.html');
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
