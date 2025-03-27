import yaml from "yaml";
import fs from "node:fs/promises"
import * as resInterfaces from "./resourceInterfaces";
import * as dirManager from "./dirManager"
//Identifica el tipo de recurso a
export default function resourceIdentifier(data: any){
    //Parsea a un formato específico según el tipo de recurso
    const resourceCategory = data['category']
    switch(resourceCategory)
    {
        case "Events":
            parseEvents(data, image);
            break;
        default:
            console.log("Resource type not valid");
    }
}

//Parsing para la categoría eventos
async function parseEvents(data: ResourceData, image: any): Promise<void> {
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

        imageManager(image, childPath)
    } catch (error) {
        console.error("Error al crear archivo yaml: ", error);
    }
}
