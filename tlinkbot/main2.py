from pyrogram import Client, filters
import requests
import os




# Initialize your Pyrogram client
bot_token = '6419718020:AAHrsd2wps0Uh-1l51W9KFYJmmyULUilMfE'
# api_hash = getenv("HASH") 
# api_id = getenv("ID")
app = Client("my_bot", bot_token=bot_token)  


# Handler for /start command
@app.on_message(filters.command("start"))
def start(client, message):
    message.reply_text('Hello! Send me a video link and I will download it for you.')

# Handler for text messages containing video links
@app.on_message(filters.create(lambda _, __, m: m.text and not m.command))
def handle_video_link(client, message):
    print("starting")
    link = message.text
    # Assuming you have a function to extract direct download links
    direct_download_link = extract_direct_download_link(link)
    if direct_download_link:
        download_video(direct_download_link)
        message.reply_text('Video downloaded successfully!')
    else:
        message.reply_text('Failed to extract direct download link.')

# Function to download and save the video file
def download_video(url: str):
    response = requests.get(url)
    if response.status_code == 200:
        filename = os.path.basename(url)  # Extract filename from URL
        with open(f'../uploads/{filename}', 'wb') as f:
            f.write(response.content)

# Start the Pyrogram client
app.run()
