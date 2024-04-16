import pyrogram
from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from os import environ, remove
from threading import Thread
from json import load
from re import search
import requests
import pymongo
from bson.objectid import ObjectId
import secrets
from texts import HELP_TEXT
import bypasser
import freewall
from time import time

# Assuming you have already initialized your MongoDB client and connected to your database and collection
mongo_client = pymongo.MongoClient("mongodb+srv://kamleshSoni:TLbtEzobixLJc3wi@nutcracker.hrrsybj.mongodb.net/?retryWrites=true&w=majority&appName=nutCracker")
db = mongo_client["nutCracker"]
video_collection = db["videosRecord"]


# Bot configuration
with open('config.json', 'r') as f:
    DATA = load(f)

def getenv(var):
    return environ.get(var) or DATA.get(var, None)

bot_token = getenv("TOKEN")
api_hash = getenv("HASH")
api_id = getenv("ID")
app = Client("my_bot", api_id=api_id, api_hash=api_hash, bot_token=bot_token)


def generate_random_hex(length):
    characters = "abcdef0123456789"
    random_hex = "".join(secrets.choice(characters) for _ in range(length))
    return random_hex

# Function to download file and save video info
def process_video(message, direct_download_link):
    # Generate a random hexadecimal string for unique link
    video_id = generate_random_hex(24)

    # Download the file
    r = requests.get(direct_download_link)
    filename = f"../uploads/video_{video_id}.mp4"  # Save file with unique name
    with open(filename, 'wb') as f:
        f.write(r.content)

    # Extract video information
    video_info = {
        "filename": filename,
        "file_size": message.video.file_size,
        "duration": message.video.duration,
        "mime_type": message.video.mime_type,
        "uniqueLink": video_id,
        "relatedUser": message.from_user.id,
        "userName": message.from_user.username or "",
        "viewCount": 0,
    }

    # Save video information into MongoDB collection
    video_collection.insert_one(video_info)

# Modify loopthread function to process video
def loopthread(message, otherss=False):
    urls = []
    if otherss:
        texts = message.caption
    else:
        texts = message.text

    if texts in [None, ""]:
        return

    for ele in texts.split():
        if "http://" in ele or "https://" in ele:
            urls.append(ele)

    if len(urls) == 0:
        return

    if bypasser.ispresent(bypasser.ddl.ddllist, urls[0]):
        msg = app.send_message(message.chat.id, "⚡ __generating...__", reply_to_message_id=message.id)
    elif freewall.pass_paywall(urls[0], check=True):
        msg = app.send_message(message.chat.id, "🕴️ __jumping the wall...__", reply_to_message_id=message.id)
    else:
        if "https://olamovies" in urls[0] or "https://psa.wf/" in urls[0]:
            msg = app.send_message(message.chat.id, "⏳ __this might take some time...__", reply_to_message_id=message.id)
        else:
            msg = app.send_message(message.chat.id, "🔎 __bypassing...__", reply_to_message_id=message.id)

    for ele in urls:
        if search(r"https?:\/\/(?:[\w.-]+)?\.\w+\/\d+:", ele):
            handleIndex(ele, message, msg)
            return
        else:
            direct_download_link = ele
            process_video(message, direct_download_link)
            return

# Bot commands and message handlers
# Start command
@app.on_message(filters.command(["start"]))
def send_start(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    app.send_message(message.chat.id, f"__👋 Hi **{message.from_user.mention}**, I am Terabox Link Bypasser Bot. Just send me any supported links and I will get you the results.\nCheckout /help to Read More__",
                     reply_markup=InlineKeyboardMarkup([
                         [InlineKeyboardButton("🌐 Source Code", url="https://github.com/youesky/TeraboxedBot")],
                         [InlineKeyboardButton("Updates", url="https://t.me/Teraboxed")]]),
                     reply_to_message_id=message.id)

# Help command
@app.on_message(filters.command(["help"]))
def send_help(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    app.send_message(message.chat.id, HELP_TEXT, reply_to_message_id=message.id, disable_web_page_preview=True)

# Text messages
@app.on_message(filters.text)
def receive(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    bypass = Thread(target=lambda: loopthread(message), daemon=True)
    bypass.start()

# Document, photo, and video messages
@app.on_message([filters.document, filters.photo, filters.video])
def docfile(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    try:
        if message.document.file_name.endswith("dlc"):
            bypass = Thread(target=lambda: docthread(message), daemon=True)
            bypass.start()
            return
    except:
        pass

    bypass = Thread(target=lambda: loopthread(message, True), daemon=True)
    bypass.start()

# Server loop
print("Bot Starting")
app.run()
