// checkout.js dosyasını BAŞTAN düzenleyin

import Stripe from "stripe";

export default async function handler(req, res) {
    // --- 1. KOD: Sadece CORS Başlıklarını Buraya Koyun ---
    res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io"); 
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // --- 2. OPTIONS preflight isteğini hemen döndür ---
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    
    // --- Diğer kodlar burada başlar ---
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }
    
    // Stripe objesi artık try bloğundan önce, handler içinde başlatılıyor
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

    try {
        // ... kodun geri kalanı ...
        
        // ... session oluşturma ve yanıt dönme ...
    } catch (err) {
        // ... hata yakalama ...
    }
}
