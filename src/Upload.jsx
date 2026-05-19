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
  if (!window.confirm("Are you sure you want to query the database specifically for videos and generate missing thumbnails in R2?")) {
    return;
  }

  console.log("Starting synchronized media registry video scan...");
  
  try {
    let videoItems = [];
    let currentOffset = 0;
    const batchLimit = 250; 
    let keepFetching = true;

    // 1. Loop through paginated pages of the flat /media route requesting ONLY video records
    while (keepFetching) {
      console.log(`Fetching video metadata slice (Offset: ${currentOffset}, Limit: ${batchLimit})...`);
      
      // Use URLSearchParams to pass 'q=video' cleanly down to your worker logic
      const params = new URLSearchParams({
        offset: currentOffset.toString(),
        limit: batchLimit.toString(),
        q: "video" // Strips out images immediately at the database level!
      });

      const res = await apiFetch(`/media?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`Media index fetch failed at offset ${currentOffset} with status: ${res.status}`);
      }

      const data = await res.json();
      const currentBatch = data.media || [];

      if (currentBatch.length === 0) {
        keepFetching = false;
      } else {
        videoItems = [...videoItems, ...currentBatch];
        if (currentBatch.length < batchLimit) {
          keepFetching = false;
        } else {
          currentOffset += batchLimit;
        }
      }
    }

    if (videoItems.length === 0) {
      alert("Scan complete: No videos returned from your filtered database index.");
      return;
    }

    console.log(`Identified ${videoItems.length} video entries. Starting direct R2 processing loop...`);

    for (let i = 0; i < videoItems.length; i++) {
      const videoItem = videoItems[i];
      const videoKey = videoItem.key;
      if (!videoKey) continue;

      // Swap extensions to compute what the thumbnail name *should* be
      const baseFolder = videoKey.includes('/') ? videoKey.substring(0, videoKey.lastIndexOf('/') + 1) : '';
      const filename = videoKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const targetThumbKey = `${baseFolder}${nameWithoutExt}.jpg`;

      // Absolute paths directly targeting your public R2 bucket instance
      const videoUrl = `${R2_PUBLIC_URL}/${videoKey}`;
      const thumbUrl = `${R2_PUBLIC_URL}/${targetThumbKey}`;

      console.log(`\n[${i + 1}/${videoItems.length}] Auditing file: ${filename}`);

      try {
        // 2. Head check: Save bandwidth by skipping videos that already have their companion thumbnails
        const checkThumbExist = await fetch(thumbUrl, { method: "HEAD" });
        if (checkThumbExist.ok) {
          console.log(`-> Thumbnail already exists on R2 for ${filename}. Skipping.`);
          continue;
        }

        console.log(`-> Thumbnail missing. Downloading video track directly out of your R2 bucket...`);

        // 3. Download video binary payload directly from your public R2 path
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error(`Public storage bucket path refused download stream connection.`);
        }
        const videoBlob = await videoResponse.blob();

        // 4. Package it back into an HTML5 recognizable file tracker instance
        const videoFile = new File([videoBlob], filename, { type: videoItem.type || "video/mp4" });

        console.log(`-> Rendering offscreen canvas frame extraction snapshot...`);
        const thumbnailFile = await generateVideoThumbnail(videoFile);
        if (!thumbnailFile) {
          throw new Error("HTML5 Canvas extraction loop returned an empty frame buffer object.");
        }

        console.log(`-> Initializing presigned write authority token for key name...`);
        // 5. Request upload authorization specifically for the target side-loaded .jpg name
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [{ name: targetThumbKey, type: "image/jpeg" }]
          }),
        });

        if (!presignRes.ok) {
          throw new Error(`Presign endpoint rejected naming registration string. Status: ${presignRes.status}`);
        }
        const { presigned } = await presignRes.json();
        const uploadTarget = presigned[0];

        // 6. Direct PUT straight up to your R2 file storage container
        const uploadRes = await fetch(uploadTarget.presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbnailFile
        });

        if (!uploadRes.ok) {
          throw new Error(`Direct storage upload transaction string rejected. Status: ${uploadRes.status}`);
        }

        console.log(`🎉 Successfully backfilled thumbnail file to your bucket: ${targetThumbKey}`);

      } catch (itemError) {
        console.error(`❌ Item skipped. Problem handling media track [${filename}]:`, itemError.message);
      }
    }

    alert(`Backfill processing complete! Check developer console output for structural summary listings.`);

  } catch (globalError) {
    console.error("Global direct migration workflow encountered a critical failure:", globalError);
    alert(`Backfill failed: ${globalError.message}`);
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