import { useState, useRef, useEffect } from "react";
import "./attendance.css";

const uuid = require("uuid");

function Attendance() {
  const [images, setImages] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null); // Store uploaded image preview
  const [authResults, setAuthResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // Store the selected image for drawing
  const [boundingBoxes, setBoundingBoxes] = useState([]); // Store bounding box data
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const canvasRef = useRef(null); // Reference to the canvas element

  async function sendImages(e) {
    e.preventDefault();
    if (images.length === 0) {
      setAuthResults([
        {
          message: "No images selected. Please upload images.",
          success: false,
        },
      ]);
      return;
    }

    setAuthResults([]); // Clear previous results
    setBoundingBoxes([]); // Clear previous bounding boxes
    setSelectedImage(null); // Clear previous selected image
    setUploadedImage(null); // Hide uploaded image when processing starts
    setIsLoading(true); // Set loading state

    for (const image of images) {
      const studentImageName = uuid.v4();

      try {
        const uploadResponse = await fetch(
          `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/utar-attendance-images/${studentImageName}.jpeg`,
          {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: image,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(`Upload Failed: ${uploadResponse.statusText}`);
        }

        console.log(`Image ${studentImageName} uploaded successfully`);

        // Call authentication after successful upload
        const authResponse = await authenticate(studentImageName);

        if (authResponse?.Message?.toLowerCase() === "success") {
          const recognizedStudents = authResponse.recognizedStudents || [];
          setAuthResults((prevResults) => [
            ...prevResults,
            ...recognizedStudents.map((student) => ({
              message: `Hi ${student.firstName} ${
                student.lastName
              }, your attendance is recorded! (Confidence: ${student.confidence.toFixed(
                2
              )}%)`,
              success: true,
            })),
          ]);

          // Set bounding boxes and selected image for drawing
          setBoundingBoxes(
            recognizedStudents.map((student) => ({
              ...student.boundingBox,
              name: `${student.firstName} ${student.lastName}`,
              confidence: (student.confidence / 100).toFixed(2), // Scale confidence to 0-1
            }))
          );
          setSelectedImage(URL.createObjectURL(image));
        } else {
          setAuthResults((prevResults) => [
            ...prevResults,
            { message: "Authentication Failed", success: false },
          ]);
        }
      } catch (error) {
        setAuthResults((prevResults) => [
          ...prevResults,
          {
            message: "Error in authentication process, try again later.",
            success: false,
          },
        ]);
        console.error("Upload/Authentication Error:", error);
      } finally {
        setIsLoading(false); // Stop loading state
      }
    }
  }

  async function authenticate(studentImageName) {
    const requestUrl = `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/student?${new URLSearchParams(
      {
        objectKey: `${studentImageName}.jpeg`,
      }
    )}`;

    console.log("Requesting authentication:", requestUrl);

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        console.error("API Error:", response.statusText);
        return []; // Return empty array if API call fails
      }

      const rawData = await response.json();
      console.log("Raw Response Data:", rawData);

      if (!rawData.body) {
        console.error("Invalid response format: Missing 'body' field");
        return [];
      }

      const data = JSON.parse(rawData.body);
      console.log("Parsed Response Data:", data);

      return data;
    } catch (error) {
      console.error("API Fetch Error:", error);
      return [];
    }
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(files);
      setUploadedImage(URL.createObjectURL(files[0])); // Set uploaded image preview
    }
  }

  // Draw bounding boxes and names on the canvas
  useEffect(() => {
    if (selectedImage && boundingBoxes.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Set canvas size to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Draw bounding boxes and names
        boundingBoxes.forEach((box) => {
          // Draw the bounding box
          ctx.strokeStyle = "green"; // Set bounding box color to green
          ctx.lineWidth = 2;
          ctx.strokeRect(
            box.Left * img.width,
            box.Top * img.height,
            box.Width * img.width,
            box.Height * img.height
          );

          // Draw the name and confidence score
          ctx.fillStyle = "green"; // Set font color to green
          ctx.font = "16px Arial";
          ctx.fillText(
            `${box.name} (CS: ${box.confidence})`,
            box.Left * img.width,
            box.Top * img.height - 5
          );
        });
      };

      img.src = selectedImage;
    }
  }, [selectedImage, boundingBoxes]);

  return (
    <div className="App">
      <h2>FACIAL RECOGNITION ATTENDANCE SYSTEM</h2>
      <form onSubmit={sendImages}>
        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Record Attendance"}
        </button>

        {/* Display uploaded image */}
        {uploadedImage && !isLoading && (
          <div className="uploaded-image-container">
            <h3>Uploaded Image</h3>
            <img
              src={uploadedImage}
              alt="Uploaded Preview"
              className="uploaded-image"
            />
          </div>
        )}
      </form>

      {/* Display the processed image with bounding boxes */}
      {selectedImage && !isLoading && (
        <div className="canvas-container">
          <h3>Processed Image with Bounding Boxes</h3>
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid black",
              maxWidth: "100%",
              cursor: "pointer",
            }}
            onClick={() => setIsModalOpen(true)} // Open modal on click
          ></canvas>
        </div>
      )}

      {/* Modal for full-size image */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>
              &times;
            </span>
            <canvas ref={canvasRef} style={{ width: "100%" }}></canvas>
          </div>
        </div>
      )}

      {/* Scrollbox for attendance messages */}
      {authResults.length > 0 && (
        <div className="scrollbox">
          <h3>Attendance Results</h3>
          {authResults.map((result, index) => (
            <div key={index} className={result.success ? "success" : "failure"}>
              {result.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Attendance;