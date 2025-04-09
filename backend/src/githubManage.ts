import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router: Router = express.Router();
const usedCodes = new Set<string>();
const CLIENT = process.env.GITHUB_CLIENT_ID!;
const SECRET = process.env.GITHUB_CLIENT_SECRET!;

const UPSTREAM_OWNER = "jramos0"; 
const REPO = "BEC-Github";

router.use(cors());
router.use(express.json());

router.get('/forks', async (req: Request, res: Response): Promise<void>=>{
    const user = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          Authorization: req.get("Authorization") as string
        }
      });
    
    const Userdata = await user.json();
    try {
        console.log(`🔎 Verificando si el fork de ${UPSTREAM_OWNER}/${REPO} ya existe...`);
        const forkexists = await fetch(`https://api.github.com/repos/${Userdata.login}/${REPO}`,{
            method: "GET",
            headers:{
                Authorization: req.get("Authorization") as string
            }
        })

        if (!forkexists.ok) {
            if (forkexists.status === 404) {
                console.log(`🚀 Fork no encontrado, creando uno nuevo...`);
                const createForkResponse = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/forks`, {
                    method: "POST",
                    headers: {
                        Authorization: req.get("Authorization") as string,
                        'Content-Type': 'application/json'
                    }
                });
    
                if (createForkResponse.ok) {
                    console.log(`✅ Fork creado con éxito.`);
                    res.json(`https://github.com/${Userdata.login}/${REPO}`)
                } else {
                    const errorData = await createForkResponse.json();
                    throw new Error(`Error al crear el fork: ${errorData.message || createForkResponse.statusText}`);
                }
            } else {
                const errorData = await forkexists.json();
                throw new Error(`Error al verificar el fork: ${errorData.message || forkexists.statusText}`);
            }
        } else {
            const data = await forkexists.json();
            console.log(`✅ Fork encontrado: ${data.html_url}`);
            res.json(data.html_url)
        }
    } catch(error){
        if (error instanceof Error) {
            console.error(`❌ Error al verificar/crear fork:`, error.message);
        } else {
            console.error(`❌ Error desconocido:`, error);
        }
    
    }
})

export default router