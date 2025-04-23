import boto3

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='ap-southeast-1')
dynamodbTableName = 'utar-student'
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
studentTable = dynamodb.Table(dynamodbTableName)

def lambda_handler(event, context):
    
    # Log the event for debugging purposes
    print("Received event: " + str(event))
    
    # Extract the bucket name and object key from the event
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    
    try:
        response = index_student_image(bucket_name, object_key)
        print("Indexing response: " + str(response))
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            
            print("Successfully indexed student image {} from bucket {}.".format(object_key, bucket_name))
            
            # Extract firstName and lastName from the object key
            faceID = response['FaceRecords'][0]['Face']['FaceId']
            name = object_key.split('.')[0].split('_')
            firstName = name[0]
            lastName = ' '.join(name[1:])  # Join the remaining parts as the last name
            
            register_student(faceID, firstName, lastName)
        return response
            
    except Exception as e:
        print(str(e))
        # Log the error for debugging purposes
        print("Error processing student image {} from bucket {}.".format(object_key, bucket_name))
        raise e
    

def index_student_image(bucket_name, object_key):
    # Call the Rekognition API to index the student image
    response = rekognition.index_faces(
        Image={
            'S3Object': {
                'Bucket': bucket_name,
                'Name': object_key
            }
        },
        CollectionId='student-collection'
    )
    return response

def register_student(faceID, firstName, lastName):
    # Register the student in DynamoDB
    studentTable.put_item(
        Item={
            'rekognitionID': faceID,
            'firstName': firstName,
            'lastName': lastName
        }
    )