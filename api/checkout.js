import Stripe from "stripe";

export default async function handler(req, res) {
    // --- 1. CORS Başlıkları ---
    res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY ortam değişkeni eksik.");
        return res.status(500).json({ error: "Server configuration error." });
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

    try {
        // --- 4. Body Parse ve Doğrulama ---
        const body = typeof req.body === "string" && req.body.length > 0
                ? JSON.parse(req.body)
                : req.body;

        // BURASI ÖNEMLİ: Webflow'dan gelen email ve trackId bilgilerini alıyoruz
        const { trackId, email } = body; 

        if (!trackId || !email) {
            return res.status(400).json({ error: "Track ID or Email missing in request body." });
        }

        const priceId = trackId; 

        // --- 5. Stripe Checkout Session Oluşturma ---
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: email, // Müşterinin yazdığı maili ödeme sayfasına otomatik aktarır
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                priceId: priceId, // verify-purchase.js için şart
            },
            success_url: `https://www.audiorituals.io/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
            cancel_url: `https://www.audiorituals.io/cancel?session_id={CHECKOUT_SESSION_ID}`,
        });

        return res.status(200).json({
            ok: true,
            url: session.url,
        });

    } catch (err) {
        console.error("CHECKOUT ERROR:", err.message); 
        return res.status(500).json({ 
            error: "Checkout failed: " + (err.message || 'Unknown error') 
        });
    }
}
