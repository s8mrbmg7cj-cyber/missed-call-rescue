// api/submit.js

const twilio = require("twilio");
const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {

  // ── CORS headers — must be first ──────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ── Preflight check ───────────────────────────────
  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  // ── Only allow POST ───────────────────────────────
  if (req.method !== "POST") {
    console.log("❌ Wrong method:", req.method);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  console.log("✅ Form submission received");

  // ── Pull form fields from body ────────────────────
  const name         = req.body?.name         || "";
  const businessName = req.body?.businessName || "";
  const phone        = req.body?.phone        || "";
  const email        = req.body?.email        || "";
  const callsPerWeek = req.body?.callsPerWeek || "Not specified";

  console.log("📋 Lead data:", { name, businessName, phone, email, callsPerWeek });

  // ── Validate required fields ──────────────────────
  if (!name || !businessName || !phone || !email) {
    console.log("❌ Validation failed — missing fields");
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // ── Build the message ─────────────────────────────
  const leadMessage =
    `🚨 NEW LEAD — Missed Call Rescue\n\n` +
    `Name: ${name}\n` +
    `Business: ${businessName}\n` +
    `Phone: ${phone}\n` +
    `Email: ${email}\n` +
    `Calls/week: ${callsPerWeek}`;

  let smsSent   = false;
  let emailSent = false;

  // ── SMS via Twilio ────────────────────────────────
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const toNumber   = process.env.NOTIFY_PHONE;

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      console.log("⚠️ Twilio env vars missing — skipping SMS");
    } else {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body: leadMessage,
        from: fromNumber,
        to: toNumber,
      });
      smsSent = true;
      console.log("✅ SMS sent");
    }
  } catch (err) {
    console.log("❌ Twilio error:", err.message);
  }

  // ── Email via Gmail ───────────────────────────────
  try {
    const gmailUser   = process.env.GMAIL_USER;
    const gmailPass   = process.env.GMAIL_APP_PASSWORD;
    const notifyEmail = process.env.NOTIFY_EMAIL;

    if (!gmailUser || !gmailPass || !notifyEmail) {
      console.log("⚠️ Email env vars missing — skipping email");
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
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
                <td style="padding:12px 0;color:#fff;font-weight:500;">${callsPerWeek}</td>
              </tr>
            </table>
            <div style="margin-top:28px;padding:16px;background:rgba(45,126,248,0.12);border:1px solid rgba(45,126,248,0.2);border-radius:8px;font-size:13px;color:rgba(240,244,255,0.6);">
              Submitted via Missed Call Rescue landing page
            </div>
          </div>
        `,
      });
      emailSent = true;
      console.log("✅ Email sent");
    }
  } catch (err) {
    console.log("❌ Email error:", err.message);
  }

  console.log(`📊 Result — SMS: ${smsSent}, Email: ${emailSent}`);

  // ── Always return JSON ────────────────────────────
  return res.status(200).json({ success: true });

};
