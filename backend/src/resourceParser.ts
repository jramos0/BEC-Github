import { Console } from "console";
import yaml from "yaml";
import fs from "node:fs/promises"

export default function resourceIdentifier(data: any){
    //Parsea a un formato específico según el tipo de recurso
    const eventType = data['type']
    const resourceType = data['resourceType']
    switch(resourceType)
    {
        case "Events":
            parseEvents(data, eventType);
            break;
        default:
            console.log("Resource type not valid");
    }
}
async function parseEvents(data : any, type : any): Promise<void>{
    //Crea un template para el yml
    interface YamlEventData {
        id: string;
        start_date: string;
        end_date: string;
        timezone: string;
        address_city_country: string;
        type: string;
        name: string;
        description: string;
        language: string[];
        website: string;
        original_language: string;
        tags: string[];
    }
    //Parsea el JSON a yaml y guarda el archivo (solución temporal)
    try{
        const eventData: YamlEventData = {
            id: data.id,
            start_date: data.start_date,
            end_date: data.end_date,
            timezone: data.timezone,
            address_city_country: data.address_city_country,
            name: data.name,
            type: data.type,
            description: data.description,
            language: data.language,
            website: data.website,
            original_language: data.original_language,
            tags: data.tags,
        }
        const yamlData = yaml.stringify(eventData);

        await fs.writeFile(`${type}.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${type}.yml`);
    }catch(error){
        console.error("Error al crear archivo yaml: ", error)
    }
}