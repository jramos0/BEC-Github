import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as crypto from 'crypto';

dotenv.config();

const router: Router = express.Router();
const CLIENT = process.env.GITHUB_CLIENT_ID!;
const SECRET = process.env.GITHUB_CLIENT_SECRET!;
const UPSTREAM_OWNER = "jramos0";
const REPO = "bitcoin-educational-content";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string; 
interface Branch {
  name: string;
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

router.use(cors());
router.use(express.json());

router.get('/forks', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.get("Authorization") as string;
  if (!authHeader) {
    res.status(400).json({ error: "No Authorization header provided" });
    return;
  }

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
  try {
    const userResp = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${decryptedToken}` }
    });

    const userData = await userResp.json();
    const userLogin = userData.login;
    const branchName = `sync-repo-${userLogin}`;

    // 1. Verificar si el fork existe
    const forkResp = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}`, {
      headers: { Authorization: `token ${decryptedToken}` }
    });

    if (!forkResp.ok) {
      if (forkResp.status === 404) {
        console.log(`🚀 Fork no encontrado, creando uno nuevo...`);
        const createFork = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/forks`, {
          method: "POST",
          headers: {
            Authorization: `token ${decryptedToken}`,
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
      headers: { Authorization: `token ${decryptedToken}` }
    });

    if (branchResp.ok) {
      console.log(`🌿 La rama '${branchName}' ya existe. Sincronizando con upstream/main...`);

      // Obtener el SHA de main desde upstream
      const upstreamMainRefResp = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/git/refs/heads/dev`, {
        headers: { Authorization: `Bearer ${decryptedToken}` }
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
          Authorization: `token ${decryptedToken}`,
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
    const mainRefResp = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/refs/heads/dev`, {
      headers: { Authorization: `token ${decryptedToken}` }
    });

    if (!mainRefResp.ok) {
      const errData = await mainRefResp.json();
      throw new Error(`Error al obtener main del fork: ${errData.message}`);
    }

    const mainRefData = await mainRefResp.json();

    const createBranch = await fetch(`https://api.github.com/repos/${userLogin}/${REPO}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `token ${decryptedToken}`,
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

router.get('/branches', async (req: Request, res: Response): Promise<void> => {
  // 1. Leer el header de Authorization
  const authHeader = req.get("Authorization");
  if (!authHeader) {
     
    res.status(400).json({ error: "No Authorization header provided" });
    return
  }
  
  const encryptedToken = authHeader.split(" ")[1];

  // 2. Desencriptar
  let decryptedToken: string;
  try {
    decryptedToken = decryptToken(encryptedToken);
  } catch (err) {
    console.error("❌ Error al desencriptar el access_token:", err);
     res.status(400).json({ error: "Invalid token" });
     return
  }

  // 3. Llamada a GitHub
  try {
    const userResp = await fetch("https://api.github.com/user", {
      headers: { 'Authorization': `token ${decryptedToken}` }
    });
    if (!userResp.ok) {
      throw new Error(`GitHub API returned ${userResp.status}`);
    }
    const { login: userLogin } = await userResp.json();

    const branchResp = await fetch(
      `https://api.github.com/repos/${userLogin}/${REPO}/branches`,
      {
        headers: {
          'Authorization': `token ${decryptedToken}`,
          'Content-Type': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!branchResp.ok) {
      throw new Error(`GitHub API returned ${branchResp.status}`);
    }
    const branches: Branch[] = await branchResp.json();

    // 4. Filtrar y responder
    const filtered = branches
      .map(b => b.name)
      .filter(name => name.includes(`${userLogin}-`));
    res.json(filtered);

  } catch (error) {
    console.error("❌ Error en /branches:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Error desconocido" });
  }
});




router.post('/deletebranch', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.get("Authorization") as string;
  const { branchName } = req.body;
  
  if (!authHeader) {
    res.status(400).json({ error: "No Authorization header provided" });
    return;
  }

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

  if (!branchName) {
    res.status(400).json({ error: "Falta el nombre de la rama en el body" });
    return;
  }

  try {
    // 1. Obtener información del usuario autenticado
    const userResp = await fetch("https://api.github.com/user", { headers: { 'Authorization': `token ${decryptedToken}` } });
    if (!userResp.ok) {
      throw new Error(`Error al obtener el usuario: ${userResp.status}`);
    }
    const userData = await userResp.json();
    const userLogin: string = userData.login;


    const prUrl = `https://api.github.com/repos/${UPSTREAM_OWNER}/${REPO}/pulls?state=closed&head=${userLogin}:${branchName}`;
    const prResp = await fetch(prUrl, {
      headers: {
        'Authorization': `token ${decryptedToken}`,
        'Content-Type': 'application/vnd.github.v3+json'
      }
    });
    if (!prResp.ok) {
      throw new Error(`Error al obtener pull requests: ${prResp.status}`);
    }
    const pullRequests: any[] = await prResp.json();


    // Debug: ver qué información se está recibiendo para cada PR
    console.log("Pull requests recibidos:", pullRequests);
    pullRequests.forEach(pr => {
      console.log(`PR #${pr.number} - estado: ${pr.state} - merged_at: ${pr.merged_at}`);
    });

    
    const prClosed = pullRequests.find(pr => pr.state === "closed");

    if (!prClosed) {
      throw new Error("A closed pull request was not found for the specified branch.");
    }

    // const prMergeado = pullRequests.find(pr => pr.merged_at !== null);
    // if (!prMergeado) {
    //   res.status(400).json({ error: "No se encontró un pull request mergeado para la rama especificada" });
    //   return;
    // }

    const deleteUrl = `https://api.github.com/repos/${userLogin}/${REPO}/git/refs/heads/${branchName}`;
    const deleteResp = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { 'Authorization': `token ${decryptedToken}` }
    });

    if (deleteResp.ok) {
      res.json({ message: `La rama "${branchName}" ha sido eliminada correctamente.` });
    } else {
      console.error("Error al eliminar la rama:", deleteResp.status);
      res.status(deleteResp.status).json({ error: "No se pudo eliminar la rama" });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error desconocido" });
    }
  }
});

router.post('/updatepr', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.get("Authorization");
  const { branchName } = req.body;

  if (!authHeader) {
    res.status(401).json({ error: "Falta el header de Authorization" });
    return;
  }

  if (!branchName) {
    res.status(400).json({ error: "Falta el nombre de la rama en el body" });
    return;
  }

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
  try {
    // 1. Obtener información del usuario autenticado
    const userResp = await fetch("https://api.github.com/user", {
      headers: { 'Authorization': `token ${decryptedToken}` }
    });

    if (!userResp.ok) {
      res.status(userResp.status).json({ error: "No se pudo obtener el usuario autenticado" });
      return;
    }

    const userData = await userResp.json();
    const userLogin = userData.login;

    const query = `
      query($owner: String!, $repo: String!, $branchName: String!) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 10, states: OPEN, headRefName: $branchName) {
            nodes {
              id
              number
              title
              isDraft
              url
              headRepository {
                name
                owner {
                  login
                }
              }
              author {
                login
              }
            }
          }
        }
      }
    `;

    const variables = { owner: UPSTREAM_OWNER, repo: REPO, branchName };

    const graphqlResp = await fetch('https://api.github.com/graphql', {
      method: "POST",
      headers: {
        'Authorization': `token ${decryptedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!graphqlResp.ok) {
      res.status(graphqlResp.status).json({
        error: `Error al obtener los Pull Requests: ${graphqlResp.statusText}`
      });
      return;
    }

    const repoResponse = await graphqlResp.json();

    const pullRequests = repoResponse.data?.repository?.pullRequests?.nodes ?? [];

    if (pullRequests.length === 0) {
      res.status(404).json({
        message: `⚠️ No se encontró ningún Pull Request para la rama '${branchName}'.`
      });
      return;
    }

    const draftPR = (pullRequests as any[]).find(pr =>
      pr.isDraft &&
      pr.headRepository &&
      pr.headRepository.owner.login === userLogin &&
      pr.author.login === userLogin
    );

    if (!draftPR) {
      res.status(404).json({
        message: `⚠️ Se encontraron PRs para la rama '${branchName}', pero ninguno corresponde al fork y usuario '${userLogin}' en estado Draft.`
      });
      return;
    }

    // 3. Ejecutar mutación para marcar el PR como listo para revisión
    const mutation = `
      mutation($prId: ID!) {
        markPullRequestReadyForReview(input: { pullRequestId: $prId }) {
          pullRequest {
            id
            number
            title
            isDraft
            url
          }
        }
      }
    `;

    const mutationResp = await fetch('https://api.github.com/graphql', {
      method: "POST",
      headers: {
        'Authorization': `token ${decryptedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { prId: draftPR.id }
      })
    });

    const mutationResponse = await mutationResp.json();

    if (mutationResponse.errors) {
      res.status(500).json({ error: '❌ Error en la mutación', details: mutationResponse.errors });
      return;
    }

    const updatedPR = mutationResponse.data.markPullRequestReadyForReview.pullRequest;

    res.status(200).json({
      message: `✅ Pull Request #${updatedPR.number} ahora está "Ready for Review".`,
      pr: updatedPR
    });

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

router.post('/user-prs', async (req: Request, res: Response):Promise<void> => {
  const auth = req.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(400).json({ error: "Invalid Authorization header format" });
    return
  }
  const encryptedToken = match[1];

  const { USERNAME, REPO_OWNER, REPO_NAME } = req.body;
  if (!USERNAME || !REPO_OWNER || !REPO_NAME) {
    
    res.status(400).json({ error: "Faltan parámetros requeridos" });
    return
  }

  let token: string;
  try {
    token = decryptToken(encryptedToken);
  } catch {
    res.status(400).json({ error: "Invalid token" });
    return
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!ghRes.ok) {
      const err = await ghRes.json();
      res.status(ghRes.status).json({ error: err.message || ghRes.statusText });
      return
    }
    const prs = await ghRes.json();
    const userPRs = prs.filter((pr: any) => pr.user.login === USERNAME);
    res.json(userPRs);
  } catch (e) {
    console.error("Error en /user-prs:", e);
    res.status(500).json({ error: "Error al obtener los PRs del usuario" });
  }
});

export default router;