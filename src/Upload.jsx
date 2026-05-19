import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
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
  if (!window.confirm("Are you sure you want to scan the gallery and generate missing thumbnails for all videos?")) {
    return;
  }

  console.log("Starting gallery video scan...");
  
  try {
    // Attempt 1: Fetch with pagination/query fallback parameters to support your specific backend structure
    let allItems = [];
    let res = await apiFetch("/gallery?limit=5000&offset=0");
    
    // Fallback if the route needs a clean trailing slash or strict naked endpoint
    if (!res.ok) {
      res = await apiFetch("/gallery");
    }

    if (!res.ok) {
      throw new Error(`Server API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Adapt to whichever data key format your database schema uses (items vs media vs files)
    allItems = data.items || data.media || data.files || data;
    
    if (!Array.isArray(allItems)) {
      throw new Error("Gallery data returned from backend is not an array format.");
    }
    
    // Filter down to elements explicitly marked as video files or files with video extensions
    const videoItems = allItems.filter(item => {
      const pathKey = item.key || item.objectKey || "";
      const type = item.fileType || "";
      return type.startsWith("video/") || /\.(mp4|mov|ts|webm|mkv|3gp)$/i.test(pathKey);
    });
    
    if (videoItems.length === 0) {
      alert("No videos found in your gallery array list to backfill!");
      return;
    }

    console.log(`Found ${videoItems.length} videos. Processing sequentially...`);

    for (let i = 0; i < videoItems.length; i++) {
      const videoItem = videoItems[i];
      const itemKey = videoItem.key || videoItem.objectKey;
      if (!itemKey) continue;
      
      // Determine precise matching target companion thumbnail filename extension swap
      const baseFolder = itemKey.includes('/') ? itemKey.substring(0, itemKey.lastIndexOf('/') + 1) : '';
      const filename = itemKey.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      const targetThumbName = `${nameWithoutExt}.jpg`;
      const targetThumbKey = `${baseFolder}${targetThumbName}`;

      console.log(`[${i + 1}/${videoItems.length}] Extracting frame from video track: ${filename}`);

      try {
        // Build absolute source URL endpoint to extract binary asset blob from R2
        const videoTargetUrl = `${R2_PUBLIC_URL}/${itemKey}`;
        
        const videoBlobRes = await fetch(videoTargetUrl);
        if (!videoBlobRes.ok) throw new Error(`Could not download binary source stream from R2 bucket public route`);
        const videoBlob = await videoBlobRes.blob();
        
        // Wrap back into standard HTML5 File wrapper instance
        const inferredType = videoItem.fileType || "video/mp4";
        const videoFile = new File([videoBlob], filename, { type: inferredType });

        // Pass down to your working on-screen canvas image extractor
        const thumbnailFile = await generateVideoThumbnail(videoFile);
        if (!thumbnailFile) throw new Error("Canvas context frame extraction capture returned null");

        // Ask backend for target S3 storage bucket initialization route
        const presignRes = await apiFetch("/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [{ name: targetThumbKey, type: "image/jpeg" }]
          }),
        });

        if (!presignRes.ok) throw new Error(`Presign endpoint refused target naming mapping. Status: ${presignRes.status}`);
        const { presigned } = await presignRes.json();
        const uploadTarget = presigned[0];

        // Directly upload our generated compressed image straight up to R2
        const uploadRes = await fetch(uploadTarget.presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbnailFile
        });

        if (!uploadRes.ok) throw new Error(`Direct storage PUT execution failed with status code: ${uploadRes.status}`);
        console.log(`Successfully side-loaded and backfilled matching thumbnail image: ${targetThumbKey}`);

      } catch (itemError) {
        console.error(`Skipping file. Error processing item index tracking [${filename}]:`, itemError.message);
      }
    }

    alert("Backfill processing execution sequence complete! Check console logs for individual file summary.");

  } catch (globalError) {
    console.error("Global backfill task encountered an error:", globalError);
    alert(`Backfill migration failed: ${globalError.message}\nCheck browser devtools console logs for system tracking parameters.`);
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
      const thumbnailNames = new Set(); // Keep track of which names are auto-generated thumbnails

      for (const file of files) {
        finalFilesList.push(file);
        
        // Check if the file is a video
        if (file.type.startsWith("video/")) {
          const thumbnailFile = await generateVideoThumbnail(file);
          if (thumbnailFile) {
            finalFilesList.push(thumbnailFile);
            thumbnailNames.add(thumbnailFile.name); // Track it to skip /upload-complete later
          }
        }
      }

      // Step 2: Get presigned URLs for all items (including generated thumbnails)
      const fileInfo = finalFilesList.map((f) => ({
        name: f.name,
        type: f.type || "application/octet-stream",
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

      // Step 3: Upload each file directly
      const uploadPromises = presigned.map(async (item, i) => {
        const file = finalFilesList[i];
        const isThumbnail = thumbnailNames.has(file.name);

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", item.presignedUrl);

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
                    objectKey: item.objectKey,
                    fileType: file.type,
                    initialTag,        // Full comma-separated tag string
                  }),
                });
              }
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