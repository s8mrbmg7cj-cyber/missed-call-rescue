import { Resend } from "resend";

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

  if (!name || !businessName || !phone || !email) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }

  console.log("=== NEW FORM SUBMISSION ===");
  console.log("Name:", name);
  console.log("Business:", businessName);
  console.log("Phone:", phone);
  console.log("Email:", email);
  console.log("Calls/week:", callsPerWeek);

  const apiKey = process.env.RESEND_API_KEY;
  console.log("ENV CHECK - RESEND_API_KEY:", apiKey ? "SET" : "MISSING");

  if (!apiKey) {
    console.log("EMAIL: skipping — RESEND_API_KEY is missing");
    return res.status(200).json({ success: true });
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "Missed Call Rescue <onboarding@resend.dev>",
      to: "andrewyoung02@icloud.com",
      subject: `New Lead: ${name} — ${businessName}`,
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
        </div>
      `,
    });

    if (error) {
      console.log("EMAIL ERROR:", error.message);
    } else {
      console.log("EMAIL: sent successfully — ID:", data?.id);
    }

  } catch (err) {
    console.log("EMAIL ERROR:", err.message);
  }

  return res.status(200).json({ success: true, message: "Form received successfully." });

}
