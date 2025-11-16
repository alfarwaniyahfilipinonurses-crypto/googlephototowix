import express from "express";
import { google } from "googleapis";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", async (req, res) => {
  try {
    console.log("🔍 Starting Google Drive folder read...");

    const folderId = process.env.DRIVE_FOLDER_ID;
    const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;

    if (!folderId) {
      console.log("❌ Missing DRIVE_FOLDER_ID");
      return res.status(400).json({ error: "Missing DRIVE_FOLDER_ID" });
    }

    if (!serviceAccountJson) {
      console.log("❌ Missing SERVICE_ACCOUNT_JSON");
      return res.status(400).json({ error: "Missing SERVICE_ACCOUNT_JSON" });
    }

    console.log("🔑 Authenticating with service account...");

    const credentials = JSON.parse(serviceAccountJson);

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"]
    });

    const drive = google.drive({ version: "v3", auth });

    console.log("📁 Fetching files from folder:", folderId);

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, mimeType)"
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      console.log("⚠ No images found in folder.");
      return res.json([]);
    }

    console.log(`📸 Found ${files.length} images.`);

    const imageUrls = files.map(f => ({
      id: f.id,
      name: f.name,
      viewUrl: `https://drive.google.com/uc?export=view&id=${f.id}`,
      thumbnail: `https://drive.google.com/thumbnail?id=${f.id}`
    }));

    res.json(imageUrls);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
