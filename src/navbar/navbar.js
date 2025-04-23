import React from "react";
import { Link } from "react-router-dom"; // Import Link for routing to other pages
import "./navbar.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top no-rounded">
      <div className="container">
      <Link className="navbar-brand fw-bold" to="/">
          UTAR Attendance System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
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
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;