
import React from 'react';
import { useAuth, R2_PUBLIC_URL } from "src/Profile/Auth.jsx";
import { TagSelect, ClickableTags } from "src/Lounge/Tag/tags.jsx";
import Collapse from "src/Utility/Utility.jsx";
import { getTagsArray } from "src/Lounge/Tag/getTagsArray.jsx";

export const mediaItem = ({ 
    item, multiSelectMode, selectedItems, setSelectedItems, openFullscreen, 
    editingItem, saveEdit, setEditingItem, tempTags, setTempTags 
}) => {
    // Context is called locally!
    const { isAdmin, hasAccessForDate } = useAuth(); 
    
    const itemTags = getTagsArray(item.tags);
    const hasAccess = hasAccessForDate(item.date || "Unknown");

    const thumbnail = item.isVideo 
        ? `${R2_PUBLIC_URL}/cdn-cgi/image/width=250,quality=80,format=auto/${item.key.replace(/\.[^/.]+$/, "")}_thumb.jpg`
        : `${R2_PUBLIC_URL}/cdn-cgi/image/width=250,quality=80,format=auto/${item.key}`;
    
    const cloudflareUrl = !hasAccess 
        ? thumbnail.replace("format=auto/", "format=auto,blur=20/") 
        : thumbnail;

    return (
        <div 
            onContextMenu={(e) => e.preventDefault()}
            style={{
                display: "inline-block", verticalAlign: "top", margin: "0 3px 5px 3px", 
                cursor: "pointer", position: "relative",
                border: multiSelectMode && selectedItems.has(item.key) ? "3px solid yellow" : "none"
            }}
        >
            <div
                style={{
                    display: "inline-block", textAlign: "center", minHeight: "100px",
                    height: "150px", maxHeight: "20dvh", width: "fit-content",
                    background: "#000", borderRadius: "12px", overflow: "hidden",
                    position: "relative", border: "1px white solid"
                }}
                onClick={() => {
                    if (multiSelectMode) {
                        setSelectedItems(prev => {
                            const next = new Set(prev);
                            next.has(item.key) ? next.delete(item.key) : next.add(item.key);
                            return next;
                        });
                    } else {
                        openFullscreen(item);
                    }
                }}
            >
                <img src={cloudflareUrl} alt={item.caption} style={{ height: "100%", width: "auto", objectFit: "contain" }} />
                {item.isVideo && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.5)", borderRadius: "50%", height: "30%", width: "auto", aspectRatio: "1/1" }}>
                        <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#fff" }}>
                            {hasAccess ? "▶" : "🔒"}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                {editingItem === item.key ? (
                    <>
                        <TagSelect selected={tempTags} onChange={setTempTags} />
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => setEditingItem(null)}>Cancel</button>
                    </>
                ) : (
                    <div style={{ color: "#ccc" }}>
                        {multiSelectMode ? (
                            <p style={{ margin: "2px 0", fontSize: "0.9em" }}>Tags:<br /> {itemTags.length > 0 ? itemTags.join(", ") : "none"}</p>
                        ) : (
                            <Collapse trigger={<p style={{ margin: "2px 0", cursor: "pointer" }}> Tags⏬</p>}>
                                <ClickableTags tags={item.tags} className="small" />
                            </Collapse>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
