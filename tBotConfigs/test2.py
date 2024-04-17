import os
import requests
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext

# Telegram Bot Token
TOKEN = "6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE"

# Directory to save downloads
UPLOADS_DIR = "../uploads"

# Command handler
def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text('Send me a direct download link and I will download the file for you.')

# Handler for direct download links
def download_file(update: Update, context: CallbackContext) -> None:
    url = update.message.text
    try:
        response = requests.get(url, stream=True)
        file_name = os.path.basename(url)
        file_path = os.path.join(UPLOADS_DIR, file_name)
        with open(file_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    file.write(chunk)
        update.message.reply_text(f'File downloaded and saved as {file_name}')
    except Exception as e:
        update.message.reply_text('Failed to download the file.')

def main() -> None:
    # Create the Updater and pass it your bot's token.
    updater = Updater(TOKEN)

    # Get the dispatcher to register handlers
    dispatcher = updater.dispatcher

    # Define handlers
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, download_file))

    # Start the Bot
    updater.start_polling()

    # Run the bot until you press Ctrl-C
    updater.idle()

if __name__ == '__main__':
    main()
