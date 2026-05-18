import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// High-performance client-side video thumbnail extractor
const extractVideoThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.onloadeddata = () => {
      // Seek slightly past 0 to force decoding pipeline and avoid black frames
      video.currentTime = 0.2;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(videoUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas blob generation failed."));
          }
        }, 'image/jpeg', 0.85);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to load video data in browser."));
    };
  });
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [initialTag, setInitialTag] = useState("");   // Controlled by TagSelect

  // Derive default tag from username when component mounts or user changes
  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    const userTag = matchedTags.length > 0 ? matchedTags[0] : usernameLower;
    setInitialTag(userTag);
  }, [user]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleTagsSave = (tagsString) => {
    setInitialTag(tagsString);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress({});

    // Step 1: Get presigned URLs
    const fileInfo = files.map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
    }));

    const res = await apiFetch("/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: fileInfo }),
    });

    if (!res.ok) {
      const err = await res.text();
      alert("Failed to get upload URLs: " + err);
      setUploading(false);
      return;
    }

    const { presigned } = await res.json();

    // Step 2: Upload each file directly
    const uploadPromises = presigned.map(async (item, i) => {
      const file = files[i];

      // Helper function wrapping XHR to keep your original progress layout functional
      const performXhrUpload = (targetUrl, payloadBlob, trackerKey, contentType) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", targetUrl);
          
          // CRITICAL: Must specify the Content-Type to align with the signed parameter rules
          xhr.setRequestHeader("Content-Type", contentType);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setProgress((prev) => ({ ...prev, [trackerKey]: percent }));
            }
          };

          xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(payloadBlob);
        });
      };

      // Extract and upload thumbnail in parallel right alongside the main file if it's a video
      const fileOperations = [];
      if (file.type.startsWith("video/") && item.thumbPresignedUrl) {
        try {
          const thumbBlob = await extractVideoThumbnail(file);
          const thumbTrackName = `📸 Thumb: ${file.name}`;
          
          fileOperations.push(
            performXhrUpload(item.thumbPresignedUrl, thumbBlob, thumbTrackName, "image/jpeg")
          );
        } catch (thumbErr) {
          console.warn("Thumbnail generation skipped:", thumbErr.message);
        }
      }

      // Add main asset file upload operation
      fileOperations.push(
        performXhrUpload(item.presignedUrl, file, file.name, file.type || "application/octet-stream")
      );

      // Wait for both the video and its thumbnail chunk to finish pushing
      await Promise.all(fileOperations);

      // Step 3: Notify backend with your original post-upload route parameters
      await apiFetch("/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: item.objectKey,
          fileType: file.type,
          initialTag,        // Full comma-separated tag string
        }),
      });
    });

    try {
      await Promise.all(uploadPromises);
      alert("All files uploaded!");
      setFiles([]);
      setProgress({});
    } catch (err) {
      alert("One or more uploads failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Upload New Content</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      <br />

      <div style={{ margin: "15px 0", textAlign: "left", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "1em" }}>
          Tags for this upload:
        </label>
        <TagSelect
          initialTags={initialTag}
          onSave={handleTagsSave}
          placeholder="Type to add tags... (e.g. hidden, art, etc.)"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{ padding: "10px 20px", fontSize: "1em" }}
      >
        {uploading ? "Uploading..." : "Start Upload"}
      </button>

      {uploading && files.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Progress:</h3>
          {files.map((file) => (
            <div key={file.name}>
              {file.name}: {progress[file.name] || 0}% 
              {progress[`📸 Thumb: ${file.name}`] !== undefined && (
                <span style={{ fontSize: "0.85em", color: "#666", marginLeft: "10px" }}>
                  (Thumbnail: {progress[`📸 Thumb: ${file.name}`]}%)
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;