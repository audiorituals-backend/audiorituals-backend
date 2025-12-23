import Stripe from 'stripe';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // --- CORS AYARI BAŞLANGIÇ ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // İstersen buraya sadece https://www.audiorituals.io yazabilirsin
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- CORS AYARI BİTİŞ ---

  const { sessionId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.customer_details.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "E-posta adresi uyuşmuyor!" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: "TiklaKazan01.zip", 
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    res.status(200).json({ downloadUrl: url });
  } catch (err) {
    res.status(500).json({ error: "Doğrulama hatası veya geçersiz Session ID." });
  }
}
