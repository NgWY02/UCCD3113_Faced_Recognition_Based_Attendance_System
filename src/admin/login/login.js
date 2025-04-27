import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Hardcoded credentials
    if (username === "admin1" && password === "admin1") {
      // Save only the username in session storage
      sessionStorage.setItem("adminUsername", username);

      // Dispatch a custom event to notify the Navbar
      const event = new Event("adminLogin");
      window.dispatchEvent(event);

      setIsLoggedIn(true); // Set login status to true
    } else {
      setError("Invalid username or password");
    }
  };

  const handleNavigate = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
    <div className="page-container">
      <div className="login-container">
        {!isLoggedIn ? (
          <>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <button type="submit" className="login-button">
                Login
              </button>
              <p className={`error-message ${error ? "visible" : ""}`}>
                {error}
              </p>
            </form>
          </>
        ) : (
          <div className="success-container">
            <h2>Login Successful!</h2>
            <p>Welcome, Admin!</p>
            <div className="success-actions">
              <button
                className="success-button"
                onClick={() => handleNavigate("/")}
              >
                Home
              </button>
              <button
                className="success-button"
                onClick={() => handleNavigate("/admin/register")}
              >
                Register Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
