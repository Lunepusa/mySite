
import React from 'react';
import { useAuth, apiFetch, R2_PUBLIC_URL } from "./Auth";

export const fullscreen = ({ item, media, closeFullscreen, goPrev, goNext }) => {
    // Context is called locally!
    const { isAdmin, user, hasAccessForDate } = useAuth();
    
    const currentIndex = media.findIndex(m => m.key === item.key);
    const hasAccess = hasAccessForDate(item.date);

    const handleMediaShareCopy = async (e) => {
        if (!isAdmin) return;
        e.preventDefault();
        try {
            const res = await apiFetch("/generate-share-token", {
                method: "POST",
                body: JSON.stringify({ target_type: "media", target_value: item.key })
            });
            const data = await res.json();
            if (data.success) {
                navigator.clipboard.writeText(data.link);
                console.log("Media share link copied:", data.link);
            }
        } catch (err) {
            console.error("Media share copy error:", err);
        }
    };

    return (
        <div
            style={{ position: "fixed", top: 0, left: 0, width: "100dvw", height: "100DVH", background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={closeFullscreen}
        >
            <div style={{ position: "absolute", right: "2%", top: "2%", fontSize: "3em", color: "#fff", cursor: "pointer", zIndex: "10" }} onClick={closeFullscreen}>
                x
            </div>
            
            {currentIndex > 0 && (
                <div style={{ position: "absolute", left: "2%", fontSize: "5em", color: "#fff", cursor: "pointer", zIndex: "10" }} onClick={e => { goPrev(); e.stopPropagation(); }}>
                    ‹-
                </div>
            )}

            <div style={{ maxWidth: "100%", maxHeight: "100%" }} onContextMenu={e => e.preventDefault()}>
                {item.isVideo ? (
                    hasAccess ? (
                        <video
                            onClick={e => e.stopPropagation()}
                            src={`${R2_PUBLIC_URL}/${item.key}`}
                            controls autoPlay loop muted controlsList="nodownload"
                            onContextMenu={e => {
                                e.preventDefault();
                                if (user?.username?.toLowerCase() === "lunepusa") handleMediaShareCopy(e);
                            }}
                            style={{ maxWidth: "100%", maxHeight: "100dvh", width: "auto", height: "auto", objectFit: "contain", background: "#000" }}
                        />
                    ) : (
                        <img
                            onClick={e => e.stopPropagation()}
                            src={`${R2_PUBLIC_URL}/cdn-cgi/image/quality=85,format=auto,blur=50/${item.key.replace(/\.[^/.]+$/, "")}_thumb.jpg`}
                            alt="Preview restricted"
                            style={{ maxWidth: "100%", maxHeight: "100dvh", width: "auto", height: "auto", objectFit: "contain", background: "#000" }}
                        />
                    )
                ) : (
                    <img
                        onClick={e => e.stopPropagation()}
                        src={hasAccess ? `${R2_PUBLIC_URL}/${item.key}` : `${R2_PUBLIC_URL}/cdn-cgi/image/quality=85,format=auto,blur=200/${item.key}`}
                        alt=""
                        onContextMenu={e => {
                            e.preventDefault();
                            if (user?.username?.toLowerCase() === "lunepusa") handleMediaShareCopy(e);
                        }}
                        style={{ maxWidth: "100%", maxHeight: "100dvh", width: "auto", height: "auto", objectFit: "contain", background: "#000" }}
                    />
                )}
            </div>

            {currentIndex < media.length - 1 && (
                <div style={{ position: "absolute", right: "2%", fontSize: "5em", color: "#fff", cursor: "pointer", zIndex: "10" }} onClick={e => { goNext(); e.stopPropagation(); }}>
                    -›
                </div>
            )}
        </div>
    );
};