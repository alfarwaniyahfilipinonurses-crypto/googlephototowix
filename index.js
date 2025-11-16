import express from "express";
import { google } from "googleapis";
import fs from "fs";

const app = express();

// Use environment variables
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
if (!DRIVE_FOLDER_ID) {
  console.error("Missing DRIVE_FOLDER_ID environment variable.");
  process.exit(1);
}

// Determine service account JSON source
const SERVICE_ACCOUNT_JSON_PATH = "/secrets/sa.json";

let SERVICE_ACCOUNT_JSON;

if (process.env.SERVICE_ACCOUNT_JSON) {
  // Local development: use environment variable
  SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;
} else if (fs.existsSync(SERVICE_ACCOUNT_JSON_PATH)) {
  // Cloud Run: use mounted secret file
  SERVICE_ACCOUNT_JSON = fs.readFileSync(SERVICE_ACCOUNT_JSON_PATH, "utf8");
} else {
  console.error(
    `Missing service account JSON. Provide SERVICE_ACCOUNT_JSON env or mount at ${SERVICE_ACCOUNT_JSON_PATH}`
  );
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
