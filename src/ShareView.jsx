import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth, apiFetch, Login, R2_PUBLIC_URL} from "./Auth.jsx";
import { ClickableTags } from "./Tags.jsx"; // assuming this is where ClickableTags lives

const ShareView = () => {
  const { token } = useParams();
      const { isSubscriber, isLoggedIn, isAdmin, user } = useAuth();

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreenItem, setFullscreenItem] = useState(null);

  // Shared caption/date (taken from first item)
  const [sharedCaption, setSharedCaption] = useState("");
  const [sharedDate, setSharedDate] = useState("");

  useEffect(() => {
    const loadShared = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/share/${token}`);
        if (!res.ok) throw new Error("Invalid share link");

        const data = await res.json();
        const items = data.media || [];

        setMedia(items);

        // Set caption/date from first item (assuming all share same date)
        if (items.length > 0) {
          setSharedCaption(items[0].caption || "");
          setSharedDate(items[0].date || "Unknown");
        }

        // Grant permanent access if logged in and it's a date
        if (isLoggedIn && data.date) {
          await apiFetch("/grant-date-access", {
            method: "POST",
            body: JSON.stringify({ date: data.date }),
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load shared content");
      } finally {
        setLoading(false);
      }
    };

    loadShared();
  }, [token, isLoggedIn]);

  const openFullscreen = (item) => setFullscreenItem(item);
  const closeFullscreen = () => setFullscreenItem(null);

  const goNext = () => {
    if (fullscreenItem) {
      const currentIndex = media.findIndex((m) => m.key === fullscreenItem.key);
      if (currentIndex < media.length - 1) {
        setFullscreenItem(media[currentIndex + 1]);
      }
    }
  };

  const goPrev = () => {
    if (fullscreenItem) {
      const currentIndex = media.findIndex((m) => m.key === fullscreenItem.key);
      if (currentIndex > 0) {
        setFullscreenItem(media[currentIndex - 1]);
      }
    }
  };

  if (loading) return <p style={{ textAlign: "center", padding: "6px" }}>Loading shared content...</p>;
  if (error) return <p style={{ textAlign: "center", padding: "6px", color: "red" }}>{error}</p>;
  if (media.length === 0) return <p style={{ textAlign: "center", padding: "6px" }}>No content for this share link.</p>;

  return (
    <>
    <div style={{textAlign:"center"}}>
     {!user ? (
      <div style={{ fontSize: "1.3em", textAlign: "center" }}>
        Hope you enjoy! Log in below to permanantly unblur this content!
        <Login />
      </div>
    ) : (
      <div style={{ fontSize: "1em", textAlign: "center" }}>
        Welcome back, <a href="/Profile">{user.username}!</a> Hope you enjoy!
        <Login />
      </div>
    )}
    </div>
      {/* Full-screen modal (same as Gallery) */}
      {fullscreenItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeFullscreen}
        >
          <div
            style={{
              position: "absolute",
              right: "2%",
              top: "2%",
              fontSize: "3em",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={closeFullscreen}
          >
            x
          </div>

          {media.findIndex((m) => m.key === fullscreenItem.key) > 0 && (
            <div
              style={{
                position: "absolute",
                left: "2%",
                fontSize: "5em",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              ‹-
            </div>
          )}

          <div
            style={{ maxWidth: "95%", maxHeight: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenItem.isVideo ? (
              <video
                src={`${R2_PUBLIC_URL}/${fullscreenItem.key}`}
                controls
                autoPlay
                loop
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  background: "#000",
                }}
              />
            ) : (
              <img
                src={`${R2_PUBLIC_URL}/${fullscreenItem.key}`}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  background: "#000",
                }}
              />
            )}
          </div>

          {media.findIndex((m) => m.key === fullscreenItem.key) < media.length - 1 && (
            <div
              style={{
                position: "absolute",
                right: "2%",
                fontSize: "5em",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              -›
            </div>
          )}
        </div>
      )}

      {/* Main content — very similar to Gallery */}
      <div style={{ padding: "2px", maxWidth: "90%", margin: "0 auto" }}>
        {/* Shared caption/date at top (only once) */}
        <h2 style={{ textAlign: "center" }}>
          {sharedCaption && `${sharedCaption} — `}
          {sharedDate}
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
          {media.map((item) => {

            return (
              <div
                key={item.key}
                style={{
                  display: "inline-block",
                  height: "auto",
                  verticalAlign: "top",
                  minWidth: "50px",
                  width: "100px",
                  maxWidth: "23vw",
                  margin: "0 3px 5px 3px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => openFullscreen(item)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div
                  style={{
                    width: "95%",
                    height: "auto",
                    display: "inline-block",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#000",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    border: "1px white solid",
                  }}
                >
                  {item.isVideo ? (
                    <>
                      <video
                        src={`${R2_PUBLIC_URL}/${item.key}`}
                        muted
                        loop
                        style={{
                          maxHeight: "auto",
                          width: "100%",
                          objectFit: "contain",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          background: "rgba(0,0,0,0.5)",
                          borderRadius: "50%",
                          width: "30%",
                          height: "auto",
                          aspectRatio: "1/1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <span style={{ color: "#fff", fontSize: "32px" }}>▶</span>
                      </div>
                    </>
                  ) : (
                    <img
                      src={`${R2_PUBLIC_URL}/${item.key}`}
                      alt=""
                      style={{
                        maxHeight: "auto",
                        width: "100%",
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>

                {/* Clickable tags under each media */}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.5em", color: "#ccc", margin: "2px 0" }}>
                    Tags: <ClickableTags tags={item.tags} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ShareView;