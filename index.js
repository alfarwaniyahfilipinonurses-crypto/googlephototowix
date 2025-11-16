import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());

// ENVIRONMENT VARIABLES
const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

if (!SERVICE_ACCOUNT_JSON || !DRIVE_FOLDER_ID) {
  console.error("Missing SERVICE_ACCOUNT_JSON or DRIVE_FOLDER_ID.");
  process.exit(1);
}

const credentials = JSON.parse(SERVICE_ACCOUNT_JSON);

// Authenticate Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

// Fetch images from Drive folder
app.get("/drive-images", async (req, res) => {
  try {
    const files = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, mimeType)",
    });

    if (!files.data.files.length) {
      return res.json({ images: [] });
    }

    // Generate temporary download URLs
    const images = await Promise.all(
      files.data.files.map(async (file) => {
        const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
        return { id: file.id, name: file.name, url };
      })
    );

    res.json({ images });
  } catch (error) {
    console.error("Drive fetch error:", error);
    res.status(500).json({ error: "Failed to load Google Drive images." });
  }
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Server running on port", port));
