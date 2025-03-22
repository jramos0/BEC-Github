import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import githubAuth from './githubAuth';
import resourceParser from "./resourceParser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post("/", (req, res)=>{
  console.log("Data received!");
  res.status(500).send("OK");
  resourceParser(req.body)
});

app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

app.use('/', githubAuth);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
