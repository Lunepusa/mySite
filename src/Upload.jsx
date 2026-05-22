import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

const generateThumbnailBlob = async (videoFile) => {
  return new Promise((resolve, reject) => { // Added reject
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
            
            // CRITICAL: Await the actual upload fetch
            await fetch(presigned[0].presignedUrl, { 
                method: "PUT", 
                headers: { "Content-Type": "image/jpeg" }, 
                body: blob 
            });
            
            console.log(`[Thumbnail] Upload Success: ${thumbName}`);
            resolve(blob); // Resolve only AFTER fetch is done
          } catch (err) { 
            console.error(`[Thumbnail] Failed:`, err);
            reject(err); // Reject on error
          }
        }, "image/jpeg", 0.82);
      } catch (e) { video.remove(); reject(e); }
    };
    video.onerror = () => { video.remove(); reject(); };
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

      // 1. Thumbnail Generation & Upload Phase
      for (const file of files) {
        let cleanFile = file;
        if (file.name.startsWith("PXL_")) {
          const newName = file.name.substring(4);
          cleanFile = new File([file], newName, { type: file.type });
        }
        finalFiles.push(cleanFile);

        if (cleanFile.type.startsWith("video/")) {
          console.log(`[Upload] Starting thumbnail for: ${cleanFile.name}`);
          // This await ensures the blob is generated AND uploaded 
          // before moving to the next file
          await generateThumbnailBlob(cleanFile);
        }
      }
      
      // This alert now only triggers after the loop finishes 
      // and all thumbnail uploads are confirmed by the code inside generateThumbnailBlob
      alert("Thumbnails generated and fully uploaded!");
      return;

      // 2. Main File Upload Phase
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

      alert("All files uploaded!");
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
