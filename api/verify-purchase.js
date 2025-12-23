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
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- CORS AYARI BİTİŞ ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, email } = req.body;

  try {
    // 1. Stripe'tan bu oturumu çek
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // 2. Güvenlik: Girilen mail ile satın alan mail uyuşuyor mu?
    if (session.customer_details.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "Email mismatch! Please use the email you used during checkout." });
    }

    // 3. Metadata içindeki priceId'yi kullanarak doğru dosyayı bul
    const priceId = session.metadata?.priceId;
    const productFiles = {
      "price_1SZpfp5PSxWy982NJ3mXWVOH": "Q-Verb-Mini.zip",
      "price_1SZpe45PSxWy982NMK8jmatt": "Q-Attenuation-Occlusion.zip"
    };

    const fileName = productFiles[priceId];

    if (!fileName) {
      console.error("Unknown priceId in session:", priceId);
      return res.status(404).json({ error: "Product file not found. Please contact support." });
    }

    // 4. R2'den imzalı (geçici) linki oluştur
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName, // R2'deki gerçek dosya adı
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 saat geçerli link
    
    // 5. Linki Webflow'a geri gönder
    res.status(200).json({ downloadUrl: url });

  } catch (err) {
    console.error("Verification error:", err.message);
    res.status(500).json({ error: "Verification failed or invalid Session ID." });
  }
}
