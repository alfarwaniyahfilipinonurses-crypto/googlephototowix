const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

// Parse secrets & environment variables
const ALBUM_ID = process.env.ALBUM_ID; // your Google Photos album ID
const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;

// Initialize Google Photos API
let photos = [];
try {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"]
  });
  const photoslibrary = google.photoslibrary({ version: "v1", auth });

  photos = async () => {
    const res = await photoslibrary.mediaItems.search({ requestBody: { albumId: ALBUM_ID } });
    return res.data.mediaItems || [];
  };
} catch (err) {
  console.error("Google Photos init failed:", err);
}

// Endpoint to return album items
app.get("/", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    const items = await photos();
    const output = items.map(i => ({
      url: i.baseUrl + "=w800", // resized
      mimeType: i.mimeType,
      filename: i.filename
    }));
    res.json(output);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
