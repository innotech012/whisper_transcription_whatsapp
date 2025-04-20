import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const token = process.env.WHATSAPP_TOKEN;


const projectRoot = path.resolve(__dirname, "..");

export default async function downloadAudio(mediaId : string) {

    const audioUrl = await getAudioUrl(mediaId);

    console.log('Audio URL:', audioUrl);


    const response = await fetch(audioUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = path.join(projectRoot, "audio", `${mediaId}.ogg`);
;
    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('File written successfully:', filePath);
        }
    });
    return filePath;

}


async function getAudioUrl(mediaId : string) {

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${mediaId}/`,
      {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
      }
    
    );
    console.log('Response:', response);
    const data = await response.json();
    return data.url;
}