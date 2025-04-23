import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isAdminAuthenticated } from "../auth";
import "./navbar.css";

function Navbar() {
  const [navOpen, setNavOpen] = useState(false); // State for toggling navbar on mobile
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for toggling dropdown menu
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(isAdminAuthenticated()); // State to track admin login status

  useEffect(() => {
    // Function to check admin login status
    const checkAdminLogin = () => {
      setIsAdminLoggedIn(isAdminAuthenticated());
    };

    // Check login status on component mount
    checkAdminLogin();

    // Listen for custom "adminLogin" event to update state dynamically
    window.addEventListener("adminLogin", checkAdminLogin);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("adminLogin", checkAdminLogin);
    };
  }, []);

  const handleLogout = () => {
    // Clear session storage and update state
    sessionStorage.removeItem("adminUsername");
    setIsAdminLoggedIn(false);

    // Redirect to the login page
    window.location.href = "/admin/login";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top no-rounded">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          UTAR Attendance System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setNavOpen(!navOpen)}
          aria-controls="navbarNav"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className={`collapse navbar-collapse ${navOpen ? "active" : ""}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="/attendance">
                Record Attendance
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="/architecture">
                Architecture
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link fw-semibold" href="/#about">
                About Us
              </a>
            </li>
            {/* Admin Dropdown Menu */}
            <li
              className={`nav-item dropdown ${dropdownOpen ? "show" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <a
                className="nav-link dropdown-toggle fw-semibold"
                href="#"
                id="adminDropdown"
                role="button"
                aria-expanded={dropdownOpen}
              >
                Admin
              </a>
              <ul
                className={`dropdown-menu dropdown-menu-dark ${
                  dropdownOpen ? "show" : ""
                }`}
                aria-labelledby="adminDropdown"
              >
                {isAdminLoggedIn ? (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/admin/register">
                        Register Student
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link className="dropdown-item" to="/admin/login">
                      Login
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;