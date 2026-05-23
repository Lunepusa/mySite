import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

// ... (generateThumbnailBlob exactly the same) ...
const generateThumbnailBlob = async (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoFile);

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
        const scale = Math.min(
          1,
          MAX_SIZE / videoWidth,
          MAX_SIZE / videoHeight,
        );

        canvas.width = Math.round(videoWidth * scale);
        canvas.height = Math.round(videoHeight * scale);

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            video.onerror = null;
            video.src = "";
            URL.revokeObjectURL(videoUrl);

            if (!blob) {
              resolve(null);
              return;
            }

            const thumbName = `${videoFile.name.replace(/\.[^/.]+$/, "")}_thumb.jpg`;
            const thumbFile = new File([blob], thumbName, {
              type: "image/jpeg",
            });

            try {
              const presignRes = await apiFetch("/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([{ name: thumbName, type: "image/jpeg" }]),
              });

              if (!presignRes.ok) throw new Error("Thumbnail presign failed");

              const { presigned } = await presignRes.json();
              const presignedUrl = presigned[0].presignedUrl;
              const objectKey = presigned[0].objectKey;

              await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": "image/jpeg" },
                body: blob,
              });

              console.log(`[Thumbnail] Uploaded successfully: ${thumbName}`);
              resolve(blob);
            } catch (err) {
              console.error(`[Thumbnail] Upload failed for ${thumbName}:`, err);
              reject(err);
            }
          },
          "image/jpeg",
          0.82,
        );
      } catch (e) {
        console.error("Thumbnail canvas error:", e);
        video.onerror = null;
        video.src = "";
        URL.revokeObjectURL(videoUrl);
        reject(e);
      }
    };

    video.onerror = () => {
      video.onerror = null;
      video.src = "";
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Video load error"));
    };

    video.src = videoUrl;
  });
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [initialTag, setInitialTag] = useState("");
  const [progress, setProgress] = useState({});
  const [thumbOnly, setThumbOnly] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    setInitialTag(matchedTags.length > 0 ? matchedTags[0] : usernameLower);
  }, [user]);

  const handleAddFiles = (newFilesList) => {
    const incomingFiles = Array.from(newFilesList);
    setFiles((prevFiles) => {
      const existingIdentifiers = new Set(
        prevFiles.map((f) => `${f.name}-${f.size}`),
      );
      const uniqueNewFiles = incomingFiles.filter(
        (f) => !existingIdentifiers.has(`${f.name}-${f.size}`),
      );
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({});

    try {
      const processedFiles = files.map((file) => {
        if (file.name.startsWith("PXL_")) {
          return new File([file], file.name.substring(4), { type: file.type });
        }
        return file;
      });

      if (thumbOnly) {
        const videoFiles = processedFiles.filter((f) =>
          f.type.startsWith("video/"),
        );
        if (videoFiles.length > 0) {
          await Promise.all(
            videoFiles.map(async (file) => {
              try {
                await generateThumbnailBlob(file);
              } catch (thumbErr) {
                console.warn(
                  `[Upload] Skipping thumbnail for ${file.name}:`,
                  thumbErr,
                );
              }
            }),
          );
        }
        alert("Thumbnails generated and uploaded successfully!");
        setFiles([]);
        setUploading(false);
        return;
      }

      const res = await apiFetch("/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          processedFiles.map((f) => ({ name: f.name, type: f.type })),
        ),
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
              setProgress((prev) => ({
                ...prev,
                [file.name]: Math.round((e.loaded / e.total) * 100),
              }));
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              setProgress((prev) => ({ ...prev, [file.name]: 100 }));
              try {
                await apiFetch("/upload-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    objectKey,
                    fileType: file.type,
                    initialTag,
                  }),
                });
                if (file.type.startsWith("video/")) {
                  await generateThumbnailBlob(file);
                }
                resolve();
              } catch (err) {
                console.error(
                  `Post-upload tasks failed for ${file.name}:`,
                  err,
                );
                resolve();
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });
      });

      await Promise.all(uploadPromises);

      alert("All files uploaded and thumbnails generated!");
      setFiles([]);
    } catch (e) {
      console.error("Upload Error:", e);
      alert("Upload failed: " + (e.message || String(e)));
    } finally {
      setUploading(false);
    }
  };

  const handlePurgeDeleted = async () => {
    if (
      !window.confirm(
        "Are you sure? This will permanently delete all files and database rows tagged with 'delete'.",
      )
    ) {
      return;
    }
    try {
      const res = await apiFetch("/purge-deleted", { method: "POST" });
      if (!res.ok) throw new Error("Purge request failed");
      const data = await res.json();
      alert(`Successfully purged ${data.deleted} items!`);
    } catch (err) {
      console.error("Purge error:", err);
      alert("Failed to purge items: " + err.message);
    }
  };

  return (
    <div
      style={{
        padding: "5px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {user?.username?.toLowerCase() === "lunepusa" && (
        <div
          style={{
            marginTop: "10px",
            borderTop: "1px dashed #ff0000",
            paddingTop: "5px",
            marginBottom: "5px",
          }}
        >
          <h3
            style={{
              display: "inline-block",
              margin: "0 10px 0 0",
              fontSize: "1em",
              verticalAlign: "middle",
            }}
          >
            Admin:
          </h3>
          <button
            onClick={handlePurgeDeleted}
            style={{
              background: "#ff4444",
              color: "white",
              border: "none",
              padding: "2px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "inline-block",
              margin: "0 5px",
              verticalAlign: "middle",
            }}
          >
            Purge "delete"
          </button>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "2px 6px",
              borderRadius: "4px",
              display: "inline-block",
              margin: "0 5px",
              verticalAlign: "middle",
              fontSize: "0.9em",
            }}
          >
            <label style={{ cursor: "pointer", margin: 0 }}>
              <input
                type="checkbox"
                checked={thumbOnly}
                onChange={(e) => setThumbOnly(e.target.checked)}
                style={{ margin: "0 5px 0 0", verticalAlign: "middle" }}
              />
              Thumbnails Only
            </label>
          </div>
        </div>
      )}

      <h2 style={{ margin: "5px 0 10px 0", fontSize: "1.2em" }}>Upload</h2>

      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !uploading && document.getElementById("hiddenFileInput").click()
        }
        style={{
          border: isDragging ? "2px dashed #007bff" : "2px dashed #ccc",
          backgroundColor: isDragging
            ? "rgba(0, 123, 255, 0.1)"
            : "transparent",
          padding: "20px 10px",
          borderRadius: "4px",
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          margin: "0 0 10px 0",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.9em",
            color: isDragging ? "#007bff" : "inherit",
          }}
        >
          {uploading
            ? "Uploading..."
            : isDragging
              ? "Drop here!"
              : "Drag & drop files, or click"}
        </p>

        <input
          id="hiddenFileInput"
          type="file"
          multiple
          onChange={(e) => handleAddFiles(e.target.files)}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </div>

      <div
        style={{
          display: "inline-block",
          margin: "0 5px",
          verticalAlign: "middle",
        }}
      >
        <TagSelect initialTags={initialTag} onSave={setInitialTag} />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{
          display: "inline-block",
          padding: "4px 12px",
          margin: "0 5px",
          fontSize: "0.9em",
          verticalAlign: "middle",
          cursor: uploading || files.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : `Upload (${files.length})`}
      </button>

      {uploading && files.length > 0 && (
        <div
          style={{
            marginTop: "10px",
            textAlign: "left",
            width: "100%",
            fontSize: "0.85em",
          }}
        >
          {files.map((file) => {
            const displayName = file.name.startsWith("PXL_")
              ? file.name.substring(4)
              : file.name;
            return (
              <div key={file.name} style={{ marginBottom: "4px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "80%",
                    }}
                  >
                    {displayName}
                  </span>
                  <span>{progress[displayName] || 0}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    backgroundColor: "#333",
                    borderRadius: "2px",
                  }}
                >
                  <div
                    style={{
                      width: `${progress[displayName] || 0}%`,
                      height: "100%",
                      backgroundColor: "#4CAF50",
                      borderRadius: "2px",
                      transition: "width 0.2s",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Upload;
