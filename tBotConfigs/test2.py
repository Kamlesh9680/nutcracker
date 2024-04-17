import os
import requests
from pyrogram import Client, filters
from pyrogram.types import Message
import magic

# Your API_ID and API_HASH obtained from https://my.telegram.org/auth
API_ID = "29305574"
API_HASH = "4f9955b64b3fd1470d11a33860ac860a"
BOT_TOKEN = "6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE"

# Directory to save downloads
UPLOADS_DIR = "../uploads"

# Create Pyrogram client
app = Client("download_bot", api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN)

# Command handler
@app.on_message(filters.command("start"))
async def start(client, message):
    await message.reply_text('Send me a direct download link and I will download the file for you.')

async def download_file_with_retry(url):
    max_retries = 3
    retries = 0
    while retries < max_retries:
        try:
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                file_name = os.path.basename(url)
                file_path = os.path.join(UPLOADS_DIR, file_name)
                with open(file_path, 'wb') as file:
                    for chunk in response.iter_content(chunk_size=1024):
                        if chunk:
                            file.write(chunk)
                return file_path
            else:
                retries += 1
        except Exception as e:
            retries += 1
    return None

@app.on_message(filters.text)
async def download_file(client, message):
    url = message.text
    try:
        file_path = await download_file_with_retry(url)
        if file_path:
            file_type = magic.Magic(mime=True).from_file(file_path)
            if file_type.startswith('text') or file_type == 'application/octet-stream':
                # If the file type is text or octet-stream, it may be misidentified
                await message.reply_text(f'File downloaded but its format could not be determined.')
            else:
                await message.reply_text(f'File downloaded and saved as {os.path.basename(file_path)}')
                # Send the downloaded file back to the user
                await client.send_document(
                    chat_id=message.chat.id,
                    document=file_path,
                    caption=f"Here is your downloaded file: {os.path.basename(file_path)}"
                )
        else:
            await message.reply_text(f'Failed to download the file after multiple retries.')
    except Exception as e:
        await message.reply_text(f'Failed to download the file. Error: {e}')
# Run the client
app.run()
