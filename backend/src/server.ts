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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/", upload.single("thumbnail"), async (req, res)=>{
  try{
  console.log("📨 Data received: ", req.body);
  await resourceParser(req.body, req.file);;
  res.status(200).send();
  } catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).send(res.json);
  }
});

app.post("/upload-tutorial", upload.fields([{name: 'thumbnail'}, {name: 'stepsImages'}]), async (req, res)=>{
  try{
    console.log("Data received: ", req.body);    
    const files = req.files as { [key: string]: Express.Multer.File[] };
    const thumbnail = files?.["thumbnail"]?.[0];
    const stepsImages = files?.["stepsImages"] || []
    const prResponse = await resourceParser(req.body, thumbnail, stepsImages);
    res.status(200).send();
  } catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).send(res.json);
  }
});

app.post("/edit-resource", async (req, res) => {
  try{  
    console.log("📨 Data received for edit: ", req.body);
    editedResourceParser(req.body);
    res.status(200).send();
  }catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).send(res.json);
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
  const token = req.get("Authorization")?.replace("Bearer ", "");

  if (!token || typeof url !== "string" || typeof username !== "string") {
    res.status(400).json({ error: "Missing parameters or invalid token" });
    return;
  }

  try {
    const path = extractPathFromUrl(url);
    console.log("📄 Final path resolved:", path);

    const content = await fetchFileFromUserFork(path, token, username);
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
