import React, { useState, useEffect } from "react";
import { useAuth, apiFetch, R2_PUBLIC_URL } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// Unified logic: Captures frame at duration / 2
const generateThumbnailBlob = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = 2; // Fixed 2 seconds in
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth || 1280, 854);
      canvas.height = Math.min(video.videoHeight || 720, 480);

      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        video.src = "";
        video.remove();
        resolve(blob);
      }, "image/jpeg", 0.78);
    };

    video.onerror = () => {
      video.remove();
      resolve(null);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

const handleBackfillThumbnails = async () => {
  if (!window.confirm("Process next 5 videos for thumbnail backfill?")) {
    return;
  }

  let processedThisRun = 0;
  let createdThisRun = 0;
  let skippedThisRun = 0;

  try {
    let currentOffset = 0;
    const batchLimit = 100;
    let videosToProcess = [];

    // Fetch until we have at least 5 videos or run out
    while (videosToProcess.length < 5) {
      console.log(`[Backfill] Fetching batch at offset ${currentOffset}...`);

      const res = await apiFetch(`/media?offset=${currentOffset}&limit=${batchLimit}`);
      const data = await res.json();
      const mediaItems = data.media || [];

      if (mediaItems.length === 0) break;

      const videoBatch = mediaItems.filter(item => {
        const tags = String(item.tags || "").toLowerCase();
        return (
          item.isVideo === true ||
          item.type?.startsWith('video/') ||
          item.file_type?.startsWith('video/') ||
          tags.includes('video')
        );
      });

      videosToProcess = [...videosToProcess, ...videoBatch];
      currentOffset += batchLimit;

      // Safety break if no more items
      if (mediaItems.length < batchLimit) break;
    }

    // Take only the first 5
    const toProcess = videosToProcess.slice(0, 5);

    console.log(`[Backfill] Starting ${toProcess.length} videos this run...`);

    for (const item of toProcess) {
      const objectKey = item.key;
      if (!objectKey) continue;

      const filename = objectKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const thumbKey = `media/${nameWithoutExt}.jpg`;

      console.log(`\n[Backfill] Processing: ${filename}`);

      // Check if thumbnail already exists
      const thumbUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${thumbKey}`;
      let exists = false;
      try {
        const headRes = await fetch(thumbUrl, { method: "HEAD" });
        exists = headRes.ok;
      } catch {}

      if (exists) {
        console.log(`⏭️ Skipped - thumbnail already exists: ${filename}`);
        skippedThisRun++;
        continue;
      }

      try {
        const videoResponse = await fetch(`${R2_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`);
        if (!videoResponse.ok) {
          console.error(`Failed to download video: ${filename}`);
          continue;
        }

        const videoBlob = await videoResponse.blob();
        console.log(`Downloaded ${filename} (${(videoBlob.size / (1024*1024)).toFixed(1)} MB)`);

        const thumbnailBlob = await generateThumbnailBlob(videoBlob);
        if (!thumbnailBlob) {
          console.error(`Thumbnail generation failed for ${filename}`);
          continue;
        }

        // Upload thumbnail
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            name: `${nameWithoutExt}.jpg`,
            type: "image/jpeg"
          }]),
        });

        const { presigned } = await presignRes.json();

        await fetch(presigned[0].presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbnailBlob,
        });

        console.log(`✅ Thumbnail created: ${thumbKey}`);
        createdThisRun++;

      } catch (err) {
        console.error(`❌ Failed ${filename}:`, err.message || err);
      }

      processedThisRun++;
      await new Promise(r => setTimeout(r, 400)); // small delay between videos
    }

    console.log(`\n=== Run Complete ===`);
    console.log(`Processed this run : ${processedThisRun}`);
    console.log(`Created this run   : ${createdThisRun}`);
    console.log(`Skipped this run   : ${skippedThisRun}`);

    alert(`Batch finished!\n\nProcessed: ${processedThisRun}\nCreated: ${createdThisRun}\nSkipped: ${skippedThisRun}\n\nClick the button again for the next 5.`);

  } catch (err) {
    console.error("Backfill Error:", err);
    alert("Error during backfill: " + err.message);
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