require("dotenv").config();

async function getRecordingsList() {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
  };

  const recordings = await fetch(
    "https://webexapis.com/v1/recordings",
    options
  );

  const recordingList = await recordings.json();

  return recordingList.items;
}

// TODO:: Improve code & cleanup
async function genrateDownloadUrl() {
  const downloadUrls = [];
  const recordingsList = await getRecordingsList();
  for (let i = 0; i < recordingsList.length; i++) {
    const resp = await fetch(recordingsList[i].downloadUrl);
    const parsedResponse = await resp.text();

    const regexForRecordId =
      /<input\s+type="hidden"\s+name="recordID"\s+value='(\d+)'>/i;
    const match = regexForRecordId.exec(parsedResponse);
    const recordID = match ? match[1] : null;

    const urlObj = new URL(recordingsList[i].downloadUrl);
    const rcid = urlObj.searchParams.get("RCID");

    const myHeaders = new Headers();
    myHeaders.append(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0"
    );
    myHeaders.append(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    );
    myHeaders.append("Accept-Language", "en-US,en;q=0.5");
    myHeaders.append("Accept-Encoding", "gzip, deflate, br");
    myHeaders.append("Referer", `${recordingsList[i].downloadUrl}`);
    myHeaders.append("Origin", `${process.env.ORIGIN}`);
    myHeaders.append("Connection", "keep-alive");
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("siteurl", `${process.env.SITE_URL}`);
    urlencoded.append("action", "dw");
    urlencoded.append("firstEntry", "false");
    urlencoded.append("hashRecordKey", "");
    urlencoded.append("rcid", `${rcid}`);
    urlencoded.append("recordID", `${recordID}`);
    urlencoded.append("password", `${recordingsList[i].password}`);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    const response = await fetch(
      `${process.env.ORIGIN}/svc3300/svccomponents/servicerecordings/recordingpasswordcheck.do`,
      requestOptions
    );
    const parsedResponse2 = await response.text();
    const regexForDownloadUrl = /var\s+href='(.*?)';/;

    const downloadUrl = regexForDownloadUrl.exec(parsedResponse2)[1];

    downloadUrls.push(downloadUrl);
  }

  return downloadUrls;
}

// TODO:: Add function to transfer recordings to s3 bucket

(async function () {
  console.log(await genrateDownloadUrl());
})();
