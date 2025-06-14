//Template de formato yml para events
export interface EventData {
    resourceCategory: string;
    id: string;
    start_date: string;
    end_date: string;
    timezone: string;
    address_city_country: string;
    name: string;
    type: string;
    description: string;
    language?: string[];
    language1: string;
    language2?: string;
    links?: string[];
    website: string;
    project_id: string;
    tags: string[];
    category: string;
    githubUser: string;
    githubToken: string;
}

export interface NewsletterData {
    resourceCategory: string;
    category: string;
    id: string;
    title: string;
    author: string;
    level: string;
    publication_date: string;
    link?: string[];
    website: string;
    language: string;
    description: string;
    contributor_names: string;
    tags: string[];
    thumbnail: File | null;
    githubUser: string;
    githubToken: string;
}

export interface ProfessorData {
    resourceCategory: string;
    id: string;
    name: string;
    contributor_id: string;
    links?: string[];
    twitter?: string;
    github?: string;
    website?: string;
    nostr?: string;
    lightning_address?: string;
    tips?: string[];
    company?: string;
    affiliations: string[];
    tags: string[];
    bio: string;
    short_bio: string;
    githubUser: string;
    githubToken: string;
}

export interface ProjectData {
    resourceCategory: string;
    id: string,
    name: string,
    description: string,
    links?: string[],
    'links.website': string,
    'links.twitter': string,
    'links.github': string,
    'links.nostr': string,
    category: string,
    language?: string[],
    original_language: string,
    tags: string[],
    contributor_names?: string[],
    githubUser: string;
    githubToken: string;
}

export interface TutorialData {
    resourceCategory: string;
    title: string;
    language: String,
    markdown: String;
    cover: File | null;
    githubUser: string;
    githubToken: string;
}