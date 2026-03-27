import yaml, { Scalar } from "yaml";
import fs from "node:fs/promises";
import * as dirManager from "./dirManager.ts";
import * as PRManagement from '../prManagement.ts';
import * as resourceInterfaces from "./resourceInterfaces.ts";
import remotePath from "./remotePaths.ts";
import { format } from "date-fns";
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string; 

function decryptToken(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift() as string, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();  
}

//Identifica el tipo de recurso
export default function resourceIdentifier(data: any) {
    const resourceCategory = data.resourceCategory;
    switch (resourceCategory) {
        case "Events":
            parseEvents(data);
            break;
        case "Newsletter":
            parseNewsletter(data);
            break;
        case "Professor":
            parseProfessor(data);
            break;
        case "Project":
            parseProjects(data);
            break;
        default:
            console.log("Resource type not valid");
    }
}

//Parsing para la categoría eventos
async function parseEvents(data: resourceInterfaces.EventData): Promise<any> {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
    };

    try {
        const eventData = {
            id: data.id,
            start_date: formatDate(data.start_date),
            end_date: formatDate(data.end_date),
            timezone: data.timezone,
            address_city_country: data.address_city_country,
            name: data.name,
            type: data.type,
            description: data.description,
            language: data.language,
            links: data.links,
            project_id: data.project_id,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        };

        const parentPath = await dirManager.createFolder(data.name);
        const yamlData = yaml.stringify(eventData);

        await fs.writeFile(`${parentPath}/event.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/event.yml`);

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);

        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Modifying"};
    
        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    } catch (error) {
        console.error("Error processing data: ", error);
    }
}
//Parsing para la categoría Newsletter
async function parseNewsletter(data: resourceInterfaces.NewsletterData): Promise<void> {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "yyyy-MM-dd");
    };

    try{
        const description = `${data.description.replace(/^\n+|\n+$/g, "")}\n`;
        const correctDescription = new Scalar(description);
        correctDescription.type = 'BLOCK_LITERAL';
        const newsletterData = {
            id: data.id,
            title: data.title,
            author: data.author,
            level: data.level,
            publication_date: formatDate(data.publication_date),
            link: data.link,
            language: data.language,
            description: correctDescription,
            contributor_names: data.contributor_names,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        }

        const parentPath = await dirManager.createFolder(data.title);
        const yamlData = yaml.stringify(newsletterData);

        await fs.writeFile(`${parentPath}/newsletter.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/newsletter.yml`);

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);

        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.title);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.title, category: data.resourceCategory, addOrMod: "Modifying"};
    
        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    }catch(error){
        console.error("Error processing data: ", error);
    }
}

//Parsing para la categoría Professors
async function parseProfessor(data: resourceInterfaces.ProfessorData): Promise<void> {
    try{
        const professorYMLData = {
            id: data.id,
            name: data.name,
            contributor_id: data.contributor_id,
            links: data.links,
            ...(data.tips && { tips: data.tips }),
            company: data.company ? data.company : undefined ,
            affiliations: data.affiliations,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        }

        const parentPath = await dirManager.createFolder(data.name);
        const yamlData = yaml.stringify(professorYMLData);

        await fs.writeFile(`${parentPath}/professor.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/professor.yml`);

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);

        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Modifying"};
    
        await PRManagement.createPR(branchData, commitData);
        
        await dirManager.deleteFolder(parentPath);
    }catch(error){
        console.error("Error processing data: ", error);
    }
}

//Parsing para la categoría Projects
async function parseProjects(data: resourceInterfaces.ProjectData): Promise<void> {
    try{
        const projectData = {
            id: data.id,
            name: data.name,
            language: data.language,
            ...(data.links && { links: data.links }),
            category: data.category,
            original_language: data.original_language,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
            contributor_names: data.contributor_names,
        }
        const exclude = ['resourceCategory', 'githubUser', 'githubToken'];
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([key]) => !exclude.includes(key))
        );
        const editedData = {...filteredData, ...projectData};

        const parentPath = await dirManager.createFolder(data.name);
        const yamlData = yaml.stringify(editedData);
    
        await fs.writeFile(`${parentPath}/project.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/project.yml`);

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);

        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Modifying"};

        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    } catch(error){
        console.error("Error processing data: ", error);
    }
}