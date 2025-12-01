export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "https://www.audiorituals.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS isteği (tarayıcının preflight kontrolü)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sadece POST'a izin ver
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Request body
  const { priceId, trackId } = JSON.parse(req.body || "{}");

  return res.json({
    ok: true,
    priceId,
    trackId,
    note: "Stripe henüz bağlanmadı",
  });
}
