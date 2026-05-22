import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

const generateThumbnailBlob = async (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.onloadedmetadata = () => { video.currentTime = (video.duration && isFinite(video.duration) && video.duration > 0) ? video.duration / 2 : 2; };
    video.onseeked = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth || 1280, 854);
        canvas.height = Math.min(video.videoHeight || 720, 480);
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          video.src = ""; video.remove();
          if (!blob) { resolve(null); return; }
          const thumbName = `${videoFile.name.replace(/\.[^/.]+$/, "")}.jpg`;
          try {
            const presignRes = await apiFetch("/presign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ files: [{ name: thumbName, type: "image/jpeg" }] }),
            });
            const { presigned } = await presignRes.json();
            await fetch(presigned[0].presignedUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
            console.log(`[Thumbnail] Success: ${thumbName}`);
          } catch (err) { console.error(`[Thumbnail] Failed:`, err); }
          resolve(blob);
        }, "image/jpeg", 0.82);
      } catch (e) { video.remove(); resolve(null); }
    };
    video.onerror = () => { video.remove(); resolve(null); };
    video.src = URL.createObjectURL(videoFile);
  });
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [initialTag, setInitialTag] = useState("");

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    setInitialTag(searchTags(usernameLower)[0] || usernameLower);
  }, [user]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({});

    // 1. THUMBNAIL BLOCK: Generates and uploads without calling upload-complete
    const videoFiles = files.filter(f => f.type.startsWith("video/"));
    for (const f of videoFiles) {
        console.log(`[Thumbnail] Starting: ${f.name}`);
        await generateThumbnailBlob(f);
    }
    alert("Thumbnails done!");

    // 2. MAIN UPLOAD BLOCK: Handles actual file uploads with parallel XHR
    const processedFiles = files.map(f => f.name.startsWith("PXL_") ? new File([f], f.name.substring(4), { type: f.type }) : f);
    const res = await apiFetch("/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: processedFiles.map(f => ({ name: f.name, type: f.type })) }),
    });
    const { presigned } = await res.json();

    // Fire all uploads at once for speed
    const uploadPromises = presigned.map((item, i) => {
      const file = processedFiles[i];
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }));
        };
        xhr.onload = async () => {
          if (xhr.status === 200) {
            await apiFetch("/upload-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ objectKey: item.objectKey, fileType: file.type, initialTag }),
            });
            resolve();
          } else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.send(file);
      });
    });

    try {
      await Promise.all(uploadPromises);
      alert("All files uploaded!");
      setFiles([]);
    } catch (e) { alert("Upload failed: " + (e?.message || String(e))); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Upload</h2>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} disabled={uploading} />
      <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      <button onClick={handleUpload} disabled={uploading || files.length === 0}>Start Upload</button>
      {uploading && (
        <div style={{ marginTop: "20px" }}>
          {files.map(f => <div key={f.name}>{f.name}: {progress[f.name] || 0}%</div>)}
        </div>
      )}
    </div>
  );
};

export default Upload;