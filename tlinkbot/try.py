from pyrogram import Client, filters
import requests
import os
import pymongo
from pymongo import MongoClient
import secrets


client = MongoClient('mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker')
db = client["nutCracker"]
video_collection = db["videosRecord"]
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
    

# Function to generate random hex
def generate_random_hex(length):
    characters = "abcdef0123456789"
    random_hex = "".join(secrets.choice(characters) for _ in range(length))
    return random_hex

# Define a function to download and save the video
def download_video(url, filename):
    response = requests.get(url)
    with open(filename, 'wb') as f:
        f.write(response.content)


# Define a function to download and save the video
def download_video(url):
    response = requests.get(url)
    filename = os.path.join(download_folder, f"{generate_random_hex(24)}.mp4")
    with open(filename, 'wb') as f:
        f.write(response.content)
    return filename


@app.on_message(filters.private & filters.text)
def handle_message(client, message):
    # Check if the message contains a direct download link
    if message.text.startswith("http"):
        try:
            # Download the video from the direct download link
            video_file = download_video(message.text)
            
            # Check if the video file is empty
            if os.path.getsize(video_file) == 0:
                raise Exception("Downloaded video file is empty")
            
            # Generate a unique ID for the video
            video_id = generate_random_hex(24)
            
            # Prepare video information
            video_info = {
                "filename": os.path.basename(video_file),
                "fileLocalPath": video_file,
                "uniqueLink": video_id,
                "relatedUser": message.from_user.id,
                "userName": message.from_user.username or "",
                "viewCount": 0,
            }
            
            # Insert video information into the database
            video_collection.insert_one(video_info)
            
            # Generate the URL for the video
            video_url = f"http://nutcracker.live/plays/{video_id}"
            
            # Reply to the user indicating successful download and provide the URL
            message.reply_text(
                f"Your video has been uploaded successfully...\n\nNow you can start using the link:\n\n{video_url}"
            )
        except Exception as e:
            # Reply to the user if an error occurs during download
            message.reply_text(f"An error occurred: {e}")




# Start the bot
app.run()
