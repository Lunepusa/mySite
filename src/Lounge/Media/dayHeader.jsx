
import React, { useState } from 'react';
import { useAuth, apiFetch } from "./Auth";

export const dayHeader = ({ date, items, caption, media, setMedia }) => {
    const { isAdmin } = useAuth(); // Called locally!
    
    const [isEditing, setIsEditing] = useState(false);
    const [tempCaption, setTempCaption] = useState(caption || "");

    const videoCount = items.filter(i => i.isVideo).length;
    const photoCount = items.length - videoCount;

    const handleDateShareCopy = async (e) => {
        if (!isAdmin) return;
        e.preventDefault();
        try {
            const res = await apiFetch("/generate-share-token", {
                method: "POST",
                body: JSON.stringify({ target_type: "date", target_value: date })
            });
            const data = await res.json();
            if (data.success) {
                navigator.clipboard.writeText(data.link);
                console.log("Date share link copied:", data.link);
            }
        } catch (err) {
            console.error("Date share copy error:", err);
        }
    };

    const saveEdit = async () => {
        const cleanGroupKey = date.toString().replace(".0", "");
        const keysToUpdate = media
            .filter(item => item.date.toString().replace(".0", "") === cleanGroupKey)
            .map(item => item.key);

        if (keysToUpdate.length === 0) {
            setIsEditing(false);
            return;
        }

        try {
            const res = await apiFetch("/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keys: keysToUpdate, newCaption: tempCaption })
            });

            if (!res.ok) throw new Error(`Save failed`);

            setMedia(prev => prev.map(item => 
                keysToUpdate.includes(item.key) ? { ...item, caption: tempCaption } : item
            ));

            setIsEditing(false);
        } catch (err) {
            console.error("Save error:", err);
            alert("Save failed — changes not applied.");
        }
    };

    return (
        <>
            <h3 className="h4" style={{ textAlign: "center", maxWidth: "500px" }} onContextMenu={handleDateShareCopy}>
                {isEditing ? (
                    <div>
                        <input
                            value={tempCaption}
                            onChange={e => setTempCaption(e.target.value)}
                            placeholder="Group caption"
                            style={{ width: "60%", fontSize: "1em" }}
                        />
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => { setIsEditing(false); setTempCaption(caption); }}>Cancel</button>
                    </div>
                ) : (
                    <>
                        {caption && `${caption} — `}
                        {!!isAdmin && (
                            <span style={{ cursor: "pointer", fontSize: "0.8em" }} onClick={() => setIsEditing(true)}>
                                ✏️
                            </span>
                        )}
                    </>
                )}
            </h3>

            <h4 style={{ textAlign: "center", fontSize: ".8em", verticalAlign: "baseline" }}>
                {date}
                {videoCount > 0 && ` — v${videoCount}`}
                {photoCount > 0 && ` p${photoCount}`}
            </h4>
        </>
    );
};