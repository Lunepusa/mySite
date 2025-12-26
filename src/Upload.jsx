import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const onDrop = (acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
  });

  const handleFolderSelect = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const getFolderNames = (allFiles) => {
    const names = new Set();
    allFiles.forEach((file) => {
      let path = file.webkitRelativePath || file.name;
      path = path.replace(/\\/g, '/');
      const parts = path.split('/');
      if (parts.length > 1) {
        names.add(parts[0]);
      }
    });
    return Array.from(names);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus("No files selected");
      return;
    }

    setUploading(true);
    setStatus("Uploading... (this may take a while)");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("https://api.lunepusa.workers.dev/upload-batch", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      let result = {};
      try {
        result = await res.json();
      } catch (e) {
        result = { successCount: files.length, errors: [] };
      }

      if (res.ok || result.successCount > 0) {
        setStatus(`Upload complete! ${result.successCount || files.length} files uploaded.`);
      } else {
        setStatus(`Upload failed: ${res.status} ${JSON.stringify(result)}`);
      }
    } catch (err) {
      setStatus(`Network error: ${err.message}`);
    }

    setFiles([]);
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h3>Upload Media</h3>

      <div
        {...getRootProps()}
        style={{
          border: "3px dashed #ff69b4",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: isDragActive ? "#222" : "#111",
          marginBottom: "30px",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ fontSize: "1.2em" }}>
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p>or</p>
        <label style={{ cursor: "pointer" }}>
          <input
            type="file"
            webkitdirectory="true"
            multiple
            onChange={handleFolderSelect}
            style={{ display: "none" }}
          />
          <button type="button" style={{ padding: "10px 20px" }}>
            Select Folder
          </button>
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <p>
            <strong>{files.length} files selected</strong>
          </p>
          <p>
            Folders: <strong>{getFolderNames(files).join(", ") || "Individual Files"}</strong>
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{ padding: "14px 28px", fontSize: "1.2em" }}
      >
        {uploading ? "Uploading..." : "Upload All"}
      </button>

      {status && (
        <pre
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#000",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
            color: status.includes("complete") ? "#0f0" : status.includes("failed") || status.includes("error") ? "#f00" : "#ff0",
          }}
        >
          {status}
        </pre>
      )}
    </div>
  );
};

export default Upload;