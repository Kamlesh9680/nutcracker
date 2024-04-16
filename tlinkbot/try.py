from pyrogram import Client, filters
import requests
import os

# Replace 'YOUR_API_ID' and 'YOUR_API_HASH' with your own Telegram API credentials
api_id = '29305574'
api_hash = '4f9955b64b3fd1470d11a33860ac860a'
bot_token = '6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE'

# Specify the folder where you want to save the downloaded videos
download_folder = '../uploads'

# Initialize the Pyrogram client
app = Client("my_bot", api_id=api_id, api_hash=api_hash, bot_token=bot_token)



# Define a command handler to handle messages containing direct download links
@app.on_message(filters.command(["start"]))
def start(client, message):
    message.reply_text("Hello! Send me a direct download link of the video to download it.")


# Define a function to download and save the video
def download_video(url, filename):
    response = requests.get(url)
    with open(filename, 'wb') as f:
        f.write(response.content)


# Define a message handler to handle messages containing direct download links
@app.on_message(filters.private & filters.text)
def handle_message(client, message):
    # Check if the message contains a direct download link
    if message.text.startswith("http"):
        try:
            # Generate a unique filename based on the message ID
            filename = os.path.join(download_folder, f"{message.message_id}.mp4")
            # Download the video from the direct download link
            download_video(message.text, filename)
            # Reply to the user indicating successful download
            message.reply_text("Video downloaded successfully!")
        except Exception as e:
            # Reply to the user if an error occurs during download
            message.reply_text(f"An error occurred: {e}")



# Start the bot
app.run()
