export default async function handler(req, res) {
  try {
    const From = req.body?.From || req.query?.From;
    const CallStatus = req.body?.CallStatus || req.query?.CallStatus;

    console.log("Incoming call from:", From);
    console.log("Call status:", CallStatus);

    if (From && CallStatus !== "completed") {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: "Hey! Sorry we missed your call — are you looking for a storage unit? What size?",
        from: process.env.TWILIO_PHONE_NUMBER,
        to: From,
      });

      console.log("Auto-text sent");
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
