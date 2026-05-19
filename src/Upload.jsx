import React, { useState, useEffect } from "react";
import { useAuth, apiFetch,R2_PUBLIC_URL } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// Helper function to capture a frame from a video file and return a File object
const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadeddata = () => {
      // Seek to 1 second (or 0 if video is very short) to avoid black frames
      video.currentTime = Math.min(1, video.duration || 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        // Clean up object URL
        URL.revokeObjectURL(video.src);

        if (blob) {
          // Swap the extension to .jpg
          const baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf("."));
          const thumbnailName = `${baseName || videoFile.name}.jpg`;
          
          const thumbnailFile = new File([blob], thumbnailName, {
            type: "image/jpeg",
          });
          resolve(thumbnailFile);
        } else {
          resolve(null);
        }
      }, "image/jpeg", 0.85); // 0.85 quality
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
  });
};

const handleBackfillThumbnails = async () => {
  if (!window.confirm("Are you sure you want to verify and backfill missing video thumbnails flatly under media/?")) {
    return;
  }

  console.log("Starting flat media repository video scan...");
  
  try {
    let videoItems = [];
    let currentOffset = 0;
    const batchLimit = 250; 
    let keepFetching = true;

    while (keepFetching) {
      console.log(`Fetching video metadata slice (Offset: ${currentOffset}, Limit: ${batchLimit})...`);
      
      const params = new URLSearchParams({
        offset: currentOffset.toString(),
        limit: batchLimit.toString(),
        q: "video" 
      });

      const res = await apiFetch(`/media?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Media index fetch failed at offset ${currentOffset}`);
      }

      const data = await res.json();
      const currentBatch = data.media || [];

      if (currentBatch.length === 0) {
        keepFetching = false;
      } else {
        videoItems = [...videoItems, ...currentBatch];
        if (currentBatch.length < batchLimit) {
          keepFetching = false;
        } else {
          currentOffset += batchLimit;
        }
      }
    }

    if (videoItems.length === 0) {
      alert("Scan complete: No videos returned from your database.");
      return;
    }

    console.log(`Identified ${videoItems.length} video entries. Running verification loop...`);
    const cleanR2Url = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;

    for (let i = 0; i < videoItems.length; i++) {
      const videoItem = videoItems[i];
      const videoKey = videoItem.object_key; // Uses your precise database schema column name
      if (!videoKey) continue;

      const filename = videoKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      
      // Target flat paths
      const flatThumbKey = `media/${nameWithoutExt}.jpg`;
      const absoluteThumbUrl = `${cleanR2Url}/${flatThumbKey}`;
      const absoluteVideoUrl = `${cleanR2Url}/media/${filename}`; 
      
      const edgeTestUrl = `/cdn-cgi/image/width=16,quality=10,format=auto/${absoluteThumbUrl}`;

      console.log(`\n[${i + 1}/${videoItems.length}] Auditing file: ${filename}`);

      try {
        // 1. AUDIT CHECK: Verify if the flat thumbnail image already exists at the Cloudflare Edge
        const checkThumbExist = await fetch(edgeTestUrl, { method: "GET" });
        if (checkThumbExist.ok && checkThumbExist.status === 200) {
          console.log(`-> Flat thumbnail already exists on R2 for ${filename}. Skipping.`);
          continue;
        }

        console.log(`-> Thumbnail missing. Capturing 0.2s frame over edge stream link...`);

        // 2. HIGH PERFORMANCE STREAMING: Pull only the needed frame bytes directly from R2
        const thumbnailBlob = await new Promise((resolve) => {
          const video = document.createElement("video");
          video.preload = "auto";
          video.crossOrigin = "anonymous"; // Essential to prevent canvas contamination
          video.muted = true;
          video.playsInline = true;
          video.src = absoluteVideoUrl;

          video.onloadeddata = () => { video.currentTime = 0.2; };
          
          video.onseeked = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth || 1280;
              canvas.height = video.videoHeight || 720;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Export as a raw binary Blob payload directly
              canvas.toBlob((blob) => { resolve(blob); }, "image/jpeg", 0.85);
            } catch (err) { resolve(null); }
          };
          video.onerror = () => { resolve(null); };
        });

        if (!thumbnailBlob) {
          throw new Error("HTML5 Video element failed to draw a valid image frame buffer.");
        }

        console.log(`-> Requesting flat thumbnail authorization for name: ${nameWithoutExt}.jpg`);
        
        // 3. PRESIGN REGISTRATION
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [{ name: `${nameWithoutExt}.jpg`, type: "image/jpeg" }]
          }),
        });

        if (!presignRes.ok) {
          throw new Error(`Presign endpoint rejected query. Status: ${presignRes.status}`);
        }
        const { presigned } = await presignRes.json();
        const uploadTarget = presigned[0];

        // 4. PUT STREAM VIA NATIVE XMLHTTPREQUEST (Ensures full CORS compatibility)
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadTarget.presignedUrl);
          xhr.setRequestHeader("Content-Type", "image/jpeg");
          
          xhr.onload = () => { xhr.status === 200 ? resolve() : reject(new Error(`Status: ${xhr.status}`)); };
          xhr.onerror = () => reject(new Error("Network error"));
          
          // Streams raw binary Blob directly without metadata wrappers
          xhr.send(thumbnailBlob);
        });

        console.log(`🎉 Successfully backfilled flat thumbnail destination: ${uploadTarget.objectKey}`);

      } catch (itemError) {
        console.error(`❌ Item skipped. Error processing [${filename}]:`, itemError.message);
      }
    }

    alert(`Backfill processing complete! Missing flat thumbnails are successfully generated.`);
  } catch (globalError) {
    console.error("Global flat backfill routine encountered a critical error:", globalError);
    alert(`Backfill failed: ${globalError.message}`);
  }
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [initialTag, setInitialTag] = useState("");   // Controlled by TagSelect

  // Derive default tag from username when component mounts or user changes
  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    const userTag = matchedTags.length > 0 ? matchedTags[0] : usernameLower;
    setInitialTag(userTag);
  }, [user]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleTagsSave = (tagsString) => {
    setInitialTag(tagsString);
  };

const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress({});

    try {
      // Step 1: Automatically generate thumbnails for any videos in the list
      const finalFilesList = [];
      const thumbnailNames = new Set(); 

      for (const file of files) {
        finalFilesList.push(file);
        
        // Check if the file is a video
        if (file.type.startsWith("video/")) {
          const thumbnailBlob = await generateVideoThumbnail(file);
          if (thumbnailBlob) {
            // Calculate flat thumbnail file name matching your core convention
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            const thumbName = `${nameWithoutExt}.jpg`;

            // CRITICAL FIX: Keep it as a raw Blob asset to ensure stable stream uploading
            thumbnailBlob.name = thumbName;
            thumbnailBlob.contentType = "image/jpeg";

            finalFilesList.push(thumbnailBlob);
            thumbnailNames.add(thumbName); 
          }
        }
      }

      // Step 2: Get presigned URLs for all items (including flat generated thumbnails)
      const fileInfo = finalFilesList.map((f) => ({
        name: f.name,
        type: f.contentType || f.type || "application/octet-stream",
      }));

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

      // Step 3: Upload each file directly via raw binary streams
      const uploadPromises = presigned.map((item, i) => {
        const file = finalFilesList[i];
        const isThumbnail = thumbnailNames.has(file.name);
        const expectedMime = file.contentType || file.type || "application/octet-stream";

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);
        
        // CRITICAL FIX: Explicitly supply Content-Type to match the Worker signature perfectly!
        xhr.setRequestHeader("Content-Type", expectedMime);

        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setProgress((prev) => ({ ...prev, [file.name]: percent }));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              // If it's a thumbnail, skip notify backend upload-complete if desired
              if (!isThumbnail) {
                await apiFetch("/upload-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    objectKey: item.objectKey, // Will cleanly match flat media/filename.ext
                    fileType: file.type,
                    initialTag,        
                  }),
                });
              }
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          
          // Sends clean un-wrapped binary straight across the network pipeline
          xhr.send(file);
        });
      });

      await Promise.all(uploadPromises);
      alert("All files uploaded successfully!");
      setFiles([]);
      setProgress({});
    } catch (err) {
      alert("One or more uploads failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {user?.username?.toLowerCase() === "lunepusa" && (
  <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "2px dashed #ff0000" }}>
    <h3>Admin Maintenance Panel</h3>
    <button 
      onClick={handleBackfillThumbnails}
      style={{ padding: "10px 20px", background: "#cd3d3d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
    >
      ⚙️ Backfill Missing Video Thumbnails
    </button>
  </div>
)}
      <h2>Upload New Content</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      <br />

      {/* Tag selection - replaces the old hidden checkbox */}
      <div style={{ margin: "15px 0", textAlign: "left", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "1em" }}>
          Tags for this upload:
        </label>
        <TagSelect
          initialTags={initialTag}
          onSave={handleTagsSave}
          placeholder="Type to add tags... (e.g. hidden, art, etc.)"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{ padding: "10px 20px", fontSize: "1em" }}
      >
        {uploading ? "Uploading..." : "Start Upload"}
      </button>

      {uploading && Object.keys(progress).length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Progress:</h3>
          {Object.keys(progress).map((fileName) => (
            <div key={fileName}>
              {fileName}: {progress[fileName] || 0}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;