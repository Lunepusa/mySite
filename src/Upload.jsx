import React, { useState, useEffect } from "react";
import { useAuth, apiFetch, R2_PUBLIC_URL } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// Unified logic: Captures frame at duration / 2
const generateThumbnailBlob = (videoFile) => {
  return new Promise((resolve) => {
    console.log(`[ThumbnailGen] Starting for video size: ${videoFile?.size} bytes`);

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;

    video.onloadedmetadata = () => {
      console.log(`[ThumbnailGen] Metadata loaded - Duration: ${video.duration}s`);
      video.currentTime = (video.duration && isFinite(video.duration)) ? video.duration / 2 : 0;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          console.log(`[ThumbnailGen] Success - Generated thumbnail size: ${blob?.size} bytes`);
          video.src = "";
          video.remove();
          resolve(blob);
        }, "image/jpeg", 0.85);
      } catch (e) {
        console.error("[ThumbnailGen] Canvas error:", e);
        video.remove();
        resolve(null);
      }
    };

    video.onerror = (e) => {
      console.error("[ThumbnailGen] Video loading error:", e);
      video.remove();
      resolve(null);
    };

    if (videoFile instanceof File || videoFile instanceof Blob) {
      video.src = URL.createObjectURL(videoFile);
    } else {
      console.error("[ThumbnailGen] Invalid video input");
      resolve(null);
    }
  });
};

const handleBackfillThumbnails = async () => {
  if (!window.confirm("Start batch-processed thumbnail backfill? This will process items in groups of 100.")) {
    return;
  }

  let totalProcessed = 0;
  let totalThumbnailsCreated = 0;

  try {
    let currentOffset = 0;
    const batchLimit = 100;
    let keepFetching = true;

    const processSingleItem = async (videoItem) => {
      if (!videoItem?.object_key) {
        console.warn("[Backfill] Item missing object_key");
        return;
      }

      const videoKey = videoItem.object_key;
      const filename = videoKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const thumbKey = `media/${nameWithoutExt}.jpg`;

      const absoluteVideoUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${videoKey}`;

      console.log(`[Backfill] Processing: ${filename}`);

      try {
        // 1. Fetch video
        console.log(`[Backfill] Fetching video from R2: ${filename}`);
        const videoResponse = await fetch(absoluteVideoUrl);
        if (!videoResponse.ok) {
          console.error(`[Backfill] Failed to fetch video ${filename} - Status: ${videoResponse.status}`);
          return;
        }
        const videoBlob = await videoResponse.blob();
        console.log(`[Backfill] Video fetched - Size: ${(videoBlob.size / (1024*1024)).toFixed(2)} MB`);

        // 2. Generate thumbnail
        const thumbnailBlob = await generateThumbnailBlob(videoBlob);
        if (!thumbnailBlob) {
          console.error(`[Backfill] Thumbnail generation failed for ${filename}`);
          return;
        }

        // 3. Get presigned URL
        console.log(`[Backfill] Requesting presigned URL for thumbnail`);
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            name: `${nameWithoutExt}.jpg`,
            type: "image/jpeg"
          }]),
        });

        const { presigned } = await presignRes.json();
        const presignedUrl = presigned[0].presignedUrl;

        // 4. Upload thumbnail
        console.log(`[Backfill] Uploading thumbnail...`);
        await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbnailBlob,
        });

        console.log(`✅ [Backfill] SUCCESS - Thumbnail created: ${thumbKey}`);
        totalThumbnailsCreated++;

      } catch (err) {
        console.error(`❌ [Backfill] Failed for ${filename}:`, err);
      }
    };

    while (keepFetching) {
      console.log(`\n=== Fetching batch ${currentOffset} ===`);

      const res = await apiFetch(`/media?offset=${currentOffset}&limit=${batchLimit}`);
      const data = await res.json();
      const mediaItems = data.media || [];

      const videoBatch = mediaItems.filter(item => {
        return item.isVideo === true ||
               item.type?.startsWith('video/') ||
               item.file_type?.startsWith('video/') ||
               (Array.isArray(item.tags) && item.tags.some(t => typeof t === 'string' && t.toLowerCase().includes('video')));
      });

      console.log(`Found ${videoBatch.length} videos in this batch (total items: ${mediaItems.length})`);

      for (const item of videoBatch) {
        await processSingleItem(item);
        totalProcessed++;
        await new Promise(r => setTimeout(r, 400)); // small delay
      }

      if (mediaItems.length < batchLimit) {
        keepFetching = false;
      } else {
        currentOffset += batchLimit;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`\n🎉 BACKFILL FINISHED`);
    console.log(`Total videos processed: ${totalProcessed}`);
    console.log(`Thumbnails successfully created: ${totalThumbnailsCreated}`);

    alert(`Backfill complete!\n\nProcessed: ${totalProcessed} videos\nThumbnails created: ${totalThumbnailsCreated}`);

  } catch (err) {
    console.error("❌ Backfill Error:", err);
    alert("Backfill failed: " + err.message);
  }
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [initialTag, setInitialTag] = useState("");

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    setInitialTag(matchedTags.length > 0 ? matchedTags[0] : usernameLower);
  }, [user]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const finalFiles = [];
      for (const file of files) {
        finalFiles.push(file);

        if (file.type.startsWith("video/")) {
          console.log(`[Upload] Generating thumbnail for: ${file.name}`);
          const thumbBlob = await generateThumbnailBlob(file);
          if (thumbBlob) {
            const thumbFile = new File(
              [thumbBlob],
              `${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
              { type: "image/jpeg" }
            );
            finalFiles.push(thumbFile);
            console.log(`[Upload] Thumbnail ready for ${file.name}`);
          }
        }
      }

      // ... rest of your upload logic stays the same
      const res = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFiles.map(f => ({ name: f.name, type: f.type }))),
      });

      const { presigned } = await res.json();

      for (let i = 0; i < finalFiles.length; i++) {
        const file = finalFiles[i];
        const { presignedUrl, objectKey } = presigned[i];

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.onload = async () => {
            if (xhr.status === 200) {
              if (!file.name.endsWith(".jpg")) {
                await apiFetch("/upload-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ objectKey, fileType: file.type, initialTag }),
                });
              }
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("XHR error"));
          xhr.send(file);
        });
      }

      alert("Upload complete!");
      setFiles([]);
    } catch (e) {
      console.error(e);
      alert("Error during upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user?.username?.toLowerCase() === "lunepusa" && (
        <div style={{ marginTop: "40px", borderTop: "2px dashed #ff0000", paddingTop: "20px" }}>
          <h3>Admin Maintenance</h3>
          <button onClick={handleBackfillThumbnails} disabled={uploading}>
            ⚙️ Backfill Missing Thumbnails
          </button>
        </div>
      )}

      <h2>Upload</h2>
      <input 
        type="file" 
        multiple 
        onChange={(e) => setFiles(Array.from(e.target.files))} 
      />
      <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      <button onClick={handleUpload} disabled={uploading || files.length === 0}>
        Start Upload
      </button>
    </div>
  );
};

export default Upload;