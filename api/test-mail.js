import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    await sgMail.send({
      to: 'audioritualsyedek@gmail.com',
      from: 'audioritualsyedek@gmail.com',
      subject: 'SendGrid Test Mail',
      text: 'Bu bir test mailidir',
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
