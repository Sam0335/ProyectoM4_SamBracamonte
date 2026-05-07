import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';


const client = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export default async function handler(req: any, res: any) {

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ message: 'Faltan datos' });
    }


    try {
        const { to, subject, body } = req.body;

        const command = new SendEmailCommand({
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Charset: 'UTF-8', Data: subject },
                Body: { Text: { Charset: 'UTF-8', Data: body } },
            },
            Source: process.env.AWS_VERIFIED_EMAIL!,
        });

        await client.send(command);
        return res.status(200).json({ message: "Email enviado!" });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Error al enviar el email' });
    }
}