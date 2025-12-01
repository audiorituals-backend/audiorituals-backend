import Stripe from "stripe";

export default async function handler(req, res) {
  // --- 1. Dinamik CORS Ayarı ---
  // Gelen isteğin origin'ini al, izin verilenlerden biri mi kontrol et
  const allowedOrigins = [
    "https://www.audiorituals.io",
    "https://audiorituals.io",
    "https://audio-rituals.design.webflow.io" // Webflow staging domainin (tahmini)
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Test aşamasında kolaylık olsun diye şimdilik herkese izin verelim (Sonra kapatırsın)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- 2. OPTIONS İsteğini Karşıla ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- 3. Method Kontrolü ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // --- 4. Stripe Key Kontrolü ---
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing in Vercel Environment Variables");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const trackId = body?.trackId;

    if (!trackId) {
      return res.status(400).json({ error: "Track ID missing in request body" });
    }

    console.log("Creating session for:", trackId); // Loglara yazdırmak debug için iyidir

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: trackId,
          quantity: 1,
        },
      ],
      success_url: "https://www.audiorituals.io/success", // Webflow'da bu sayfayı yaptığından emin ol
      cancel_url: "https://www.audiorituals.io", // İptal ederse ana sayfaya dönsün
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    // Vercel Loglarına hatayı detaylı yazdır
    console.error("DETAILED ERROR:", err.message);
    
    // Frontend'e de hatayı (güvenli şekilde) dön
    return res.status(500).json({ 
      error: "Checkout failed", 
      details: err.message 
    });
  }
}
