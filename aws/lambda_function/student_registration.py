import boto3
import json
import base64

# Initialize AWS clients for Rekognition and DynamoDB
rekognition = boto3.client('rekognition', region_name='ap-southeast-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')

# DynamoDB table and S3 bucket names
dynamodbTableName = 'utar-student' # DynamoDB table name for student details
studentTable = dynamodb.Table(dynamodbTableName)
bucketName = 'utar-student-images' # S3 bucket name for student images

def lambda_handler(event, context):
    """
    Main Lambda function handler to process student registration requests.
    """
    try:
        # Log the full event for debugging purposes
        print("Full event:", json.dumps(event))

        # Check if the request body exists and is not empty
        if 'body' not in event or not event['body']:
            print("Event body is missing or empty")
            raise ValueError("Request body is missing")

        # Decode the body if it is base64-encoded
        if event.get("isBase64Encoded"):
            event['body'] = base64.b64decode(event['body']).decode('utf-8')

        # Log the raw body for debugging
        print("Raw event body:", event['body'])

        # Parse the incoming request body into a dictionary
        if isinstance(event['body'], str):
            data = json.loads(event['body'])  # Parse JSON string into a dictionary
        else:
            data = event['body']  # Use the dictionary directly

        # Extract student details and image file name from the request
        firstName = data.get('firstName')
        lastName = data.get('lastName')
        email = data.get('email')
        fileName = data.get('fileName')

        # Validate that all required fields are present
        if not all([firstName, lastName, email, fileName]):
            raise ValueError("Missing required fields in the request body")

        # Step 1: Index the image in Rekognition and get the FaceId
        faceID = index_student_image(fileName)

        # Step 2: Register the student in DynamoDB with the provided details
        register_student(faceID, firstName, lastName, email)

        # Return a success response
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Student registered successfully!'})
        }

    except Exception as e:
        # Log and return an error response
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def index_student_image(fileName):
    """
    Index the student image in Rekognition and return the FaceId.
    """
    # Call Rekognition to index the image in the specified collection
    response = rekognition.index_faces(
        Image={
            'S3Object': {
                'Bucket': bucketName,
                'Name': fileName
            }
        },
        CollectionId='student-collection' # Name of the Rekognition collection
    )
    # Extract the FaceId from the response
    faceID = response['FaceRecords'][0]['Face']['FaceId']
    print(f"Image {fileName} indexed in Rekognition with FaceId {faceID}.")
    return faceID

def register_student(faceID, firstName, lastName, email):
    """
    Register the student in DynamoDB with the provided details.
    """
    # Add a new item to the DynamoDB table with student details
    studentTable.put_item(
        Item={
            'rekognitionID': faceID,  # Unique FaceId from Rekognition
            'firstName': firstName,   # Student's first name
            'lastName': lastName,     # Student's last name
            'email': email,           # Student's email address
            'attendanceStatus': False,  # Default attendance status
            'record_time': None         # Default record time
        }
    )