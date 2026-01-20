import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth, apiFetch } from "./Auth";
import { R2_PUBLIC_URL } from "./Gallery"; // adjust import path if needed

const ShareView = () => {
  const { token } = useParams();
  const { isLoggedIn } = useAuth();

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadShared = async () => {
      try {
        const res = await apiFetch(`/share/${token}`);
        if (!res.ok) throw new Error("Invalid share link");

        const data = await res.json();
        setMedia(data.media || []);

        // Grant access if logged in
        if (isLoggedIn && data.date) {
          await apiFetch("/grant-date-access", {
            method: "POST",
            body: JSON.stringify({ date: data.date }),
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    loadShared();
  }, [token, isLoggedIn]);

  if (loading) return <p>Loading shared content...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (media.length === 0) return <p>No content for this share.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Shared Content</h1>
      {isLoggedIn && <p style={{ color: "green" }}>Access granted (permanent if date)</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
        {media.map(item => (
          <div key={item.key} style={{ width: "220px" }}>
            {item.isVideo ? (
              <video src={`${R2_PUBLIC_URL}/${item.key}`} controls style={{ width: "100%" }} />
            ) : (
              <img src={`${R2_PUBLIC_URL}/${item.key}`} alt="" style={{ width: "100%" }} />
            )}
            <p>{item.caption || "No caption"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShareView;