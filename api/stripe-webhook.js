import Stripe from 'stripe';
import sgMail from "@sendgrid/mail";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;

    console.log("Payment completed by:", customerEmail);

    // DİKKAT: Artık doğrudan downloadUrl oluşturmuyoruz.
    // Kullanıcıyı Webflow'daki indirme sayfasına, session ID ile gönderiyoruz.
    const webflowDownloadUrl = `https://audiorituals.com/download?sid=${session.id}`;

    await sgMail.send({
      from: "audioritualsyedek@gmail.com",
      to: customerEmail,
      subject: "Your Audio Rituals download is ready",
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Thank you for your purchase!</h2>
          <p>Hello,</p>
          <p>To access your products, please click the button below and verify your purchase email on the download page:</p>
          <p style="margin: 30px 0;">
            <a href="${webflowDownloadUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Go to Download Page
            </a>
          </p>
          <p>This link is permanent, you can use it whenever you need to download your files again.</p>
          <br>
          <p>Best regards,<br>Audio Rituals Team</p>
        </div>
      `,
    });

    console.log("Download page link sent to:", customerEmail);
  }

  res.status(200).json({ received: true });
}
