import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./navbar/navbar";
import Footer from "./footer/footer";
import Attendance from "./attendance/attendance";
import Architecture from "./architecture/architecture";
import Home from "./home/home";
import Login from "./admin/login/login";
import Register from "./admin/register_student/register_student";
import { AdminRoute } from "./auth";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/admin/login" element={<Login />} />
        {/* Protect the Register Student route */}
        <Route
          path="/admin/register"
          element={
            <AdminRoute>
              <Register />
            </AdminRoute>
          }
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;