const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors()); // allow all origins

const PORT = process.env.PORT || 8080;

// Environment variables
const ALBUM_ID = process.env.ALBUM_ID;
const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;

if (!ALBUM_ID) console.error("ALBUM_ID is not set!");
if (!SERVICE_ACCOUNT_JSON) console.error("SERVICE_ACCOUNT_JSON is not set!");

// Initialize Google Photos API safely (correct version)
let photoslibrary;
try {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"]
  });

  photoslibrary = google.photoslibrary({
    version: "v1",
    auth: auth
  });
} catch (err) {
  console.error("Google Photos API initialization failed:", err);
}

// Function to fetch media items
async function fetchPhotos() {
  if (!photoslibrary || !ALBUM_ID) return [];
  try {
    const res = await photoslibrary.mediaItems.search({
      requestBody: { albumId: ALBUM_ID }
    });
    return res.data.mediaItems || [];
  } catch (err) {
    console.error("Error fetching photos:", err);
    return [];
  }
}

// Endpoint to return album items
app.get("/", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    const items = await fetchPhotos();
    if (!items.length) return res.json({ message: "No photos found or failed to fetch." });

    const output = items.map(i => ({
      url: i.baseUrl + "=w800", // resize for display
      mimeType: i.mimeType,
      filename: i.filename
    }));

    res.json(output);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error fetching photos." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
