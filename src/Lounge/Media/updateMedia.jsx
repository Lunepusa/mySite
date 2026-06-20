import React, { useMemo } from 'react';
import { apiFetch } from "src/Profile/Auth.jsx";
import { TagSelect } from "src/Lounge/Tag/tags.jsx";
import { getTagsArray } from "src/Lounge/Tag/getTagsArray.jsx"; 

// --- 1. Logic ---
const calculateMultiCommonTags = (selectedItems, media) => {
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

// --- 2. UI Component ---
export const updateMedia = ({ media, setMedia, multiSelectMode, setMultiSelectMode, selectedItems, setSelectedItems }) => {
    
    const multiCommonTags = useMemo(() => calculateMultiCommonTags(selectedItems, media), [selectedItems.size, media]);

    return (
        <div style={{ position: "sticky", top: "2%", background: "#333", padding: "1px", borderRadius: "1px", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", color: "#fff" }}>
            <label style={{ display: "block" }}>
                <input
                    type="checkbox"
                    checked={multiSelectMode}
                    onChange={e => {
                        setMultiSelectMode(e.target.checked);
                        if (!e.target.checked) setSelectedItems(new Set());
                    }}
                    style={{ width: "fitContent" }}
                />
                Multi-select ({selectedItems.size} selected)
            </label>

            {multiSelectMode && selectedItems.size > 0 && (
                <div style={{ marginTop: "2px" }}>
                    <TagSelect
                        initialTags={multiCommonTags.join(",")}
                        onSave={(tagsString, dateValue) => {
                            const newTags = getTagsArray(tagsString);
                            const added = newTags.filter(t => !multiCommonTags.includes(t));
                            const removed = multiCommonTags.filter(t => !newTags.includes(t));

                            if (added.length > 0 || removed.length > 0 || dateValue?.length === 8) {
                                const keys = Array.from(selectedItems);
                                const body = { keys };

                                if (added.length > 0) body.addedTags = added;
                                if (removed.length > 0) body.removedTags = removed;
                                if (dateValue?.length === 8) body.newDate = dateValue;

                                apiFetch("/bulk-update", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(body)
                                }).then(res => {
                                    if (res.ok) {
                                        setMedia(prev => prev.map(item => {
                                            if (keys.includes(item.key)) {
                                                let current = getTagsArray(item.tags);
                                                current = current.filter(t => !removed.includes(t));
                                                current = [...new Set([...current, ...added])];
                                                return {
                                                    ...item,
                                                    tags: current.join(", "),
                                                    created_date: dateValue?.length === 8 ? dateValue : item.created_date
                                                };
                                            }
                                            return item;
                                        }));
                                        setSelectedItems(new Set());
                                    }
                                });
                            }
                        }}
                        placeholder="Edit tags (common shown)..."
                    />
                </div>
            )}
        </div>
    );
};