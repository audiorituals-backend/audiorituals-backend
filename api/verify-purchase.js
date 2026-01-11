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
  // --- CORS AYARI ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, email } = req.body;

  try {
    // 1. Stripe'tan bu oturumu çek
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // 2. Güvenlik Kontrolü
    if (!session || session.customer_details.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "Email mismatch! Please use the email you used during checkout." });
    }

    // 3. Metadata içindeki priceId'yi kullanarak doğru dosyayı bul
    const priceId = session.metadata?.priceId;
    const productFiles = {
      "price_1SYN6O5PSxWy982NN4qY1tCQ": "Q-Verb-Mini.zip",
      "price_1SYN4V5PSxWy982NoG8RIfm7": "Q-Attenuation-Occlusion.zip", // Virgül eksikti, eklendi
      "price_1SijwA5PSxWy982Ny0PJwVYd": "Dantes-Inferno-Layer-I-Limbo-Sound-Collection-by-Audio-Rituals.zip"
    };

    const fileName = productFiles[priceId];

    if (!fileName) {
      console.error("Unknown priceId in session:", priceId);
      return res.status(404).json({ error: "Product file not found. Please contact support." });
    }

    // 4. R2'den imzalı (geçici) linki oluştur
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 }); 
    
    // 5. Linki geri gönder
    return res.status(200).json({ downloadUrl: url });

  } catch (err) {
    console.error("Verification error:", err.message);
    return res.status(500).json({ error: "Verification failed or invalid Session ID." });
  }
}
