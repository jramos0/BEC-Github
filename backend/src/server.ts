import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import resourceParser from "./utils/resourceParser";
import githubAuth from './githubAuth';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({storage : storage});

app.post("/", upload.single('thumbnail'), async (req, res)=>{
  try{
  console.log("Data received: ", req.body);
  resourceParser(req.body, req.file)
  res.status(200).send();
  } catch(error){
    console.error("Error receiving data: ", error);
    res.status(500).send();
  }
});

app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

app.use('/', githubAuth);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
