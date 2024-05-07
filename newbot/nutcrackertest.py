import os
import requests
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext

# Replace with your Telegram bot token
TELEGRAM_BOT_TOKEN = "6419718020:AAHrsd2wps0Uh-1l51W9KFYJmmyULUilMfE"

def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text("Hello! ENTER THE TERABOX LINK.")

def download_video(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    video_link = update.message.text

    # Download the video
    try:
        response = requests.get(video_link)
        if response.status_code == 200:
            video_file = response.content
            # Save the video locally (you can customize the file name)
            video_filename = "downloaded_video.mp4"
            with open(video_filename, "wb") as f:
                f.write(video_file)
            update.message.reply_text(f"Video downloaded successfully! Now send me the link to attach it.")
        else:
            update.message.reply_text("Error downloading the video. Please check the link.")
    except Exception as e:
        update.message.reply_text(f"Error: {str(e)}")

def attach_video(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    video_filename = "downloaded_video.mp4"  # Use the same filename as before

    # Send the video as an attachment
    try:
        with open(video_filename, "rb") as f:
            context.bot.send_video(chat_id=chat_id, video=f)
        update.message.reply_text("Video attached successfully!")
    except Exception as e:
        update.message.reply_text(f"Error attaching the video: {str(e)}")

def main() -> None:
    updater = Updater(token=6303457153:AAFVzzRllAv9RrpNOtRzVKE112laHceVY5s)
    dispatcher = updater.dispatcher

    # Handlers
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, download_video))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, attach_video))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()