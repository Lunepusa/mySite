
import React, { useState, useEffect } from 'react';
import { apiFetch } from "src/Profile/Auth.jsx";
import { searchTags } from "./Tags.jsx";

// --- 1. Logic (Sits outside component) ---
const normalizeSearchInput = input => {
    if (!input.trim()) return "";
    let cleanInput = input.replace(/&/g, "+");
    const orGroups = cleanInput.trim().split(/\s+/);

    return orGroups.map(group => {
        let isExclude = false;
        if (group.startsWith("-")) {
            isExclude = true;
            group = group.slice(1);
        }
        const andTerms = group.split("+");
        const normalizedAnd = andTerms.map(term => {
            const clean = term.trim();
            const matches = searchTags(clean);
            return matches[0] || clean; 
        });
        const normalizedGroup = normalizedAnd.join("+");
        return isExclude ? `-${normalizedGroup}` : normalizedGroup;
    }).join("~");
};

// --- 2. UI Component ---
export const galleryHeader = ({
    searchInput,
    setSearchInput,
    activeSearchQuery,
    displayedQuery,
    triggerSearch, // Now takes the normalized query as an argument from this file
    handleClearSearch
}) => {
    const [stats, setStats] = useState({ photos: 0, videos: 0 });

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

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            const cleanQuery = normalizeSearchInput(searchInput);
            triggerSearch(cleanQuery);
        }
    };

    return (
        <div style={{ padding: "5px", textAlign: "center", background: "#111", width: "100%", maxWidth: "600px" }}>
            <h1 style={{ marginBottom: "1px" }}>Gallery</h1>
            <h2 style={{ color: "#aaa" }}>
                Total: {stats.photos} photos • {stats.videos} videos
            </h2>

            <div style={{ margin: "5px 0", width: "95%" }}>
                <input
                    type="text"
                    placeholder="Search, Ex. space=OR, +=AND, -exclude)"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ padding: "8px", width: "80%", maxWidth: "100%", fontSize: "1em", borderRadius: "8px", border: "1px solid #ccc" }}
                />
                <button onClick={() => triggerSearch(normalizeSearchInput(searchInput))} style={{ marginLeft: "2px", padding: "1px 3px" }}>
                    Search
                </button>
                {activeSearchQuery && (
                    <>
                        <button onClick={handleClearSearch} style={{ marginLeft: "2px", padding: "1px 3px" }}>
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
    );
};
