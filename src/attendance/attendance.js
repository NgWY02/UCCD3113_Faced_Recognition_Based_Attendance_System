import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam"; // Import react-webcam
import "./attendance.css";

const uuid = require("uuid");

function Attendance() {
  const [images, setImages] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [authResults, setAuthResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false); // State for webcam
  const canvasRef = useRef(null);
  const webcamRef = useRef(null); // Ref for webcam

  async function sendImages(e) {
    e.preventDefault();
    if (images.length === 0) {
      setAuthResults([
        {
          message: "No images selected. Please upload images.",
          success: false,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    setAuthResults([]);
    setBoundingBoxes([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setIsLoading(true);

    for (const image of images) {
      const studentImageName = uuid.v4();
      // Save a reference to the image URL before any API calls
      const imageObjectUrl = URL.createObjectURL(image);

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

        const authResponse = await authenticate(studentImageName);

        if (authResponse?.Message?.toLowerCase() === "success") {
          const recognizedStudents = authResponse.recognizedStudents || [];
          const newResults = recognizedStudents.map((student) => ({
            firstName: student.firstName,
            lastName: student.lastName,
            message: `Hi ${student.firstName} ${
              student.lastName
            }, your attendance is recorded! (Confidence: ${student.confidence.toFixed(
              2
            )}%)`,
            success: true,
            confidence: student.confidence,
            timestamp: new Date().toISOString(),
          }));
          
          setAuthResults((prevResults) => [...prevResults, ...newResults]);

          setBoundingBoxes(
            recognizedStudents.map((student) => ({
              ...student.boundingBox,
              name: `${student.firstName} ${student.lastName}`,
              confidence: (student.confidence / 100).toFixed(2),
            }))
          );
          setSelectedImage(imageObjectUrl);
        } else {
          const failResult = { 
            message: "Authentication Failed", 
            success: false,
            timestamp: new Date().toISOString()
          };
          setAuthResults((prevResults) => [...prevResults, failResult]);
          
          // Still display the image even if authentication failed
          setSelectedImage(imageObjectUrl);
          // Empty bounding boxes for failed authentication
          setBoundingBoxes([]);
        }
      } catch (error) {
        const errorResult = {
          message: "Error in authentication process, try again later.",
          success: false,
          timestamp: new Date().toISOString()
        };
        setAuthResults((prevResults) => [...prevResults, errorResult]);
        console.error("Upload/Authentication Error:", error);
        
        // Still display the image even if there was an error
        setSelectedImage(imageObjectUrl);
        // Empty bounding boxes for failed authentication
        setBoundingBoxes([]);
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function authenticate(studentImageName) {
    const requestUrl = `https://c1u9c2vtug.execute-api.ap-southeast-1.amazonaws.com/dev/student?${new URLSearchParams(
      {
        objectKey: `${studentImageName}.jpeg`,
      }
    )}`;

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

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Clear previous images and results when a new image is uploaded
      setBoundingBoxes([]);
      setSelectedImage(null);
      setAuthResults([]);
      
      // Set the new image
      setImages(files);
      setUploadedImage(URL.createObjectURL(files[0]));
    }
  }

  function captureImage() {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          // Clear previous images and results when capturing a new image
          setBoundingBoxes([]);
          setSelectedImage(null);
          setAuthResults([]);
          
          // Set the new image
          setImages([blob]);
          setUploadedImage(imageSrc);
          setIsWebcamOpen(false);
        });
    }
  }

  useEffect(() => {
    if (selectedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Only draw bounding boxes if they exist
        if (boundingBoxes && boundingBoxes.length > 0) {
          boundingBoxes.forEach((box) => {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.strokeRect(
              box.Left * img.width,
              box.Top * img.height,
              box.Width * img.width,
              box.Height * img.height
            );

            ctx.fillStyle = "green";
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

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function resetAttendance() {
    setAuthResults([]);
    setBoundingBoxes([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setImages([]);
  }

  return (
    <div className="attendance-container">
      <div className="title-bar">
        <h1>Facial Recognition Attendance System</h1>
      </div>

      <main className="main-content">
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
          <button onClick={() => {
            setIsWebcamOpen(!isWebcamOpen);
            // Clear previous images and results when opening webcam
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

        {(uploadedImage || selectedImage || authResults.length > 0) && !isLoading && (
          <div className="image-results-container">
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
                          className={`result-card ${
                            result.success ? "success" : "failure"
                          }`}
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