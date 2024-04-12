import os
import random
import string
import re
import asyncio
import uvloop
from pyrogram import Client, filters 
import tgcrypto
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
import datetime
import secrets
import requests

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

load_dotenv()

# Initialize MongoDB
MONGO_URI = os.getenv("mongoDB_uri")
client = MongoClient(MONGO_URI)
db = client["nutCracker"]
videoCollection = db["videosRecord"]
userCollection = db["userRecord"]
conversation_state = {}
# Initialize Telegram bot
videoConverterToken = os.getenv("bot1Token")
API_ID = os.getenv("api_id")
API_HASH = os.getenv("api_hash")

app = app = Client("my_bot", api_id=API_ID, api_hash=API_HASH, bot_token=videoConverterToken)


def generate_random_hex(length):
    characters = "abcdef0123456789"
    random_hex = "".join(secrets.choice(characters) for _ in range(length))
    return random_hex

def get_user_record(user_id):
    userInformation = userCollection.find_one({"userId": user_id})
    print(userInformation)
    return userInformation

def insert_user_record(user_id, userName):
    userCollection.insert_one(
        {
            "userId": user_id,
            "userName": userName,
            "upiNumber": 0,
            "uploadedVideos": 0,
            "totalViews": 0,
            "createdAt": datetime.datetime.now(),
        }
    )
    return "Done! User record inserted successfully."

def download_and_store_video(video_url, folder="../uploads/"):
    # Generate a unique filename
    filename = generate_random_filename() + ".mp4"
    filepath = os.path.join(folder, filename)

    # Download the video
    with requests.get(video_url, stream=True) as r:
        r.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filepath

# Handle messages
@app.on_message(filters.video)
async def handle_video(bot, message: Message):
    messageInit = await message.reply("Processing request...")
    try:
        user_id = message.from_user.id
        file_id = message.video.file_id
        
        # Extract original filename if available
        original_filename = message.video.file_name
        
        video_path = await bot.download_media(file_id, file_name="../uploads/")
        video_file_extension = os.path.splitext(video_path)[1]
        
        # Use the original filename if available, otherwise assign a default filename
        if original_filename:
            new_video_path = os.path.join("../uploads/", original_filename)
        else:
            # Assign a default filename
            new_video_path = os.path.join("../uploads/", "video.mp4")
        
        os.rename(video_path, new_video_path)
        video_file = open(new_video_path, "rb")
        try:
            videoId = generate_random_hex(24)
            video_info = {
                "filename": original_filename or "video.mp4",  # Use original filename if available, otherwise use default
                "fileLocalPath": f"../uploads/{original_filename or 'video.mp4'}",  # Use original filename if available, otherwise use default
                "file_size": message.video.file_size,
                "duration": message.video.duration,
                "mime_type": message.video.mime_type,
                "fileUniqueId": videoId,
                "relatedUser": user_id,
                "userName": message.from_user.username or "",
                "viewCount": 0,
            }
            videoCollection.insert_one(video_info)
        except Exception as e:
            print(e)
            return
        videoUrl = f"http://nutcracker.live/play/{videoId}"
        await message.reply(
            f"""Your video has been uploaded successfully... \n\n😊😊Now you can start using the link:\n\n{videoUrl}"""
        )
        await messageInit.delete()
    except Exception as e:
        print(e)
        await messageInit.edit(
            f"An error occurred while processing your request. Please try again later."
        )
        return

@app.on_message(filters.photo)
async def handleImage(bot, message):
    caption = message.caption
    imageInfo = message.photo
    if caption:
        print(caption)
        print(imageInfo)
        sender_username = message.from_user.username
        user_id = message.from_user.id
        uniqueId = message.message_id
        video_links = re.findall(r"(https?://\S+)", caption)
        if video_links:
            messageInit = await bot.send_message(
                message.chat.id, "Processing request... 👍"
            )
            
            for video_link in video_links:
                localFilePath = os.path.join(
                    f"../public/uploads", f"{os.path.basename(video_link)}"
                )
                unique_link = await process_video_link(
                    video_link, user_id, sender_username, localFilePath, uniqueId
                )
                await message.reply(
                    f"""Your video has been uploaded successfully... \n\n😊😊Now you can start using the link:\n\n{unique_link}"""
                )
                await messageInit.delete()
        else:
            await bot.send_message(
                message.chat.id,
                f"""
                                                We Only accept videos or video link .. 

                                          """,
                reply_to_message_id=message.message_id,
            )



@app.on_message(filters.command("titlerename"))
async def titleRename(bot, message):
    # Set conversation state to 'awaiting_video_id' for the current chat
    conversation_state[message.chat.id] = {'state': 'awaiting_video_id'}

    # Send a message requesting the video ID
    await bot.send_message(
        message.chat.id, "Please enter the video ID (fileUniqueId):"
    )

@app.on_message(filters.command("titlerename"))
async def titleRename(bot, message):
    # Check if the command is triggered via the menu button
    if message.text == "/titlerename":
        await bot.send_message(
            message.chat.id, "Please enter the video ID (fileUniqueId):"
        )
        return

    # If the command is not triggered via the menu button, extract the video ID
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await bot.send_message(
            message.chat.id, "Please provide the video ID along with the new title."
        )
        return

    videoId, new_title = args[1].split(maxsplit=1)

    # Get the user's uploaded video from the database
    video_info = videoCollection.find_one({"fileUniqueId": videoId})
    if video_info is None:
        await bot.send_message(
            message.chat.id, "No video found with the provided video ID."
        )
        return

    # Update the title in the database
    videoCollection.update_one(
        {"fileUniqueId": videoId}, {"$set": {"videoName": new_title}}
    )

    await bot.send_message(
        message.chat.id,
        f"The title of the video with ID '{videoId}' has been updated to '{new_title}'.",
    )


@app.on_message(filters.text)
async def handleMessage(bot, message):
 chat_id = message.chat.id
 if chat_id in conversation_state:
        state = conversation_state[chat_id].get('state')

        if state == 'awaiting_video_id':
            # Extract the video ID
            video_id = message.text.strip()

            # Check if the video ID is valid
            video_info = videoCollection.find_one({"fileUniqueId": video_id})
            if video_info is None:
                await bot.send_message(
                    chat_id, "No video found with the provided video ID."
                )
                return

            # Update conversation state to 'awaiting_new_title'
            conversation_state[chat_id]['state'] = 'awaiting_new_title'
            # Store the video ID for later use
            conversation_state[chat_id]['video_id'] = video_id

            # Send a message requesting the new title
            await bot.send_message(
                chat_id, "Please provide the new title for the video:"
            )

        elif state == 'awaiting_new_title':
            # Extract the new title
            new_title = message.text.strip()

            # Extract the video ID from conversation state
            video_id = conversation_state[chat_id]['video_id']

            # Update the title in the database
            videoCollection.update_one(
                {"fileUniqueId": video_id}, {"$set": {"videoName": new_title}}
            )

            # Remove conversation state for the current chat
            del conversation_state[chat_id]

            # Send a confirmation message
            await bot.send_message(
                chat_id,
                f"The title of the video with ID '{video_id}' has been updated to '{new_title}'.",
            )
 else:        
    user_id = message.from_user.id
    sender_username = message.from_user.username
    video_links = re.findall(r"(https?://\S+)", message.text)
    if video_links:
        messageInit = await bot.send_message(
            message.chat.id, "Processing request... 👍"
        )
        for video_link in video_links:
            unique_link = await process_video_link(video_link, user_id, sender_username)
            await message.reply(
                f"""Your video has been uploaded successfully... \n\n😊😊Now you can start using the link:\n\n{unique_link}"""
            )
        await messageInit.delete()
    else:
        await bot.send_message(
            message.chat.id, """\nPlease Choose From Menu Options... \n\n👇👇"""
        )



@app.on_message(filters.command("start"))
async def startCommand(bot, message):
    user_id = message.from_user.id
    userName = (message.from_user.username) or " "
    user_record = get_user_record(user_id)
    first = message.from_user.first_name
    if user_record:
        await bot.send_message(message.chat.id, f"Welcome back !! \n Upload, Share and Earn.")
    else:
        print("new")
        insert_user_record(user_id, userName)
        await bot.send_message(
            message.chat.id,
            f"Welcome! {first}\n\nWe're glad you're here.\nTo start using our platform\nYou can start sharing videos directly\n\n Note: If anything went wrong don't worry about it as we are on testing phase",
        )

@app.on_message(filters.command("getmyuserid"))
async def getUserId(bot, message):
    user_id = message.from_user.id
    await bot.send_message(
        message.chat.id, f"""Here is your 👤 user id:\n\n {user_id}"""
    )

@app.on_message(filters.command("myaccountsinfo"))
async def getAccountInfo(bot, message):
    await bot.send_message(
        message.chat.id, f"We are under construction, please check back later.... 😊"
    )

@app.on_message(filters.command("availablebots"))
async def availableBots(bot, message):
    bot_list = [
        (
            """              Nutcracker video convert bot.           """,
            "https://t.me/nutcracker_video_convert_bot",
        ),
        (
            """              NutCracker Link Convert Bot             """,
            "https://t.me/NutCracker_Link_Convert_Bot",
        ),
        (
            """              NutCracker Finance Bot             """,
            "https://t.me/NutCracker_Finance_Bot",
        ),
    ]

    keyboard = [[InlineKeyboardButton(bot[0], url=bot[1])] for bot in bot_list]

    reply_markup = InlineKeyboardMarkup(keyboard)
    await bot.send_message(
        message.chat.id,
        f"""        Available Bots: 👇👇         """,
        reply_markup=reply_markup,
    )

@app.on_message(filters.command("uploadfromdevice"))
async def uploadFromDevice(bot, message):
    await bot.send_message(message.chat.id, f"""Start Uploading Your Video ...😉""")

def generate_random_filename(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for _ in range(length))

async def process_video_link(video_link: str, user_id: int, sender_username: str) -> str:
    video_path = download_and_store_video(video_link)
    
    # Check if video_path is None
    if video_path is None:
        return "Failed to download and store the video."

    videoId = generate_random_hex(24)
    
    video_info = {
        "filename": os.path.basename(video_path),
        "fileLocalPath": f"../uploads/{videoId}",
        "file_size": os.path.getsize(video_path),
        "duration": 0,  # Update with actual duration if available
        "mime_type": "video/mp4",  # Update with actual MIME type if available
        "uniqueLink": videoId,
        "relatedUser": user_id,
        "userName": sender_username or "",
    }
    videoCollection.insert_one(video_info)
    videoUrl = f"http://nutcracker.live/play/{videoId}"
    return videoUrl


app.run()
