import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch';

const router: Router = express.Router();
router.use(cors());
router.use(express.json());

const REPO = 'bitcoin-educational-content';

function stripTemp(p: string): string {
  const norm = p.replace(/\\/g, '/');
  return norm.replace(/^temp\//, '');
}

router.post('/create-branch', async (req: Request, res: Response) => {
  const { OWNER, TOKEN, branchName } = req.body;
  const baseBranch = `sync-repo-${OWNER}`;

  try {
    const baseRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${baseBranch}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    if (!baseRes.ok) throw new Error(baseRes.statusText);
    const { object: { sha: baseSha } } = await baseRes.json();

    const createRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
      }
    );
    if (createRes.ok) {
      console.log(`✅ Branch ${branchName} created successfully.`);
    } else if (createRes.status === 422) {
      console.log(`ℹ️ Branch ${branchName} already exists, skipping creation.`);
    } else {
      throw new Error(`Error creating branch: ${await createRes.text()}`);
    }

    res.status(201).json({ message: `Branch ${branchName} ready.` });
  } catch (err) {
    console.error('❌ Error in /create-branch:', err);
    res.status(500).json({ error: String(err) });
  }
});

router.post('/commit-folder', async (req: Request, res: Response) => {
  const { OWNER, TOKEN, branchName, folderPath, remotePath, resourceName } = req.body;
  const baseBranch = `sync-repo-${OWNER}`;

  try {
    console.log('🚀 Committing data...');

    const baseRefRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${baseBranch}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    if (!baseRefRes.ok) throw new Error('Error fetching base branch SHA');
    const { object: { sha: latestCommitSha } } = await baseRefRes.json();

    const checkRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${branchName}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    if (!checkRes.ok && checkRes.status === 404) {
      const createRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: latestCommitSha }),
        }
      );
      if (!createRes.ok) throw new Error('Error creating target branch');
      console.log(`✅ Branch ${branchName} created for commit.`);
    }

    const commitDataRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    if (!commitDataRes.ok) throw new Error('Error retrieving tree SHA');
    const { tree: { sha: baseTreeSha } } = await commitDataRes.json();

    const normalizedRemote = remotePath.endsWith('/') ? remotePath : remotePath + '/';

    const files = fs.readdirSync(folderPath);
    const blobs: { path: string; mode: string; type: string; sha: string }[] = [];

    for (const name of files) {
      const full = path.join(folderPath, name);
      if (fs.statSync(full).isDirectory()) {
        for (const sub of fs.readdirSync(full)) {
          const subPath = path.join(full, sub);
          if (fs.statSync(subPath).isFile()) {
            const content = fs.readFileSync(subPath);
            const encoded = content.toString('base64');
            const blobRes = await fetch(
              `https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: encoded, encoding: 'base64' }),
              }
            );
            if (!blobRes.ok) throw new Error(`Error creating blob ${sub}`);
            const { sha } = await blobRes.json();

            const rel = stripTemp(subPath);
            blobs.push({ path: normalizedRemote + rel, mode: '100644', type: 'blob', sha });
          }
        }
      } else {
        const content = fs.readFileSync(full);
        const encoded = content.toString('utf8');
        const blobRes = await fetch(
          `https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: encoded, encoding: 'utf-8' }),
          }
        );
        if (!blobRes.ok) throw new Error(`Error creating blob ${name}`);
        const { sha } = await blobRes.json();

        const rel = stripTemp(full);
        blobs.push({ path: normalizedRemote + rel, mode: '100644', type: 'blob', sha });
      }
    }

    const treeRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs }),
      }
    );
    if (!treeRes.ok) throw new Error('Error creating Git tree');
    const { sha: newTreeSha } = await treeRes.json();

    const commitRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Adding ${resourceName}`,
          tree: newTreeSha,
          parents: [latestCommitSha],
        }),
      }
    );
    if (!commitRes.ok) throw new Error('Error creating commit');
    const { sha: commitSha } = await commitRes.json();

        let blobs: any[] = [];
        const processFolder = async (folder: string)=> {
        const files = fs.readdirSync(folder);
    
        for (const fileName of files) {
            const filePath = path.join(folder, fileName);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                await processFolder(filePath);
            } else {
                const fileBuffer = fs.readFileSync(filePath);
                const encodedContent = fileBuffer.toString('base64');

                const blobResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({content: encodedContent, encoding: 'base64',}),
                });
                if (!blobResponse.ok) {
                    throw new Error(`❌ Error creating blob for ${fileName}`);
                }
                const blob = await blobResponse.json();
                //modifies the path to add the processed files to the right folder in the repo
                const finalFilePath = remotePath + filePath.replace(/^temp[\\/]/, '').replace(/\\/g, '/');
                blobs.push({path: finalFilePath, mode: '100644', type: 'blob', sha: blob.sha,});                
                }
            }
        };

        await processFolder(folderPath);
        
        if(blobs.length === 0) {
            throw new Error('❌ No files found to commit.');
        }
        //Creates a new tree with the changes
        const treeResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({base_tree: baseTreeSha, tree: blobs,}),
            }
        );
        if (!treeResponse.ok) {
            throw new Error('❌ Error creating new file tree.');
        }
        const treeData = await treeResponse.json();

        //Commits the new tree
        const commitResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({message: `Adding ${resourceName}`, tree: treeData.sha, parents: [latestCommitSha],}),
            }
        );
        if (!commitResponse.ok) {
            throw new Error('❌ Error creating commit');
        }
        const commitData = await commitResponse.json();

        //Updates the reference
        const updateRefResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${branchName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({sha: commitData.sha}),
            }
        );

        if (!updateRefResponse.ok) {
            throw new Error(`❌ Error updating the branch's ref`);
        }
        console.log(`✅ Data added succesfully to ${branchName}`);
        res.status(201).json({message: `Resource ${resourceName} uploaded to branch ${branchName} succesfully.`});
    } catch (error) {
        console.error(error);
        res.status(500).json("❌" + error);
    }
});

export default router;
