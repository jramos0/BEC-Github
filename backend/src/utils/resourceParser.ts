import yaml from "yaml";
import fs from "node:fs/promises";
import * as dirManager from "./dirManager.ts";
import * as imageManager from "./imageManager.ts";
import * as PRManagement from '../prManagement.ts';
import * as resourceInterfaces from "./resourceInterfaces.ts";
import remotePath from "./remotePaths.ts";
import { format } from "date-fns";
import * as crypto from "crypto";
import dotenv from "dotenv";

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
export default function resourceIdentifier(data: any, image: any, imageSet?: any[], logo?: any) {
    const resourceCategory = data.resourceCategory;
    switch (resourceCategory) {
        case "Events":
            parseEvents(data, image);
            break;
        case "Newsletter":
            parseNewsletter(data, image);
            break;
        case "Professor":
            parseProfessor(data, image);
            break;
        case "Project":
            parseProjects(data, image);
            break;
        case "Tutorial":
            if(imageSet) {
                parseTutorials(data, image, imageSet, logo);
            }
            break;
        default:
            console.log("Resource type not valid");
    }
}

//Parsing para la categoría eventos
async function parseEvents(data: resourceInterfaces.EventData, image: any): Promise<any> {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
    };

    try {
        const languages = [data.language1, data.language2].filter(Boolean);

        const eventData = {
            id: data.id,
            start_date: formatDate(data.start_date),
            end_date: formatDate(data.end_date),
            timezone: data.timezone,
            address_city_country: data.address_city_country,
            name: data.name,
            type: data.type,
            description: data.description,
            language: languages,
            links: {
                website: data.website
            },
            project_id: data.project_id,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        };

        const parentPath = await dirManager.createFolder(data.name);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(eventData);

        await fs.writeFile(`${parentPath}/event.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/event.yml`);

        await imageManager.singleImage(image, childPath, "thumbnail");

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);
        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Adding"};
    
        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    } catch (error) {
        console.error("Error processing data: ", error);
    }
}
//Parsing para la categoría Newsletter
async function parseNewsletter(data: resourceInterfaces.NewsletterData, image: any): Promise<void> {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
    };
    try{
        const description = `${data.description}\n`;
        const newsletterData = {
            id: data.id,
            title: data.title,
            author: data.author,
            level: data.level,
            publication_date: data.publication_date,
            links: {
                website: data.website
            },
            language: data.language,
            description: description,
            contributor_names: data.githubUser,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        }

        const parentPath = await dirManager.createFolder(data.title);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(newsletterData);

        await fs.writeFile(`${parentPath}/newsletter.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/newsletter.yml`);

        await imageManager.singleImage(image, childPath, "thumbnail");

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);
        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.title);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.title, category: data.resourceCategory, addOrMod: "Adding"};
    
        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    }catch(error){
        console.error("Error processing data: ", error);
    }
}

//Parsing para la categoría Professors
async function parseProfessor(data: resourceInterfaces.ProfessorData, image: any): Promise<void> {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
    };
    try{
        const links = [data.twitter, data.github, data.website, data.nostr].filter(Boolean)
        const professorYMLData = {
            id: data.id,
            name: data.name,
            contributor_id: data.githubUser,
            links: links,
            ...(data.lightning_address && { tips: { lightning_address: data.lightning_address } }),
            company: data.company ? data.company : undefined ,
            affiliations: data.affiliations,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        }
        const professorENData = {
            bio: data.bio,
            short_bio: data.short_bio,
        }

        const parentPath = await dirManager.createFolder(data.name);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(professorYMLData);
        const yamlENData = yaml.stringify(professorENData);

        await fs.writeFile(`${parentPath}/professor.yml`, yamlData, 'utf8');
        await fs.writeFile(`${parentPath}/en.yml`, yamlENData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/professor.yml`);
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/en.yml`);

        await imageManager.singleImage(image, childPath, "profile");

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);
        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Adding"};
    
        await PRManagement.createPR(branchData, commitData);
        
        await dirManager.deleteFolder(parentPath);
    }catch(error){
        console.error("Error processing data: ", error);
    }
}

//Parsing para la categoría Projects
async function parseProjects(data: resourceInterfaces.ProjectData, image: any): Promise<void> {
    try{
        const links = [data["links.website"], data["links.twitter"], data["links.github"], data["links.nostr"]].filter(Boolean);
        const projectData = {
            id: data.id,
            name: data.name,
            ...(links[0 || 1 || 2 || 3] && {links: { website: links[0], twitter: links[1], github: links[2], nostr: links[3] } }),
            category: data.category,
            original_language: data.original_language,
            tags: (data.tags || []).filter(tag => tag && tag.trim() !== ""),
        }
        const projectENData = {
            description: data.description,
        }
        
        const parentPath = await dirManager.createFolder(data.name);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(projectData);
        const yamlENData = yaml.stringify(projectENData);
    
        await fs.writeFile(`${parentPath}/project.yml`, yamlData, 'utf8');
        await fs.writeFile(`${parentPath}/${data.original_language}.yml`, yamlENData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/project.yml`);
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/${data.original_language}.yml`);
    
        await imageManager.singleImage(image, childPath, "logo");

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);
        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.name);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.name, category: data.resourceCategory, addOrMod: "Adding"};

        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    } catch(error){
        console.error("Error processing data: ", error);
    }
}

//Parsing para la categoría Tutorial
async function parseTutorials(data: resourceInterfaces.TutorialData, image: any, imageSet: any[], logo?: any): Promise<void> {
    try{
        // Create tutorial YAML data with metadata
        // Remove parent category prefix from subcategory to get the category value for yml
        // e.g., "node-lightning-network" → "lightning-network"
        // e.g., "wallet-desktop" → "desktop"
        const categoryForYml = data.subcategory.replace(`${data.category}-`, '');

        const tutorialData = {
            id: data.id,
            title: data.title,
            description: data.description,
            category: categoryForYml,
            level: data.level,
            language: data.language,
            tags: (data.tags || []).filter((tag: string) => tag && tag.trim() !== ""),
            ...(data.author && { author: data.author }),
            contributor_id: data.githubUser,
        };

        const parentPath = await dirManager.createFolder(data.title);
        const childPath = await dirManager.createChildFolder(parentPath);
        const subChildPath = childPath + `/${data.language}`;
        try {
            await fs.mkdir(subChildPath, { recursive: true });
            console.log(`Carpeta creada: ${subChildPath}`);
        } catch (error) {
            console.error("Error al crear la carpeta: ", error);
            return ;
        }

        // Write tutorial.yml file
        const yamlData = yaml.stringify(tutorialData);
        await fs.writeFile(`${parentPath}/tutorial.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/tutorial.yml`);

        // Write markdown file
        await fs.writeFile(`${parentPath}/${data.language}.md`, data.markdown, 'utf8');
        console.log(`Archivo MD creado exitosamente en: ${parentPath}/${data.language}.md`);

        // Process images: cover, logo, and content images
        await imageManager.singleImage(image, childPath, "cover");
        if (logo) {
            await imageManager.singleImage(logo, childPath, "logo");
        }
        await imageManager.imageSet(imageSet, subChildPath);

        const remote = await remotePath(data);
        console.log("Remote Path for the processed resource category: " + remote);
        var decryptedToken = decryptToken(data.githubToken);
        const branchName = await PRManagement.branchNameCreator(data.githubUser, data.title);
        const branchData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName};
        const commitData = {OWNER: data.githubUser, TOKEN: decryptedToken, branchName: branchName, folderPath: parentPath, remotePath: remote, resourceName: data.title, category: data.resourceCategory, addOrMod: "Adding"};

        await PRManagement.createPR(branchData, commitData);

        await dirManager.deleteFolder(parentPath);
    } catch(error) {
        console.error("Error processing data: ", error);
    }
}
