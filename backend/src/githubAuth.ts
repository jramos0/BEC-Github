import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as crypto from 'crypto';

dotenv.config();

const router: Router = express.Router();

const CLIENT = process.env.GITHUB_CLIENT_ID;
const SECRET = process.env.GITHUB_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string; 
const IV_LENGTH = 16;

const usedCodes = new Set<string>();

router.use(cors());
router.use(express.json());

function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptToken(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift() as string, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

router.get('/getAccessToken', async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ error: "No code provided" });
    return;
  }

  if (usedCodes.has(code)) {
    console.warn("⚠️ Este code ya fue usado:", code);
    res.status(400).json({ error: "Code already used" });
    return;
  }

  usedCodes.add(code);

  const params = `?client_id=${CLIENT}&client_secret=${SECRET}&code=${code}`;

  try {
    const response = await fetch("https://github.com/login/oauth/access_token" + params, {
      method: 'POST',
      headers: {
        Accept: "application/json"
      }
    });

    const data = await response.json();
    console.log("✅ Access token obtenido:", data);

    // Utilizamos cifrado reversible (AES‑256‑CBC)
    if (data.access_token) {
      data.access_token = encryptToken(data.access_token);
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener el access_token:", error);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

router.get('/getUserData', async (req: Request, res: Response): Promise<void> => {
  // Se espera que el header Authorization tenga el token cifrado
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    res.status(400).json({ error: "No Authorization header provided" });
    return;
  }

  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(400).json({ error: "Invalid Authorization header format" });
    return;
  }

  const encryptedToken = parts[1];

  let decryptedToken: string;
  try {
    decryptedToken = decryptToken(encryptedToken);
  } catch (error) {
    console.error("❌ Error al desencriptar el access_token:", error);
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  // Utilizar el token descifrado para obtener los datos del usuario de GitHub
  try {
    const response = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${decryptedToken}`
      }
    });

    const data = await response.json();
    console.log("✅ Datos del usuario:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener datos del usuario:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});


export default router;