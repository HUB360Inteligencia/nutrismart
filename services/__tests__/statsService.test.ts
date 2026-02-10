
import { getWeeklyStats, TABLE_DAILY_LOGS } from '../statsService';
import { supabase } from '../supabaseClient';
import { TABLE_MEALS } from '../mealService';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn()
    }
}));

describe('statsService', () => {
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockGte = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup chain mock
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect.mockReturnValue({
                eq: mockEq.mockReturnValue({
                    gte: mockGte
                })
            })
        });
    });

    test('getWeeklyStats aggregates meals and water correctly', async () => {
        const userId = 'user123';
        const today = new Date().toISOString().split('T')[0];

        // Mock Meals Response
        const mockMeals = [
            { date: today, calories: 500, protein: 30, carbs: 50, fats: 20 },
            { date: today, calories: 300, protein: 20, carbs: 30, fats: 10 }
        ];

        // Mock Logs Response
        const mockLogs = [
            { date: today, water_consumed: 1000 }
        ];

        // Simulate different calls for different tables
        mockGte.mockImplementationOnce(() => Promise.resolve({ data: mockMeals, error: null })); // For Meals
        mockGte.mockImplementationOnce(() => Promise.resolve({ data: mockLogs, error: null })); // For Logs

        const result = await getWeeklyStats(userId);

        // Verify aggregation for today
        const todayStats = result.find(r => r.date === today);
        expect(todayStats).toBeDefined();
        expect(todayStats?.stats.caloriesConsumed).toBe(800);
        expect(todayStats?.stats.waterConsumed).toBe(1000);
        expect(todayStats?.stats.proteinConsumed).toBe(50);
    });

    test('getWeeklyStats handles empty data', async () => {
        const userId = 'user123';
        mockGte.mockResolvedValue({ data: [], error: null });

        const result = await getWeeklyStats(userId);

        expect(result).toHaveLength(7); // Should return 7 days
        result.forEach(day => {
            expect(day.stats.caloriesConsumed).toBe(0);
            expect(day.stats.waterConsumed).toBe(0); // Assuming water defaults to 0
        });
    });
});
