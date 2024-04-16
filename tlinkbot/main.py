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
import os
import requests
import re
import time

with open('config.json', 'r') as f: DATA = load(f)
def getenv(var): return environ.get(var) or DATA.get(var, None)

bot_token = '6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE'
api_hash = '4f9955b64b3fd1470d11a33860ac860a'
api_id = '29305574'
app = Client("my_bot",api_id=api_id, api_hash=api_hash,bot_token=bot_token)  


# handle ineex
def handleIndex(ele,message,msg):
    result = bypasser.scrapeIndex(ele)
    try: app.delete_messages(message.chat.id, msg.id)
    except: pass
    for page in result: app.send_message(message.chat.id, page, reply_to_message_id=message.id, disable_web_page_preview=True)

def loopthread(message, otherss=False):
    urls = []
    if otherss:
        texts = message.caption
    else:
        texts = message.text

    if texts in [None,""]:
        return
    
    for ele in texts.split():
        if "http://" in ele or "https://" in ele:
            urls.append(ele)
    
    if len(urls) == 0:
        return

    for ele in urls:
        if bypasser.ispresent(bypasser.ddl.ddllist, ele):
            try: 
                temp = bypasser.ddl.direct_link_generator(ele)
            except Exception as e: 
                temp = "**Error**: " + str(e)

            if temp != None:
                match = re.search(r'\[(.*?)\]\((.*?)\)', temp)
                if match:
                    title = match.group(1)
                    url = match.group(2)

                    # Create a folder named 'uploads' if it doesn't exist
                    os.makedirs('uploads', exist_ok=True)
                    
                    # Download the video file using the extracted URL
                    response = requests.get(url)
                    
                    if response.status_code == 200:
                        # Save the downloaded video file to the /uploads folder
                        timestamp = int(time.time())
                        filename = f'video_{timestamp}.mp4'
                        with open(f'..uploads/{filename}', 'wb') as f:
                            f.write(response.content)
                            print("Video downloaded and saved successfully!")

                else:
                    print("Invalid link format:", temp)

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