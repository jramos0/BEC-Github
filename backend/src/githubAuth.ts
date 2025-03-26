import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router: Router = express.Router();

const CLIENT = process.env.GITHUB_CLIENT_ID!;
const SECRET = process.env.GITHUB_CLIENT_SECRET!;

const usedCodes = new Set<string>();

router.use(cors());
router.use(express.json());

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
    const response = await fetch("https://www.github.com/login/oauth/access_token" + params, {
      method: 'POST',
      headers: {
        Accept: "application/json"
      }
    });

    const data = await response.json();
    console.log("✅ Access token obtenido:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener el access_token:", error);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

router.get('/getUserData', async (req: Request, res: Response): Promise<void> => {
  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: req.get("Authorization") as string
    }
  });

  const data = await response.json();
  console.log(data);
  res.json(data);
});

// ✅ Exportar solo el router
export default router;
