import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import resourceParser from "./resourceParser";
import githubAuth from './githubAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post("/", (req, res)=>{
  try{
  resourceParser(req.body)
  console.log("Data received!");
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
