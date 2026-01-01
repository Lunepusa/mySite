import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import { TagSelect, searchTags } from "./Tags";

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

  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");

    // Multi-select mode
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [multiEditTags, setMultiEditTags] = useState([]);
  const [multiEditDate, setMultiEditDate] = useState("");
  const [multiEditTime, setMultiEditTime] = useState("");

  const [editingDateItem, setEditingDateItem] = useState(null);
  const [tempNewDate, setTempNewDate] = useState("");
  const [tempNewTime, setTempNewTime] = useState("");

  const R2_PUBLIC_URL = "https://pub-737d16f465e74a25bb9b4613475ea7ef.r2.dev";
  const ITEMS_PER_BATCH = 100;

  useEffect(() => {
    loadMoreGroups();
  }, []);

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

  // Normalize search using searchTags — top result per term



const normalizeSearchInput = (input) => {
  if (!input.trim()) return "";

  // Allow user to type & or + for AND — convert & to +
  input = input.replace(/&/g, '+');


  // Split on spaces for OR groups
  const orGroups = input.trim().split(/\s+/);
  console.log('OR groups (space split):', orGroups);

  const normalizedOrGroups = orGroups.map((group) => {
    let isExclude = false;
    if (group.startsWith('-')) {
      isExclude = true;
      group = group.slice(1);
    }

    // Split on + for AND within group
    const andTerms = group.split('+');
    const normalizedAnd = andTerms.map(term => {
      const clean = term.trim();
      const matches = searchTags(clean);
      return matches[0] || clean;
    });

    const normalizedGroup = normalizedAnd.join('+');

    return isExclude ? `-${normalizedGroup}` : normalizedGroup;
  });

  // Join OR groups with ~
  const finalQuery = normalizedOrGroups.join('~');
  console.log('Final query sent to backend:', finalQuery);
  return finalQuery;
};

  // Load more media — accept currentOffset and queryToUse
const loadMoreGroups = async (currentOffset = offset, queryToUse = activeSearchQuery, ignoreChecks = false) => {
  
   if (!ignoreChecks) {
    if (loading || !hasMore) return;
  }
  
  setLoading(true);

  try {
    const params = new URLSearchParams({
      offset: currentOffset.toString(),
      limit: ITEMS_PER_BATCH.toString(),
    });

    if (queryToUse.trim()) {
      params.append("q", queryToUse);
    }
    console.log(`/media?${params.toString()}`);

    const res = await apiFetch(`/media?${params.toString()}`);
    const data = await res.json();

    if (data.media.length === 0) {
      setHasMore(false);
      setLoading(false);
      // If we are clearing a search or starting a new one, 
      // we need to make sure the media is empty
      if (currentOffset === 0) setMedia([]); 
      return;
    }

    const newMedia = data.media;
    
    setMedia((prev) => (currentOffset === 0 ? newMedia : [...prev, ...newMedia]));
    setOffset(currentOffset + newMedia.length);

    setHasMore(data.media.length === ITEMS_PER_BATCH);

  } catch (err) {
    console.error("Load error:", err);
  } finally {
    setLoading(false);
  }
};

  // Updated triggerSearch — force offset 0

const triggerSearch = () => {
  const normalized = normalizeSearchInput(searchInput);
  setActiveSearchQuery(normalized);
  setDisplayedQuery(normalized || "(no terms)");
  setMedia([]);
  setOffset(0);
  setHasMore(true);
  loadMoreGroups(0, normalized, true); // Force offset 0 and new query
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
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        {activeSearchQuery ? (
          <>
            <p>No results for: "{displayedQuery}"</p>
            <button
              onClick={() => {
      setSearchInput("");
      setActiveSearchQuery("");
      setDisplayedQuery("");
      setMedia([]);
      setOffset(0);
      setHasMore(true);
      loadMoreGroups(0, "",true); // Force reload with no query
              }}
            >
              Clear search
            </button>
          </>
        ) : (
          "No media yet."
        )}
      </div>
    );

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

      // Optimistic update — NO RELOAD
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

    const saveDateEdit = async () => {
    if (!editingDateItem || !tempNewDate || !tempNewTime) return;

    const body = {
      key: editingDateItem,
      newDate: tempNewDate.replace(/-/g, ""),
      newTime: tempNewTime.replace(/:/g, "") + "000",
    };

    try {
      const res = await apiFetch("/update-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Date update failed: ${res.status} ${errText}`);
      }

      // Optimistic update — update key and date locally, NO RELOAD
      setMedia((prev) =>
        prev.map((item) => {
          if (item.key === editingDateItem) {
            const oldFilename = item.key.split("/").pop();
            const suffix = oldFilename.split("_").slice(2).join("_");
            const newFilename = `${body.newDate}_${body.newTime}_${suffix}`;
            const newKey = `media/${body.newDate}/${newFilename}`;
            return {
              ...item,
              key: newKey,
              date: body.newDate,
            };
          }
          return item;
        })
      );

      setEditingDateItem(null);
      setTempNewDate("");
      setTempNewTime("");
    } catch (err) {
      console.error("Date edit error:", err);
      alert("Failed to update date/time: " + err.message);
    }
  };
  // Multi-select save
  const saveMultiEdit = async () => {
    if (selectedItems.size === 0) return;

    const keys = Array.from(selectedItems);

    const body = { keys };

    if (multiEditTags.length > 0) {
      body.addedTags = multiEditTags;
    }

    if (multiEditDate && multiEditTime) {
      body.newDate = multiEditDate.replace(/-/g, "");
      body.newTime = multiEditTime.replace(/:/g, "") + "000";
    }

    try {
      const res = await apiFetch("/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Bulk update failed");

      // Optimistic update
      setMedia((prev) =>
        prev.map((item) => {
          if (keys.includes(item.key)) {
            let updated = { ...item };

            if (body.addedTags) {
              const current = getTagsArray(item.tags);
              updated.tags = [...new Set([...current, ...body.addedTags])].join(", ");
            }

            if (body.newDate && body.newTime) {
              const suffix = item.key.split("/").pop().split("_").slice(2).join("_");
              updated.key = `media/${body.newDate}/${body.newDate}_${body.newTime}_${suffix}`;
              updated.date = body.newDate;
            }

            return updated;
          }
          return item;
        })
      );

      setSelectedItems(new Set());
      setMultiEditTags([]);
      setMultiEditDate("");
      setMultiEditTime("");
    } catch (err) {
      alert("Bulk update failed: " + err.message);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ` — total video: ${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

return (
  <>
  <h1 style={{ marginBottom: "5px" }}>Gallery</h1>
      <h3 style={{ margin: "5px 0" }}>
        {!isLoggedIn
          ? "Log in to see more previews, Subscribe to see all media"
          : !isSubscriber || !isAdmin
          ? "Subscribe to see all media"
          : ""}
      </h3>
    {/* Sticky search header */}
    <div
      style={{
        padding: "2px",
        textAlign: "center",
        background: "#111",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Admin Multi-Select Toggle */}
      {!!isAdmin && (
        <div
          style={{
            position: "inline-block",
            background: "#333",
            padding: "10px",
            borderRadius: "2px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
            color: "#fff",
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={multiSelectMode}
              onChange={(e) => {
                setMultiSelectMode(e.target.checked);
                if (!e.target.checked) setSelectedItems(new Set());
              }}
            />
            Multi-select ({selectedItems.size} selected)
          </label>

          {multiSelectMode && selectedItems.size > 0 && (
            <div style={{ marginTop: "2px" }}>
              <TagSelect selected={multiEditTags} onChange={setMultiEditTags} />
              <div style={{ marginTop: "1px" }}>
                <input
                  type="date"
                  value={multiEditDate}
                  onChange={(e) => setMultiEditDate(e.target.value)}
                />
                <input
                  type="time"
                  value={multiEditTime}
                  onChange={(e) => setMultiEditTime(e.target.value)}
                  style={{ marginLeft: "1px" }}
                />
              </div>
              <button onClick={saveMultiEdit} style={{ marginTop: "1px", display: "block" }}>
                Apply to Selected
              </button>
            </div>
          )}
        </div>
      )}
      <div style={{ margin: "2px 0" }}>
        <input
          type="text"
          placeholder="Search tags, caption, date, video/photo (space=OR, +=AND, -exclude)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              triggerSearch();
            }
          }}
          style={{
            padding: "8px",
            width: "60%",
            maxWidth: "100%",
            fontSize: "1em",
            borderRadius: "8px",
            border: "1px solid #ccc",
            display: "inline-block",
          }}
        />
        <button
          onClick={triggerSearch}
          style={{ marginLeft: "2px", padding: "1px 3px", display:"inline-block",}}
        >
          Search
        </button>
        {activeSearchQuery && (
          <button
            onClick={() => {
              setSearchInput("");
              setActiveSearchQuery("");
              setDisplayedQuery("");
              setMedia([]);
              setOffset(0);
              setHasMore(true);
              loadMoreGroups(0, "", true);
            }}
            style={{ marginLeft: "2px", padding: "1px 3px" }}
          >
            Clear
          </button>
        )}
      </div>

      {activeSearchQuery && (
        <p style={{ margin: "2px 0", color: "#aaa", fontStyle: "italic" }}>
          Searching for: <strong>"{displayedQuery}"</strong>
        </p>
      )}
    </div>

    {/* Main wrapper for multi-select panel and gallery content */}
    <div>
      

      {/* Gallery content */}
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
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
                    maxWidth: "auto",
                    maxHeight: "90vh",
                    filter: !isSubscriber || !isAdmin ? "blur(10px)" : "none",
                  }}
                />
              ) : (
                <img
                  src={`${R2_PUBLIC_URL}/${fullscreenItem.key}`}
                  alt=""
                  style={{
                    maxWidth: "auto",
                    maxHeight: "90vh",
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

        {/* Groups */}
        {sortedDates.map((date) => {
          const { items, commonTags, totalVideoSeconds = 0 } = groups[date];
          const videoCount = items.filter((i) => i.isVideo).length;
          const photoCount = items.length - videoCount;
          const caption = items[0]?.caption || "";

          const isFirstGroup = date === firstDate;

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
                  verticalAlign: "baseline",
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
                      verticalAlign: "baseline",
                      marginLeft: "2px",
                    }}
                    onClick={() => {
                      setEditingGroupTags(date);
                      setTempTags(commonTags);
                      setOriginalTags([...commonTags]);
                    }}
                  >
                    ~ {commonTags.length > 0 ? commonTags.join(", ") : "none"}✏️
                  </span>
                )}
              </h4>

              {editingGroupTags === date && (
                <div style={{ textAlign: "center", marginBottom: "2px" }}>
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
                {items
                  .slice()
                  .sort((a, b) => {
                    const getTime = (key) => {
                      const filename = key.split("/").pop();
                      const timePart = filename.split("_")[1]?.split(".")[0] || "000000000";
                      return timePart;
                    };
                    return getTime(a.key).localeCompare(getTime(b.key));
                  })
                  .map((item) => {
                    const itemTags = getTagsArray(item.tags);

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
                          border: multiSelectMode && selectedItems.has(item.key) ? "3px solid yellow" : "none",
                        }}
                        onClick={(e) => {
                          if (multiSelectMode) {
                            e.stopPropagation();
                            setSelectedItems((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              return next;
                            });
                          } else {
                            openFullscreen(item);
                          }
                        }}
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
                                onLoadedMetadata={(e) => {
                                  const dur = Math.round(e.target.duration);
                                  if (!isNaN(dur)) {
                                    groups[date].totalVideoSeconds += dur;
                                    setMedia([...media]);
                                  }
                                }}
                                style={{
                                  maxHeight: "auto",
                                  width: "100%",
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
                                maxHeight: "auto",
                                width: "100%",
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
                            <>
                              <p
                                style={{
                                  fontSize: "0.5em",
                                  color: "#ccc",
                                  margin: "2px 0",
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

                              {!!isAdmin && (
                                <p
                                  style={{
                                    fontSize: "0.5em",
                                    color: "#ccc",
                                    margin: "2px 0",
                                  }}
                                >
                                  Date: {item.key.split("/")[2]?.split("_")[0] || "Unknown"}{" "}
                                  Time: {item.key.split("_")[1]?.split(".")[0] || "Unknown"}
                                  {editingDateItem === item.key ? (
                                    <>
                                      <br />
                                      <input
                                        type="date"
                                        value={tempNewDate}
                                        onChange={(e) => setTempNewDate(e.target.value)}
                                        style={{ fontSize: "0.8em" }}
                                      />
                                      <input
                                        type="time"
                                        value={tempNewTime}
                                        onChange={(e) => setTempNewTime(e.target.value)}
                                        style={{ fontSize: "0.8em", marginLeft: "5px" }}
                                      />
                                      <button onClick={saveDateEdit} style={{ fontSize: "0.7em" }}>
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingDateItem(null);
                                          setTempNewDate("");
                                          setTempNewTime("");
                                        }}
                                        style={{ fontSize: "0.7em" }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <span
                                      style={{ cursor: "pointer", marginLeft: "2px" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const filename = item.key.split("/").pop();
                                        const datePart = filename.split("_")[0];
                                        const timePart = filename.split("_")[1]?.split(".")[0];
                                        setEditingDateItem(item.key);
                                        setTempNewDate(
                                          `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6)}`
                                        );
                                        setTempNewTime(
                                          `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`
                                        );
                                      }}
                                    >
                                      📅
                                    </span>
                                  )}
                                </p>
                              )}
                            </>
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
            onClick={() => loadMoreGroups()}
            disabled={loading}
            style={{
              display: "block",
              margin: "5px auto",
              padding: "2px 4px",
              fontSize: "1.1em",
            }}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  </>
);
};

export default Gallery;