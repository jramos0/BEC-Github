import yaml from "yaml";
import fs from "node:fs/promises";
import * as dirManager from "./dirManager";
import { format } from "date-fns";

interface ResourceData {
    id: string;
    start_date: string;
    end_date: string;
    timezone: string;
    address_city_country: string;
    name: string;
    type: string;
    description: string;
    language1: string;
    language2?: string;
    website: string;
    project_id: string;
    tags: string[];
    category: string;
}

//Identifica el tipo de recurso
export default function resourceIdentifier(data: ResourceData) {
    const resourceCategory = data.category;
    switch (resourceCategory) {
        case "Events":
            parseEvents(data);
            break;
        default:
            console.log("Resource type not valid");
    }
}

//Parsing para la categoría eventos
async function parseEvents(data: ResourceData): Promise<void> {
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
        await dirManager.createChildFolder(parentPath);
        const yamlData = yaml.stringify(eventData);

        await fs.writeFile(`${parentPath}/event.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/event.yml`);
    } catch (error) {
        console.error("Error al crear archivo yaml: ", error);
    }
}
