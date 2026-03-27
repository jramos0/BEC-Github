import fs from "node:fs/promises"
//Crea el parent folder
export async function createFolder(folderName : string): Promise<any> {
    const folderFinalName = folderName.toLowerCase().replace(/ /g, '-');
    const path = "temp/" + folderFinalName;
    //Crea el folder y retorna el path
    try {
        await fs.mkdir(path, { recursive: true });
        console.log(`Folder created succesfully: ${path}`);
        return path;
    } catch (error) {
        console.error("Error creating folder: ", error);
        return ;
    }
}
//Crea el folder "assets" para la portada
export async function createChildFolder(parent : string): Promise<any> {
    const path = parent + "/assets";
    //Crea el folder y retorna el path
    try {
        await fs.mkdir(path, { recursive: true });
        console.log(`Subfolder created succesfully: ${path}`);
        return path;
    } catch (error) {
        console.error("Error creating subfolder: ", error);
        return 0;
    }
}
//Borra el folder indicado
export async function deleteFolder(path : string){
    await fs.rm(path, {recursive: true})
    console.log("Folder deleted succesfully: " + path);
}