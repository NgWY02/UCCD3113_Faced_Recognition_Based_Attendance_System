import boto3
import json
from PIL import Image, ImageDraw
import io

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='ap-southeast-1')
dynamodbTableName = 'utar-student'
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
studentTable = dynamodb.Table(dynamodbTableName)
bucketName = 'utar-attendance-images'

def lambda_handler(event, context):
    # Log the event for debugging purposes
    print("Received event: " + str(event))
    
    objectKey = event['queryStringParameters']['objectKey']
    image_object = s3.get_object(Bucket=bucketName, Key=objectKey)
    image_bytes = image_object['Body'].read()
    
    # Load the image using PIL for cropping
    image = Image.open(io.BytesIO(image_bytes))
    image_width, image_height = image.size

    # Step 1: Detect all faces in the image
    face_detection_response = rekognition.detect_faces(
        Image={'Bytes': image_bytes},
        Attributes=['DEFAULT']
    )
    
    recognized_students = []  # List to store recognized student details
    processed_faces = set()  # Set to track already processed faces to avoid duplicates
    
    # Step 2: For each detected face, crop the image and search for matches
    for face in face_detection_response.get('FaceDetails', []):
        bounding_box = face['BoundingBox']
        print(f"Detected face with bounding box: {bounding_box}")
        
        # Calculate the pixel coordinates of the bounding box
        left = int(bounding_box['Left'] * image_width)
        top = int(bounding_box['Top'] * image_height)
        width = int(bounding_box['Width'] * image_width)
        height = int(bounding_box['Height'] * image_height)
        
        # Create a unique identifier for the face based on its bounding box
        face_id = (left, top, width, height)
        if face_id in processed_faces:
            print(f"Skipping duplicate face with bounding box: {bounding_box}")
            continue  # Skip if this face has already been processed
        
        processed_faces.add(face_id)  # Mark this face as processed
        
        # Crop the face from the image
        cropped_face = image.crop((left, top, left + width, top + height))
        
        # Convert the cropped face back to bytes
        cropped_face_bytes = io.BytesIO()
        cropped_face.save(cropped_face_bytes, format='JPEG')
        cropped_face_bytes = cropped_face_bytes.getvalue()
        
        # Search for the face in the collection
        response = rekognition.search_faces_by_image(
            CollectionId='student-collection',
            Image={'Bytes': cropped_face_bytes},
            FaceMatchThreshold=80,  # Confidence threshold
            MaxFaces=1  # Only match the most likely face
        )
        
        for match in response.get('FaceMatches', []):  # Safely handle if 'FaceMatches' is missing
            print(match['Face']['FaceId'], match['Face']['Confidence'])
            
            face_data = studentTable.get_item(
                Key={
                    'rekognitionID': match['Face']['FaceId']
                }
            )
            if 'Item' in face_data:
                print("Student found: " + json.dumps(face_data['Item']))
                recognized_students.append({
                    'firstName': face_data['Item']['firstName'],
                    'lastName': face_data['Item']['lastName'],
                    'confidence': match['Face']['Confidence'],
                    'boundingBox': bounding_box  # Include bounding box for the response
                })
    
    if recognized_students:
        return buildResponse(200, {
            'Message': 'Success',
            'recognizedStudents': recognized_students
        })
    
    print("No students could be recognized!")
    return buildResponse(403, {
        'Message': 'No students found!'
    })
            
def buildResponse(statusCode, body = None):
    return {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Allow all origins
        },
        'body': json.dumps(body)
    }

def draw_bounding_boxes(image_bytes, recognized_students):
    image = Image.open(io.BytesIO(image_bytes))
    draw = ImageDraw.Draw(image)
    
    for student in recognized_students:
        bounding_box = student['boundingBox']
        image_width, image_height = image.size
        
        # Calculate pixel coordinates
        left = int(bounding_box['Left'] * image_width)
        top = int(bounding_box['Top'] * image_height)
        width = int(bounding_box['Width'] * image_width)
        height = int(bounding_box['Height'] * image_height)
        
        # Draw rectangle
        draw.rectangle([left, top, left + width, top + height], outline="red", width=3)
        draw.text((left, top - 10), f"{student['firstName']} {student['lastName']}", fill="red")
    
    # Save or return the modified image
    output = io.BytesIO()
    image.save(output, format='JPEG')
    return output.getvalue()

