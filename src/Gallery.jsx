import React, { useState, useEffect, useMemo } from "react";
import { useAuth, apiFetch, R2_PUBLIC_URL } from "./Auth";
import { TagSelect, searchTags, ClickableTags } from "./Tags";

const Gallery = () => {
  const { isSubscriber, isLoggedIn, isAdmin, user, unlockedDates } = useAuth();
  const hasAccessForDate = (dateString) => {
  return isAdmin || isSubscriber || (unlockedDates && unlockedDates.includes(dateString));
};

  // Main list of loaded media items (photos + videos)
  const [media, setMedia] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fullscreenItem, setFullscreenItem] = useState(null);

  // Total counts displayed in header
  const [stats, setStats] = useState({ photos: 0, videos: 0 });

  // Editing states for group caption/tags or single item tags
  const [editingGroupCaption, setEditingGroupCaption] = useState(null);
  const [editingGroupTags, setEditingGroupTags] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [tempCaption, setTempCaption] = useState("");
  const [tempTags, setTempTags] = useState([]);
  const [originalTags, setOriginalTags] = useState([]);

  // Search input and active normalized query
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [displayedQuery, setDisplayedQuery] = useState("");

  // Multi-select mode (admin only)
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const ITEMS_PER_BATCH = 50;

  // -------------------------------------------------------------------------
  // Effect: Sync URL hash ↔ search query + reset results on hash change
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const rawQuery = hash ? decodeURIComponent(hash) : "";

      // Always mirror hash in the input field
      setSearchInput(rawQuery);

      const normalized = normalizeSearchInput(rawQuery);
      setActiveSearchQuery(normalized);
      setDisplayedQuery(normalized || "(no terms)");

      // Reset pagination and media when query changes via hash
      setMedia([]);
      setOffset(0);
      setHasMore(true);

      loadMoreGroups(0, normalized, true);
    };

    // Run once on mount (handles initial hash or empty)
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // -------------------------------------------------------------------------
  // Effect: Initial load of first batch (runs once after mount)
  // -------------------------------------------------------------------------
  useEffect(() => {
    loadMoreGroups();
  }, []);

  // -------------------------------------------------------------------------
  // Effect: Fetch total photo/video counts for header
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/gallery-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchStats();
  }, []);

useEffect(() => {
  const handleTouch = (e) => {
    const target = e.target;

    // Only act on images and videos that are currently blurred
    const isBlurred = 
      target.style.filter && 
      (target.style.filter.includes("blur") || 
       getComputedStyle(target).filter.includes("blur"));

    if ((target.tagName === "IMG" || target.tagName === "VIDEO") && isBlurred) {
      // Only preventDefault on long-press gestures, not on normal taps
      if (e.touches && e.touches.length > 1) {
        e.preventDefault(); // multi-touch
      }
    }
  };

  // We still prevent the context menu
  const preventContextMenu = (e) => {
    if (e.target.tagName === "IMG" || e.target.tagName === "VIDEO") {
      e.preventDefault();
    }
  };

  document.addEventListener("touchstart", handleTouch, { passive: false });
  document.addEventListener("touchmove", handleTouch, { passive: false });
  document.addEventListener("contextmenu", preventContextMenu, { passive: false });

  return () => {
    document.removeEventListener("touchstart", handleTouch);
    document.removeEventListener("touchmove", handleTouch);
    document.removeEventListener("contextmenu", preventContextMenu);
  };
}, []);
  
  // -------------------------------------------------------------------------
  // Utility: Convert tag string or array into clean array
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Utility: Normalize search input into internal format
  //   space = OR (~), + = AND, - = exclude
  //   also replaces & with + and prefers known tags from searchTags
  // -------------------------------------------------------------------------
  const normalizeSearchInput = (input) => {
    if (!input.trim()) return "";

    input = input.replace(/&/g, '+');

    const orGroups = input.trim().split(/\s+/);

    const normalizedOrGroups = orGroups.map((group) => {
      let isExclude = false;
      if (group.startsWith('-')) {
        isExclude = true;
        group = group.slice(1);
      }

      const andTerms = group.split('+');
      const normalizedAnd = andTerms.map(term => {
        const clean = term.trim();
        const matches = searchTags(clean);
        return matches[0] || clean; // prefer canonical if match exists
      });

      const normalizedGroup = normalizedAnd.join('+');
      return isExclude ? `-${normalizedGroup}` : normalizedGroup;
    });

    return normalizedOrGroups.join('~');
  };

  // -------------------------------------------------------------------------
  // Core pagination loader — fetches next batch of media
  // Supports search query and offset-based loading
  // -------------------------------------------------------------------------
  const loadMoreGroups = async (
    currentOffset = offset,
    queryToUse = activeSearchQuery,
    ignoreChecks = false
  ) => {
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

      const res = await apiFetch(`/media?${params.toString()}`);
      const data = await res.json();

      if (data.media.length === 0) {
        setHasMore(false);
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

  // -------------------------------------------------------------------------
  // Trigger new search: normalize, reset list, update URL hash
  // -------------------------------------------------------------------------
  const triggerSearch = () => {
    const normalized = normalizeSearchInput(searchInput);
    setActiveSearchQuery(normalized);
    setDisplayedQuery(normalized || "(no terms)");

    setMedia([]);
    setOffset(0);
    setHasMore(true);
    loadMoreGroups(0, normalized, true);

    if (normalized) {
      window.history.pushState(null, "", `#${encodeURIComponent(normalized)}`);
    } else {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  // -------------------------------------------------------------------------
  // Calculate tags common to ALL selected items (for multi-edit)
  // -------------------------------------------------------------------------
  const calculateMultiCommonTags = () => {
    if (selectedItems.size === 0) return [];

    const keys = Array.from(selectedItems);
    const firstItem = media.find(m => m.key === keys[0]);
    if (!firstItem) return [];

    let common = getTagsArray(firstItem.tags);

    for (const key of keys.slice(1)) {
      const item = media.find(m => m.key === key);
      if (!item) continue;
      const itemTags = getTagsArray(item.tags);
      common = common.filter(t => itemTags.includes(t));
    }

    return common;
  };

  const multiCommonTags = useMemo(() => {
    return calculateMultiCommonTags();
  }, [selectedItems.size, media]);

  // -------------------------------------------------------------------------
  // Group media by date + compute common tags per date group
  // -------------------------------------------------------------------------
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
  const firstDate = sortedDates[0];

  if (loading && media.length === 0)
    return <p style={{ textAlign: "center", padding: "6px" }}>Loading gallery...</p>;

  if (media.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "6px" }}>
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
                loadMoreGroups(0, "", true);
                window.history.pushState(null, "", window.location.pathname);
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

  // -------------------------------------------------------------------------
  // Save edited caption or tags (group or single item)
  // Uses optimistic update on success
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Admin: Right-click date header → copy share link for whole date
  // -------------------------------------------------------------------------
  const handleDateShareCopy = (date) => async (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await apiFetch('/generate-share-token', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'date', target_value: date }),
      });
      const data = await res.json();
      if (data.success) {
        navigator.clipboard.writeText(data.link);
        console.log("Date share link copied:", data.link);
      } else {
        console.error("Failed to generate date share link:", data.error);
      }
    } catch (err) {
      console.error("Date share copy error:", err);
    }
  };

  // -------------------------------------------------------------------------
  // Admin: Right-click media thumbnail/fullscreen → copy item share link
  // -------------------------------------------------------------------------
  const handleMediaShareCopy = (item) => async (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await apiFetch('/generate-share-token', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'media', target_value: item.key }),
      });
      const data = await res.json();
      if (data.success) {
        navigator.clipboard.writeText(data.link);
        console.log("Media share link copied:", data.link);
      } else {
        console.error("Failed to generate media share link:", data.error);
      }
    } catch (err) {
      console.error("Media share copy error:", err);
    }
  };

  return (
    <>
      {/* Sticky search + stats header */}
      <div
        style={{
          padding: "5px",
          textAlign: "center",
          background: "#111",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ marginBottom: "1px" }}>Gallery</h1>
        <h2 style={{ color: "#aaa" }}>
          Total: {stats.photos} photos • {stats.videos} videos
        </h2>

        <div style={{ margin: "5px 0" }}>
          <input
            type="text"
            placeholder="Search, Ex. tits+ass, tits -ass, tits ass,   space=OR, +=AND, -exclude)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                triggerSearch();
              }
            }}
            style={{
              padding: "8px",
              width: "80%",
              maxWidth: "100%",
              fontSize: "1em",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={triggerSearch}
            style={{ marginLeft: "2px", padding: "1px 3px" }}
          >
            Search
          </button>
          {activeSearchQuery && (
            <>
              <button
                onClick={() => {
                  setSearchInput("");
                  setActiveSearchQuery("");
                  setDisplayedQuery("");
                  setMedia([]);
                  setOffset(0);
                  setHasMore(true);
                  loadMoreGroups(0, "", true);
                  window.history.pushState(null, "", window.location.pathname);
                }}
                style={{ marginLeft: "2px", padding: "1px 3px" }}
              >
                Clear
              </button>
              <p style={{ fontSize: ".8em", margin: "5px 0" }}>
                Like a particular tag, or want to hide anything with a particular tag? You can add them to your{" "}
                <a href="/Profile#collapse-favoritemutedtags">favorites or mute lists!</a>
              </p>
            </>
          )}
        </div>

        {activeSearchQuery && (
          <p style={{ margin: "5px 0", color: "#aaa", fontStyle: "italic" }}>
            Searching for: <strong>"{displayedQuery}"</strong>
          </p>
        )}
      </div>

      {/* Main content wrapper */}
      <div>
        {/* Admin Multi-Select Toggle */}
        {!!isAdmin && (
          <div
            style={{
              position: "fixed",
              bottom: "5px",
              right: "5px",
              background: "#333",
              padding: "1px",
              borderRadius: "1px",
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
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
                <TagSelect
                  initialTags={multiCommonTags.join(",")}
                  onSave={(tagsString) => {
                    const newTags = getTagsArray(tagsString);
                    const added = newTags.filter(t => !multiCommonTags.includes(t));
                    const removed = multiCommonTags.filter(t => !newTags.includes(t));

                    if (added.length > 0 || removed.length > 0) {
                      const keys = Array.from(selectedItems);
                      const body = { keys };
                      if (added.length > 0) body.addedTags = added;
                      if (removed.length > 0) body.removedTags = removed;

                      apiFetch("/bulk-update", {
                        method: "POST",
                        body: JSON.stringify(body),
                      }).then(res => {
                        if (res.ok) {
                          setMedia(prev => prev.map(item => {
                            if (keys.includes(item.key)) {
                              let current = getTagsArray(item.tags);
                              current = current.filter(t => !removed.includes(t));
                              current = [...new Set([...current, ...added])];
                              return { ...item, tags: current.join(", ") };
                            }
                            return item;
                          }));
                        }
                      });
                    }
                  }}
                  placeholder="Edit tags (common shown)..."
                />
              </div>
            )}
          </div>
        )}

        {/* Gallery content */}
        <div style={{ padding: "2px", maxWidth: "90%", margin: "0 auto" }}>
          {/* Full-screen modal */}
          {fullscreenItem && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100dvw",
                height: "100DVH",
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
                  zIndex:"10",
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
                    zIndex:"10",
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
                style={{ maxWidth: "100%", maxHeight: "100%" }}
                onClick={(e) => e.stopPropagation()}
              >
                {fullscreenItem.isVideo ? (
  <video
    src={
      hasAccessForDate(fullscreenItem?.date)
        ? `${R2_PUBLIC_URL}/${fullscreenItem.key}`
        : (() => {
            // Unauthorized video preview: load the companion thumbnail from R2 through Cloudflare blur
            const baseFolder = fullscreenItem.key.includes('/') ? fullscreenItem.key.substring(0, fullscreenItem.key.lastIndexOf('/') + 1) : '';
            const filename = fullscreenItem.key.split('/').pop();
            const nameWithoutExt = filename.split('.')[0];
            const thumbKey = `${baseFolder}${nameWithoutExt}.jpg`;
            return `${window.location.origin}/cdn-cgi/image/quality=85,format=auto,blur=50/${R2_PUBLIC_URL}/${thumbKey}`;
          })()
    }
    controls={hasAccessForDate(fullscreenItem?.date)}
    autoPlay
    loop
    muted={!hasAccessForDate(fullscreenItem?.date)}
    controlsList="nodownload"
    onContextMenu={(e) => {
      e.preventDefault();
      handleMediaShareCopy(fullscreenItem)(e);
    }}
    style={{
      maxWidth: "100%",
      maxHeight: "100DVH",
      width: "auto",
      height: "auto",
      objectFit: "contain",
      background: "#000",
    }}
  />
) : (
  <img
    src={
      // Images (.png, .jpg) directly preserve their extension, only appending blur transforms if unauthorized
      hasAccessForDate(fullscreenItem?.date)
        ? `${R2_PUBLIC_URL}/${fullscreenItem.key}`
        : `${window.location.origin}/cdn-cgi/image/quality=85,format=auto,blur=50/${R2_PUBLIC_URL}/${fullscreenItem.key}`
    }
    alt=""
    onContextMenu={(e) => {
      e.preventDefault();
      handleMediaShareCopy(fullscreenItem)(e);
    }}
    style={{
      maxWidth: "100%",
      maxHeight: "100DVH",
      width: "auto",
      height: "auto",
      objectFit: "contain",
      background: "#000",
    }}
  />
)}
              </div>

              {media.findIndex((m) => m.key === fullscreenItem.key) <
                media.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    right: "2%",
                    fontSize: "5em",
                    color: "#fff",
                    cursor: "pointer",
                    zIndex:"10",
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

          {/* Date groups */}
          {sortedDates.map((date) => {
            const { items, commonTags } = groups[date];
            const videoCount = items.filter((i) => i.isVideo).length;
            const photoCount = items.length - videoCount;
            const caption = items[0]?.caption || "";

            const isFirstGroup = date === firstDate;

            return (
              <div
                key={date}
                style={{ marginBottom: "5px", border: "2px dashed white" }}
              >
                <h2 style={{ textAlign: "center" }} onContextMenu={handleDateShareCopy(date)}>
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
                </h4>

                <div style={{ textAlign: "center" }}>
                  {items
                    .slice()
                    .sort((a, b) => {
                      const getTime = (key) => {
                        const filename = key.split("/").pop();
                        const timePart = filename.split("_")[1]?.split(".")[0] || "000000000";
                        return timePart;
                      };
                      return getTime(b.key).localeCompare(getTime(a.key));
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
                            maxWidth: "23dvw",
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
                          onContextMenu={(e) =>{ e.preventDefault();}}
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
    {(() => {
      // 1. Determine if current user has access to this date
      const hasAccess = isAdmin || isSubscriber || unlockedDates.includes(date);

let targetKey = item.key;
  if (item.isVideo) {
    const baseFolder = item.key.includes('/') ? item.key.substring(0, item.key.lastIndexOf('/') + 1) : '';
    const filename = item.key.split('/').pop();
    const nameWithoutExt = filename.split('.')[0];
    targetKey = `${baseFolder}${nameWithoutExt}.jpg`;
  }

  // 2. Safely sanitize absolute R2 URL construction
  const cleanR2PublicUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  const cleanTargetKey = targetKey.startsWith('/') ? targetKey.slice(1) : targetKey;
  const absoluteAssetUrl = `${cleanR2PublicUrl}/${cleanTargetKey}`;

  // 3. Apply Cloudflare parameter rules
  const cloudflareUrl = !hasAccess
    ? `lunepusa.com/cdn-cgi/image/width=250,quality=80,format=auto,blur=40/${absoluteAssetUrl}`
    : `lunepusa.com/cdn-cgi/image/width=250,quality=85,format=auto/${absoluteAssetUrl}`;


      return (
        <>
          {/* Every item now renders a flat, fast optimized image in the grid */}
          <img
            src={cloudflareUrl}
            alt={caption}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              maxHeight: "auto",
              width: "100%",
              objectFit: "contain",
            }}
          />

          {/* If it's a video, add an overlay icon to distinguish it */}
          {item.isVideo && (
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
              <span style={{ color: "#fff", fontSize: "1.2em" }}>
                {hasAccess ? "▶" : "🔒"}
              </span>
            </div>
          )}
        </>
      );
    })()}
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
                                  {multiSelectMode ? (
                                    itemTags.length > 0 ? itemTags.join(", ") : "none"
                                  ) : (
                                    <ClickableTags tags={item.tags} />
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
                                    Time: {item.key.split("_")[1]?.split(".")[0] || "Unknown"}
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
                margin: "10px auto",
                padding: "2px 5px",
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
