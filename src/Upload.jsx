import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// High-performance client-side video thumbnail extractor
const extractVideoThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.onloadeddata = () => {
      video.currentTime = 0.2; // Move past 0s frame to prevent black images
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(videoUrl);
          if (blob) resolve(blob);
          else reject(new Error("Canvas blob generation failed."));
        }, 'image/jpeg', 0.85);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to decode video file locally."));
    };
  });
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [initialTag, setInitialTag] = useState("");

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    const userTag = matchedTags.length > 0 ? matchedTags[0] : usernameLower;
    setInitialTag(userTag);
  }, [user]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setStatusMessage("Requesting authorization tokens...");

    // Step 1: Tell backend about files to get presigned URLs
    const fileInfo = files.map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
    }));

    try {
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

      // Step 2: Sequentially process and upload files directly to R2 using raw fetch
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const target = presigned[i];

        // 2a. Handle thumbnail generation first if it's a video asset
        if (file.type.startsWith("video/") && target.thumbPresignedUrl) {
          setStatusMessage(`Extracting preview image for ${file.name}...`);
          try {
            const thumbBlob = await extractVideoThumbnail(file);
            
            await fetch(target.thumbPresignedUrl, {
              method: "PUT",
              body: thumbBlob,
            });
          } catch (thumbErr) {
            console.warn("Thumbnail generation skipped:", thumbErr.message);
          }
        }

        // 2b. Push master media item natively
        setStatusMessage(`Uploading ${file.name}... (Please keep tab open)`);
        const uploadRes = await fetch(target.presignedUrl, {
          method: "PUT",
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed network destination sync for ${file.name}`);
        }

        // Step 3: Inform your Cloudflare worker the transfer is done to execute SQL updates
        setStatusMessage(`Finalizing metadata registration for ${file.name}...`);
        await apiFetch("/upload-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectKey: target.objectKey,
            fileType: file.type,
            initialTag,
          }),
        });
      }

      setStatusMessage("All items uploaded successfully!");
      alert("All content successfully pushed to R2!");
      setFiles([]);
    } catch (err) {
      alert("Upload pipeline failure: " + err.message);
      setStatusMessage("Upload process errored out.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Upload New Content</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      <br />

      <div style={{ margin: "15px 0", textAlign: "left", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "1em" }}>
          Tags for this upload:
        </label>
        <TagSelect
          initialTags={initialTag}
          onSave={(tagsString) => setInitialTag(tagsString)}
          placeholder="Type to add tags..."
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{ padding: "10px 20px", fontSize: "1em" }}
      >
        {uploading ? "Processing..." : "Start Upload"}
      </button>

      {statusMessage && (
        <div style={{ marginTop: "20px", fontWeight: "bold", color: "#007acc" }}>
          Status: {statusMessage}
        </div>
      )}
    </div>
  );
};

export default Upload;