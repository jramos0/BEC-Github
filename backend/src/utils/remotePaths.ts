export default async function getRemotePath(data: any): Promise <string | undefined> {
    const resourceCategory = data.resourceCategory;
    let remotePath;

    switch(resourceCategory)
    {
        case "Events":
            remotePath = "https://github.com/jramos0/bitcoin-educational-content/tree/dev/events";
            break;
        case "Newsletter":
            remotePath = "https://github.com/jramos0/bitcoin-educational-content/tree/dev/resources/newsletters";
            break;
        case "Professor":
            remotePath = "https://github.com/jramos0/bitcoin-educational-content/tree/dev/professors";
            break;
        case "Project":
            remotePath = "https://github.com/jramos0/bitcoin-educational-content/tree/dev/resources/projects";
            break;
        default:
            console.error("Error retrieving remote path.")
            break;
    }

    return remotePath;
}