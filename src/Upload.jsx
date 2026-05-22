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
        // 1. Get original video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // 2. Define the absolute maximum for BOTH width and height
        const MAX_SIZE = 720;

        // 3. Calculate the scale needed to fit within the 780x780 bounding box
        // (Math.min with 1 ensures we only shrink, we never stretch small videos)
        const scale = Math.min(1, MAX_SIZE / videoWidth, MAX_SIZE / videoHeight);

        // 4. Set the literal pixel dimensions of the final JPEG file
        // (Using Math.round to ensure we don't pass decimal pixels to the canvas)
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

          // === YOUR REQUESTED BEHAVIOR ===
          const thumbName = `${videoFile.name.replace(/\.[^/.]+$/, "")}.jpg`;
          const thumbFile = new File([blob], thumbName, { type: "image/jpeg" });

          console.log(`[Thumbnail] Generated: ${thumbName}`, URL.createObjectURL(blob));
          
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
            console.log(`[Thumbnail] Uploaded successfully: ${thumbName}`, presignedUrl);

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
        let cleanFile =file;
        // Remove PXL_ prefix on frontend
        if (file.name.startsWith("PXL_")) {
          const newName = file.name.substring(4);
          cleanFile = new File([file], newName, { type: file.type });
        }

        finalFiles.push(cleanFile);

        // Generate + Upload thumbnail immediately for videos
        if (cleanFile.type.startsWith("video/")) {
          console.log(`[Upload] Starting thumbnail for: ${cleanFile.name}`);
          await generateThumbnailBlob(cleanFile);   // This now uploads the thumbnail itself
        }
      }

      // Only upload the original files now (thumbnails already handled)
      console.log(`[Upload] Uploading ${finalFiles.length} main files...`);

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

          xhr.onload = async () => {
            if (xhr.status === 200) {
              await apiFetch("/upload-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectKey, fileType: file.type, initialTag }),
              });
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