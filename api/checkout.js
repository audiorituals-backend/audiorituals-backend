import Stripe from "stripe"; // BU SATIRI BIRAKIN

export default async function handler(req, res) {
    // --- 1. CORS Ayarı ---
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // --- SADECE ÇALIŞIP ÇALIŞMADIĞINI KONTROL ETMEK İÇİN GEÇİCİ KOD ---
    
    // Test amacıyla Stripe'ı kullanmadan direkt bir yanıt dönelim.
    return res.status(200).json({ 
        ok: true, 
        message: "Backend calisiyor!", 
        url: "https://www.audiorituals.io/success" 
    });

    // --- KODUNUZUN GERİ KALANI BU YERE GELECEK ---
}
