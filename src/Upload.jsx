import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// Background thumbnail generator
const generateThumbnailBlob = async (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = (video.duration && isFinite(video.duration) && video.duration > 0) ? video.duration / 2 : 2;
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth || 1280, 854);
        canvas.height = Math.min(video.videoHeight || 720, 480);
        
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          video.src = "";
          video.remove();
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
    const matchedTags = searchTags(usernameLower);
    setInitialTag(matchedTags.length > 0 ? matchedTags[0] : usernameLower);
  }, [user]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({});

    // 1. Prepare files and kick off thumbnails
    const processedFiles = files.map(file => {
      if (file.name.startsWith("PXL_")) {
        return new File([file], file.name.substring(4), { type: file.type });
      }
      return file;
    });

    const videoFiles = processedFiles.filter(f => f.type.startsWith("video/"));
    const thumbPromise = Promise.all(videoFiles.map(f => generateThumbnailBlob(f))).then(() => {
        alert("All thumbnails generated and uploaded!");
    });

    // 2. Get presigned URLs for main files
    const res = await apiFetch("/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: processedFiles.map(f => ({ name: f.name, type: f.type })) }),
    });

    if (!res.ok) {
      alert("Failed to get upload URLs");
      setUploading(false);
      return;
    }

    const { presigned } = await res.json();

    // 3. Upload main files
    const uploadPromises = presigned.map((item, i) => {
      const file = processedFiles[i];
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }));
          }
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
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });
    });

    try {
      await Promise.all(uploadPromises);
      await thumbPromise; // Wait for thumbnails if they are still processing
      alert("All files uploaded!");
      setFiles([]);
      setProgress({});
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Upload New Content</h2>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} disabled={uploading} style={{ marginBottom: "10px" }} />
      <div style={{ margin: "15px 0" }}>
        <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      </div>
      <button onClick={handleUpload} disabled={uploading || files.length === 0} style={{ padding: "10px 20px" }}>
        {uploading ? "Uploading..." : "Start Upload"}
      </button>

      {uploading && files.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
          <h3>Progress:</h3>
          {files.map((file) => (
            <div key={file.name}>
              {file.name}: {progress[file.name] || 0}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;
