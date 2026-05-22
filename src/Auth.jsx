import React, { createContext, useContext, useState, useEffect } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Public Cloudflare R2 bucket URL for media assets
// Used across the app for img/video src attributes
// ──────────────────────────────────────────────────────────────────────────────
export const R2_PUBLIC_URL = "https://files.lunepusa.com";

// ──────────────────────────────────────────────────────────────────────────────
// Centralized fetch wrapper with automatic Bearer token + base URL
// All API calls should go through this function
// ──────────────────────────────────────────────────────────────────────────────
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `https://api.lunepusa.workers.dev${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // needed for any cookie-based auth (if used)
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Context + hook to access auth state anywhere in the app
// ──────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ──────────────────────────────────────────────────────────────────────────────
// Combined Login + Signup form component
// Handles both modes + shows current user + logout when authenticated
// ──────────────────────────────────────────────────────────────────────────────
export const Login = () => {
  const { user, loadUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const lowerUsername = username.toLowerCase().trim();

    const res = await apiFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: lowerUsername,
        password,
        mode: isSignup ? "signup" : "login",
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      await loadUser();
    } else {
      setError(data.error || "Failed");
    }
  };

  // Already logged in → show username + logout button
  if (user) {
    return (
      <div>
        Logged in as {user.username}
        <button
          onClick={async () => {
            await apiFetch("/logout", { method: "POST" });
            localStorage.removeItem("token");
            await loadUser();
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  // Login / Signup form
  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignup ? "Sign Up" : "Log In"}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{isSignup ? "Sign Up" : "Log In"}</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Log In" : "No account? Sign Up"}
        </button>
      </p>
    </form>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Root auth provider — manages user state, token, wallet, derived flags
// Wrap your entire app with <AuthProvider> ... </AuthProvider>
// ──────────────────────────────────────────────────────────────────────────────
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState("0.00");

  // Core function: fetch current user data from /me endpoint
  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/me");
      if (res.ok) {
        const data = await res.json();
        const fetchedUser = data.user || null;
        setUser(fetchedUser);

        // Parse wallet balance stored as JSON string in user.wallet
        let balanceCents = 0;
        if (fetchedUser?.wallet && fetchedUser.wallet.trim() !== '[]') {
          try {
            const walletData = JSON.parse(fetchedUser.wallet);
            balanceCents = walletData.balance || 0;
          } catch (e) {
            console.error("Invalid wallet JSON:", e);
          }
        }
        setWalletBalance((balanceCents / 100).toFixed(2));
      } else {
        setUser(null);
        setWalletBalance("0.00");
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      setUser(null);
      setWalletBalance("0.00");
    } finally {
      setLoading(false);
    }
  };

  // Load user once on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Alias so components can call refreshUser() after purchases/spends
  const refreshUser = loadUser;

  // Derived boolean states
  const isLoggedIn = !!user;
  const isAdmin = user?.is_admin || false;

  // Active subscription check (or admin override)
  const isSubscriber =
    user?.subscription_expires > Math.floor(Date.now() / 1000) || isAdmin;

  // Sorted list of purchased/unlocked dates (newest first)
  const unlockedDates = user?.purchased_dates
    ? user.purchased_dates
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)) // newest → oldest
    : [];

  const value = {
    user,
    loading,
    loadUser: refreshUser,
    isLoggedIn,
    isAdmin,
    unlockedDates,
    isSubscriber,
    walletBalance,           // formatted string "XX.XX"
    refreshUser,             // convenience alias for loadUser
  };

  // Show loading state while first auth check is running
  if (loading) return <p>Loading auth...</p>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;