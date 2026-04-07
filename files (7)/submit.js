// api/submit.js
// Vercel serverless function — handles form submissions
// Sends SMS via Twilio + email via nodemailer (Gmail)

const twilio = require("twilio");
const nodemailer = require("nodemailer");

// ─── CORS helper ─────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCors(res);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const { name, businessName, phone, email, callsPerWeek } = req.body;

  // Basic validation
  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const errors = [];

  // ── Build the lead message ───────────────────────────────────────────────────
  const leadMessage =
    `🚨 NEW LEAD — Missed Call Rescue\n\n` +
    `Name: ${name}\n` +
    `Business: ${businessName}\n` +
    `Phone: ${phone}\n` +
    `Email: ${email}\n` +
    `Calls/week: ${callsPerWeek || "Not specified"}`;

  // ── SMS via Twilio ───────────────────────────────────────────────────────────
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER; // your Twilio number
    const toNumber   = process.env.NOTIFY_PHONE;        // 385-600-8134

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      throw new Error("Twilio environment variables are not fully configured");
    }

    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: leadMessage,
      from: fromNumber,
      to: toNumber,
    });

    console.log("✅ SMS sent successfully");
  } catch (err) {
    console.error("❌ Twilio SMS error:", err.message);
    errors.push("SMS notification failed");
    // Don't return early — still try email
  }

  // ── Email via nodemailer (Gmail) ─────────────────────────────────────────────
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const notifyEmail = process.env.NOTIFY_EMAIL;

    if (!gmailUser || !gmailPass || !notifyEmail) {
      throw new Error("Email environment variables are not fully configured");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass, // Gmail App Password (not your real password)
      },
    });

    await transporter.sendMail({
      from: `"Missed Call Rescue" <${gmailUser}>`,
      to: notifyEmail,
      subject: `🚨 New Lead: ${name} — ${businessName}`,
      text: leadMessage,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
          <div style="background:#2d7ef8;color:#fff;padding:8px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px;">
            🚨 New Lead
          </div>
          <h2 style="margin:0 0 24px;font-size:22px;color:#fff;">Missed Call Rescue</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:12px 0;color:rgba(240,244,255,0.5);font-size:13px;width:140px;">Name</td>
              <td style="padding:12px 0;color:#fff;font-weight:500;">${name}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:12px 0;color:rgba(240,244,255,0.5);font-size:13px;">Business</td>
              <td style="padding:12px 0;color:#fff;font-weight:500;">${businessName}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:12px 0;color:rgba(240,244,255,0.5);font-size:13px;">Phone</td>
              <td style="padding:12px 0;color:#fff;font-weight:500;">${phone}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:12px 0;color:rgba(240,244,255,0.5);font-size:13px;">Email</td>
              <td style="padding:12px 0;color:#fff;font-weight:500;">${email}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;color:rgba(240,244,255,0.5);font-size:13px;">Calls/week</td>
              <td style="padding:12px 0;color:#fff;font-weight:500;">${callsPerWeek || "Not specified"}</td>
            </tr>
          </table>
          <div style="margin-top:28px;padding:16px;background:rgba(45,126,248,0.12);border:1px solid rgba(45,126,248,0.2);border-radius:8px;font-size:13px;color:rgba(240,244,255,0.6);">
            Submitted via Missed Call Rescue landing page
          </div>
        </div>
      `,
    });

    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Email error:", err.message);
    errors.push("Email notification failed");
  }

  // ── Respond to frontend ──────────────────────────────────────────────────────
  if (errors.length === 2) {
    // Both SMS and email failed — tell frontend something went wrong
    return res.status(500).json({
      success: false,
      error: "Notification delivery failed. Please try again.",
    });
  }

  // At least one channel succeeded — form is captured
  return res.status(200).json({ success: true });
};
