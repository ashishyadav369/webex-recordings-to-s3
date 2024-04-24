const webexScript = require("./webexScript");
const AWS = require("aws-sdk");
const axios = require("axios");
const { PassThrough } = require("stream");
const cliProgress = require("cli-progress");

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

async function uploadVideoToS3(url, bucketName, keyName) {
  let ar = await webexScript.genrateDownloadUrl();
  try {
    const response = await axios.get(ar[0].downloadUrl, {
      responseType: "stream",
    });

    const passThroughStream = new PassThrough();

    response.data.pipe(passThroughStream);
    const contentLength = parseInt(response.headers["content-length"], 10);
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    progressBar.start(contentLength, 0);

    const params = {
      Bucket: bucketName,
      Key: "huihuihuihueeewwsdfrrrrwrerwew44i",
      Body: passThroughStream,
    };
    const upload = s3.upload(params);
    upload.on("httpUploadProgress", function (event) {
      const progress = Math.round((event.loaded / event.total) * 100);
      progressBar.update(event.loaded);
    });

    await upload.promise();

    progressBar.stop();
    console.log("Video uploaded to S3:", params.Key);
  } catch (error) {
    console.error("Error uploading video to S3:", error);
  }
}

uploadVideoToS3("", bucketName, " keyName");
