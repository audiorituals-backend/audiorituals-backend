import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { trackId } = JSON.parse(req.body);

    if (!trackId) {
      return res.status(400).json({ error: "Track ID missing" });
    }

    // Webflow CMS’de kayıtlı fiyat ID’sini getiriyoruz
    // Eğer Webflow’dan "Stripe Price ID" gönderiyorsan direkt kullanabiliriz
    const priceId = trackId; // Eğer trackId = Stripe Price ID ise

    // Stripe Checkout Session oluştur
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: "https://www.audiorituals.io/success",
      cancel_url: "https://www.audiorituals.io/cancel",
    });

    return res.status(200).json({
      ok: true,
      url: session.url
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Checkout error" });
  }
}
