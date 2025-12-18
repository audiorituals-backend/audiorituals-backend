import Stripe from 'stripe';
import sgMail from "@sendgrid/mail";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const customerEmail = session.customer_details?.email;
    const priceId = session.metadata?.priceId;

    console.log("Payment completed by:", customerEmail);
    console.log("Purchased Price ID:", priceId);

    const productFiles = {
      "price_1SZpfp5PSxWy982NJ3mXWVOH": "TiklaKazan01.zip",
      "price_1SZpe45PSxWy982NMK8jmatt": "TiklaKazan01.zip"
    };

    const fileName = productFiles[priceId];

    if (!fileName) {
      console.log("Unknown priceId:", priceId);
      return res.status(200).json({ received: true });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
    });

    const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 21600 });

    await sgMail.send({
      from: "audioritualsyedek@gmail.com",
      to: customerEmail,
      subject: "Your download is ready",
      html: `
        <p>Hello,</p>
        <p>Thank you for your purchase! You can download your product using the link below:</p>
        <p><a href="${downloadUrl}">Download Product</a></p>
        <p>This link will expire in 6 hours.</p>
        <br>
        <p>Audio Rituals</p>
      `,
    });

    console.log("Download email sent to:", customerEmail);
  }

  res.status(200).json({ received: true });
}
