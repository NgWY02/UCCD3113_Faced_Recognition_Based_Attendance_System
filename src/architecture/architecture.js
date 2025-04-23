import React from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap



function Architecture() {
    return (
        <>


            {/* Architecture Diagram Section */}
            <section id="architecture" className="architecture py-5">
                <div className="container mt-5">
                    <h2 className="text-center mb-5 fw-bold">System Architecture</h2>
                    <img src={require("./Architecture_Diagram.jpg")} alt="Architecture Diagram" className="img-fluid mx-auto d-block" />
                </div>
            </section>
            {/* System Component Details Section */}
            {/* System Component Details Section */}
            <section className="component-details py-5 bg-light">
                <div className="container">
                    <h3 className="text-center mb-4 fw-bold">System Component Details</h3>
                    <div className="row g-4">
                        {[
                            {
                                title: "React (Browser)",
                                description: "Used for frontend interface.",
                                link: "https://reactjs.org/"
                            },
                            {
                                title: "Amazon API Gateway",
                                description: "Handles RESTful API requests from the frontend.",
                                link: "https://docs.aws.amazon.com/apigateway/"
                            },
                            {
                                title: "AWS Lambda",
                                description: "Serverless backend logic for image comparison and database operations.",
                                link: "https://docs.aws.amazon.com/lambda/"
                            },
                            {
                                title: "Amazon S3",
                                description: "Stores uploaded student images and attendance records.",
                                link: "https://docs.aws.amazon.com/s3/"
                            },
                            {
                                title: "Amazon Rekognition",
                                description: "Facial recognition for authentication and student registration.",
                                link: "https://docs.aws.amazon.com/rekognition/"
                            },
                            {
                                title: "Amazon DynamoDB",
                                description: "NoSQL database storing face ID and student information.",
                                link: "https://docs.aws.amazon.com/dynamodb/"
                            },
                            {
                                title: "Amazon Athena",
                                description: "SQL-based querying of attendance records stored in S3.",
                                link: "https://docs.aws.amazon.com/athena/"
                            },
                            {
                                title: "Amazon QuickSight",
                                description: "Visualizes attendance reports for lecturers.",
                                link: "https://docs.aws.amazon.com/quicksight/"
                            }
                        ].map((component, index) => (
                            <div className="col-md-6 col-lg-4" key={index}>
                                <div className="card h-100 shadow-sm border-0">
                                    <div className="card-body">
                                        <h5 className="card-title">{component.title}</h5>
                                        <p className="card-text">{component.description}</p>
                                        <a href={component.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                            Learn more
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

export default Architecture;