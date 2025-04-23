import React, { useState, useRef } from "react";
import "./register_student.css";

function RegisterStudent() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    image: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Ref for the file input field
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.image) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    setIsLoading(true);

    try {
      // Format the last name to replace spaces with underscores
      const formattedLastName = formData.lastName.replace(/\s+/g, "_");
      const imageFileName = `${formData.firstName}_${formattedLastName}.jpeg`;

      // Extract the image file
      const image = formData.image;

      console.log("Uploading image with file name:", imageFileName); // Debugging

      // Step 1: Upload the image to S3
      const uploadResponse = await fetch(
        `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/utar-student-images/${imageFileName}`,
        {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: image, // Pass the image directly
        }
      );

      console.log("Image upload response status:", uploadResponse.status); // Debugging

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
      }

      // Step 2: Submit student details to the API
      const studentDetails = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        fileName: imageFileName,
      };

      const registerResponse = await fetch(
        "https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(studentDetails), // Ensure body is a JSON string
        }
      );

      console.log("Student registration response status:", registerResponse.status); // Debugging

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text(); // Get error details
        console.error("Registration API error response:", errorText); // Debugging
        throw new Error(`Student registration failed: ${registerResponse.statusText}`);
      }

      alert("Student registered successfully!");

      // Reset the form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        image: null,
      });

      // Clear the file input field
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error during registration process:", error); // Debugging
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-student-container">
      <h2>Register Student</h2>
      <form onSubmit={handleSubmit} className="register-student-form">
        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Upload Image:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef} // Attach the ref to the file input
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register Student"}
        </button>
      </form>
    </div>
  );
}

export default RegisterStudent;