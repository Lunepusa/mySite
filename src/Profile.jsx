import React, { useState } from "react";
import { useAuth, apiFetch } from "./Auth";
import Collapse from "./Utility";

const Profile = () => {
   const { isSubscriber, isLoggedIn, isAdmin, user } = useAuth();
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
    <div style={{ padding: "2%", maxWidth: "90vw", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Profile</h1>

      {user ? (
        <>
          <div style={{ marginBottom: "1%", padding: "2%", background: "#222", borderRadius: "1px" }}>
            <h2>User Information</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Subscription:</strong> {subscriptionText}</p>
            <p><strong>Expires:</strong> {expiration}</p>
          </div>

          <div style={{ padding: "2%", background: "#222", borderRadius: "1px" }}>
            <Collapse trigger={<h2>Change Password</h2>}>
              {message && <p style={{ color: "lightgreen" }}>{message}</p>}
              {error && <p style={{ color: "red" }}>{error}</p>}

              <form onSubmit={handlePasswordChange}>
                {/* ... form fields unchanged ... */}
              </form>
            </Collapse>
          </div>
        </>
      ) : (
        <div style={{ fontSize: "1.3em", textAlign: "center" }}>
          This is a private area. Log in below to enter.
          <Login />
        </div>
      )}
    </div>
  );
export default Profile;