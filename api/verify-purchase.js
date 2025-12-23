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
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { sessionId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Güvenlik kontrolü: E-posta uyuşuyor mu?
    if (session.customer_details.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "E-posta adresi hatalı!" });
    }

    // Dosya adını belirle (R2'deki isminiz)
    const fileName = "TiklaKazan01.zip";

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 saatlik geçici link
    res.status(200).json({ downloadUrl: url });
  } catch (err) {
    res.status(500).json({ error: "Doğrulama başarısız." });
  }
}
