export default async function getRemotePath(data: any): Promise <string | undefined> {
    const resourceCategory = data.resourceCategory;
    let remotePath;

    switch(resourceCategory)
    {
        case "Events":
            remotePath = "events/";
            break;
        case "Newsletter":
            remotePath = "resources/newsletters/";
            break;
        case "Professor":
            remotePath = "professors/";
            break;
        case "Project":
            remotePath = "resources/projects/";
            break;
        case "Tutorial":
            remotePath = "tutorials/"
            break;
        default:
            console.error("Error retrieving remote path.")
            break;
    }

    return remotePath;
}