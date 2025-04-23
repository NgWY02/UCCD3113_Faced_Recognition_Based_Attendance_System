import React from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
import "./App.css";
import Navbar from "./navbar/navbar"; // Import the Navbar component
import Footer from "./footer/footer"; // Import the Footer component

function App() {
  return (
    <>
      {/* Navbar */}
      <header>
        <Navbar />
      </header>

      {/* Hero Section */}
      <section className="hero bg-light text-dark text-center py-5 mt-5 hero-background">
        <div className="container">
          <h1 className="display-4">Welcome to UTAR Facial Recognition Attendance System</h1>
          <p className="lead">
            Automate attendance tracking with cutting-edge facial recognition technology using AWS Rekognition.
          </p>
          <a href="#features" className="btn btn-primary btn-lg mt-3">
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features py-5 bg-white">
        <div className="container">
          <h2 className="text-center mb-5">Features</h2>
          <div className="row gy-4">
            <div className="col-md-6 col-lg-3 text-center">
              <i className="bi bi-person-check-fill display-3 text-primary mb-3"></i>
              <h3 className="mt-3">Accurate Attendance</h3>
              <p className="text-muted">
                Ensure precise attendance tracking with advanced facial recognition technology from AWS.
              </p>
            </div>
            <div className="col-md-6 col-lg-3 text-center">
              <i className="bi bi-speedometer2 display-3 text-primary mb-3"></i>
              <h3 className="mt-3">Fast Processing</h3>
              <p className="text-muted">
                Process attendance in real-time with minimal delays.
              </p>
            </div>
            <div className="col-md-6 col-lg-3 text-center">
              <i className="bi bi-cloud-upload-fill display-3 text-primary mb-3"></i>
              <h3 className="mt-3">Cloud Integration</h3>
              <p className="text-muted">
                Store and manage attendance data securely in the cloud.
              </p>
            </div>
            <div className="col-md-6 col-lg-3 text-center">
              <i className="bi bi-bounding-box display-3 text-primary mb-3"></i>
              <h3 className="mt-3">Bounding Box Detection</h3>
              <p className="text-muted">
                Detect recognized students with bounding boxes drawn around their faces and display confidence scores for each detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about bg-light py-5">
        <div className="container">
          <h2 className="text-center mb-4">About Us</h2>
          <p className="text-center">
            We are a team of UTAR students dedicated to leveraging technology to improve efficiency
            and streamline processes. Our Facial Recognition Attendance System is designed to
            simplify attendance tracking for educational institutions.
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}

export default App;