export default function handler(req, res) {
  const digit = req.body?.Digits || req.query?.Digits;

  let message = "We will text you the payment link shortly.";

  if (digit === "1") {
    message = "Thanks. We will text you the Bonham payment link shortly.";
  } else if (digit === "2") {
    message = "Thanks. We will text you the Highway 136 payment link shortly.";
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
</Response>`;

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(twiml);
}
