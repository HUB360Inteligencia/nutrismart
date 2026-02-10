
import { calculateStreak, getUserProgress, TABLE_USER_PROGRESS } from '../gamificationService';
import { supabase } from '../supabaseClient';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn()
    }
}));

// Mock getUserProgress
jest.mock('../gamificationService', () => {
    const originalModule = jest.requireActual('../gamificationService');
    return {
        ...originalModule,
        getUserProgress: jest.fn(),
    };
});

describe('gamificationService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('calculateStreak returns streak from user progress', async () => {
        const userId = 'user123';

        // Mock getUserProgress response
        (getUserProgress as jest.Mock).mockResolvedValue({
            streak: 5
        });

        const streak = await calculateStreak(userId);
        expect(streak).toBe(5);
    });

    test('calculateStreak returns 0 if no progress found', async () => {
        const userId = 'userNew';

        // Mock getUserProgress response
        (getUserProgress as jest.Mock).mockResolvedValue(null);

        const streak = await calculateStreak(userId);
        expect(streak).toBe(0);
    });
});
