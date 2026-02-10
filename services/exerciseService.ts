
import { supabase } from './supabaseClient';
import { Exercise } from '../types';

export const TABLE_EXERCISES = 'exercises';

export async function getExercises(userId: string, date?: string): Promise<Exercise[]> {
    let query = supabase.from(TABLE_EXERCISES).select('*').eq('user_id', userId);

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching exercises:', error);
        return [];
    }
    return data as Exercise[];
}

export async function addExercise(userId: string, exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> {
    const { data, error } = await supabase
        .from(TABLE_EXERCISES)
        .insert({ ...exercise, user_id: userId })
        .select()
        .single();

    if (error) {
        console.error('Error adding exercise:', error);
        return null;
    }
    return data as Exercise;
}

export async function updateExercise(exerciseId: string, updates: Partial<Exercise>): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_EXERCISES)
        .update(updates)
        .eq('id', exerciseId);

    if (error) {
        console.error('Error updating exercise:', error);
        return false;
    }
    return true;
}

export async function deleteExercise(exerciseId: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_EXERCISES)
        .delete()
        .eq('id', exerciseId);

    if (error) {
        console.error('Error deleting exercise:', error);
        return false;
    }
    return true;
}

export async function getExercisesPaginated(
    userId: string,
    options: {
        dateFrom?: string;
        dateTo?: string;
        limit: number;
        offset: number;
    }
): Promise<{ data: Exercise[]; hasMore: boolean }> {
    let query = supabase
        .from(TABLE_EXERCISES)
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
        console.error('Error fetching exercises paginated:', error);
        return { data: [], hasMore: false };
    }

    const exercises = data as Exercise[];
    const hasMore = (count ?? 0) > options.offset + exercises.length;

    return { data: exercises, hasMore };
}
