export interface Customer {
    id: number;
    display_name: string;
    email: string;
    order_count: number;
    total_spent: number;
    last_order_at: string;
}

export interface ViewState {
    perPage: number;
    page: number;
    type: string;
    titleField: string;
    layout: {
        table: Record<string, unknown>;
        list: Record<string, unknown>;
        density: string;
    };
    fields: string[];
    search: string;
}

export interface RouterProps {
    navigate: ( path: string | { pathname?: string; search?: string } ) => void;
    location: {
        search: string;
    };
    params?: Readonly< Record< string, string | undefined > >;
}
