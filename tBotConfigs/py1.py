from pyrogram import Client, filters
from pyrogram.types import Message
import subprocess
from nudenet import NudeClassifier
import cv2

# Initialize NudeNet classifier
classifier = NudeClassifier()

# Blur explicit content
def blur_nude_parts(image_path, detections):
    image = cv2.imread(image_path)
    for detection in detections:
        if detection['label'] == 'EXPLICIT':
            x, y, w, h = detection['box']
            roi = image[y:y+h, x:x+w]
            roi = cv2.GaussianBlur(roi, (99, 99), 30)
            image[y:y+h, x:x+w] = roi
    blurred_image_path = 'blurred_' + image_path
    cv2.imwrite(blurred_image_path, image)
    return blurred_image_path

# Create a thumbnail from the video
def create_thumbnail(video_url):
    thumbnail_path = "thumbnail.jpg"
    subprocess.run(['ffmpeg', '-i', video_url, '-ss', '00:00:01.000', '-vframes', '1', thumbnail_path])
    return thumbnail_path

# Initialize Pyrogram Client
app = Client("thumbnail_bot", bot_token="6183932093:AAHs-oVwawQbINs_8Jq3EiAfMASGXSiUDuE")

# Start command handler
@app.on_message(filters.command("start"))
def start(client, message: Message):
    message.reply_text("Send me a video link to generate a thumbnail.")

# Video link handler
@app.on_message(filters.text & ~filters.command)
def handle_video_link(client, message: Message):
    video_link = message.text
    
    try:
        # Create a thumbnail
        thumbnail_path = create_thumbnail(video_link)

        # Detect nudity
        result = classifier.classify(thumbnail_path)

        # Blur nude parts if necessary
        if result[thumbnail_path]['safe'] < 0.5:
            blurred_thumbnail_path = blur_nude_parts(thumbnail_path, result[thumbnail_path]['detections'])
        else:
            blurred_thumbnail_path = thumbnail_path

        # Send the thumbnail back to the user
        message.reply_photo(photo=open(blurred_thumbnail_path, 'rb'))

    except Exception as e:
        message.reply_text(f"An error occurred: {e}")

# Run the bot
app.run()
