import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./navbar/navbar";
import Footer from "./footer/footer";
import Attendance from "./attendance/attendance";
import Architecture from "./architecture/architecture";
import Home from "./home/home";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/architecture" element={<Architecture />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;