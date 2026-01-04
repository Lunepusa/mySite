import React, { useState, useEffect } from "react";
import { useAuth, apiFetch } from "./Auth";
import Collapse from "./Utility";
import { TagSelect, searchTags, getTagsArray } from "./Tags";

const Profile = () => {
   const { isSubscriber, isLoggedIn, isAdmin, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
    const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

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

    return (
    <div style={{ padding: "2%", maxWidth: "90vw", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Profile</h1>

      {user ? (
        <>
          <div style={{ marginBottom: "1%", padding: "2%", background: "#222", borderRadius: "1px" }}>
            <h2>User Information</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Subscription:</strong> {subscriptionText}</p>
            <p><strong>Expires:</strong> {expiration}</p>
            <login />
          </div>

          <div style={{ padding: "2%", background: "#222", borderRadius: "1px" }}>
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
          <div style={{ marginBottom: "1%" }}>
            <h3>Favorite Tags</h3>
            <TagSelect
              selected={getTagsArray(user.favorite_tags)}
              onChange={(tags) => {
                const tagsString = tags.join(",");
                updateTagPrefs({ favorite_tags: tagsString });
              }}
            />
          </div>

          <div>
            <h3>Muted Tags</h3>
            <TagSelect
              selected={getTagsArray(user.muted_tags)}
              onChange={(tags) => {
                const tagsString = tags.join(",");
                updateTagPrefs({ muted_tags: tagsString });
              }}
            />
          </div>
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
          This is a private area. Log in below to enter.
          <Login />
        </div>
      )}
    </div>
  );}
export default Profile;