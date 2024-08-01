import os
import re
import string
import random
import string
from dotenv import load_dotenv
import re
import uvloop
import asyncio
import requests
from pyrogram import Client, filters
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
import datetime
from datetime import datetime
import secrets
from urllib.parse import urlparse


# Load environment variables
load_dotenv()

# Initialize MongoDB client
MONGO_URI = os.getenv("mongoDB_uri")
client = MongoClient(MONGO_URI)
db = client["nutCracker"]
video_collection = db["videosRecord"]
user_collection = db["userRecord"]
tmp_record_collection = db["tmpRecord"]
sessions_collection = db["sessions"]
conversation_state = {}

# Initialize Telegram bot
API_ID = os.getenv("api_id")
API_HASH = os.getenv("api_hash")
BOT_TOKEN = os.getenv("bot1Token")
app = Client("my_bot", api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN)


# Function to generate random hex
def generate_random_hex(length):
    characters = "abcdef0123456789"
    random_hex = "".join(secrets.choice(characters) for _ in range(length))
    return random_hex



def download_and_store_video(video_url, folder="../uploads/"):
    parsed_url = urlparse(video_url)
    filename = os.path.basename(parsed_url.path)

    filepath = os.path.join(folder, filename)

    with requests.get(video_url, stream=True) as r:
        r.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filepath


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
        
        # Generate a unique filename if the original filename is not available
        if original_filename:
            new_video_path = os.path.join("../uploads/", original_filename)
        else:
            unique_suffix = datetime.now().strftime("%Y%m%d%H%M%S") + ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
            new_video_path = os.path.join("../uploads/", f"video_{unique_suffix}{video_file_extension}")
        
        os.rename(video_path, new_video_path)
        video_file = open(new_video_path, "rb")
        try:
            videoId = generate_random_hex(24)
            video_info = {
                "filename": original_filename or f"video_{unique_suffix}{video_file_extension}",
                "fileLocalPath": new_video_path,
                "file_size": message.video.file_size,
                "duration": message.video.duration,
                "mime_type": message.video.mime_type,
                "uniqueLink": videoId,
                "relatedUser": user_id,
                "userName": message.from_user.username or "",
                "viewCount": 0,
            }
            video_collection.insert_one(video_info)
        except Exception as e:
            print(e)
            return
        videoUrl = f"http://nutcracker.live/plays/{videoId}"
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


# Command handler for /convertsitelink
@app.on_message(filters.command("convertsitelink"))
async def convert_site_link_command_handler(bot, message):
    await message.reply("Please provide the video link:")
    user_id = message.chat.id
    await save_session_data(user_id, {"converting_site_link": True})


# Command handler for /titlerename
# @app.on_message(filters.command("titlerename"))
# async def title_rename(bot, message):
#     if message.text == "/titlerename":
#         await bot.send_message(
#             message.chat.id, "Please enter the video ID (fileUniqueId):"
#         )
#         return

#     args = message.text.split(maxsplit=1)
#     if len(args) < 2:
#         await bot.send_message(
#             message.chat.id, "Please provide the video ID along with the new title."
#         )
#         return

#     video_id, new_title = args[1].split(maxsplit=1)

#     video_info = video_collection.find_one({"fileUniqueId": video_id})
#     if video_info is None:
#         await bot.send_message(
#             message.chat.id, "No video found with the provided video ID."
#         )
#         return

#     video_collection.update_one(
#         {"fileUniqueId": video_id}, {"$set": {"videoName": new_title}}
#     )

#     await bot.send_message(
#         message.chat.id,
#         f"The title of the video with ID '{video_id}' has been updated to '{new_title}'.",
#     )


# Command handler for /start
@app.on_message(filters.command("start"))
async def start_command(bot, message):
    user_id = message.from_user.id
    userName = message.from_user.username or ""
    user_record = user_collection.find_one({"userId": user_id})
    if user_record:
        await bot.send_message(
            message.chat.id,
            f"Welcome back, {userName}\n\n<b>Upload, Share and Earn.</b>\n\n<b>You can start sharing videos directly and get a direct playing link.</b>\n\n<b>Offical Channel - https://t.me/Nutcracker_live</b>\n\n<b>Discussion group - https://t.me/NutCracker_Discussion</b>",
        )
    else:
        insert_user_record(user_id, userName)
        await bot.send_message(
            message.chat.id,
            f"Welcome, {userName}! We're glad you're here.\n\n<b>Upload, Share and Earn.</b>\n\n<b>You can start sharing videos directly and get a direct playing link.</b>\n\n<b>Offical Channel - https://t.me/Nutcracker_live</b>\n\n<b>Discussion group - https://t.me/NutCracker_Discussion</b>",
        )




# Command handler for /getmyuserid
@app.on_message(filters.command("getmyuserid"))
async def get_user_id(bot, message):
    user_id = message.from_user.id
    await bot.send_message(
        message.chat.id, f"Your user ID is: {user_id}"
    )


# Command handler for /myaccountsinfo
@app.on_message(filters.command("myaccountsinfo"))
async def get_account_info(bot, message):
    user_id = message.from_user.id

    try:
        user_info = user_collection.find_one({'userId': user_id})

        if user_info:
            user_name = user_info.get('userName', 'N/A')
            total_views = user_info.get('totalViews', 'N/A')
            bank_details = user_info.get('bankDetails', 'N/A')
            total_earnings = user_info.get('totalEarnings', 'N/A')

            info_message = f"Your account information:\n\n"
            info_message += f"User ID: {user_id}\n"
            info_message += f"User Name: {user_name}\n"
            info_message += f"Total Views: {total_views}\n"
            info_message += f"Bank Details: {bank_details}\n"
            info_message += f"Total Earnings: {total_earnings}\n"

            await bot.send_message(message.chat.id, info_message)
        else:
            await bot.send_message(message.chat.id, "No account information found.")
    except Exception as e:
        print("Error fetching user information:", e)
        await bot.send_message(message.chat.id, "An error occurred while fetching your account information.")


# Command handler for /availablebots
@app.on_message(filters.command("availablebots"))
async def available_bots(bot, message):
    bot_list = [
        ("Nutcracker video convert bot.", "https://t.me/nutcracker_video_convert_bot"),
        ("NutCracker Link Convert Bot", "https://t.me/NutCracker_Link_Convert_Bot"),
        ("NutCracker Finance Bot", "https://t.me/NutCracker_Finance_Bot"),
        ("NutCracker - Terabox Links to video", "https://t.me/Terabox_Link_to_Nutcracker_bot"),
    ]

    keyboard = [[InlineKeyboardButton(bot[0], url=bot[1])] for bot in bot_list]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await bot.send_message(
        message.chat.id,
        "Available Bots:",
        reply_markup=reply_markup
    )

# Command handler for /deletelink
@app.on_message(filters.command("deletelink"))
async def delete_link_command_handler(bot, message):
    await message.reply("Please enter the video ID you want to delete:")
    user_id = message.chat.id
    await save_session_data(user_id, {"delete_link": True})


async def delete_video_link(bot, message, video_id):
    try:
        # Find the video record
        video_record = video_collection.find_one({"uniqueLink": video_id})

        # Check if the video record exists
        if not video_record:
            await bot.send_message(message.chat.id, "No video found with the provided ID.")
            return  # Exit the function early

        # Delete the video record
        deletion_result = video_collection.delete_one({"uniqueLink": video_id})

        # Check if the video record was deleted
        if deletion_result.deleted_count == 1:
            await bot.send_message(message.chat.id, "Video link deleted successfully.")
        else:
            await bot.send_message(message.chat.id, "An error occurred while deleting the video link. Please try again later.")

    except Exception as error:
        print("Error deleting video link:", error)
        await bot.send_message(message.chat.id, "An error occurred while deleting the video link. Please try again later.")


@app.on_message(filters.command("help"))
async def help_command(client, message):
    # Reply with the help message
    await message.reply_text("You can connect on the following link for any kind of help.\n\nSupport Team - https://t.me/NetCracker_live")

# Command handler for /uploadfromdevice
@app.on_message(filters.command("uploadfromdevice"))
async def upload_from_device(bot, message):
    await bot.send_message(message.chat.id, "Start uploading your video...")


@app.on_message(filters.text)
async def text_middleware(bot, message):
    user_id = message.chat.id
    session_data = await load_session_data(user_id)
    if session_data.get("converting_site_link", False):
        video_link = message.text.strip()
        video_id = video_link.split('/')[-1]
        await process_site_link(bot, message, video_id)
        await save_session_data(user_id, {})

    elif session_data.get("delete_link", False):
        await delete_video_link(bot, message, video_id)
        app.should_process_message = False
    
    else:
        user_id = message.from_user.id
        sender_username = message.from_user.username
        video_links = re.findall(r"(https?://\S+)", message.text)
        if video_links:
            await save_session_data(user_id, {"converting_site_link": True})  # Simulate selection of the convertsitelink command
            message_init = await bot.send_message(
                message.chat.id, "Please provide the video link:"
            )
            for video_link in video_links:
                video_id = video_link.split('/')[-1]
                await process_site_link(bot, message, video_id)
            await message_init.delete()
            await save_session_data(user_id, {})
        else:
            await bot.send_message(
                message.chat.id, """\nPlease Choose From Menu Options... \n\n👇👇"""
            )


# Helper function to generate random filename
def generate_random_filename(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for _ in range(length))


# Helper function to save session data
async def save_session_data(user_id, session_data):
    document = {"user_id": user_id, "session_data": session_data}
    try:
        result = sessions_collection.replace_one({"user_id": user_id}, document, upsert=True)
        if result.modified_count == 0 and not result.upserted_id:
            await sessions_collection.insert_one(document)
    except Exception as e:
        print("Error saving session data:", e)


# Helper function to retrieve session data
async def load_session_data(user_id):
    try:
        document = sessions_collection.find_one({"user_id": user_id})
        if document:
            return document.get("session_data", {})
        else:
            return {}
    except Exception as e:
        print("Error retrieving session data:", e)
        return {}


# Async function to process video link
# async def process_video_link(video_link: str, user_id: int, sender_username: str) -> str:
#     # Check if the video link is from terabox
#     if "terabox" not in video_link:
#         return "Only terabox links are supported."

#     try:
#         # Attempt to request the video link headers to check if the video is playable
#         response = requests.head(video_link, allow_redirects=True)
#         content_type = response.headers.get("content-type")
        
#         # Check if the content type is video
#         if content_type and "video" in content_type:
#             # Download and store the video
#             video_path = download_and_store_video(video_link)
            
#             # Check if video_path is None
#             if video_path is None:
#                 return "Failed to download and store the video."
            
#             # Generate unique ID for the video
#             videoId = generate_random_hex(24)
            
#             # Prepare video info to store in the database
#             video_info = {
#                 "filename": os.path.basename(video_path),
#                 "fileLocalPath": f"../uploads/{videoId}",
#                 "file_size": os.path.getsize(video_path),
#                 "duration": 0,  # Update with actual duration if available
#                 "mime_type": "video/mp4",  # Update with actual MIME type if available
#                 "uniqueLink": videoId,
#                 "relatedUser": user_id,
#                 "userName": sender_username or "",
#             }
#             videoCollection.insert_one(video_info)
            
#             # Generate URL for the uploaded video
#             videoUrl = f"http://nutcracker.live/plays/{videoId}"
#             return videoUrl
#         else:
#             return "The provided link does not point to a playable video."
#     except Exception as e:
#         print(e)
#         return "An error occurred while processing the video link."


async def process_site_link(bot, message, video_id):
    try:
        # Search for the video ID in the 'tmpRecord' collection
        tmp_record = tmp_record_collection.find_one({"uniqueLink": video_id})
        user_id = message.from_user.id

        # Check if the video ID was found in the 'tmpRecord' collection
        if not tmp_record:
            await message.reply("No video found.")
            return

        # Move the video file from '/tmpvideos' to '/uploads'
        source_file_path = f"../tmpvideos/{tmp_record['filename']}"  # Update source file path
        dest_file_path = f"../uploads/{tmp_record['filename']}"

        # Check if the source file exists
        if os.path.exists(source_file_path):
            # Rename the source file to the destination file
            os.rename(source_file_path, dest_file_path)

            # Create a new record in the 'videosRecord' collection
            new_video_record = {
                "filename": tmp_record["filename"],
                "uniqueLink": video_id,
                "relatedUser": user_id,
                "viewCount": 0,
            }
            video_collection.insert_one(new_video_record)

            # Generate a unique link for the user to play the converted video
            unique_link = f"https://nutcracker.live/plays/{video_id}"

            # Inform the user about the successful conversion and provide the unique link
            await bot.send_message(
                message.chat.id, f"Video converted successfully!\nYou can play it using the following link:\n\n{unique_link}"
            )
        else:
            await message.reply("The source video file does not exist.")
    except Exception as error:
        print("Error processing site link:", error)
        await message.reply("An error occurred while processing the site link. Please try again later.")


# Helper function to insert user record
def insert_user_record(user_id, userName):
    user_collection.insert_one(
        {
            "userId": user_id,
            "userName": userName,
            "totalViews": 0,
            "totalEarnings": 0,
            "uploadedVideos": 0,
            "tenDaysViews": [],
            "currentEarnings": 0,
            "createdAt": datetime.datetime.now(),
        }
    )
    return "User record inserted successfully."


# Main
if __name__ == "__main__":
    app.run()
