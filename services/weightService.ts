
import { supabase } from './supabaseClient';

export const TABLE_WEIGHT_HISTORY = 'weight_history';

export interface WeightEntry {
    id: string;
    user_id: string;
    weight: number;
    date: string;
    created_at: string;
}

export async function getWeightHistory(userId: string, days?: number): Promise<WeightEntry[]> {
    let query = supabase
        .from(TABLE_WEIGHT_HISTORY)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    if (days) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        query = query.gte('date', dateLimit.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching weight history:', error);
        return [];
    }
    return data as WeightEntry[];
}


export async function addWeightEntry(userId: string, weight: number, date: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_WEIGHT_HISTORY)
        .insert({ user_id: userId, weight, date });

    if (error) {
        console.error('Error adding weight entry:', error);
        return false;
    }
    return true;
}

export async function getLatestWeight(userId: string): Promise<number | null> {
    const { data, error } = await supabase
        .from(TABLE_WEIGHT_HISTORY)
        .select('weight')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // It's common to not have a weight history yet, so just return null without error log if it's PGRST116 (0 rows)
        if (error.code !== 'PGRST116') {
            console.error('Error fetching latest weight:', error);
        }
        return null;
    }
    return data?.weight || null;
}
