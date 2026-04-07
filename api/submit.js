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
    return res.status(405).json({ success: false, error: "Method not allowed." });
  }

  // ── Read form fields ──
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

  // ── Validate ──
  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }

  console.log("=== NEW FORM SUBMISSION ===");
  console.log("Name:", name);
  console.log("Business:", businessName);
  console.log("Phone:", phone);
  console.log("Email:", email);
  console.log("Calls/week:", callsPerWeek);

  // ── Env var check ──
  const gmailUser   = process.env.GMAIL_USER;
  const gmailPass   = process.env.GMAIL_APP_PASSWORD;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  console.log("ENV CHECK - GMAIL_USER:", gmailUser ? "SET" : "MISSING");
  console.log("ENV CHECK - GMAIL_APP_PASSWORD:", gmailPass ? "SET" : "MISSING");
  console.log("ENV CHECK - NOTIFY_EMAIL:", notifyEmail ? "SET" : "MISSING");

  if (!gmailUser || !gmailPass || !notifyEmail) {
    console.log("EMAIL: skipping — one or more env vars missing");
    return res.status(200).json({ success: true, message: "Form received. Email skipped — env vars missing." });
  }

  // ── Send email ──
  try {
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
      text:
        `NEW LEAD — Missed Call Rescue\n\n` +
        `Name: ${name}\n` +
        `Business: ${businessName}\n` +
        `Phone: ${phone}\n` +
        `Email: ${email}\n` +
        `Calls/week: ${callsPerWeek}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
          <div style="background:#2d7ef8;color:#fff;padding:7px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px;">
            New Lead
          </div>
          <h2 style="margin:0 0 24px;font-size:20px;color:#fff;">Missed Call Rescue</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:11px 0;color:rgba(240,244,255,0.5);font-size:13px;width:130px;">Name</td>
              <td style="padding:11px 0;color:#fff;font-weight:600;">${name}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:11px 0;color:rgba(240,244,255,0.5);font-size:13px;">Business</td>
              <td style="padding:11px 0;color:#fff;font-weight:600;">${businessName}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:11px 0;color:rgba(240,244,255,0.5);font-size:13px;">Phone</td>
              <td style="padding:11px 0;color:#fff;font-weight:600;">${phone}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
              <td style="padding:11px 0;color:rgba(240,244,255,0.5);font-size:13px;">Email</td>
              <td style="padding:11px 0;color:#fff;font-weight:600;">${email}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;color:rgba(240,244,255,0.5);font-size:13px;">Calls/week</td>
              <td style="padding:11px 0;color:#fff;font-weight:600;">${callsPerWeek}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:14px 16px;background:rgba(45,126,248,0.1);border:1px solid rgba(45,126,248,0.2);border-radius:8px;font-size:12px;color:rgba(240,244,255,0.5);">
            Submitted via Missed Call Rescue landing page
          </div>
        </div>
      `,
    });

    console.log("EMAIL: sent successfully to", notifyEmail);

  } catch (err) {
    console.log("EMAIL ERROR:", err.message);
    return res.status(200).json({ success: true, message: "Form received but email failed." });
  }

  return res.status(200).json({ success: true, message: "Form received successfully." });

}
