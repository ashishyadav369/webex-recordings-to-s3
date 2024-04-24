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
  console.log(`Total recordings found : ${recordingList.items?.length}`);
  return recordingList.items;
}

// TODO:: Improve code & cleanup
async function genrateDownloadUrl() {
  const recordingsWithDirectUrl = [];
  const recordingsList = await getRecordingsList();
  for (let i = 0; i < recordingsList.length; i++) {
    console.log(
      `Genrating direct download url for :  ${recordingsList[i].topic}`
    );

    const resp = await fetch(recordingsList[i].downloadUrl);
    const parsedResponse = await resp.text();

    const regexForRecordId =
      /<input\s+type="hidden"\s+name="recordID"\s+value='(\d+)'>/i;
    const matchRecordId = regexForRecordId.exec(parsedResponse);
    const recordID = matchRecordId ? matchRecordId[1] : null;

    //
    const urlObj = new URL(recordingsList[i].downloadUrl);
    const rcid = urlObj.searchParams.get("RCID");

    const myHeaders = new Headers();
    myHeaders.append(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    );
    myHeaders.append("Referer", `${recordingsList[i].downloadUrl}`);
    myHeaders.append("Origin", `${process.env.ORIGIN}`);
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

    const responseAfterPasswordVerification = await fetch(
      `${process.env.ORIGIN}/svc3300/svccomponents/servicerecordings/recordingpasswordcheck.do`,
      requestOptions
    );
    const parsedresponseAfterPasswordVerification =
      await responseAfterPasswordVerification.text();
    const regexForDownloadUrl = /var\s+href='(.*?)';/;

    const downloadUrl = regexForDownloadUrl.exec(
      parsedresponseAfterPasswordVerification
    )[1];

    const downloadUrlObj = new URL(downloadUrl);
    const recordKey = downloadUrlObj.searchParams.get("recordKey");
    const recordIDDownload = downloadUrlObj.searchParams.get("recordID");
    const serviceRecordIDDownload =
      downloadUrlObj.searchParams.get("serviceRecordID");

    const myHeadersGenrateDownload = new Headers();
    myHeadersGenrateDownload.append(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0"
    );
    myHeadersGenrateDownload.append(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    );
    myHeadersGenrateDownload.append(
      "Referer",
      `${process.env.ORIGIN}/svc3300/svccomponents/servicerecordings/recordingpasswordcheck.do`
    );
    myHeadersGenrateDownload.append(
      "Content-Type",
      "application/x-www-form-urlencoded"
    );
    myHeadersGenrateDownload.append("Origin", `${process.env.ORIGIN}`);

    const urlencodedDownload = new URLSearchParams();
    urlencodedDownload.append("siteurl", `${process.env.SITE_URL}`);
    urlencodedDownload.append("action", "publishfile");
    urlencodedDownload.append("recordID", `${recordIDDownload}`);
    urlencodedDownload.append("serviceRecordID", `${serviceRecordIDDownload}`);
    urlencodedDownload.append("recordKey", `${recordKey}`);

    const requestOptionsGenerateDownload = {
      method: "POST",
      headers: myHeadersGenrateDownload,
      body: urlencodedDownload,
      redirect: "follow",
    };

    const responseDownloadPublish = await fetch(
      `${process.env.ORIGIN}/mw3300/mywebex/nbrshared.do`,
      requestOptionsGenerateDownload
    );

    const parsedResponseDownloadPublish = await responseDownloadPublish.text();

    const downloadUrlRegex = /downloadUrl = '(.*?)'/;
    const recordIdRegex = /var recordId = (\d+);/;
    const serviceRecordIdRegex = /var serviceRecordId = (\d+);/;
    const prepareTicketRegex = /var prepareTicket = '([^']+)';/;

    const downloadUrlMatch =
      parsedResponseDownloadPublish.match(downloadUrlRegex);
    const recordIdMatch = parsedResponseDownloadPublish.match(recordIdRegex);
    const serviceRecordIdMatch =
      parsedResponseDownloadPublish.match(serviceRecordIdRegex);
    const prepareTicketMatch =
      parsedResponseDownloadPublish.match(prepareTicketRegex);

    let recordIdForDownloadUrl;
    let serviceRecordIdForDownloadUrl;
    let prepareTicketForDownloadUrl;
    let baseDownloadUrl;
    if (recordIdMatch && recordIdMatch[1]) {
      recordIdForDownloadUrl = recordIdMatch[1];
    }

    if (serviceRecordIdMatch && serviceRecordIdMatch[1]) {
      serviceRecordIdForDownloadUrl = serviceRecordIdMatch[1];
    }

    if (prepareTicketMatch && prepareTicketMatch[1]) {
      prepareTicketForDownloadUrl = prepareTicketMatch[1];
    }

    if (downloadUrlMatch && downloadUrlMatch[1]) {
      baseDownloadUrl = downloadUrlMatch[1];
    }

    const myHeadersDirectDownload = new Headers();
    myHeadersDirectDownload.append(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0"
    );
    myHeadersDirectDownload.append(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    );

    myHeadersDirectDownload.append(
      "Referer",
      `${process.env.ORIGIN}/mw3300/mywebex/nbrshared.do`
    );

    let directDownloadResponse = await fetch(
      `${process.env.ORIGIN}/mw3300/mywebex/nbrPrepare.do?siteurl=${process.env.SITE_URL}&recordid=${recordIdForDownloadUrl}&prepareTicket=${prepareTicketForDownloadUrl}&serviceRecordId=${serviceRecordIdForDownloadUrl}`
    );

    let parsedDirectDownloadResponse = await directDownloadResponse.text();

    const regexDirectDownloadUrl =
      /window\.parent\.func_prepare\('([^']*)','([^']*)','([^']*)'/;
    const directDownloadUrl = parsedDirectDownloadResponse.match(
      regexDirectDownloadUrl
    );

    const finalUrl = baseDownloadUrl + directDownloadUrl[3];
    recordingsWithDirectUrl.push({
      downloadUrl: finalUrl,
      name: recordingsList[i].topic,
    });
  }
  console.log("Finished genrerating download urls for recordings");
  return recordingsWithDirectUrl;
}

// TODO:: Exception handelling

module.exports = {
  genrateDownloadUrl,
};
