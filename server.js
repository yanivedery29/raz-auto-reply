const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = "1182444134949873";

const AUTO_REPLY_MESSAGE = `שלום ותודה שפניתם לרז תיקון תריסים.

רז נמצא כרגע בשירות מילואים ואינו זמין.

לקבלת שירות ניתן לפנות ליהושוע בטלפון 052-360-7070.

תודה והמשך יום נעים.`;

app.get("/", (req, res) => {
  res.send("Raz Auto Reply Server is running");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.from) {
      const customerPhone = message.from;

      console.log("Incoming message from:", customerPhone);

      await axios.post(
        `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "text",
          text: {
            body: AUTO_REPLY_MESSAGE,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Auto reply sent");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending auto reply:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
