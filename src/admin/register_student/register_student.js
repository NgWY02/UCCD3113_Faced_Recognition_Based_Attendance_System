import React, { useState, useRef } from "react";
import "./register_student.css";

function RegisterStudent() {
  // State to manage form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    image: null,
  });

  // State to manage loading state during registration
  const [isLoading, setIsLoading] = useState(false);

  // Ref for the file input field to reset it after submission
  const fileInputRef = useRef(null);

  // Handle input changes for text fields (first name, last name, email)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate that all fields are filled
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.image) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    setIsLoading(true); // Set loading state to true during the process

    try {
      // Format the last name to replace spaces with underscores for the file name
      const formattedLastName = formData.lastName.replace(/\s+/g, "_");
      const imageFileName = `${formData.firstName}_${formattedLastName}.jpeg`;

      // Extract the image file from the form data
      const image = formData.image;

      console.log("Uploading image with file name:", imageFileName); // Debugging

      // Step 1: Upload the image to the S3 bucket via API Gateway
      const uploadResponse = await fetch(
        `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/utar-student-images/${imageFileName}`,
        {
          method: "PUT", // HTTP PUT method for uploading the image
          headers: { "Content-Type": "image/jpeg" }, // Set content type to image/jpeg
          body: image, // Pass the image file as the request body
        }
      );

      console.log("Image upload response status:", uploadResponse.status); // Debugging

      // Check if the upload was successful
      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
      }

      // Step 2: Submit student details to the registration API
      const studentDetails = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        fileName: imageFileName, // Use the formatted file name
      };

      const registerResponse = await fetch(
        "https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/register",
        {
          method: "POST", // HTTP POST method for sending student details
          headers: {
            "Content-Type": "application/json", // Set content type to JSON
          },
          body: JSON.stringify(studentDetails), // Convert student details to JSON string
        }
      );

      console.log("Student registration response status:", registerResponse.status); // Debugging

      // Check if the registration was successful
      if (!registerResponse.ok) {
        const errorText = await registerResponse.text(); // Get error details from the response
        console.error("Registration API error response:", errorText); // Debugging
        throw new Error(`Student registration failed: ${registerResponse.statusText}`);
      }

      // Show success message to the user
      alert("Student registered successfully!");

      // Reset the form fields
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
      // Log and show error message to the user
      console.error("Error during registration process:", error); // Debugging
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="register-student-container">
      <h2>Register Student</h2>
      <form onSubmit={handleSubmit} className="register-student-form">
        {/* Input field for first name */}
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

        {/* Input field for last name */}
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

        {/* Input field for email */}
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

        {/* File input for uploading the image */}
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

        {/* Submit button */}
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register Student"}
        </button>
      </form>
    </div>
  );
}

export default RegisterStudent;