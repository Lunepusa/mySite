import React, { useState } from "react";
import { useAuth, apiFetch } from "./Auth";
import Collapse from "./Utility";

const Profile = () => {
   const { isSubscriber, isLoggedIn, isAdmin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "2%", maxWidth: "90VW", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Profile</h1>
{!user ? (
        <div style={{ fontSize: "1.3em", textAlign: "center" }}>
          This is a private area. Log in below to enter.
          <Login />
        </div>
      ) : (
      <div style={{ marginBottom: "1%", padding: "2%", background: "#222", borderRadius: "1px" }}>
        <h2>User Information</h2>
        <p><strong>userame:</strong> {user.username}</p>
        <p><strong>Subscription:</strong> {subscriptionText}</p>
        <p><strong>Expires:</strong> {expiration}</p>
      </div>

      <div style={{ padding: "2%", background: "#222", borderRadius: "1px" }}>
       <Collapse trigger={ <h2>Change Password</h2>}>
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
        </form></Collapse>
      </div>)}
    </div>
  );
};

export default Profile;