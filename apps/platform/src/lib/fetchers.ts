import { supabase } from './supabase';

export const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        const error = new Error(info.error || 'An error occurred while fetching the data.');
        (error as any).status = res.status;
        (error as any).info = info;
        throw error;
    }
    return res.json();
};

export const supabaseFetcher = async (key: { table: string, query: string, organizationId: string }) => {
    const { data, error } = await supabase
        .from(key.table as any)
        .select(key.query)
        .eq('organization_id', key.organizationId);

    if (error) throw error;
    return data;
};
