import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Small reusable login/logout bar
export const AuthBar = () => {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const success = await login(username, password);
    if (!success) setError("Invalid credentials");
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "5px" }}>
        <form onSubmit={handleLogin} style={{ display: "inline-block" }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: "3px", marginRight: "3px" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "3px", marginRight: "3px" }}
          />
          <button type="submit" style={{}}>
            Log In
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <span style={{}}>Logged in as {user.username}</span>
      <button onClick={logout}>Log Out</button>
    </div>
  );
};

const Auth = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const WORKER_URL = "https://api.lunepusa.workers.dev";

  useEffect(() => {
    fetch(`${WORKER_URL}/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${WORKER_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      return true;
    }
    window.location.reload();
    return false;
  };

  const logout = async () => {
    await fetch(`${WORKER_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.reload();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default Auth;
