import boto3
import json
import base64

# Initialize AWS clients
rekognition = boto3.client('rekognition', region_name='ap-southeast-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')

# DynamoDB table and S3 bucket names
dynamodbTableName = 'utar-student'
studentTable = dynamodb.Table(dynamodbTableName)
bucketName = 'utar-student-images'

def lambda_handler(event, context):
    try:
        # Log the full event for debugging
        print("Full event:", json.dumps(event))

        # Check if 'body' exists and is not empty
        if 'body' not in event or not event['body']:
            print("Event body is missing or empty")
            raise ValueError("Request body is missing")

        # Handle base64-encoded body if necessary
        if event.get("isBase64Encoded"):
            event['body'] = base64.b64decode(event['body']).decode('utf-8')

        # Log the raw body for debugging
        print("Raw event body:", event['body'])

        # Parse the incoming request body
        if isinstance(event['body'], str):
            data = json.loads(event['body'])  # Parse JSON string into a dictionary
        else:
            data = event['body']  # Use the dictionary directly

        # Extract student details and image file name
        firstName = data.get('firstName')
        lastName = data.get('lastName')
        email = data.get('email')
        fileName = data.get('fileName')

        if not all([firstName, lastName, email, fileName]):
            raise ValueError("Missing required fields in the request body")

        # Step 1: Index the image in Rekognition
        faceID = index_student_image(fileName)

        # Step 2: Register the student in DynamoDB
        register_student(faceID, firstName, lastName, email)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Student registered successfully!'})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def index_student_image(fileName):
    """
    Index the student image in Rekognition and return the FaceId.
    """
    response = rekognition.index_faces(
        Image={
            'S3Object': {
                'Bucket': bucketName,
                'Name': fileName
            }
        },
        CollectionId='student-collection'
    )
    faceID = response['FaceRecords'][0]['Face']['FaceId']
    print(f"Image {fileName} indexed in Rekognition with FaceId {faceID}.")
    return faceID

def register_student(faceID, firstName, lastName, email):
    """
    Register the student in DynamoDB with the provided details.
    """
    studentTable.put_item(
        Item={
            'rekognitionID': faceID,
            'firstName': firstName,
            'lastName': lastName,
            'email': email,  # Include email in the DynamoDB record
            'attendanceStatus': False,  # Default attendance status
            'record_time': None         # Default record time
        }
    )