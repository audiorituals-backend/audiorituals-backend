import Stripe from "stripe";
import getRawBody from "raw-body";
import { R2 } from "../../utils/r2"; 

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let event;
  const signature = req.headers["stripe-signature"];

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook doğrulama hatası:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ---- EVENT: Ödeme tamamlandı ---- //
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details.email;
    const priceId = session.metadata.priceId;
    const trackId = session.metadata.trackId;

    console.log("💳 Ödeme tamamlandı:", email, priceId, trackId);

    // --- R2’den dosya al ---
    const fileBuffer = await R2.getFile(`${trackId}.zip`);

    if (!fileBuffer) {
      console.error("❌ Dosya bulunamadı:", trackId);
      return res.status(500).send("File not found");
    }

    // ---- MÜŞTERİYE MAIL → ürün gönder ---- //
    await sendEmail({
      to: email,
      subject: "Audio Rituals - Download Link",
      text: "Teşekkürler! Ürününüz hazır.",
      attachments: [
        {
          filename: `${trackId}.zip`,
          content: fileBuffer,
        },
      ],
    });

    console.log("📨 Email gönderildi:", email);
  }

  res.status(200).json({ received: true });
}
