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
      video.currentTime = (video.duration && isFinite(video.duration)) ? video.duration / 2 : 0;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          video.src = "";
          video.remove();
          resolve(b);
        }, "image/jpeg", 0.85);
      } catch (e) {
        video.remove();
        resolve(null);
      }
    };

    video.onerror = () => {
      video.remove();
      resolve(null);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

const handleBackfillThumbnails = async () => {
  if (!window.confirm("Start batch-processed thumbnail backfill? This will process items in groups of 100.")) return;

  try {
    let currentOffset = 0;
    const batchLimit = 100;
    let keepFetching = true;

    const processSingleItem = async (videoItem) => {
      if (!videoItem || !videoItem.object_key) return;

      const videoKey = videoItem.object_key;
      const filename = videoKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const flatThumbKey = `media/${nameWithoutExt}.jpg`;
      const absoluteVideoUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${videoKey}`;

      console.log(`-> Generating thumbnail for: ${filename}`);

      // We skip existence checks and force generate to ensure parity
      const blob = await generateThumbnailBlob(new File([], videoKey)); // Dummy file for URL
      // Note: For the backfill, we actually need the video content. 
      // Replace the blob generation with a fetch to the R2 URL to get the stream:
      const videoResponse = await fetch(absoluteVideoUrl);
      const videoBlob = await videoResponse.blob();
      const thumbnailBlob = await generateThumbnailBlob(videoBlob);

      if (!thumbnailBlob) return;

      const presignRes = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ name: `${nameWithoutExt}.jpg`, type: "image/jpeg" }] }),
      });

      const { presigned } = await presignRes.json();
      await fetch(presigned[0].presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbnailBlob
      });
      console.log(`✅ Success: ${flatThumbKey}`);
    };

    while (keepFetching) {
      console.log(`--- Fetching batch: Offset ${currentOffset} ---`);
      const res = await apiFetch(`/media?offset=${currentOffset}&limit=${batchLimit}`);
      const data = await res.json();
      const batch = (data.media || []).filter(item => item.isVideo || item.type?.startsWith('video/'));

      for (const item of batch) {
        await processSingleItem(item);
      }

      if (batch.length < batchLimit) {
        keepFetching = false;
      } else {
        currentOffset += batchLimit;
        await new Promise(r => setTimeout(r, 1000));
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
          const thumbBlob = await generateThumbnailBlob(file);
          if (thumbBlob) {
            const thumbFile = new File([thumbBlob], `${file.name.replace(/\.[^/.]+$/, "")}.jpg`, { type: "image/jpeg" });
            finalFiles.push(thumbFile);
          }
        }
      }

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
            } else reject();
          };
          xhr.send(file);
        });
      }
      alert("Upload complete!");
      setFiles([]);
    } catch (e) { alert("Error: " + e.message); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user?.username?.toLowerCase() === "lunepusa" && (
        <div style={{ marginTop: "40px", borderTop: "2px dashed #ff0000" }}>
          <h3>Admin Maintenance</h3>
          <button onClick={handleBackfillThumbnails}>⚙️ Backfill Missing Thumbnails</button>
        </div>
      )}
      <h2>Upload</h2>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
      <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      <button onClick={handleUpload} disabled={uploading}>Start Upload</button>
    </div>
  );
};

export default Upload;