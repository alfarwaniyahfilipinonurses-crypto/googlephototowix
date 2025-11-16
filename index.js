import express from "express";
import { google } from "googleapis";

const app = express();

// Use environment variables
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
if (!DRIVE_FOLDER_ID) {
  console.error("Missing DRIVE_FOLDER_ID environment variable.");
  process.exit(1);
}

const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;
if (!SERVICE_ACCOUNT_JSON) {
  console.error("Missing SERVICE_ACCOUNT_JSON environment variable.");
  process.exit(1);
}

// Initialize Google Drive API client
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

// Endpoint to get files
app.get("/", async (req, res) => {
  try {
    const response = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, webViewLink, thumbnailLink)",
      pageSize: 100,
    });

    const files = response.data.files || [];
    if (files.length === 0) {
      return res.status(200).json({ message: "No files found in the folder." });
    }

    // Return simplified info
    const fileList = files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      link: file.webViewLink,
      thumbnail: file.thumbnailLink || null,
    }));

    res.json(fileList);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Listen on the port provided by Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Drive gallery API running on port ${PORT}`);
});
