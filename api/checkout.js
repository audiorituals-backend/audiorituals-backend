export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // Webflow bazen JSON'u otomatik decode eder
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { priceId, trackId } = body || {};

    return res.json({
      ok: true,
      priceId,
      trackId,
      note: "Stripe henüz bağlanmadı"
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
