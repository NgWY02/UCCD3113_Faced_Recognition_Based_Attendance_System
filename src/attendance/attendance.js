import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam"; // Import react-webcam library
import "./attendance.css"; // Import CSS styling

const uuid = require("uuid"); // Import uuid to generate unique IDs

function Attendance() {
  // State variables
  const [images, setImages] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [authResults, setAuthResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  
  const canvasRef = useRef(null); // Reference for canvas
  const webcamRef = useRef(null); // Reference for webcam

  // Function to handle uploading and sending images
  async function sendImages(e) {
    e.preventDefault(); // Prevent page reload
    if (images.length === 0) {
      // If no images uploaded, show an error message
      setAuthResults([
        {
          message: "No images selected. Please upload images.",
          success: false,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    // Reset previous results
    setAuthResults([]);
    setBoundingBoxes([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setIsLoading(true);

    // Loop through all selected images
    for (const image of images) {
      const studentImageName = uuid.v4(); // Generate a random unique name
      const imageObjectUrl = URL.createObjectURL(image); // Create temporary URL to display image

      try {
        // Upload the image to S3 via API Gateway
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

        // After uploading, call the authentication API
        const authResponse = await authenticate(studentImageName);

        if (authResponse?.Message?.toLowerCase() === "success") {
          // If authentication successful, process recognized students
          const recognizedStudents = authResponse.recognizedStudents || [];

          const newResults = recognizedStudents.map((student) => ({
            firstName: student.firstName,
            lastName: student.lastName,
            message: `Hi ${student.firstName} ${student.lastName}, your attendance is recorded! (Confidence: ${student.confidence.toFixed(2)}%)`,
            success: true,
            confidence: student.confidence,
            timestamp: new Date().toISOString(),
          }));

          setAuthResults((prevResults) => [...prevResults, ...newResults]);

          // Save bounding box info for drawing rectangles
          setBoundingBoxes(
            recognizedStudents.map((student) => ({
              ...student.boundingBox,
              name: `${student.firstName} ${student.lastName}`,
              confidence: (student.confidence / 100).toFixed(2),
            }))
          );
          setSelectedImage(imageObjectUrl);
        } else {
          // If authentication failed
          const failResult = { 
            message: "Authentication Failed", 
            success: false,
            timestamp: new Date().toISOString()
          };
          setAuthResults((prevResults) => [...prevResults, failResult]);

          setSelectedImage(imageObjectUrl);
          setBoundingBoxes([]);
        }
      } catch (error) {
        // Handle any errors during upload or authentication
        const errorResult = {
          message: "Error in authentication process, try again later.",
          success: false,
          timestamp: new Date().toISOString()
        };
        setAuthResults((prevResults) => [...prevResults, errorResult]);
        console.error("Upload/Authentication Error:", error);

        setSelectedImage(imageObjectUrl);
        setBoundingBoxes([]);
      } finally {
        setIsLoading(false); // Stop loading after each image
      }
    }
  }

  // Function to call the authentication API
  async function authenticate(studentImageName) {
    const requestUrl = `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/student?${new URLSearchParams({
      objectKey: `${studentImageName}.jpeg`,
    })}`;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return [];
      }

      const rawData = await response.json();
      const data = JSON.parse(rawData.body);
      return data;
    } catch (error) {
      console.error("API Fetch Error:", error);
      return [];
    }
  }

  // Handle file selection by user
  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Reset previous states
      setBoundingBoxes([]);
      setSelectedImage(null);
      setAuthResults([]);

      setImages(files);
      setUploadedImage(URL.createObjectURL(files[0]));
    }
  }

  // Capture image from webcam
  function captureImage() {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          setBoundingBoxes([]);
          setSelectedImage(null);
          setAuthResults([]);

          setImages([blob]);
          setUploadedImage(imageSrc);
          setIsWebcamOpen(false); // Close webcam after capturing
        });
    }
  }

  // Draw bounding boxes after processing image
  useEffect(() => {
    if (selectedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        if (boundingBoxes && boundingBoxes.length > 0) {
          boundingBoxes.forEach((box) => {
            ctx.strokeStyle = "lightgreen"; // Bounding box color
            ctx.lineWidth = 2;
            ctx.strokeRect(
              box.Left * img.width,
              box.Top * img.height,
              box.Width * img.width,
              box.Height * img.height
            );

            ctx.fillStyle = "lightgreen";
            ctx.font = "16px Arial";
            ctx.fillText(
              `${box.name} (CS: ${box.confidence})`,
              box.Left * img.width,
              box.Top * img.height - 5
            );
          });
        }
      };

      img.src = selectedImage;
    }
  }, [selectedImage, boundingBoxes]);

  // Format time for displaying timestamps
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Reset everything back to default
  function resetAttendance() {
    setAuthResults([]);
    setBoundingBoxes([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setImages([]);
  }

  return (
    <div className="attendance-container">
      {/* Title Bar */}
      <div className="title-bar">
        <h1>Facial Recognition Attendance System</h1>
      </div>

      <main className="main-content">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Upload Images</h2>
          <form onSubmit={sendImages}>
            <label className="upload-area">
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <p>Drag and drop images here, or click to select files.</p>
            </label>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Record Attendance"}
            </button>
          </form>

          {/* Open or Close Webcam Button */}
          <button onClick={() => {
            setIsWebcamOpen(!isWebcamOpen);
            if (!isWebcamOpen) {
              setImages([]);
              setUploadedImage(null);
              setSelectedImage(null);
              setBoundingBoxes([]);
              setAuthResults([]);
            }
          }}>
            {isWebcamOpen ? "Close Webcam" : "Open Webcam"}
          </button>
        </section>

        {/* Webcam Section */}
        {isWebcamOpen && (
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-preview"
            />
            <div className="webcam-controls">
              <button onClick={captureImage}>Capture Image</button>
              <button onClick={() => setIsWebcamOpen(false)}>Close Webcam</button>
            </div>
          </div>
        )}

        {/* Display Results */}
        {(uploadedImage || selectedImage || authResults.length > 0) && !isLoading && (
          <div className="image-results-container">
            {/* Uploaded Image Preview */}
            <div className="image-display-container">
              {uploadedImage && !isLoading && (
                <div className="preview-container">
                  <section className="preview-section">
                    <h2>Uploaded Image Preview</h2>
                    <img
                      src={uploadedImage}
                      alt="Uploaded Preview"
                      className="uploaded-image"
                    />
                  </section>
                </div>
              )}

              {/* Processed Image Canvas */}
              {selectedImage && !isLoading && (
                <div className="processed-container">
                  <section className="processed-section">
                    <h2>Processed Image</h2>
                    <canvas
                      ref={canvasRef}
                      onClick={() => setIsModalOpen(true)}
                    ></canvas>
                  </section>
                </div>
              )}
            </div>

            {/* Attendance Results */}
            {authResults.length > 0 && (
              <div className="results-container">
                <section className="results-section">
                  <h2>Attendance Results</h2>

                  <div className="results-content">
                    {authResults.length === 0 ? (
                      <div className="empty-results">
                        <p>No attendance records yet.</p>
                      </div>
                    ) : (
                      authResults.map((result, index) => (
                        <div
                          key={index}
                          className={`result-card ${result.success ? "success" : "failure"}`}
                        >
                          <div className="result-message">
                            <span className="result-icon">
                              {result.success ? "✅" : "❌"}
                            </span>
                            <div className="result-info">
                              {result.success && (
                                <div className="result-name">
                                  {result.firstName} {result.lastName}
                                </div>
                              )}
                              <div className="result-details">{result.message}</div>
                            </div>
                          </div>
                          <div className="result-time">
                            {formatTime(result.timestamp)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reset Button */}
                  <button 
                    onClick={resetAttendance} 
                    style={{ marginTop: '20px' }}
                  >
                    Reset Attendance
                  </button>
                </section>
              </div>
            )}
          </div>
        )}

        {/* Modal to enlarge the canvas image */}
        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setIsModalOpen(false)}>
                &times;
              </span>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Attendance;
