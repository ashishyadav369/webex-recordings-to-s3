const webexScript = require("./webexScript");
const AWS = require("aws-sdk");
const axios = require("axios");
const { Readable } = require("stream");

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;
