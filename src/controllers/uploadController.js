const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    stream.end(buffer);
  });
}

async function uploadIssueImage(req, res) {
  if (!isCloudinaryConfigured) {
    res.status(500).json({ error: "Cloudinary is not configured on server." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Image file is required." });
    return;
  }

  const mime = String(req.file.mimetype || "").toLowerCase();
  if (!mime.startsWith("image/")) {
    res.status(400).json({ error: "Only image uploads are allowed." });
    return;
  }

  try {
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "careconnect/issues",
      resource_type: "image"
    });

    res.status(201).json({
      imageUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height
    });
  } catch (error) {
    console.error("Cloudinary upload failed", error.message);
    res.status(500).json({ error: "Failed to upload image." });
  }
}

module.exports = {
  uploadIssueImage
};
