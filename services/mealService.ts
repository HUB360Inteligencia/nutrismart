
import { supabase } from './supabaseClient';
import { Meal } from '../types';

export const TABLE_MEALS = 'meals';

export async function getMeals(userId: string, date?: string): Promise<Meal[]> {
    let query = supabase.from(TABLE_MEALS).select('*').eq('user_id', userId);

    if (date) {
        // Assuming 'date' column exists or we filter by timestamp range
        // If the schema uses 'created_at', we need start/end of day.
        // Let's assume a 'date' column for simplicity based on legacy code, 
        // or strictly filter by ISO string date part if stored as such.
        query = query.eq('date', date);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching meals:', error);
        return [];
    }
    return data as Meal[];
}

export async function addMeal(userId: string, meal: Omit<Meal, 'id'>): Promise<Meal | null> {
    const { data, error } = await supabase
        .from(TABLE_MEALS)
        .insert({ ...meal, user_id: userId })
        .select()
        .single();

    if (error) {
        console.error('Error adding meal:', error);
        return null;
    }
    return data as Meal;
}

export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_MEALS)
        .update(updates)
        .eq('id', mealId);

    if (error) {
        console.error('Error updating meal:', error);
        return false;
    }
    return true;
}

export async function deleteMeal(mealId: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_MEALS)
        .delete()
        .eq('id', mealId);

    if (error) {
        console.error('Error deleting meal:', error);
        return false;
    }
    return true;
}

export async function getMealsPaginated(
    userId: string,
    options: {
        dateFrom?: string;
        dateTo?: string;
        limit: number;
        offset: number;
    }
): Promise<{ data: Meal[]; hasMore: boolean }> {
    let query = supabase
        .from(TABLE_MEALS)
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1);

    if (options.dateFrom) {
        query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
        query = query.lte('date', options.dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching meals paginated:', error);
        return { data: [], hasMore: false };
    }

    const meals = data as Meal[];
    const hasMore = (count ?? 0) > options.offset + meals.length;

    return { data: meals, hasMore };
}
