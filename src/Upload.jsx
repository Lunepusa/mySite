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

    video.onloadedmetadata = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration / 2;
      } else {
        video.currentTime = 2;
      }
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement("canvas");
        const videoWidth = video.videoWidth || 1280;
        const videoHeight = video.videoHeight || 720;
        const MAX_SIZE = 720;
        const scale = Math.min(1, MAX_SIZE / videoWidth, MAX_SIZE / videoHeight);

        canvas.width = Math.round(videoWidth * scale);
        canvas.height = Math.round(videoHeight * scale);

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          video.src = "";
          video.remove();

          if (!blob) {
            resolve(null);
            return;
          }

          const thumbName = `${videoFile.name.replace(/\.[^/.]+$/, "")}.jpg`;
          try {
            const presignRes = await apiFetch("/presign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify([{ name: thumbName, type: "image/jpeg" }]),
            });

            const { presigned } = await presignRes.json();
            const presignedUrl = presigned[0].presignedUrl;

            await fetch(presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": "image/jpeg" },
              body: blob,
            });
            console.log(`[Thumbnail] Uploaded successfully: ${thumbName}`);
          } catch (err) {
            console.error(`[Thumbnail] Upload failed for ${thumbName}:`, err);
          }
          resolve(blob);
        }, "image/jpeg", 0.82);
      } catch (e) {
        console.error("Thumbnail canvas error:", e);
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

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [initialTag, setInitialTag] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    setInitialTag(matchedTags.length > 0 ? matchedTags[0] : usernameLower);
  }, [user]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress({});

    try {
      const finalFiles = [];
      for (const file of files) {
        let cleanFile = file;
        if (file.name.startsWith("PXL_")) {
          cleanFile = new File([file], file.name.substring(4), { type: file.type });
        }
        finalFiles.push(cleanFile);

        if (cleanFile.type.startsWith("video/")) {
          console.log(`[Upload] Starting thumbnail for: ${cleanFile.name}`);
          await generateThumbnailBlob(cleanFile);
        }
      }

      const res = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFiles.map(f => ({ name: f.name, type: f.type }))),
      });

      if (!res.ok) throw new Error("Presign request failed");
      const { presigned } = await res.json();

      for (let i = 0; i < finalFiles.length; i++) {
        const file = finalFiles[i];
        const { presignedUrl, objectKey } = presigned[i];

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              await apiFetch("/upload-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectKey, fileType: file.type, initialTag }),
              });
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });
      }

      alert("Upload complete!");
      setFiles([]);
    } catch (e) {
      console.error("Upload Error:", e);
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user?.username?.toLowerCase() === "lunepusa" && (
        <div style={{ marginTop: "40px", borderTop: "2px dashed #ff0000", paddingTop: "20px" }}>
          <h3>Admin Maintenance</h3>
        </div>
      )}

      <h2>Upload</h2>
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
      <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      <button onClick={handleUpload} disabled={uploading || files.length === 0}>
        Start Upload
      </button>

      {uploading && (
        <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
          <h4>Upload Progress:</h4>
          {Object.entries(uploadProgress).map(([name, p]) => (
            <div key={name} style={{ marginBottom: "5px" }}>
              <span style={{ fontSize: "0.8em" }}>{name}: </span>
              <progress value={p} max="100" />
              <span> {p}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;
