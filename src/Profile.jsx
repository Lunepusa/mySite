import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import Collapse from "./Utility";
import { TagSelect, searchTags, getTagsArray, ClickableTags } from "./Tags";


export const PaymentChecker = () => {
  const [savedPairs, setSavedPairs] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // For new pair entry
  const [selectedPair, setSelectedPair] = useState(""); // "" = new, otherwise saved pair key
  const [newPlatform, setNewPlatform] = useState("");
  const [newUsername, setNewUsername] = useState("");

  // Platform info display
  const [selectedPlatformInfo, setSelectedPlatformInfo] = useState(null);

  // Load saved pairs and platforms
  useEffect(() => {
    const loadData = async () => {
      try {
        // Saved pairs
        const pairsRes = await apiFetch("/saved-payment-pairs");
        const pairsData = await pairsRes.json();
        setSavedPairs(pairsData.pairs || []);

        // Platforms (full data)
        const platRes = await apiFetch("/platforms");
        const platData = await platRes.json();
        setPlatforms(platData.platforms || []);
      } catch (err) {
        console.error("Failed to load payment data:", err);
      }
    };
    loadData();
  }, []);

  // When selecting a saved pair or switching to new
  const handlePairChange = (e) => {
    const value = e.target.value;
    setSelectedPair(value);

    if (value === "" || value === "new") {
      setNewPlatform("");
      setNewUsername("");
      setSelectedPlatformInfo(null);
    } else {
      const selected = savedPairs.find(p => `${p.platform}-${p.username}` === value);
      if (selected) {
        setNewPlatform(selected.platform);
        setNewUsername(selected.username);
        const platInfo = platforms.find(p => p.platform === selected.platform);
        setSelectedPlatformInfo(platInfo || null);
      }
    }
  };

  // When changing platform in new entry
  const handlePlatformChange = (e) => {
    const value = e.target.value;
    setNewPlatform(value);
    const selected = platforms.find(p => p.platform === value);
    setSelectedPlatformInfo(selected || null);
  };

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);

    let payload;
    if (selectedPair === "" || selectedPair === "new") {
      if (!newPlatform || !newUsername) {
        setResult({ success: false, message: "Please select platform and enter username" });
        setLoading(false);
        return;
      }
      payload = { platform: newPlatform, username: newUsername };
    } else {
      const selected = savedPairs.find(p => `${p.platform}-${p.username}` === selectedPair);
      if (!selected) {
        setResult({ success: false, message: "Selected pair not found" });
        setLoading(false);
        return;
      }
      payload = selected;
    }

    try {
      const res = await apiFetch("/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, message: "Error checking payment" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{margin: "0 auto" }}>
      <h3>Check Recent Payment</h3>
      <p style={{ fontSize: "0.9em", color: "#aaa", marginBottom: "5px" }}>
        Searches emails from the last 7 days only. For older payments or issues, contact LunePusa directly with your receipt.
      </p>

      <div style={{ marginBottom: "5px" }}>
        <label>Select saved pair or enter new:</label>
        <select
          value={selectedPair}
          onChange={handlePairChange}
          style={{ width: "100%", padding: "2px", marginBottom: "5px" }}
        >
          <option value="">-- Select a saved pair --</option>
          <option value="new">Enter new pair</option>
          {savedPairs.map((p, i) => (
            <option key={i} value={`${p.platform}-${p.username}`}>
              {p.platform} - {p.username}
            </option>
          ))}
        </select>

        {(selectedPair === "" || selectedPair === "new") && (
          <>
            <label>Platform</label>
            <select
              value={newPlatform}
              onChange={handlePlatformChange}
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            >
              <option value="">Select platform...</option>
              {platforms.map(p => (
                <option key={p.platform} value={p.platform}>
                  {p.platform}
                </option>
              ))}
            </select>

            <label>Username used in payment</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="yourusername"
              style={{ width: "100%", padding: "2px", marginBottom: "5px" }}
            />
          </>
        )}

        {/* Platform info display */}
        {selectedPlatformInfo && (
          <div style={{
            marginTop: "3px",
            padding: "3px",
            background: "#1a1a1a",
            borderRadius: "2px",
            border: "1px solid #444"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "2px" }}>
              {selectedPlatformInfo.icon && (
                <img
                  src={selectedPlatformInfo.icon}
                  alt={`${selectedPlatformInfo.platform} icon`}
                  style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain" }}
                />
              )}
              <h4 style={{ margin: 0 }}>{selectedPlatformInfo.platform}</h4>
            </div>

            {selectedPlatformInfo.description && (
              <p style={{ margin: "8px 0", color: "#ccc" }}>
                {selectedPlatformInfo.description}
              </p>
            )}

            {selectedPlatformInfo.category && (
              <p style={{ margin: "8px 0", fontSize: "0.9em" }}>
                <strong>Category:</strong> {selectedPlatformInfo.category}
              </p>
            )}

            {selectedPlatformInfo.link_to_page && (
              <p style={{ margin: "8px 0" }}>
                <a
                  href={selectedPlatformInfo.link_to_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  Visit website →
                </a>
              </p>
            )}

            {selectedPlatformInfo.is_favorite && (
              <p style={{ margin: "8px 0", color: "#ffcc00" }}>
                ★ Favorite Platform
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleCheck}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: loading ? "#666" : "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Checking..." : "Check Payment"}
      </button>

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", background: result.success ? "#1a3a1a" : "#3a1a1a", borderRadius: "4px" }}>
          <p style={{ color: result.success ? "lightgreen" : "orange" }}>
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
};



const Profile = () => {
   const { isSubscriber, isLoggedIn, isAdmin, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingFavorites, setEditingFavorites] = useState(false);
  const [editingMuted, setEditingMuted] = useState(false);

// Process purchased_dates into a sorted array (newest first)
const unlockedDates = user?.purchased_dates
  ? user.purchased_dates
      .split(',')
      .map(d => d.trim())
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a)) // newest first
  : [];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      const res = await apiFetch("/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return <p style={{ textAlign: "center", padding: "60px" }}>Loading...</p>;
  }

  const subscriptionText = user.is_admin
    ? "Admin"
    : user.is_subscriber
    ? "Subscriber"
    : "Free User";

  const expiration = user.subscription_expires
    ? new Date(user.subscription_expires * 1000).toLocaleDateString()
    : "Never";

      const [tagPrefs, setTagPrefs] = useState({
    favorite_tags: "",
    muted_tags: "",
  });

  useEffect(() => {
    if (user) {
      setTagPrefs({
        favorite_tags: user.favorite_tags || "",
        muted_tags: user.muted_tags || "",
      });
    }
  }, [user]);

  const updateTagPrefs = async (updates) => {
    try {
      const res = await apiFetch("/tag-prefs", {
        method: "POST",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");

      // Optimistic update
      setTagPrefs(prev => ({ ...prev, ...updates }));
      // Also update main user if needed
      loadUser?.(); // if you have it
    } catch (err) {
      setError("Failed to save tag preferences");
    }
  };

  useEffect(() => {
    if (user?.username === "lunepusa") {
      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const res = await apiFetch("/admin-users");
          if (!res.ok) throw new Error("Failed");
          const data = await res.json();
          setAllUsers(data.users);
        } catch (err) {
          setError("Failed to load users");
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    }
  }, [user]);

    const updateUser = async (userId, updates) => {
    try {
      const res = await apiFetch("/admin-update-user", {
        method: "POST",
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) throw new Error("Update failed");

      // Optimistic update
      setAllUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      ));
    } catch (err) {
      setError("Failed to update user");
    }
  };

  // Inline clickable dates (same style as ClickableTags)
const ClickableDates = ({ dates }) => {
  if (!dates || dates.length === 0) return <span style={{ color: "#ccc" }}>None yet</span>;

  return (
    <div style={{ margin: "0.5% 0" }}>
      {dates.map((date, i) => (
        <React.Fragment key={date}>
          <a
            href={`/lounge#${encodeURIComponent(date)}`}
            style={{
              color: "#0066cc",
              textDecoration: "none",
              marginRight: "0.5%",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/lounge#${encodeURIComponent(date)}`;
            }}
          >
            {date}
          </a>
          {i < dates.length - 1 && <span style={{ color: "#666" }}>, </span>}
        </React.Fragment>
      ))}
    </div>
  );
};


    return (
    <div style={{ padding: "2%", MinWidth: "200px", width: "100VW", margin: "0 auto", display: "inline-block", }}>
      <h1 style={{ textAlign: "center" }}>Profile</h1>

      {user ? (
        <>
          <div style={{ marginBottom: "1%", padding: "2%", background: "#222", borderRadius: "1px" }}>
            <h2>User Information</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Subscription:</strong> {subscriptionText}</p>
            <p><strong>Expires:</strong> {expiration}</p>
            <login />
          </div><Collapse trigger={<h2>Reload Wallet</h2>}>
<PaymentChecker />
</Collapse>
          <div style={{ padding: "2%", MinWidth: "200px", width: "40VW", margin: "0 auto", display: "inline-block" }}>
            <Collapse trigger={<h2>Change Password</h2>}>
              {message && <p style={{ color: "lightgreen" }}>{message}</p>}
              {error && <p style={{ color: "red" }}>{error}</p>}

              <form onSubmit={handlePasswordChange}>
          <div style={{ }}>
            <label style={{ display: "block",}}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "2px", borderRadius: "1px" }}
            />
          </div>

          <div style={{}}>
            <label style={{ display: "block" }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "2px", borderRadius: "1px" }}
            />
          </div>

          <div style={{}}>
            <label style={{ display: "block" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "2px", borderRadius: "1px" }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "2px 4px",
              background: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "1px",
              cursor: "pointer",
            }}
          >
            Change Password
          </button>
        </form>
            </Collapse>
          </div>
      {/* Favorite & Muted Tags */}
      <div style={{ marginTop: "1%" }}>
        <Collapse trigger={<h2>Favorite & Muted Tags</h2>}>
        <h4>Tags here are NOT all present in any of my content. in fact quite a few are not and likely will never be. But I wanted everything listed just in case. I am pretty kinky so who knows. add anything you dont want to see to the muted tag. Favorite tags are currently just a way for you to easily search your favorite tags. and maybe help tell me what people want to see</h4>
          {/* Favorite Tags */}
          <div style={{ marginBottom: "1%" }}>
            <h3 style={{ margin: "0.5% 0" }}>Favorite Tags</h3>
            {editingFavorites ? (
              <>
                <TagSelect
                  initialTags={user.favorite_tags || ""}
                  onSave={(tagsString) => {
                    updateTagPrefs({ favorite_tags: tagsString });
                    setEditingFavorites(false);
                  }}
                  placeholder="Add favorite tag..."
                />
                <button
                  onClick={() => setEditingFavorites(false)}
                  style={{
                    marginTop: "0.5%",
                    padding: "0.5% 1%",
                    background: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "2px",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
             <div style={{ margin: "0.5% 0" }}>
                <ClickableTags tags={user.favorite_tags} emptyText="None set" />
                <span
                  style={{
                    marginLeft: "1%",
                    cursor: "pointer",
                    color: "#0066cc",
                    fontSize: "0.9em",
                  }}
                  onClick={() => setEditingFavorites(true)}
                >
                  ✏️ Edit
                </span>
              </div>
            )}
          </div>

          {/* Muted Tags */}
          <div>
            <h3 style={{ margin: "0.5% 0" }}>Muted Tags</h3>
            {editingMuted ? (
              <>
                <TagSelect
                  initialTags={user.muted_tags || ""}
                  onSave={(tagsString) => {
                    updateTagPrefs({ muted_tags: tagsString });
                    setEditingMuted(false);
                  }}
                  placeholder="Add muted tag..."
                />
                <button
                  onClick={() => setEditingMuted(false)}
                  style={{
                    marginTop: "0.5%",
                    padding: "0.5% 1%",
                    background: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "2px",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <div style={{ margin: "0.5% 0" }}>
                <ClickableTags tags={user.muted_tags} emptyText="None set" />
                <span
                  style={{
                    marginLeft: "1%",
                    cursor: "pointer",
                    color: "#0066cc",
                    fontSize: "0.9em",
                  }}
                  onClick={() => setEditingMuted(true)}
                >
                  ✏️ Edit
                </span>
              </div>
            )}
      </div>
        </Collapse>
      </div>

     <div style={{ marginTop: "20px" }}>
  <Collapse trigger={<h2>Permanently Unlocked Dates</h2>}>
    <p style={{ margin: "0.5% 0", color: "#ccc" }}>
      These dates are permanently unlocked and always visible to you in the gallery.
    </p>
    <ClickableDates dates={unlockedDates} />
  </Collapse>
</div>

            {user?.username === "lunepusa" && (
        <div style={{ marginTop: "1%" }}>
          <Collapse trigger={<h2>User Management (Admin Only)</h2>}>
            {usersLoading ? (
              <p>Loading users...</p>
            ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #444" }}>
                    <th style={{ textAlign: "left", padding: "0.5% 0" }}>Username</th>
                    <th style={{ textAlign: "center", padding: "0.5% 0" }}>Admin</th>
                    <th style={{ textAlign: "left", padding: "0.5% 0" }}>Subscription Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => {
                    const isActive = u.subscription_expires > Math.floor(Date.now() / 1000);
                    const expiryDate = u.subscription_expires > 0
                      ? new Date(u.subscription_expires * 1000).toISOString().slice(0, 10)
                      : "";

                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #333" }}>
                        <td style={{ padding: "0.5% 0" }}>
                          <strong>{u.username}</strong> (ID: {u.id})
                        </td>
                        <td style={{ textAlign: "center", padding: "0.5% 0" }}>
                          <input
                            type="checkbox"
                            checked={!!u.is_admin}
                            onChange={(e) => updateUser(u.id, { is_admin: e.target.checked })}
                          />
                        </td>
                        <td style={{ padding: "0.5% 0" }}>
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => {
                              const date = e.target.value;
                              const timestamp = date ? Math.floor(new Date(date + "T00:00:00").getTime() / 1000) : 0;
                              updateUser(u.id, { subscription_expires: timestamp });
                            }}
                            style={{
                              width: "100%",
                              padding: "0.5%",
                              border: "1px solid #555",
                              background: "#111",
                              color: isActive ? "lightgreen" : "#ccc",
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Collapse>
        </div>
      )}
        </>
      ) : (
        <div style={{ fontSize: "1.3em", textAlign: "center" }}>
          You are not logged in. To save favorite or muted tags, or to view all permanantly umlocked media you may have, please log in.
          <Login />
        </div>
      )}
    </div>
  );}
export default Profile;

