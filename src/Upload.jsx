import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { searchTags, TagSelect } from "./Tags";

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

    // Step 1: Get presigned URLs
    const fileInfo = files.map((f) => ({
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
            // Notify backend with the current tags from TagSelect
            await apiFetch("/upload-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                objectKey: item.objectKey,
                fileType: file.type,
                initialTag,        // Full comma-separated tag string
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
      // Do not reset tags here - keep user's selected tags for next upload if desired
      // setInitialTag("");   // Uncomment if you want to reset after every upload
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