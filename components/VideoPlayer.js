// components/VideoPlayer.js

import { useEffect, useState } from "react";
import fetchVideoDetails from "../lib/fetchVideoDetails";
import ReactPlayer from "react-player";
import styles from "../pages/styles/videopage.module.css";

function VideoPlayer({ videoId }) {
  const [videoDetails, setVideoDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await fetchVideoDetails(videoId);
        setVideoDetails(data);
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    };

    if (videoId) {
      fetchDetails();
    }
  }, [videoId]);

  const handleVideoPlay = async () => {
    try {
      console.log("Incrementing view count...");
      await fetch("/api/incrementViewCount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });
      console.log("View count incremented successfully.");
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };
  

  if (!videoDetails) {
    return <div>Loading...</div>;
  }

  const videoUrl = `/uploads/${videoDetails.videoName}`;

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.innercontainer}>
          <div className={styles.videotitle}>
            <h2>{videoDetails.videoName}</h2>
          </div>
          <div className={styles.videocontainer}>
            <ReactPlayer
              className={styles.video}
              url={videoUrl}
              controls={true}
              width="100%"
              height="100%"
              onStart={handleVideoPlay} // Call handleVideoPlay when the video starts playing
            />
          </div>
          <div className={styles.shareButton}>
            <button onClick={handleShare}>Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
