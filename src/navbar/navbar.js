import React from "react";
import "./navbar.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top no-rounded">
      <div className="container">
        <a className="navbar-brand fw-bold" href="#">
          UTAR Attendance System
        </a>
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
              <a className="nav-link fw-semibold" href="#home">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link fw-semibold" href="#record-attendance">
                Record Attendance
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link fw-semibold" href="#architecture">
                Architecture
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link fw-semibold" href="#about">
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