import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

const generateThumbnailBlob = async (videoFile) => {
  return new Promise((resolve, reject) => {
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
        
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const MAX_SIZE = 720;
        const scale = Math.min(1, MAX_SIZE / videoWidth, MAX_SIZE / videoHeight);

        canvas.width = Math.round(videoWidth * scale);
        canvas.height = Math.round(videoHeight * scale);

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          video.onerror = null; 
          video.src = "";
          video.remove();

          if (!blob) {
            resolve(null);
            return;
          }

          const thumbName = `${videoFile.name.replace(/\.[^/.]+$/, "")}_thumb.jpg`;
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
            const objectKey = presigned[0].objectKey;

            await fetch(presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": "image/jpeg" },
              body: blob,
            });

            const publicUrl = `https://files.lunepusa.com/${objectKey}`;
            console.log(`[Thumbnail] Uploaded successfully: ${thumbName}`);
            console.log(`[Thumbnail] Public URL: ${publicUrl}`);

            resolve(blob);
          } catch (err) {
            console.error(`[Thumbnail] Upload failed for ${thumbName}:`, err);
            reject(err);
          }

        }, "image/jpeg", 0.82);
      } catch (e) {
        console.error("Thumbnail canvas error:", e);
        video.onerror = null;
        video.remove();
        reject(e);
      }
    };

    video.onerror = () => {
      video.onerror = null;
      video.remove();
      reject(new Error("Video load error"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [initialTag, setInitialTag] = useState("");
  const [progress, setProgress] = useState({});
  const[thumbOnly, setThumbOnly] = useState(false);

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    setInitialTag(matchedTags.length > 0 ? matchedTags[0] : usernameLower);
  }, [user]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({});

    try {
      // 1. THUMBNAIL BLOCK
      const videoFiles = files.filter(f => f.type.startsWith("video/"));
      if (videoFiles.length > 0) {
        for (const file of videoFiles) {
          let cleanFile = file;
          if (file.name.startsWith("PXL_")) {
            const newName = file.name.substring(4);
            cleanFile = new File([file], newName, { type: file.type });
          }
          console.log(`[Upload] Starting thumbnail for: ${cleanFile.name}`);
          
          try {
            await generateThumbnailBlob(cleanFile);
          } catch (thumbErr) {
            console.warn(`[Upload] Skipping thumbnail for ${cleanFile.name} due to error:`, thumbErr);
          }
        }
        alert("Thumbnails generated and fully uploaded!");
        if(thumbOnly) return;
      }

      // 2. MAIN UPLOAD BLOCK
      const processedFiles = files.map(file => {
        if (file.name.startsWith("PXL_")) {
          return new File([file], file.name.substring(4), { type: file.type });
        }
        return file;
      });

      console.log(`[Upload] Uploading ${processedFiles.length} main files...`);

      const res = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedFiles.map(f => ({ name: f.name, type: f.type }))),
      });

      if (!res.ok) throw new Error("Presign request failed");

      const { presigned } = await res.json();

      const uploadPromises = presigned.map((item, i) => {
        const file = processedFiles[i];
        const { presignedUrl, objectKey } = item;

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              // Force progress to 100% immediately on success
              setProgress(prev => ({ ...prev, [file.name]: 100 }));
              
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
      });

      await Promise.all(uploadPromises);

      alert("All files uploaded!");
      setFiles([]);

    } catch (e) {
      console.error("Upload Error:", e);
      alert("Upload failed: " + (e.message || String(e)));
    } finally {
      setUploading(false);
    }
  };

  const handlePurgeDeleted = async () => {
    if (!window.confirm("Are you sure? This will permanently delete all files and database rows tagged with 'delete'.")) {
      return;
    }

    try {
      const res = await apiFetch("/purge-deleted", { method: "POST" });
      if (!res.ok) throw new Error("Purge request failed");
      
      const data = await res.json();
      alert(`Successfully purged ${data.deleted} items from the server!`);
      
      // Force a hard refresh of the gallery to clear the deleted items from the UI
      setMedia([]);
      setOffset(0);
      setHasMore(true);
      loadMoreGroups(0, activeSearchQuery, true);
    } catch (err) {
      console.error("Purge error:", err);
      alert("Failed to purge items: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user?.username?.toLowerCase() === "lunepusa" && (
        <div style={{ marginTop: "40px", borderTop: "2px dashed #ff0000", paddingTop: "20px" }}>
          <h3>Admin Maintenance</h3>
          <button 
              onClick={handlePurgeDeleted}
              style={{
                background: "#ff4444",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Purge "delete" Tag
            </button>
            <div style={{border:"2pxsolidwhite"}}>
              Upload only the thumbnails?
              <input type="checkbox" onChange={setThumbOnly(!thumbOnly)} />
            </div>
        </div>
      )}

      <h2>Upload</h2>
      <input 
        type="file" 
        multiple 
        onChange={(e) => setFiles(Array.from(e.target.files))} 
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      
      <div style={{ margin: "15px 0" }}>
        <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      </div>

      <button onClick={handleUpload} disabled={uploading || files.length === 0}>
        {uploading ? "Uploading..." : "Start Upload"}
      </button>

      {uploading && files.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
          <h3>Progress:</h3>
          {files.map((file) => {
            const displayName = file.name.startsWith("PXL_") ? file.name.substring(4) : file.name;
            return (
              <div key={file.name} style={{ marginBottom: "5px" }}>
                <span style={{ fontSize: "0.8em" }}>{displayName}: </span>
                {/* Visual progress bar removed, strictly numbers now */}
                <span> {progress[displayName] || 0}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Upload;