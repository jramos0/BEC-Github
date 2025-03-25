//Template de formato yml para events
export interface YamlEventData {
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