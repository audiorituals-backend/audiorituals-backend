import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { trackId } = req.body || {};

  if (!trackId) {
    return res.status(400).json({ error: "Missing trackId" });
  }

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const fileKey = `${trackId}.zip`;

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: 600, // 10 dakika geçerli
    });

    return res.status(200).json({
      ok: true,
      downloadUrl: signedUrl,
    });

  } catch (err) {
    console.error("R2 ERROR:", err);
    return res.status(500).json({
      error: "Signed URL oluşturulamadı.",
      details: err.message,
    });
  }
}
