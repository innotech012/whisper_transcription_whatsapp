import express, { Request, Response, Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import BodyParser  from "body-parser";
import downloadAudio from "./functions/DownloadAudio";
import transcribeAudio from "./functions/transcribe";

import Respond from "./functions/Respond";
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

const processedMessageIds = new Set<string>();

app.use(cors());
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

const expectedToken = process.env.EXPECTED_TOKEN;

const token = process.env.WHATSAPP_TOKEN;

if (!token) {
  console.error("WHATSAPP_TOKEN is not defined in the environment variables.");
  process.exit(1);
}


app.get("/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const verifyToken = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;


  if (mode === "subscribe" && verifyToken === expectedToken) {

    res.status(200).send(challenge);
  } else {
    res.status(403).send("Invalid verify token"); 
  }
});

app.post("/whatsapp", async (req: Request, res: Response) : Promise<any> => {
  const body = req.body;

  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(200).send("No valid message to process.");
  }

  const message = messages[0];

  if (!message.audio || !message.from) {
    return res.status(200).send("Not an audio message.");
  }


  if (processedMessageIds.has(message.id)) {
    console.log("Duplicate message, ignoring:", message.id);
    return res.status(200).send("Duplicate message.");
  }

  processedMessageIds.add(message.id);

  setTimeout(() => processedMessageIds.delete(message.id), 5 * 60 * 1000);

  try {
    const sender = message.from;
    const audio = message.audio;

    console.log("Processing message id:", message.id);

    const audioPath = await downloadAudio(audio.id);
    console.log("Audio file downloaded to:", audioPath);

    const transcription = await transcribeAudio(audioPath);

    const response = await Respond(transcription, sender);

    if (!response) {
      console.error("Failed to send response");
      return res.status(500).send("Failed to send response");
    }

    console.log("Response sent successfully");
    return res.status(200).send("Response sent");
  } catch (error) {
    console.error("Error handling WhatsApp message:", error);
    return res.status(500).send("Internal server error");
  }
});



app.get("/", (req: Request, res: Response) => {

    res.json({
        message: "Welcome to Express & TypeScript Server",
        status: 200,
    });
});




app.listen(port, () => {
  console.log(`Server is Fire at https://localhost:${port}`);
});