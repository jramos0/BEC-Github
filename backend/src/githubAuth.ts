import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const fetch = async (...args: Parameters<typeof import("node-fetch").default>) => {
  const { default: fetch } = await import("node-fetch");
  return fetch(...args);
};
var bodyParser = require('body-parser')
dotenv.config();

const app = express();

const CLIENT = process.env.GITHUB_CLIENT_ID
const SECRET = process.env.GITHUB_CLIENT_SECRET
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

app.get('/getAccessToken', async function (req, res) {
  req.query.code;

  const params = "?client_id=" + CLIENT + "&client_secret=" + SECRET + "&code=" + req.query.code;

  await fetch("https://www.github.com/login/oauth/access_token" + params, {
    method: 'POST',
    headers: {
      "Accept": "application/json"
    }

  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data)
    res.json(data);
  });
});

app.get('/getUserData', async function (req, res) {
  req.get('Authorization');
  await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      "Authorization": req.get("Authorization") as string
    }
  }).then((response) => {
    return response.json()
  }).then((data) => {
    console.log(data)
    res.json(data)
  })
})


export default app
