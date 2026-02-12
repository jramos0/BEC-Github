import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import resourceParser from "./utils/resourceParser.ts";
import editedResourceParser from "./utils/editedResourceParser.ts";
import githubAuth from './githubAuth.ts';
import githubManage from './githubManage.ts';
import branchManagement from './branchManagement.ts';
import { fetchFileFromUserFork } from './githubUtils.ts';
import { extractPathFromUrl } from './utils/pathUtils.ts';
import * as crypto from 'crypto';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

function normalizeIndexedArrays(body: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = { ...body };
  const arrayBuckets: Record<string, any[]> = {};

  for (const [key, value] of Object.entries(body)) {
    const match = key.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
    if (!match) continue;

    const [, field, indexStr] = match;
    const index = Number(indexStr);

    if (!arrayBuckets[field]) arrayBuckets[field] = [];
    arrayBuckets[field][index] = value;
    delete normalized[key];
  }

  for (const [field, values] of Object.entries(arrayBuckets)) {
    normalized[field] = values.filter((item) => item !== undefined);
  }

  if (typeof normalized.tags === "string") {
    normalized.tags = [normalized.tags];
  }
  if (typeof normalized.language === "string") {
    normalized.language = [normalized.language];
  }
  if (normalized.language1 || normalized.language2) {
    normalized.language = [normalized.language1, normalized.language2].filter(Boolean);
  }

  return normalized;
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

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/", upload.single("thumbnail"), async (req, res)=>{
  try{
  const normalizedBody = normalizeIndexedArrays(req.body);
  console.log("📨 Data received: ", normalizedBody);
  const parserResult = await resourceParser(normalizedBody, req.file);
  res.status(200).json({
    message: "Resource processed successfully",
    ...(parserResult?.prUrl && { prUrl: parserResult.prUrl }),
  });
  } catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

app.post("/upload-tutorial", upload.fields([{name: 'thumbnail'}, {name: 'logo'}, {name: 'stepsImages'}]), async (req, res)=>{
  try{
    const normalizedBody = normalizeIndexedArrays(req.body);
    console.log("Data received: ", normalizedBody);
    const files = req.files as { [key: string]: Express.Multer.File[] };
    const thumbnail = files?.["thumbnail"]?.[0];
    const logo = files?.["logo"]?.[0];
    const stepsImages = files?.["stepsImages"] || []
    const parserResult = await resourceParser(normalizedBody, thumbnail, stepsImages, logo);
    res.status(200).json({
      message: "Tutorial processed successfully",
      ...(parserResult?.prUrl && { prUrl: parserResult.prUrl }),
    });
  } catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

app.post("/edit-resource", async (req, res) => {
  try{  
    console.log("📨 Data received for edit: ", req.body);
    await editedResourceParser(req.body);
    res.status(200).json({ message: "Resource edited successfully" });
  }catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

app.get("/", (__req, res) => {
  res.send("Backend funcionando 🚀");
});

app.use("/", githubAuth);
app.use("/manage", githubManage);
app.use("/", branchManagement);

// GET: Load existing resource YAML
app.get("/api/load-file", async (req, res): Promise<void> => {
  const { url, username } = req.query;
 const authHeader = req.get("Authorization") as string;
  // En este ejemplo esperamos el formato "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'token') {
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
  if (!authHeader || typeof url !== "string" || typeof username !== "string") {
    res.status(400).json({ error: "Missing parameters or invalid token" });
    return;
  }

  try {
    const path = extractPathFromUrl(url);
    console.log("📄 Final path resolved:", path);

    const content = await fetchFileFromUserFork(path, decryptedToken, username);
    res.json({ content, path });

  } catch (err: any) {
    console.error("❌ Failed to load file:", err.message);
    if (err.status === 404) {
      res.status(404).json({ error: "Resource not found" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please free it or set a different PORT.`);
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});
