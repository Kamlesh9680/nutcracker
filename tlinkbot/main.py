import pyrogram
from pyrogram import Client,filters
from pyrogram.types import InlineKeyboardMarkup,InlineKeyboardButton
from os import environ, remove
from threading import Thread
from json import load
from re import search

from texts import HELP_TEXT
import bypasser
import freewall
from time import time


# bot
with open('config.json', 'r') as f: DATA = load(f)
def getenv(var): return environ.get(var) or DATA.get(var, None)

bot_token = getenv("TOKEN")
api_hash = getenv("HASH") 
api_id = getenv("ID")
app = Client("my_bot",api_id=api_id, api_hash=api_hash,bot_token=bot_token)  


# handle ineex
def handleIndex(ele,message,msg):
    result = bypasser.scrapeIndex(ele)
    try: app.delete_messages(message.chat.id, msg.id)
    except: pass
    for page in result: app.send_message(message.chat.id, page, reply_to_message_id=message.id, disable_web_page_preview=True)


# Update the loopthread function
def loopthread(message, otherss=False):
    urls = []
    if otherss:
        texts = message.caption
    else:
        texts = message.text

    if texts in [None, ""]:
        return

    for ele in texts.split():
        if ele.startswith("http://") or ele.startswith("https://"):
            urls.append(ele)

    if len(urls) == 0:
        return

    for url in urls:
        if "https://olamovies" in url or "https://psa.wf/" in url:
            # For certain platforms, handle the URL differently
            handle_special_case(url, message, otherss)
        else:
            # For other platforms, download the video and send it directly
            download_and_send_video(url, message, otherss)

def download_and_send_video(url, message, otherss):
    # Download the video
    video_file = f"{message.message_id}.mp4"
    app.download_media(url, file_name=video_file)

    # Send the video file
    try:
        if otherss:
            app.send_video(
                message.chat.id,
                video_file,
                caption="Here's the video you requested!",
                reply_to_message_id=message.message_id
            )
        else:
            app.send_video(
                message.chat.id,
                video_file,
                caption="Here's the video you requested!",
                reply_to_message_id=message.message_id
            )
    except Exception as e:
        app.send_message(
            message.chat.id,
            f"Failed to send video: {e}",
            reply_to_message_id=message.message_id
        )

    # Clean up the downloaded file
    os.remove(video_file)

# start command
@app.on_message(filters.command(["start"]))
def send_start(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    app.send_message(message.chat.id, f"__👋 Hi **{message.from_user.mention}**, i am Terabox Link Bypasser Bot, just send me any supported links and i will you get you results.\nCheckout /help to Read More__",
    reply_markup=InlineKeyboardMarkup([
        [ InlineKeyboardButton("🌐 Source Code", url="https://github.com/youesky/TeraboxedBot")],
        [ InlineKeyboardButton("Updates", url="https://t.me/Teraboxed") ]]), 
        reply_to_message_id=message.id)


# help command
@app.on_message(filters.command(["help"]))
def send_help(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    app.send_message(message.chat.id, HELP_TEXT, reply_to_message_id=message.id, disable_web_page_preview=True)


# links
@app.on_message(filters.text)
def receive(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    bypass = Thread(target=lambda:loopthread(message),daemon=True)
    bypass.start()


# doc thread
def docthread(message):
    msg = app.send_message(message.chat.id, "🔎 __bypassing...__", reply_to_message_id=message.id)
    print("sent DLC file")
    file = app.download_media(message)
    dlccont = open(file,"r").read()
    links = bypasser.getlinks(dlccont)
    app.edit_message_text(message.chat.id, msg.id, f'__{links}__', disable_web_page_preview=True)
    remove(file)


# files
@app.on_message([filters.document,filters.photo,filters.video])
def docfile(client: pyrogram.client.Client, message: pyrogram.types.messages_and_media.message.Message):
    
    try:
        if message.document.file_name.endswith("dlc"):
            bypass = Thread(target=lambda:docthread(message),daemon=True)
            bypass.start()
            return
    except: pass

    bypass = Thread(target=lambda:loopthread(message,True),daemon=True)
    bypass.start()


# server loop
print("Bot Starting")
app.run()