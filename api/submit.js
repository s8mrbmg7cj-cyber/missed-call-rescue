import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({ success: true });
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed." });

  let name = "", businessName = "", phone = "", email = "", callsPerWeek = "Not specified";

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
  console.log("Name:", name, "| Business:", businessName);

  // Save to Supabase
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );
    const { error } = await supabase.from("form_submissions").insert({
      name,
      business_name: businessName,
      phone,
      email,
      calls_per_week: callsPerWeek
    });
    if (error) console.log("SUPABASE ERROR:", error.message);
    else console.log("SUPABASE: saved successfully");
  } catch (err) {
    console.log("SUPABASE ERROR:", err.message);
  }

  // Send push notification via Ntfy
  try {
    const ntfyTopic = process.env.NTFY_TOPIC;
    if (ntfyTopic) {
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          "Title": `New Lead: ${name}`,
          "Priority": "high",
          "Tags": "bell",
          "Content-Type": "text/plain"
        },
        body: `Business: ${businessName}\nPhone: ${phone}\nEmail: ${email}\nCalls/week: ${callsPerWeek}`
      });
      console.log("NTFY: push notification sent");
    } else {
      console.log("NTFY: topic not set — skipping");
    }
  } catch (err) {
    console.log("NTFY ERROR:", err.message);
  }

  // Send email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Missed Call Rescue <onboarding@resend.dev>",
      to: process.env.NOTIFY_EMAIL,
      subject: `New Lead: ${name} — ${businessName}`,
      html: `<div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;"><h2 style="color:#fff;margin:0 0 20px;">New Lead</h2><p><strong style="color:#fff;">Name:</strong> ${name}</p><p><strong style="color:#fff;">Business:</strong> ${businessName}</p><p><strong style="color:#fff;">Phone:</strong> ${phone}</p><p><strong style="color:#fff;">Email:</strong> ${email}</p><p><strong style="color:#fff;">Calls/week:</strong> ${callsPerWeek}</p></div>`,
    });
    console.log("EMAIL: sent successfully");
  } catch (err) {
    console.log("EMAIL ERROR:", err.message);
  }

  return res.status(200).json({ success: true, message: "Form received successfully." });
}
