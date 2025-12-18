import Stripe from "stripe";

export default async function handler(req, res) {
    // --- 1. CORS Başlıkları ve OPTIONS Kontrolü ---
    // vercel.json bu başlıkları halletmeli ama kodda kalması güvenlidir.
    res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // OPTIONS preflight isteğini hemen döndür
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // --- 2. Method Kontrolü ---
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }
    
    // --- 3. Stripe Başlatma ---
    // Ortam değişkeni eksikse hata yakalanır
    if (!process.env.STRIPE_SECRET_KEY) {
        // Bu hata muhtemelen Vercel logs'ta görünür
        console.error("STRIPE_SECRET_KEY ortam değişkeni eksik.");
        return res.status(500).json({ error: "Server configuration error." });
    }
    
    // Stripe objesi handler içinde başlatılıyor (En güvenli yöntem)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

    try {
        // --- 4. Body Parse ve Doğrulama ---
        // Vercel'in body'yi doğru işlemesi için esnek parse
        const body =
            typeof req.body === "string" && req.body.length > 0
                ? JSON.parse(req.body)
                : req.body;

        const trackId = body?.trackId;

        if (!trackId) {
            return res.status(400).json({ error: "Track ID missing in request body." });
        }

        const priceId = trackId; 

        // --- 5. Stripe Checkout Session Oluşturma ---
        const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  metadata: {
    priceId: priceId, // 👈 BU ŞART
  },
  success_url: "https://www.audiorituals.io/success",
  cancel_url: "https://www.audiorituals.io/cancel",
});

        // Başarılı yanıt, kullanıcıyı Stripe'a yönlendirir
        return res.status(200).json({
            ok: true,
            url: session.url,
        });

    } catch (err) {
        // --- 6. Detaylı Hata Yakalama ---
        // Bu hata Vercel Logs'a yazılır (Örn: "No such price: price_1SYN...")
        console.error("CHECKOUT ERROR:", err.message); 
        
        // Frontend'e genel bir hata mesajı döndür
        return res.status(500).json({ 
            error: "Checkout failed: " + (err.message || 'Unknown error') 
        });
    }
}
