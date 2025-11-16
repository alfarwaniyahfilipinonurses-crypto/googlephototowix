import { google } from "googleapis";

export const function = async (req, res) => {
  try {
    const ALBUM_ID = process.env.ALBUM_ID;
    const serviceAccountJSON = process.env.SERVICE_ACCOUNT_JSON;
    const serviceAccount = JSON.parse(serviceAccountJSON);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
    });

    const photos = google.photoslibrary({ version: "v1", auth });

    let items = [];
    let pageToken = null;

    do {
      const response = await photos.mediaItems.search({
        requestBody: {
          albumId: ALBUM_ID,
          pageSize: 100,
          pageToken: pageToken || undefined,
        },
      });

      if (response.data.mediaItems) items.push(...response.data.mediaItems);
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    const results = items.map((m) => ({
      url: m.baseUrl + "=w1600",
      mimeType: m.mimeType,
      filename: m.filename,
    }));

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Google Photos album.");
  }
};
