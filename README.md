# Copy Large Files - AWS S3
Copy large files between buckets (AWS S3) with AWS Lambda Function (NodeJS).

AWS SDK Reference: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
Based on: https://gist.github.com/joshbedo/47bab20d47c1754626b5

## S3 Upload Part Copy
For this function, we used the method s3.uploadPartCopy (if the source object is greater than 5 GB):
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#uploadPartCopy-property

However, if the source object is lesser than 5 GB, the method s3.copyObject can be used:
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property

### Dependencies

#### AWS Resources
aws-sdk-js: https://github.com/aws/aws-sdk-js

#### Logging
winston: https://github.com/winstonjs/winston

#### Unit Tests
aws-sdk-mock: https://github.com/dwyl/aws-sdk-mock
code: https://github.com/hapijs/code
lab: https://github.com/hapijs/lab 