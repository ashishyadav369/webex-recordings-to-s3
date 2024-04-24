const webexScript = require("./webexScript");
const AWS = require("aws-sdk");
const axios = require("axios");
const { PassThrough } = require("stream");
const cliProgress = require("cli-progress");
const _colors = require("ansi-colors");

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

async function uploadVideoToS3() {
  let recordingsWithDirectUrl = await webexScript.genrateDownloadUrl();

  for (const recording of recordingsWithDirectUrl) {
    try {
      const response = await axios.get(recording.downloadUrl, {
        responseType: "stream",
      });

      const passThroughStream = new PassThrough();

      response.data.pipe(passThroughStream);
      const contentLength = parseInt(response.headers["content-length"], 10);
      const progressBar = new cliProgress.Bar(
        {
          format:
            `${recording.name} Upload Progress |` +
            _colors.cyan("{bar}") +
            "| {percentage}% || ETA : {eta_formatted} || {value}/{total} Bytes || {duration_formatted}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        },
        cliProgress.Presets.shades_classic
      );

      progressBar.start(contentLength, 0);

      const params = {
        Bucket: bucketName,
        Key: recording.name,
        Body: passThroughStream,
      };
      const upload = s3.upload(params);
      upload.on("httpUploadProgress", function (event) {
        progressBar.update(event.loaded);
      });

      await upload.promise();

      progressBar.stop();
      console.log("Video uploaded to S3:", params.Key);
    } catch (error) {
      console.error(`Error uploading ${recording.name} to S3:`, error);
    }
  }
}

uploadVideoToS3();
