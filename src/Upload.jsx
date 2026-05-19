import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// Helper function to capture a frame from a video file and return a File object
const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadeddata = () => {
      // Seek to 1 second (or 0 if video is very short) to avoid black frames
      video.currentTime = Math.min(1, video.duration || 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        // Clean up object URL
        URL.revokeObjectURL(video.src);

        if (blob) {
          // Swap the extension to .jpg
          const baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf("."));
          const thumbnailName = `${baseName || videoFile.name}.jpg`;
          
          const thumbnailFile = new File([blob], thumbnailName, {
            type: "image/jpeg",
          });
          resolve(thumbnailFile);
        } else {
          resolve(null);
        }
      }, "image/jpeg", 0.85); // 0.85 quality
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
  });
};

const handleBackfillThumbnails = async () => {
  if (!window.confirm("Are you sure you want to scan the gallery and generate missing thumbnails for all videos?")) {
    return;
  }

  console.log("Starting gallery video scan...");
  
  try {
    // 1. Fetch your entire current database gallery inventory
    const res = await apiFetch("/gallery");
    if (!res.ok) throw new Error("Failed to fetch gallery items");
    
    const data = await res.json();
    const allItems = data.items || [];
    
    // 2. Filter out items that are explicitly flagged as videos
    const videoItems = allItems.filter(item => item.fileType && item.fileType.startsWith("video/"));
    
    if (videoItems.length === 0) {
      alert("No videos found in your gallery to backfill!");
      return;
    }

    console.log(`Found ${videoItems.length} videos. Processing sequentially...`);

    for (let i = 0; i < videoItems.length; i++) {
      const videoItem = videoItems[i];
      
      // Determine target thumbnail name
      const baseFolder = videoItem.key.includes('/') ? videoItem.key.substring(0, videoItem.key.lastIndexOf('/') + 1) : '';
      const filename = videoItem.key.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const targetThumbName = `${nameWithoutExt}.jpg`;
      const targetThumbKey = `${baseFolder}${targetThumbName}`;

      console.log(`[${i + 1}/${videoItems.length}] Processing: ${filename}`);

      try {
        // 3. Download the video stream into a temporary blob
        const videoTargetUrl = `${R2_PUBLIC_URL}/${videoItem.key}`;
        const videoBlobRes = await fetch(videoTargetUrl);
        if (!videoBlobRes.ok) throw new Error(`Could not fetch video source file from storage`);
        const videoBlob = await videoBlobRes.json(); // converted stream
        
        // Convert blob payload back to a standard File object wrapper
        const videoFile = new File([videoBlob], filename, { type: videoItem.fileType });

        // 4. Extract frame using your existing thumbnail generation engine
        const thumbnailFile = await generateVideoThumbnail(videoFile);
        if (!thumbnailFile) throw new Error("Frame extraction failed");

        // 5. Get a presigned upload URL specifically for this target thumbnail asset name
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [{ name: targetThumbKey, type: "image/jpeg" }]
          }),
        });

        if (!presignRes.ok) throw new Error("Failed to obtain presigned URL from backend");
        const { presigned } = await presignRes.json();
        const uploadTarget = presigned[0];

        // 6. Directly PUT the image blob into your R2 storage bucket
        const uploadRes = await fetch(uploadTarget.presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbnailFile
        });

        if (!uploadRes.ok) throw new Error("Direct S3/R2 storage upload failed");
        console.log(`Successfully backfilled thumbnail: ${targetThumbKey}`);

      } catch (itemError) {
        console.error(`Failed to process video [${filename}]:`, itemError.message);
      }
    }

    alert("Backfill processing routine completed! Check browser console logs for detailed status summary.");

  } catch (globalError) {
    console.error("Global backfill task encountered an error:", globalError);
    alert("Backfill migration failed: " + globalError.message);
  }
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

    try {
      // Step 1: Automatically generate thumbnails for any videos in the list
      const finalFilesList = [];
      const thumbnailNames = new Set(); // Keep track of which names are auto-generated thumbnails

      for (const file of files) {
        finalFilesList.push(file);
        
        // Check if the file is a video
        if (file.type.startsWith("video/")) {
          const thumbnailFile = await generateVideoThumbnail(file);
          if (thumbnailFile) {
            finalFilesList.push(thumbnailFile);
            thumbnailNames.add(thumbnailFile.name); // Track it to skip /upload-complete later
          }
        }
      }

      // Step 2: Get presigned URLs for all items (including generated thumbnails)
      const fileInfo = finalFilesList.map((f) => ({
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

      // Step 3: Upload each file directly
      const uploadPromises = presigned.map(async (item, i) => {
        const file = finalFilesList[i];
        const isThumbnail = thumbnailNames.has(file.name);

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setProgress((prev) => ({ ...prev, [file.name]: percent }));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              // If it's a thumbnail, skip notify backend upload-complete if desired
              if (!isThumbnail) {
                await apiFetch("/upload-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    objectKey: item.objectKey,
                    fileType: file.type,
                    initialTag,        // Full comma-separated tag string
                  }),
                });
              }
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });
      });

      await Promise.all(uploadPromises);
      alert("All files uploaded successfully!");
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
      {user?.username?.toLowerCase() === "lunepusa" && (
  <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "2px dashed #ff0000" }}>
    <h3>Admin Maintenance Panel</h3>
    <button 
      onClick={handleBackfillThumbnails}
      style={{ padding: "10px 20px", background: "#cd3d3d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
    >
      ⚙️ Backfill Missing Video Thumbnails
    </button>
  </div>
)}
      <h2>Upload New Content</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      <br />

      {/* Tag selection - replaces the old hidden checkbox */}
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

      {uploading && Object.keys(progress).length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Progress:</h3>
          {Object.keys(progress).map((fileName) => (
            <div key={fileName}>
              {fileName}: {progress[fileName] || 0}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;