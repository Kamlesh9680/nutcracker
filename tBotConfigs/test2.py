import os
import requests
from pyrogram import Client, filters
from pyrogram.types import Message
import magic
import random
import string

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
                print(f"Failed to download. Status Code: {response.status_code}")
        except Exception as e:
            retries += 1
            print(f"Failed to download. Error: {e}")
    return None

def generate_random_filename(length=12):
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join(random.choice(letters_and_digits) for _ in range(length))

@app.on_message(filters.text)
async def download_file(client, message):
    url = message.text
    try:
        file_path = await download_file_with_retry(url)
        if file_path:
            # Generate a random filename for the downloaded file
            file_extension = os.path.splitext(url)[1]  # Get the file extension from the URL
            random_filename = generate_random_filename() + file_extension
            new_file_path = os.path.join(UPLOADS_DIR, random_filename)
            
            # Rename the downloaded file with the random filename
            os.rename(file_path, new_file_path)

            await message.reply_text(f'File downloaded and saved as {random_filename}')
            # Send the downloaded file back to the user
            await client.send_document(
                chat_id=message.chat.id,
                document=new_file_path,
                caption=f"Here is your downloaded file: {random_filename}"
            )
        else:
            await message.reply_text(f'Failed to download the file after multiple retries.')
    except Exception as e:
        await message.reply_text(f'Failed to download the file. Error: {e}')

app.run()
