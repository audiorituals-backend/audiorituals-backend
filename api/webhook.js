export default function handler(req, res) {
  return res.json({ ok: true, message: "Webhook endpoint hazır, Stripe bağlanınca çalışacak." });
}