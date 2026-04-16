export default async function handler(req, res) {
  try {
    const From = req.body?.From || req.query?.From;
    const Body = req.body?.Body || req.query?.Body;

    console.log("Reply from:", From);
    console.log("Message:", Body);

    res.status(200).send("Received");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
