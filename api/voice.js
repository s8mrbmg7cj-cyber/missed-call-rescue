export default function handler(req, res) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="https://missed-call-rescue-nu.vercel.app/api/menu" method="POST">
    <Say voice="Polly.Joanna">
      Hello, and thank you for calling.
      We can help with storage rentals, payments, move out requests, and customer service.
      Press 1 for rentals.
      Press 2 for payments.
      Press 3 for customer service.
      Press 4 for move out.
      Press 5 for a representative.
    </Say>
  </Gather>
  <Say voice="Polly.Joanna">We did not receive a selection. Goodbye.</Say>
</Response>`;

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(twiml);
}
