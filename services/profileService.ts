
import { supabase } from './supabaseClient';
import { User } from '../types';

export const TABLE_PROFILES = 'profiles';

export async function getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from(TABLE_PROFILES)
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data as User;
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_PROFILES)
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return false;
    }
    return true;
}

export async function createProfile(user: User): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_PROFILES)
        .insert(user);

    if (error) {
        console.error('Error creating profile:', error);
        return false;
    }
    return true;
}
