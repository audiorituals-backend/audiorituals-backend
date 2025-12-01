import Stripe from "stripe";

export default async function handler(req, res) {
    // --- CORS Başlıkları (vercel.json bu başlıkları zaten halledecek ama kodda kalması zarar vermez) ---
    res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io"); 
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }
    
    // Stripe objesi artık burada, handler içinde başlatılıyor
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

    try {
        // ... kodun geri kalanı ...
