import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Reusable Login/Signup component
export const Login = () => {
  const { user, loadUser } = useAuth(); // Now loadUser exists
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const lowerUsername = username.toLowerCase().trim(); // Force lowercase

    const res = await fetch("https://api.lunepusa.workers.dev/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: lowerUsername, 
        password, 
        mode: isSignup ? "signup" : "login" 
      }),
    });

    const data = await res.json();

    if (data.success) {
      await loadUser(); // Refresh user state
    } else {
      setError(data.error || "Failed");
    }
  };

  if (user) {
    return (
      <div>
        Logged in as {user.username}
        <button onClick={async () => {
          await fetch("https://api.lunepusa.workers.dev/logout", { 
            method: "POST", 
            credentials: "include" 
          });
          await loadUser();
        }}>
          Log Out
        </button>
      </div>
    );
  }

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

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const WORKER_URL = "https://api.lunepusa.workers.dev";

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/me`, { credentials: "include" });
      const data = await res.json();
      setUser(data.user || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    user,
    loading,
    loadUser,
  };

  if (loading) return <p>Loading auth...</p>;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;