export default function handler(req, res) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="https://missed-call-rescue-nu.vercel.app/api/rent-send" method="POST">
    <Say voice="alice">
      For Bonham, press 1. For Highway 136, press 2.
    </Say>
  </Gather>
  <Say voice="alice">We did not receive a selection. Goodbye.</Say>
</Response>`;

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(twiml);
}
