//Template de formato yml para events
export interface EventData {
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

export interface NewsletterData {
    category: string;
    id: string;
    title: string;
    author: string;
    level: string;
    publication_date: string;
    website: string;
    language: string;
    description: string;
    contributor_names: string[];
    tags: string[];
    thumbnail: File | null;
}

export interface ProfessorData {
    id: string;
    name: string;
    contributor_id: string;
    twitter?: string;
    github?: string;
    website?: string;
    nostr?: string;
    lightning_address?: string;
    company?: string;
    affiliations: string[];
    tags: string[];
    bio: string;
    short_bio: string;
}