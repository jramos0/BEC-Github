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
            parseEvents(data);
            break;
        default:
            console.log("Resource type not valid");
    }
}
//Parsing para la categoría eventos
async function parseEvents(data : any): Promise<void>{
    const type = data['type']
    //Rellena el contenido que tendrá el .yml con la información del JSON
    try{
        //Rellena la información
        const eventData: resInterfaces.YamlEventData = {
            id: data.id,
            start_date: data.start_date,
            end_date: data.end_date,
            timezone: data.timezone,
            address_city_country: data.address_city_country,
            name: data.name,
            type: data.type,
            description: data.description,
            language: [data.language1, data.language2],
            website: data.website,
            original_language: data.language1,
            tags: data.tags,
        }
        const parentPath = await dirManager.createFolder(data.name)
        const childFolder = await dirManager.createChildFolder(parentPath)
        const yamlData = yaml.stringify(eventData);
        //Crea el archivo .yml en el directorio creado
        await fs.writeFile(`${parentPath}`+ "/" + `${type}.yml`, yamlData, 'utf8');
        console.log(`Archivo YAML creado exitosamente en: ${parentPath}/${type}.yml`);
    }catch(error){
        console.error("Error al crear archivo yaml: ", error)
    }
}