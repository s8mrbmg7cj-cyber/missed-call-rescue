export default function handler(req, res) {
  const digit = req.body?.Digits || req.query?.Digits;

  let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;

  if (digit === "1") {
    twiml += `
      <Gather numDigits="1" action="https://missed-call-rescue-nu.vercel.app/api/rent-location" method="POST">
        <Say voice="alice">
          For Bonham, press 1. For Highway 136, press 2.
        </Say>
      </Gather>
      <Say voice="alice">We did not receive a selection. Goodbye.</Say>
    `;
  } else if (digit === "2") {
    twiml += `
      <Gather numDigits="1" action="https://missed-call-rescue-nu.vercel.app/api/payment-location" method="POST">
        <Say voice="alice">
          For Bonham, press 1. For Highway 136, press 2.
        </Say>
      </Gather>
      <Say voice="alice">We did not receive a selection. Goodbye.</Say>
    `;
  } else if (digit === "3") {
    twiml += `
      <Say voice="alice">
        We will text you shortly for customer service support.
      </Say>
    `;
  } else if (digit === "4") {
    twiml += `
      <Say voice="alice">
        We will text you shortly with move out help.
      </Say>
    `;
  } else if (digit === "5") {
    twiml += `
      <Say voice="alice">
        Please hold while we connect you to a representative.
      </Say>
    `;
  } else {
    twiml += `
      <Say voice="alice">Invalid selection. Goodbye.</Say>
    `;
  }

  twiml += `</Response>`;

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(twiml);
}
