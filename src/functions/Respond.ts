export default async function Respond(transcription: string, number: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: number,
          type: "text",
          text: {
            body: `${transcription}`,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error sending message:", error);
        return false;
    }

    return true;
}