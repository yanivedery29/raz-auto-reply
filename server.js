const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const AUTO_REPLY_ENABLED = process.env.AUTO_REPLY_ENABLED === "true";

const YOUR_TEST_PHONE = "972509119195";
const META_DUMMY_PHONE = "163155551181";

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

  console.log("Webhook GET received");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  console.log("====================================");
  console.log("Webhook POST received");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("====================================");

  try {
    if (!AUTO_REPLY_ENABLED) {
      console.log("Auto reply is disabled");
      return res.sendStatus(200);
    }

    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message?.from) {
      console.log("No incoming message found in payload");
      return res.sendStatus(200);
    }

    const incomingPhone = message.from;

    const replyToPhone =
      incomingPhone === META_DUMMY_PHONE ? YOUR_TEST_PHONE : incomingPhone;

    console.log("Incoming message from:", incomingPhone);
    console.log("Reply will be sent to:", replyToPhone);

    await axios.post(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: replyToPhone,
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

    console.log("Auto reply sent successfully");
    return res.sendStatus(200);
  } catch (error) {
    console.error("ERROR SENDING MESSAGE:");
    console.error(error.response?.data || error.message);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
