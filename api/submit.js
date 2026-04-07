import twilio from "twilio";
import nodemailer from "nodemailer";

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  let name = "";
  let businessName = "";
  let phone = "";
  let email = "";
  let callsPerWeek = "Not specified";

  try {
    name         = req.body?.name         || "";
    businessName = req.body?.businessName || "";
    phone        = req.body?.phone        || "";
    email        = req.body?.email        || "";
    callsPerWeek = req.body?.callsPerWeek || "Not specified";
  } catch (err) {
    return res.status(400).json({ success: false, error: "Could not read form data." });
  }

  console.log("=== NEW FORM SUBMISSION ===");
  console.log("Name:", name);
  console.log("Business:", businessName);
  console.log("Phone:", phone);
  console.log("Email:", email);
  console.log("Calls/week:", callsPerWeek);
  console.log("===========================");

  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }

  const leadMessage =
    `NEW LEAD - Missed Call Rescue\n\n` +
    `Name: ${name}\n` +
    `Business: ${businessName}\n` +
    `Phone: ${phone}\n` +
    `Email: ${email}\n` +
    `Calls/week: ${callsPerWeek}`;

  // ── Twilio SMS ──────────────────────────────────────────
  try {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_PHONE_NUMBER;
    const to    = process.env.NOTIFY_PHONE;

    if (!sid || !token || !from || !to) {
      console.log("TWILIO: env vars missing, skipping SMS");
    } else {
      const client = twilio(sid, token);
      await client.messages.create({
        body: leadMessage,
        from: from,
        to: to,
      });
      console.log("TWILIO: SMS sent successfully to", to);
    }
  } catch (err) {
    console.log("TWILIO ERROR:", err.message);
  }

  // ── Email via Gmail ─────────────────────────────────────
  try {
    const gmailUser   = process.env.GMAIL_USER;
    const gmailPass   = process.env.GMAIL_APP_PASSWORD;
    const notifyEmail = process.env.NOTIFY_EMAIL;

    if (!gmailUser || !gmailPass || !notifyEmail) {
      console.log("EMAIL: env vars missing, skipping email");
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"Missed Call Rescue" <${gmailUser}>`,
        to: notifyEmail,
        subject: `New Lead: ${name} — ${businessName}`,
        text: leadMessage,
        html: `
          <div style="font-family:sans-serif;max-width:500px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
            <div style="background:#2d7ef8;color:#fff;padding:8px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:24px;">
              New Lead
            </div>
            <h2 style="margin:0 0 24px;color:#fff;">Missed Call Rescue</h2>
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
          </div>
        `,
      });
      console.log("EMAIL: sent successfully to", notifyEmail);
    }
  } catch (err) {
    console.log("EMAIL ERROR:", err.message);
  }

  return res.status(200).json({ success: true, message: "Form received successfully" });

}
