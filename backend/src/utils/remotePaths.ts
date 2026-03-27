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
            // Use category for folder structure: tutorials/{category}/
            if (data.category) {
                remotePath = `tutorials/${data.category}/`;
                console.log(`Tutorial category-based path: ${remotePath}`);
            } else {
                // Fallback to root tutorials folder if no category
                remotePath = "tutorials/";
                console.warn("Tutorial submitted without category, using root path");
            }
            break;
        default:
            console.error("Error retrieving remote path.")
            break;
    }

    return remotePath;
}