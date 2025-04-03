import yaml from "yaml";
import fs from "node:fs/promises";
import * as dirManager from "./dirManager";
import * as resourceInterfaces from "./resourceInterfaces";
import imageManager from "./imageManager";
import { format } from "date-fns";

//Identifica el tipo de recurso
export default function resourceIdentifier(data: any, image: any) {
    const resourceCategory = data.category;
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
        default:
            console.log("Resource type not valid");
    }
}

//Parsing para la categoría eventos
async function parseEvents(data: resourceInterfaces.EventData, image: any): Promise<void> {
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
            tags: data.tags,
        };

        const parentPath = await dirManager.createFolder(data.name);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(eventData);

        await fs.writeFile(`${parentPath}/event.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/event.yml`);

        imageManager(image, childPath, "thumbnail")
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
            contributor_names: data.contributor_names,
            tags: data.tags,
        }

        const parentPath = await dirManager.createFolder(data.title);
        const childPath = await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(newsletterData);

        await fs.writeFile(`${parentPath}/newsletter.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/newsletter.yml`);

        imageManager(image, childPath, "thumbnail")
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
            contributor_id: data.contributor_id,
            links: links,
            ...(data.lightning_address && { tips: { lightning_address: data.lightning_address } }),
            company: data.company ? data.company : undefined ,
            affiliations: data.affiliations,
            tags: data.tags,
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

        imageManager(image, childPath, "profile")
    }catch(error){
        console.error("Error processing data: ", error);
    }
}