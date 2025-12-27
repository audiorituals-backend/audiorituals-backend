import Stripe from "stripe";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { trackId, email } = body; 

        // Mail veya Track ID yoksa hata döndür (Zorunluluk burada)
        if (!trackId || !email) {
            return res.status(400).json({ error: "Track ID or Email missing in request body." });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: email,
            line_items: [{ price: trackId, quantity: 1 }],
            metadata: { priceId: trackId },
            success_url: `https://www.audiorituals.io/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
            cancel_url: `https://www.audiorituals.io/cancel`,
        });

        return res.status(200).json({ ok: true, url: session.url });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
