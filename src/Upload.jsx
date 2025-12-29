import React, { useState } from "react";
import { useAuth } from "./Auth";
import { searchTags } from "./Tags"; // Import from Tags.jsx

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress({});

    // Derive canonical tag from username
    const usernameLower = user?.username?.toLowerCase() || "lunepusa";
    const matchedTags = searchTags(usernameLower);
    const initialTag = matchedTags.length > 0 ? matchedTags[0] : usernameLower;

    // Step 1: Get presigned URLs
    const fileInfo = files.map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
    }));

    const res = await fetch("https://api.lunepusa.workers.dev/presign", {
      method: "POST",
      credentials: "include",
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

    // Step 2: Upload each file directly
    const uploadPromises = presigned.map(async (item, i) => {
      const file = files[i];

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
            // Notify Worker, send initialTag
            await fetch("https://api.lunepusa.workers.dev/upload-complete", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                objectKey: item.objectKey,
                fileType: file.type,
                initialTag,
              }),
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

    try {
      await Promise.all(uploadPromises);
      alert("All files uploaded!");
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
      <h2>Upload New Content</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      <br />
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{ padding: "10px 20px", fontSize: "1em" }}
      >
        {uploading ? "Uploading..." : "Start Upload"}
      </button>

      {uploading && files.length > 0 && (
        <div style={{ marginTop: "20px" }}>
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
