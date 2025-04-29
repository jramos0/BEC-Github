import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router: Router = express.Router();
const CLIENT = process.env.GITHUB_CLIENT_ID!;
const SECRET = process.env.GITHUB_CLIENT_SECRET!;
const UPSTREAM_OWNER = "jramos0";
const REPO = "BEC-Github";

router.use(cors());
router.use(express.json());

router.get('/forks', async (req: Request, res: Response): Promise<void> => {
  const Authorization = req.get("Authorization") as string;

  try {
    const userResp = await fetch("https://api.github.com/user", {
      headers: { Authorization }
    });

    const userData = await userResp.json();
    const userLogin = userData.login;
    const branchName = `sync-repo-${userLogin}`;

    // 1. Verificar si el fork existe
    const forkResp = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}`, {
      headers: { Authorization }
    });

    if (!forkResp.ok) {
      if (forkResp.status === 404) {
        console.log(`🚀 Fork no encontrado, creando uno nuevo...`);
        const createFork = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/forks`, {
          method: "POST",
          headers: {
            Authorization,
            'Content-Type': 'application/json'
          }
        });

        if (!createFork.ok) {
          const errData = await createFork.json();
          throw new Error(`Error al crear el fork: ${errData.message}`);
        }

        console.log(`✅ Fork creado con éxito.`);
        // Esperar un poco a que GitHub cree el fork
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        const errData = await forkResp.json();
        throw new Error(`Error al verificar el fork: ${errData.message}`);
      }
    } else {
      console.log(`✅ Fork encontrado: https://github.com/${userLogin}/${REPO}`);
    }

    // 2. Verificar si la rama ya existe
    const branchResp = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/ref/heads/${branchName}`, {
      headers: { Authorization }
    });

    if (branchResp.ok) {
      console.log(`🌿 La rama '${branchName}' ya existe. Sincronizando con upstream/main...`);

      // Obtener el SHA de main desde upstream
      const upstreamMainRefResp = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/git/refs/heads/dev`, {
        headers: { Authorization }
      });

      if (!upstreamMainRefResp.ok) {
        const errData = await upstreamMainRefResp.json();
        throw new Error(`Error al obtener upstream/main: ${errData.message}`);
      }

      const upstreamMainRefData = await upstreamMainRefResp.json();

      // Forzar actualización de la rama del fork
      const updateBranch = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/refs/heads/${branchName}`, {
        method: "PATCH",
        headers: {
          Authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: upstreamMainRefData.object.sha,
          force: true
        })
      });

      if (!updateBranch.ok) {
        const errUpdate = await updateBranch.json();
        throw new Error(`Error al sincronizar la rama: ${errUpdate.message}`);
      }

      console.log(`🔄 Rama '${branchName}' sincronizada con upstream/main.`);
      res.json(`https://github.com/${userLogin}/${REPO}/tree/${branchName}`);
      return;
    }

    // 3. Si la rama no existe, crearla desde main del fork
    const mainRefResp = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/refs/heads/main`, {
      headers: { Authorization }
    });

    if (!mainRefResp.ok) {
      const errData = await mainRefResp.json();
      throw new Error(`Error al obtener main del fork: ${errData.message}`);
    }

    const mainRefData = await mainRefResp.json();

    const createBranch = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/refs`, {
      method: "POST",
      headers: {
        Authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: mainRefData.object.sha
      })
    });

    if (!createBranch.ok) {
      const errorData = await createBranch.json();
      if (errorData.message.includes("Reference already exists")) {
        console.warn(`⚠️ La rama ya existe, omitiendo creación.`);
      } else {
        throw new Error(`Error al crear la rama: ${errorData.message}`);
      }
    } else {
      console.log(`✅ Rama '${branchName}' creada con éxito.`);
    }

    // 4. Responder con el link de la rama
    res.json(`https://github.com/${userLogin}/${REPO}/tree/${branchName}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error:`, error.message);
      res.status(500).json(`❌ Error: ${error.message}`);
    } else {
      res.status(500).json(`❌ Error desconocido`);
    }
  }
});

export default router;