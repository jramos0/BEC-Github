import axios from 'axios';

//Manages branch creation, data commit and PR
export async function createPR(branchData: any, commitData: any): Promise<any> {
    const category = commitData.category.toUpperCase();
    const UPSTREAM_OWNER = 'jramos0';
    const UPSTREAM_REPO = 'bitcoin-educational-content';

    try{
        const prsResponse = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?state=all`, {
            headers: { Authorization: `token ${branchData.TOKEN}` },
        });
        const prsData = await prsResponse.json();

        // Filtrar PRs del usuario autenticado
        const userPRs: any[] = await prsData.filter((pr: any) => pr.user.login === branchData.OWNER && pr.state == "open");
        
        if(userPRs.length < 15) {
            try{        
                await axios.post('http://localhost:4000/create-branch', branchData, {
                    headers: {
                        'Content-Type' : 'application/json',
                    },
                });
            }catch(error){
                console.error('❌ Error creating branch: \n' + error);
            }
        
            try{
                await axios.post('http://localhost:4000/commit-folder', commitData, {
                    headers: {
                        'Content-Type' : 'application/json',
                    }
                });
            }catch(error){
                console.error('❌ Error commiting data to branch: ' + error);
            }
        
            try{
                console.log('Creating PR...');
                const fullHead = `${commitData.OWNER}:${commitData.branchName}`
        
                const payload = {
                    title: `[${category}]${commitData.addOrMod} ${commitData.resourceName}`, 
                    head: fullHead, 
                    base: 'dev', 
                    body: `This pull request adds resource ${commitData.resourceName}`,
                    draft: true,
                };
                
                const prResponse = await axios.post(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls`, JSON.stringify(payload), {
                    headers: {
                        'Authorization' : `Bearer ${commitData.TOKEN}`,
                        'Content-Type' : 'application/json',
                    }
                })
                if(prResponse.status === 403 || prResponse.status === 422) {
                    console.log('❌Error creating PR to upstream repo');
                }
                else if(prResponse.status === 201) {
                    console.log('✅ PR created succesfully to remote repo');
                }
            }catch(error){
                console.error('❌ Error creating PR: ' + error);
            }
        }
        else if(userPRs.length >= 15) {
            console.error('User has reached the limit of 3 pull requests open at a time.');
        }
    }catch(error){
        throw new Error('Error retrieving open/darft PRs made by the user: ' + error);
    }
}
//Modifies the new resource's branch name
export async function branchNameCreator(owner: string, resourceName: string): Promise<string> {
    const branchName = owner + '-' + resourceName.toLocaleLowerCase().replace(/ /g, '-');
    return branchName;
}