import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth, apiFetch } from "src/Profile/Auth.jsx";
import { galleryHeader } from "src/Lounge/Media/dayHeader.jsx";
import { updateMedia } from "src/Lounge/Media/updateMedia.jsx";
import { fullscreen } from "src/Lounge/Media/fullscreen.jsx";
import { dayHeader } from "src/Lounge/Media/DayHeader.jsx";
import { mediaItem } from "src/Lounge/Media/mediaItem.jsx";
import { mediaGroups } from "src/Lounge/Media/mediaGroups.jsx"; 
import { sortDates } from "src/Lounge/Media/sortDates.jsx";

const gallery = () => {
    // Gallery.jsx now only needs isAdmin to decide whether to show the Admin bar!
    const { isAdmin } = useAuth();

    // --- State ---
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [fullscreenItem, setFullscreenItem] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [activeSearchQuery, setActiveSearchQuery] = useState("");
    const [displayedQuery, setDisplayedQuery] = useState("");
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(() => new Set());
    
    // --- Refs ---
    const offsetRef = useRef(0);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const loadMoreButtonRef = useRef(null);

    // --- Derived Data ---
    const groups = useMemo(() => mediaGroups(media), [media]);
    const sortedDates = useMemo(() => sortDates(groups), [groups]);

    // --- Core Logic ---
    const loadMoreGroups = useCallback(async (targetOffset, queryToUse, ignoreChecks = false) => {
        if (!ignoreChecks && (loadingRef.current || !hasMoreRef.current)) return;

        loadingRef.current = true;
        setLoading(true);

        try {
            const params = new URLSearchParams({
                offset: targetOffset.toString(),
                limit: "50"
            });
            if (queryToUse?.trim()) params.append("q", queryToUse);

            const res = await apiFetch(`/media?${params.toString()}`);
            const data = await res.json();

            hasMoreRef.current = data.media.length === 50;
            offsetRef.current = targetOffset + data.media.length;

            setMedia(prev => targetOffset === 0 ? data.media : [...prev, ...data.media]);
            setHasMore(hasMoreRef.current);
        } catch (err) {
            console.error("Load error:", err);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [activeSearchQuery]);

    const handleClearSearch = () => {
        setSearchInput("");
        setActiveSearchQuery("");
        setDisplayedQuery("");
        setMedia([]);
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        loadMoreGroups(0, "", true);
        window.history.pushState(null, "", window.location.pathname);
    };

    const triggerSearch = (normalizedQuery) => {
        setActiveSearchQuery(normalizedQuery);
        setDisplayedQuery(normalizedQuery || "(no terms)");
        setMedia([]);
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        loadMoreGroups(0, normalizedQuery, true);
        
        if (normalizedQuery) {
            window.history.pushState(null, "", `#${encodeURIComponent(normalizedQuery)}`);
        } else {
            window.history.pushState(null, "", window.location.pathname);
        }
    };

    // Fullscreen Navigation
    const openFullscreen = (item) => setFullscreenItem(item);
    const closeFullscreen = () => setFullscreenItem(null);
    const goNext = () => {
        const idx = media.findIndex(m => m.key === fullscreenItem.key);
        if (idx < media.length - 1) setFullscreenItem(media[idx + 1]);
    };
    const goPrev = () => {
        const idx = media.findIndex(m => m.key === fullscreenItem.key);
        if (idx > 0) setFullscreenItem(media[idx - 1]);
    };

    // Initial Load / Hash handling
    useEffect(() => {
        // Safe initial load since loadMoreGroups handles its own limits
        loadMoreGroups(0, "", true);
    }, [loadMoreGroups]);

    return (
        <>
            <galleryHeader 
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                activeSearchQuery={activeSearchQuery}
                displayedQuery={displayedQuery}
                triggerSearch={triggerSearch}
                handleClearSearch={handleClearSearch}
            />

            {!!isAdmin && (
                <updateMedia 
                    media={media}
                    setMedia={setMedia}
                    multiSelectMode={multiSelectMode}
                    setMultiSelectMode={setMultiSelectMode}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                />
            )}

            {fullscreenItem && (
                <fullscreen 
                    item={fullscreenItem}
                    media={media}
                    closeFullscreen={closeFullscreen}
                    goPrev={goPrev}
                    goNext={goNext}
                />
            )}

            <div style={{ padding: "2px", maxWidth: "90%", margin: "0 auto" }}>
                {sortedDates.map(date => {
                    const { items } = groups[date];
                    return (
                        <div key={date} style={{ marginBottom: "5px", border: "1px dashed white", width: "fit-content", maxWidth: "90%" }}>
                            
                            <dayHeader 
                                date={date} 
                                items={items} 
                                caption={items[0]?.caption} 
                                media={media}
                                setMedia={setMedia}
                            />
                            
                            <div style={{ textAlign: "center" }}>
                                {items.sort((a,b) => {
                                    const getT = k => k.split("/").pop().split("_")[1]?.split(".")[0] || "0";
                                    return getT(b.key).localeCompare(getT(a.key));
                                }).map(item => (
                                    <mediaItem 
                                        key={item.key} 
                                        item={item}
                                        multiSelectMode={multiSelectMode}
                                        selectedItems={selectedItems}
                                        setSelectedItems={setSelectedItems}
                                        openFullscreen={openFullscreen}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {hasMore && (
                    <div ref={loadMoreButtonRef} style={{ width: "100%" }}>
                        <button 
                            onClick={() => loadMoreGroups(offsetRef.current, activeSearchQuery)}
                            disabled={loading}
                            style={{ display: "block", margin: "10px auto", padding: "2px 5px", fontSize: "1.1em" }}
                        >
                            {loading ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default gallery;