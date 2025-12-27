import React, { useState, useEffect } from "react";
import { useAuth } from "./Auth";
import { TagSelect } from "./Tags";

const Gallery = () => {
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fullscreenItem, setFullscreenItem] = useState(null);

  const [editingGroupCaption, setEditingGroupCaption] = useState(null);
  const [editingGroupTags, setEditingGroupTags] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [tempCaption, setTempCaption] = useState("");
  const [tempTags, setTempTags] = useState([]);
  const [originalTags, setOriginalTags] = useState([]);

  const R2_PUBLIC_URL = "https://pub-737d16f465e74a25bb9b4613475ea7ef.r2.dev";
  const LIMIT = 20;

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    fetch(
      `https://api.lunepusa.workers.dev/media?offset=${offset}&limit=${LIMIT}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.media.length < LIMIT) setHasMore(false);
        setMedia((prev) => [...prev, ...data.media]);
        setOffset((prev) => prev + LIMIT);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Safe tag parsing
  const getTagsArray = (tagInput) => {
    if (!tagInput) return [];
    if (Array.isArray(tagInput)) return tagInput;
    if (typeof tagInput === "string") {
      return tagInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    return [];
  };

  // Group by date and compute common tags
  const groups = {};
  media.forEach((item) => {
    const date = item.date || "Unknown";
    if (!groups[date]) {
      groups[date] = { items: [], commonTags: [] };
    }
    groups[date].items.push(item);
  });

  Object.keys(groups).forEach((date) => {
    const items = groups[date].items;
    if (items.length === 0) return;

    let common = new Set(getTagsArray(items[0].tags));
    for (let i = 1; i < items.length; i++) {
      const itemTags = new Set(getTagsArray(items[i].tags));
      common = new Set([...common].filter((tag) => itemTags.has(tag)));
    }
    groups[date].commonTags = [...common];
  });

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const isSubscriber = user?.is_subscriber || user?.is_admin;
  const isLoggedIn = !!user;
  const isAdmin = user?.is_admin;

  const firstDate = sortedDates[0];

  if (loading && media.length === 0)
    return (
      <p style={{ textAlign: "center", padding: "60px" }}>Loading gallery...</p>
    );

  if (media.length === 0)
    return <p style={{ textAlign: "center" }}>No media yet.</p>;

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

  const saveEdit = async () => {
    const body = {};

    if (editingGroupCaption) {
      body.caption = tempCaption;
      body.groupKey = editingGroupCaption;
    }

    if (editingGroupTags || editingItem) {
      const added = tempTags.filter((tag) => !originalTags.includes(tag));
      const removed = originalTags.filter((tag) => !tempTags.includes(tag));

      if (editingGroupTags) {
        body.addedTags = added.length ? added : undefined;
        body.removedTags = removed.length ? removed : undefined;
        body.groupKey = editingGroupTags;
      } else if (editingItem) {
        body.addedTags = added.length ? added : undefined;
        body.removedTags = removed.length ? removed : undefined;
        body.key = editingItem;
      }
    }

    try {
      const res = await fetch("https://api.lunepusa.workers.dev/update-media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");

      // Full reload for fresh data
      setMedia([]);
      setOffset(0);
      setHasMore(true);
      loadMedia();

      setEditingGroupCaption(null);
      setEditingGroupTags(null);
      setEditingItem(null);
      setTempCaption("");
      setTempTags([]);
      setOriginalTags([]);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "5px" }}>Gallery</h1>
      <h3>
        {!isLoggedIn
          ? "Log in to see more previews, Subscribe to see all media"
          : !isSubscriber || !isAdmin
          ? "Subscribe to see all media"
          : ""}
      </h3>

      {/* Full-screen modal */}
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
          {media.findIndex((m) => m.key === fullscreenItem.key) > 0 && (
            <div
              style={{
                position: "absolute",
                left: "20px",
                fontSize: "60px",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              ‹
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
                style={{
                  maxWidth: "100%",
                  maxHeight: "100vh",
                  filter: !isSubscriber || !isAdmin ? "blur(10px)" : "none",
                }}
              />
            ) : (
              <img
                src={`${R2_PUBLIC_URL}/${fullscreenItem.key}`}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: "100vh",
                  objectFit: "contain",
                  filter: !isSubscriber || !isAdmin ? "blur(10px)" : "none",
                }}
              />
            )}
          </div>

          {media.findIndex((m) => m.key === fullscreenItem.key) <
            media.length - 1 && (
            <div
              style={{
                position: "absolute",
                right: "20px",
                fontSize: "60px",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              ›
            </div>
          )}
        </div>
      )}

      {sortedDates.map((date) => {
        const { items, commonTags } = groups[date];
        const videoCount = items.filter((i) => i.isVideo).length;
        const photoCount = items.length - videoCount;
        const caption = items[0]?.caption || "";

        const isFirstGroup = date === firstDate;
        const blurred = !isSubscriber && !isFirstGroup;

        return (
          <div
            key={date}
            style={{ marginBottom: "5px", border: "2px dashed white" }}
          >
            <h2 style={{ textAlign: "center" }}>
              {editingGroupCaption === date ? (
                <div>
                  <input
                    value={tempCaption}
                    onChange={(e) => setTempCaption(e.target.value)}
                    placeholder="Group caption"
                    style={{ width: "60%", fontSize: "1em" }}
                  />
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={() => setEditingGroupCaption(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {caption && `${caption} — `}
                  {!!isAdmin && (
                    <span
                      style={{ cursor: "pointer", fontSize: "0.8em" }}
                      onClick={() => {
                        setEditingGroupCaption(date);
                        setTempCaption(caption);
                      }}
                    >
                      ✏️
                    </span>
                  )}
                </>
              )}
            </h2>

            <h4 style={{ textAlign: "center" }}>
              {date}
              {videoCount > 0 && ` — v${videoCount}`}
              {photoCount > 0 && ` p${photoCount}`}
              {!!isAdmin && (
                <span
                  style={{
                    cursor: "pointer",
                    marginLeft: "10px",
                    fontSize: "0.8em",
                  }}
                  onClick={() => {
                    setEditingGroupTags(date);
                    setTempTags(commonTags);
                    setOriginalTags([...commonTags]);
                  }}
                >
                  ✏️ Group Tags
                </span>
              )}
            </h4>

            {editingGroupTags === date && (
              <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <TagSelect selected={tempTags} onChange={setTempTags} />
                <button onClick={saveEdit}>Save Group Tags</button>
                <button
                  onClick={() => {
                    setEditingGroupTags(null);
                    setTempTags([]);
                    setOriginalTags([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              {items.map((item) => {
                const itemTags = getTagsArray(item.tags);

                return (
                  <div
                    key={item.key}
                    style={{
                      display: "inline-block",
                      verticalAlign: "top",
                      width: "auto",
                      maxWidth: "100%",
                      margin: "0 5px 10px 5px",
                      cursor: "pointer",
                    }}
                    onClick={() => openFullscreen(item)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        height: "clamp(100px, 40vh, 500px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#000",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {item.isVideo ? (
                        <video
                          src={`${R2_PUBLIC_URL}/${item.key}`}
                          controls={!isAdmin || !isSubscriber}
                          muted={!isAdmin || !isSubscriber}
                          loop
                          style={{
                            maxHeight: "100%",
                            width: "auto",
                            objectFit: "contain",
                            filter: !isLoggedIn
                              ? "blur(10px)"
                              : isAdmin || isSubscriber
                              ? "none"
                              : !isFirstGroup && isLoggedIn
                              ? "blur(7px)"
                              : "blur(3px)",
                          }}
                        />
                      ) : (
                        <img
                          src={`${R2_PUBLIC_URL}/${item.key}`}
                          alt={caption}
                          style={{
                            maxHeight: "100%",
                            width: "auto",
                            objectFit: "contain",
                            filter: !isLoggedIn
                              ? "blur(10px)"
                              : isAdmin || isSubscriber
                              ? "none"
                              : !isFirstGroup && isLoggedIn
                              ? "blur(7px)"
                              : "blur(3px)",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                      {editingItem === item.key ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TagSelect
                            selected={tempTags}
                            onChange={setTempTags}
                          />
                          <button onClick={saveEdit}>Save</button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setTempTags([]);
                              setOriginalTags([]);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p
                          style={{
                            fontSize: "0.9em",
                            color: "#ccc",
                          }}
                        >
                          Tags:{" "}
                          {itemTags.length > 0 ? itemTags.join(", ") : "none"}
                          {!!isAdmin && (
                            <span
                              style={{ cursor: "pointer", marginLeft: "5px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(item.key);
                                setTempTags(itemTags);
                                setOriginalTags([...itemTags]);
                              }}
                            >
                              ✏️
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={loadMedia}
          disabled={loading}
          style={{
            display: "block",
            margin: "40px auto",
            padding: "12px 24px",
            fontSize: "1.1em",
          }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default Gallery;
