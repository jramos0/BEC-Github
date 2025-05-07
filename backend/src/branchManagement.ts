import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch';

const router: Router = express.Router();
router.use(cors());
router.use(express.json());

const REPO = 'bitcoin-educational-content';
//Creates the branch with the name received
router.post('/create-branch', async (req: Request, res: Response): Promise<void> =>{
    const {OWNER, TOKEN, branchName} = req.body;
    const baseBranch = `sync-repo-${OWNER}`;
    //Retrieves the sha of the base branch
    try{
        const baseBranchResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${baseBranch}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        })
        if(!baseBranchResponse.ok) {
           throw new Error('❌Error retrieving base branch: ' + baseBranchResponse.statusText);
        }
        const baseBranchData = await baseBranchResponse.json();
        const baseSha = baseBranchData.object.sha;
        //Creates the new branch
        const createBranchResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs`, {
            method: 'POST',
            headers: {
                'Authorization' : `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ref: `refs/heads/${branchName}`, sha: baseSha,})
        });
        if(!createBranchResponse.ok) {
            throw new Error('❌ Error creating the new branch: ' + createBranchResponse.statusText);
        }

        console.log(`✅ Branch ${branchName} created succesfully.`);
        res.status(201).json({message: '✅ New branch created succesfully'});
    }
    catch (error){
        console.error("Error: ", error);
        res.status(500).json("❌" + error);
    }
})
//"uploads" the folder with the changes to the branch
router.post('/commit-folder', async (req: Request, res: Response) => {
    const {OWNER, TOKEN, branchName, folderPath, remotePath, resourceName} = req.body;
    const baseBranch = `sync-repo-${OWNER}`;

    try {
        console.log("Committing data...");
        //Gets the sha of the last commit
        const branchResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${baseBranch}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                }
            }
        );
        if (!branchResponse.ok) {
            throw new Error(`❌ Error fetching base branch.`);
        }
        const branchData = await branchResponse.json();
        const latestCommitSha = branchData.object.sha;

        //Gets the sha of the tree to be used, from the prevoiusly retrieved commit
        const baseCommitResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!baseCommitResponse.ok) {
            throw new Error("❌ Error retrieving latest commit: " + baseCommitResponse.statusText);
        }
        const baseCommitData = await baseCommitResponse.json();
        const baseTreeSha = baseCommitData.tree.sha; 

        //Reads every file and/or image inside de given folder
        const files = fs.readdirSync(folderPath);
        let blobs = [];

        for (const fileName of files) {
            const filePath = path.join(folderPath, fileName);
            const stats = fs.statSync(filePath);
        
            if (stats.isDirectory()) {
                const subFiles = fs.readdirSync(filePath);
                
                for (const subFileName of subFiles) {
                    const subFilePath = path.join(filePath, subFileName);
                    const stats = fs.statSync(subFilePath);
                    
                    if (stats.isFile()) {
                        const fileBuffer = fs.readFileSync(subFilePath);
                        const encodedContent = fileBuffer.toString('base64')
                        //creates the blob of the processed file
                        const blobResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({content: encodedContent, encoding: 'base64',}),
                        });
                        if (!blobResponse.ok) {
                            throw new Error(`❌ Error creating blob for ${subFileName}`);
                        }
                        const blob = await blobResponse.json();
                        //modifies the path to add the processed files to the right folder in the repo
                        const finalFilePath = remotePath + filePath.replace(/temp\\/, '').replace(/\\/g, '/') + '/' + subFileName;
                        blobs.push({path: finalFilePath, mode: '100644', type: 'blob', sha: blob.sha,});
                    }
                }        
            }
            //Same logic as above but for the file in the main folder
            else if (stats.isFile()) {
                const fileBuffer = fs.readFileSync(filePath);
                const encodedContent = fileBuffer.toString('utf8');

                const blobResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({content: encodedContent, encoding: 'utf-8',}),
                });
                if (!blobResponse.ok) {
                throw new Error(`❌ Error creating blob for ${fileName}`);
                }
                const finalFilePath = remotePath + filePath.replace(/temp\\/, '').replace(/\\/g, '/');
                const blob = await blobResponse.json();
                blobs.push({path: finalFilePath, mode: '100644', type: 'blob', sha: blob.sha,});
            }
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