export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }
  const { priceId, trackId } = JSON.parse(req.body || "{}");
  return res.json({ ok: true, priceId, trackId, note: "Stripe henüz bağlanmadı" });
}