const fs = require("fs");
const axios = require("axios");
const { MongoClient } = require("mongodb");

const saveVideoToFolder = async (fileUrl) => {
  try {
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });

    const fileName = generateRandomFilename() + '.mp4';
    const filePath = `../uploads/${fileName}`;

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve({ fileName, filePath }));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error saving video to folder:", error);
    throw error;
  }
};

const saveVideoInfoToMongoDB = async (videoInfo) => {
  try {
    const client = new MongoClient("mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    const database = client.db("nutCracker");
    const collection = database.collection("videosRecord");

    await collection.insertOne(videoInfo);

    await client.close();
  } catch (error) {
    console.error("Error saving video info to MongoDB:", error);
    throw error;
  }
};

const sendFile = async (item, ctx) => {
  if (item) {
    try {
      // Save video to folder
      const { fileName, filePath } = await saveVideoToFolder(item);

      const videoId = generateRandomHex(24);
      console.log(videoId);
      // Save video info to MongoDB
      const videoInfo = {
        filename: fileName,
        filepath: filePath,
        uniqueLink: videoId,
        relatedUser: ctx.from.id,
        viewCount: 0,
        downloaded_at: new Date(),
      };
      await saveVideoInfoToMongoDB(videoInfo);

      // Reply to user with the downloaded video
      // await ctx.replyWithVideo({ source: filePath });
      await ctx.reply(`https://nutcracker.live/plays/${videoId}`);
    } catch (error) {
      console.error("Error sending file:", error);
      await ctx.replyWithMarkdown(
        `⚠️ ${error.message}\n\n👉 Try manually downloading from [here](${item})\n\n👉 *Maybe This File Is Too Large Or Cannot Accessible From Terabox*`,
      );
    }
  }
};

function generateRandomHex(length) {
  const characters = "abcdef0123456789";
  let randomHex = "";
  for (let i = 0; i < length; i++) {
      randomHex += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomHex;
}

// Helper function to generate a random filename with 15 digits
function generateRandomFilename(length = 15) {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}


module.exports = {
  sendFile,
};
