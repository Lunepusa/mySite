import React, { useState, useEffect } from "react";
import { useAuth, apiFetch,R2_PUBLIC_URL } from "./Auth";
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
  if (!window.confirm("Start batch-processed thumbnail backfill? This will process items in groups of 100.")) return;

  try {
    let currentOffset = 0;
    const batchLimit = 100;
    let keepFetching = true;

    // Helper: Processes a single item to generate and upload its thumbnail
const processSingleItem = async (videoItem) => {
  if (!videoItem || !videoItem.object_key) return;

  const videoKey = videoItem.object_key;
  const filename = videoKey.split('/').pop();
  const nameWithoutExt = filename.split('.')[0];
  const flatThumbKey = `media/${nameWithoutExt}.jpg`;
  const absoluteThumbUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${flatThumbKey}`;
  const absoluteVideoUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${videoKey}`;

  // 1. Check if exists
  try {
    const check = await fetch(absoluteThumbUrl, { method: "HEAD" });
    
    // ONLY skip if it's a genuine 200 OK image
    if (check.status === 200) {
      const contentType = check.headers.get("content-type");
      if (contentType?.includes("image/jpeg")) {
        console.log(`-> Skipping: Thumbnail already exists for ${filename}`);
        return; 
      }
    }
    // If we reach here, it's a 404 or an invalid file, so we proceed to generation
    console.log(`-> Thumbnail missing for ${filename}. Proceeding to generation...`);
  } catch (e) {
    // 404s often trigger the catch block in browsers. 
    // We want to proceed if an error occurs!
    console.log(`-> Error checking existence (likely 404): ${e.message}. Proceeding...`);
  }

  // 2. Generation
  const blob = await new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata"; // Ensure metadata is loaded
    
    video.onloadedmetadata = () => { video.currentTime = video.duration / 2; };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob((b) => {
          video.src = ""; // Clean up
          video.remove(); 
          resolve(b);
        }, "image/jpeg", 0.85);
      } catch (e) { resolve(null); }
    };
    video.onerror = () => { video.remove(); resolve(null); };
    video.src = absoluteVideoUrl;
  });

  if (!blob) return;

      // 3. Presign & Upload
      const presignRes = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ name: `${nameWithoutExt}.jpg`, type: "image/jpeg" }] }),
      });
      
      const { presigned } = await presignRes.json();
      await fetch(presigned[0].presignedUrl, {
        method: "PUT", 
        headers: { "Content-Type": "image/jpeg" },
        body: blob
      });
      console.log(`Successfully backfilled: ${flatThumbKey} - ${absoluteThumbUrl}`);
    };

    // Main Batch Loop
    while (keepFetching) {
      console.log(`--- Fetching batch: Offset ${currentOffset} ---`);
      const res = await apiFetch(`/media?offset=${currentOffset}&limit=${batchLimit}&q=video`);
      const data = await res.json();
      const batch = data.media || [];

      for (const item of batch) {
        await processSingleItem(item);
      }

      if (batch.length < batchLimit) {
        keepFetching = false;
      } else {
        currentOffset += batchLimit;
        await new Promise(r => setTimeout(r, 1000)); // 1s throttle between batches
      }
    }
    alert("Backfill complete!");
  } catch (err) {
    console.error("Backfill Error:", err);
    alert("Backfill failed: " + err.message);
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
      const thumbnailNames = new Set(); 

      for (const file of files) {
        finalFilesList.push(file);
        
        // Check if the file is a video
        if (file.type.startsWith("video/")) {
          const thumbnailBlob = await generateVideoThumbnail(file);
          if (thumbnailBlob) {
            // Calculate flat thumbnail file name matching your core convention
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            const thumbName = `${nameWithoutExt}.jpg`;

            // CRITICAL FIX: Keep it as a raw Blob asset to ensure stable stream uploading
            thumbnailBlob.name = thumbName;
            thumbnailBlob.contentType = "image/jpeg";

            finalFilesList.push(thumbnailBlob);
            thumbnailNames.add(thumbName); 
          }
        }
      }

      // Step 2: Get presigned URLs for all items (including flat generated thumbnails)
      const fileInfo = finalFilesList.map((f) => ({
        name: f.name,
        type: f.contentType || f.type || "application/octet-stream",
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

      // Step 3: Upload each file directly via raw binary streams
      const uploadPromises = presigned.map((item, i) => {
        const file = finalFilesList[i];
        const isThumbnail = thumbnailNames.has(file.name);
        const expectedMime = file.contentType || file.type || "application/octet-stream";

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);
        
        // CRITICAL FIX: Explicitly supply Content-Type to match the Worker signature perfectly!
        xhr.setRequestHeader("Content-Type", expectedMime);

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
                    objectKey: item.objectKey, // Will cleanly match flat media/filename.ext
                    fileType: file.type,
                    initialTag,        
                  }),
                });
              }
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          
          // Sends clean un-wrapped binary straight across the network pipeline
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