import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
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

  const [searchQuery, setSearchQuery] = useState("");

  const R2_PUBLIC_URL = "https://pub-737d16f465e74a25bb9b4613475ea7ef.r2.dev";
  const LIMIT = 20;

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    apiFetch(`/media?offset=${offset}&limit=${LIMIT}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.media.length < LIMIT) setHasMore(false);
        setMedia((prev) => [...prev, ...data.media]);
        setOffset((prev) => prev + LIMIT);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

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

  // Group by date
  const groups = {};
  media.forEach((item) => {
    const date = item.date || "Unknown";
    if (!groups[date]) {
      groups[date] = { items: [], commonTags: [], totalVideoSeconds: 0 };
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

    let cleanGroupKey = null;

    if (editingGroupCaption) {
      cleanGroupKey = editingGroupCaption.toString().replace(".0", "");
      body.caption = tempCaption;
      body.groupKey = cleanGroupKey;
    }

    let added = [];
    let removed = [];

    if (editingGroupTags || editingItem) {
      added = tempTags.filter((tag) => !originalTags.includes(tag));
      removed = originalTags.filter((tag) => !tempTags.includes(tag));

      if (editingGroupTags) {
        cleanGroupKey = editingGroupTags.toString().replace(".0", "");
        body.addedTags = added.length ? added : undefined;
        body.removedTags = removed.length ? removed : undefined;
        body.groupKey = cleanGroupKey;
      } else if (editingItem) {
        body.addedTags = added.length ? added : undefined;
        body.removedTags = removed.length ? removed : undefined;
        body.key = editingItem;
      }
    }

    if (Object.keys(body).length === 0) {
      setEditingGroupCaption(null);
      setEditingGroupTags(null);
      setEditingItem(null);
      return;
    }

    try {
      const res = await apiFetch("/update-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Save failed: ${res.status} ${errText}`);
      }

      // Optimistic local update
      setMedia((prev) => {
        return prev.map((item) => {
          let updated = { ...item };

          if (
            cleanGroupKey &&
            item.date.toString().replace(".0", "") === cleanGroupKey
          ) {
            if (body.caption !== undefined) {
              updated.caption = tempCaption;
            }
            if (body.addedTags || body.removedTags) {
              let currentTags = getTagsArray(item.tags);
              const set = new Set(currentTags);
              removed.forEach((t) => set.delete(t));
              added.forEach((t) => set.add(t));
              updated.tags = [...set].join(", ");
            }
          }

          if (editingItem && item.key === editingItem) {
            let currentTags = getTagsArray(item.tags);
            const set = new Set(currentTags);
            removed.forEach((t) => set.delete(t));
            added.forEach((t) => set.add(t));
            updated.tags = [...set].join(", ");
          }

          return updated;
        });
      });

      setEditingGroupCaption(null);
      setEditingGroupTags(null);
      setEditingItem(null);
      setTempCaption("");
      setTempTags([]);
      setOriginalTags([]);
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed — changes not applied: " + err.message);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ` — total video: ${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Advanced search filter
  const filteredDates = sortedDates.filter((date) => {
    if (!searchQuery.trim()) return true;

    const group = groups[date];
    const allItemTags = group.items.flatMap((item) =>
      getTagsArray(item.tags).map((t) => t.toLowerCase())
    );

    const terms = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t);

    let andTags = [];
    let orTags = [];
    let excludeTags = [];

    terms.forEach((term) => {
      if (term.startsWith("-")) {
        excludeTags.push(term.slice(1));
      } else if (term.includes("&")) {
        andTags.push(...term.split("&"));
      } else {
        orTags.push(term);
      }
    });

    // Exclude
    if (excludeTags.some((tag) => allItemTags.some((t) => t.includes(tag)))) {
      return false;
    }

    // AND
    if (andTags.length > 0) {
      const hasAllAnd = andTags.every((tag) =>
        allItemTags.some((t) => t.includes(tag))
      );
      if (!hasAllAnd) return false;
    }

    // OR
    if (orTags.length > 0) {
      return orTags.some((tag) => allItemTags.some((t) => t.includes(tag)));
    }

    return true;
  });

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

      {/* Search bar */}
      <div style={{ textAlign: "center", marginBottom: "2px" }}>
        <input
          type="text"
          placeholder="Search tags (space=OR, &=AND, -exclude)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "3px",
            width: "100%",
            fontSize: ".7em",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ textAlign: "center", padding: "2px" }}
          >
            Clear
          </button>
        )}
      </div>

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
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
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

      {/* Filtered groups */}
      {filteredDates.map((date) => {
        const { items, commonTags, totalVideoSeconds = 0 } = groups[date];
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

            <h4
              style={{
                textAlign: "center",
                fontSize: ".8em",
                verticalAlign: "middle",
              }}
            >
              {date}
              {videoCount > 0 && ` — v${videoCount}`}
              {photoCount > 0 && ` p${photoCount}`}
              {totalVideoSeconds > 0 && formatDuration(totalVideoSeconds)}
              {!!isAdmin && (
                <span
                  style={{
                    cursor: "pointer",
                    fontSize: "0.9em",
                    verticalAlign: "middle",
                    marginLeft: "2px",
                  }}
                  onClick={() => {
                    setEditingGroupTags(date);
                    setTempTags(commonTags);
                    setOriginalTags([...commonTags]);
                  }}
                >
                  {commonTags.length > 0 ? commonTags.join(", ") : "none"}✏️
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
                      position: "relative",
                    }}
                    onClick={() => openFullscreen(item)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <div
                      style={{
                        height: "clamp(50px, 30vh, 500px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#000",
                        borderRadius: "12px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {item.isVideo ? (
                        <>
                          <video
                            src={`${R2_PUBLIC_URL}/${item.key}`}
                            muted
                            loop
                            onLoadedMetadata={(e) => {
                              const dur = Math.round(e.target.duration);
                              if (!isNaN(dur)) {
                                groups[date].totalVideoSeconds += dur;
                                setMedia([...media]);
                              }
                            }}
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
                            <span style={{ color: "#fff", fontSize: "32px" }}>
                              ▶
                            </span>
                          </div>
                        </>
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
                            fontSize: "0.8em",
                            color: "#ccc",
                          }}
                        >
                          Tags:{" "}
                          {itemTags.length > 0 ? itemTags.join(", ") : "none"}
                          {!!isAdmin && (
                            <span
                              style={{ cursor: "pointer" }}
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

      {searchQuery && filteredDates.length === 0 && (
        <p
          style={{
            textAlign: "center",
            marginTop: "40px",
            color: "#aaa",
            fontSize: "1.2em",
          }}
        >
          No results for: "{searchQuery}"
        </p>
      )}

      {!searchQuery && hasMore && (
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
