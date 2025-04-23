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
  const [isWebcamOn, setIsWebcamOn] = useState(false); // State for webcam
  const [capturedImage, setCapturedImage] = useState(null); // State for captured image
  const canvasRef = useRef(null);
  const webcamRef = useRef(null); // Ref for the webcam

  async function sendImages(e) {
    e.preventDefault();
    if (images.length === 0 && !capturedImage) {
      setAuthResults([
        {
          message: "No images selected or captured. Please upload or capture an image.",
          success: false,
        },
      ]);
      return;
    }

    setAuthResults([]);
    setBoundingBoxes([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setIsLoading(true);

    const imageList = capturedImage ? [capturedImage] : images;

    for (const image of imageList) {
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

          setBoundingBoxes(
            recognizedStudents.map((student) => ({
              ...student.boundingBox,
              name: `${student.firstName} ${student.lastName}`,
              confidence: (student.confidence / 100).toFixed(2),
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
      setImages(files);
      setUploadedImage(URL.createObjectURL(files[0]));
    }
  }

  function captureImage() {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsWebcamOn(false); // Turn off the webcam after capturing
  }

  useEffect(() => {
    if (selectedImage && boundingBoxes.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

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
      };

      img.src = selectedImage;
    }
  }, [selectedImage, boundingBoxes]);

  return (
    <div className="attendance-container">
      <div className="title-bar">
        <h1>Facial Recognition Attendance System</h1>
      </div>

      <main className="main-content">
        <section className="upload-section">
          <h2>Upload or Capture Images</h2>
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
          <button
            className="btn btn-secondary mt-3"
            onClick={() => setIsWebcamOn(true)}
          >
            Capture Image
          </button>
        </section>

        {isWebcamOn && (
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-preview"
            />
            <button className="btn btn-primary mt-3" onClick={captureImage}>
              Take Photo
            </button>
          </div>
        )}

        {capturedImage && (
          <div className="preview-container">
            <section className="preview-section">
              <h2>Captured Image Preview</h2>
              <img
                src={capturedImage}
                alt="Captured Preview"
                className="uploaded-image"
              />
              <button
                className="btn btn-secondary mt-3"
                onClick={() => setCapturedImage(null)}
              >
                Retake Photo
              </button>
              <button
                className="btn btn-primary mt-3"
                onClick={sendImages}
              >
                Submit Photo
              </button>
            </section>
          </div>
        )}

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

        {authResults.length > 0 && (
          <div className="results-container">
            <section className="results-section">
              <h2>Attendance Results</h2>
              <div className="results-content">
                {authResults.map((result, index) => (
                  <div
                    key={index}
                    className={`result-card ${
                      result.success ? "success" : "failure"
                    }`}
                  >
                    {result.message}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Attendance;