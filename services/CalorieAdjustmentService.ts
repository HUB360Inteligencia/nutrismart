/**
 * CalorieAdjustmentService - Intelligent Calorie Recalculation
 * 
 * Monitors weight changes and suggests/applies calorie adjustments
 * to keep the user on track for their weight goal.
 */

import { WeightEntry, WeightGoal, User } from '../types';
import {
    calculateBMR,
    calculateTDEE,
    calculateCalorieGoal,
    calculateAdjustedWeight,
    calculateProtein,
    calculateFat,
    calculateCarbs,
    type Goal,
    type ActivityLevel
} from './nutritionCalculator';
import { detectPlateau } from './PlateauDetectionService';

export interface CalorieAdjustment {
    shouldAdjust: boolean;
    reason: 'weight_changed' | 'plateau_detected' | 'fast_loss' | 'slow_progress' | 'goal_achieved' | 'none';
    previousGoal: number;
    suggestedGoal: number;
    difference: number;
    message: string;
    severity: 'info' | 'warning' | 'success';
}

export interface WeightChangeAlert {
    type: 'fast_loss' | 'fast_gain' | 'slow_progress' | 'on_track' | 'goal_achieved';
    weeklyChange: number;
    message: string;
    recommendation?: string;
}

/**
 * Calculates weekly weight change from history
 */
export function calculateWeeklyChange(weightHistory: WeightEntry[]): number {
    if (weightHistory.length < 2) return 0;

    const sorted = [...weightHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get entries from last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentEntry = sorted[0];
    const weekOldEntries = sorted.filter(
        e => new Date(e.date) <= weekAgo
    );

    if (weekOldEntries.length === 0) {
        // Use oldest available entry if no week-old data
        const oldestEntry = sorted[sorted.length - 1];
        const daysDiff = Math.max(1, (new Date(recentEntry.date).getTime() - new Date(oldestEntry.date).getTime()) / (1000 * 60 * 60 * 24));
        return ((recentEntry.weight - oldestEntry.weight) / daysDiff) * 7;
    }

    const weekOldEntry = weekOldEntries[0];
    return recentEntry.weight - weekOldEntry.weight;
}

/**
 * Checks weight loss/gain velocity and returns appropriate alerts
 */
export function checkWeightVelocity(
    weightHistory: WeightEntry[],
    weightGoal: WeightGoal
): WeightChangeAlert {
    const weeklyChange = calculateWeeklyChange(weightHistory);
    const isLosing = weightGoal.startWeight > weightGoal.targetWeight;
    const absChange = Math.abs(weeklyChange);

    // Check if goal was achieved
    if (weightHistory.length > 0) {
        const currentWeight = weightHistory.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0].weight;

        if (isLosing && currentWeight <= weightGoal.targetWeight) {
            return {
                type: 'goal_achieved',
                weeklyChange,
                message: '🎉 Parabéns! Você alcançou sua meta de peso!',
                recommendation: 'Considere definir uma nova meta ou entrar em modo de manutenção.'
            };
        }
        if (!isLosing && currentWeight >= weightGoal.targetWeight) {
            return {
                type: 'goal_achieved',
                weeklyChange,
                message: '🎉 Parabéns! Você alcançou sua meta de peso!',
                recommendation: 'Considere definir uma nova meta ou entrar em modo de manutenção.'
            };
        }
    }

    // Check for fast loss (> 1kg/week)
    if (isLosing && weeklyChange < -1) {
        return {
            type: 'fast_loss',
            weeklyChange,
            message: `⚠️ Perda rápida detectada: ${absChange.toFixed(1)}kg em uma semana`,
            recommendation: 'Perda superior a 1kg/semana pode causar perda muscular e efeito rebote. Considere aumentar calorias em 200-300kcal.'
        };
    }

    // Check for fast gain when trying to lose
    if (isLosing && weeklyChange > 0.5) {
        return {
            type: 'fast_gain',
            weeklyChange,
            message: `📈 Ganho de ${absChange.toFixed(1)}kg esta semana`,
            recommendation: 'Verifique seus registros alimentares. Isso pode ser retenção de água ou variação normal.'
        };
    }

    // Check for slow progress (on loss goal)
    if (isLosing && weeklyChange > -0.2 && weeklyChange <= 0) {
        return {
            type: 'slow_progress',
            weeklyChange,
            message: 'Progresso lento detectado',
            recommendation: 'Considere revisar seu déficit calórico ou aumentar atividade física.'
        };
    }

    // On track
    return {
        type: 'on_track',
        weeklyChange,
        message: isLosing
            ? `✅ Perda saudável: ${absChange.toFixed(1)}kg esta semana`
            : `✅ Ganho saudável: ${absChange.toFixed(1)}kg esta semana`
    };
}

/**
 * Determines if calorie goals should be recalculated based on weight changes
 */
export function shouldRecalculateCalories(
    currentWeight: number,
    lastCalculatedWeight: number,
    weightHistory: WeightEntry[]
): { shouldRecalculate: boolean; reason: string } {
    const weightDiff = Math.abs(currentWeight - lastCalculatedWeight);

    // Recalculate if weight changed by more than 2kg
    if (weightDiff >= 2) {
        return {
            shouldRecalculate: true,
            reason: `Seu peso mudou ${weightDiff.toFixed(1)}kg desde o último cálculo`
        };
    }

    // Check for plateau (4+ weeks without significant change)
    if (weightHistory.length >= 4) {
        const sorted = [...weightHistory].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const oldEntries = sorted.filter(e => new Date(e.date) <= fourWeeksAgo);
        if (oldEntries.length > 0) {
            const fourWeekChange = Math.abs(currentWeight - oldEntries[0].weight);
            if (fourWeekChange < 0.5) {
                return {
                    shouldRecalculate: true,
                    reason: 'Possível platô detectado - peso estável há 4+ semanas'
                };
            }
        }
    }

    return { shouldRecalculate: false, reason: '' };
}

/**
 * Helper to calculate calories for a user profile
 */
function calculateUserCalories(
    weight: number,
    height: number,
    age: number,
    gender: 'masculino' | 'feminino' | 'outro',
    activityLevel: ActivityLevel,
    goal: Goal
): number {
    const bmr = calculateBMR({ weight, height, age, gender });
    const tdee = calculateTDEE(bmr, activityLevel);
    return calculateCalorieGoal(tdee, goal);
}

/**
 * Get user's activity level with fallback
 */
function getUserActivityLevel(user: User): ActivityLevel {
    const activityMap: Record<string, ActivityLevel> = {
        'sedentario': 'sedentario',
        'leve': 'leve',
        'moderado': 'moderado',
        'ativo': 'intenso', // Map legacy value
        'intenso': 'intenso',
        'muito_ativo': 'muito_intenso', // Map legacy value
        'muito_intenso': 'muito_intenso'
    };

    if (user.activityLevel && user.activityLevel in activityMap) {
        return activityMap[user.activityLevel as string];
    }
    return 'sedentario';
}

/**
 * Get user's goal with fallback
 */
function getUserGoal(user: User): Goal {
    const validGoals: Goal[] = ['perder_peso', 'manter_peso', 'ganhar_massa'];
    if (user.goal && validGoals.includes(user.goal as Goal)) {
        return user.goal as Goal;
    }
    return 'manter_peso';
}

/**
 * Main function: Analyzes and suggests calorie adjustments
 */
export function analyzeCalorieAdjustment(
    user: User,
    weightHistory: WeightEntry[],
    lastCalculatedWeight?: number
): CalorieAdjustment {
    const currentWeight = user.weight || 70;
    const previousWeight = lastCalculatedWeight || currentWeight;
    const weightGoal = user.weightGoal;

    // No adjustment needed if no weight goal
    if (!weightGoal || weightGoal.status !== 'active') {
        return {
            shouldAdjust: false,
            reason: 'none',
            previousGoal: user.dailyCalorieGoal,
            suggestedGoal: user.dailyCalorieGoal,
            difference: 0,
            message: 'Nenhuma meta de peso ativa',
            severity: 'info'
        };
    }

    // Check velocity alerts
    const velocityAlert = checkWeightVelocity(weightHistory, weightGoal);

    // Check if goal was achieved
    if (velocityAlert.type === 'goal_achieved') {
        // Calculate maintenance calories using current weight
        const maintenanceCalories = calculateUserCalories(
            currentWeight,
            user.height || 170,
            user.age || 30,
            user.gender || 'masculino',
            getUserActivityLevel(user),
            'manter_peso'
        );

        return {
            shouldAdjust: true,
            reason: 'goal_achieved',
            previousGoal: user.dailyCalorieGoal,
            suggestedGoal: maintenanceCalories,
            difference: maintenanceCalories - user.dailyCalorieGoal,
            message: '🎉 Meta alcançada! Transitando para modo manutenção.',
            severity: 'success'
        };
    }

    // Check if recalculation is needed
    const { shouldRecalculate, reason } = shouldRecalculateCalories(
        currentWeight,
        previousWeight,
        weightHistory
    );

    if (!shouldRecalculate) {
        // Check for fast loss warning
        if (velocityAlert.type === 'fast_loss') {
            const increased = user.dailyCalorieGoal + 250;
            return {
                shouldAdjust: true,
                reason: 'fast_loss',
                previousGoal: user.dailyCalorieGoal,
                suggestedGoal: increased,
                difference: 250,
                message: velocityAlert.recommendation || 'Considere aumentar calorias',
                severity: 'warning'
            };
        }

        return {
            shouldAdjust: false,
            reason: 'none',
            previousGoal: user.dailyCalorieGoal,
            suggestedGoal: user.dailyCalorieGoal,
            difference: 0,
            message: 'Suas metas estão adequadas',
            severity: 'info'
        };
    }

    // Calculate new calorie goal based on current weight
    // Use adjusted weight for obese users
    const adjustedWeight = calculateAdjustedWeight(
        currentWeight,
        weightGoal.targetWeight,
        user.height || 170
    );

    const newCalorieGoal = calculateUserCalories(
        adjustedWeight.weightForCalc,
        user.height || 170,
        user.age || 30,
        user.gender || 'masculino',
        getUserActivityLevel(user),
        getUserGoal(user)
    );

    const difference = newCalorieGoal - user.dailyCalorieGoal;

    // Check for plateau
    if (reason.includes('platô')) {
        // For plateaus, suggest a small reduction or diet break
        // Calculate approximate deficit (20% of TDEE as estimate)
        const estimatedDeficit = Math.round(user.dailyCalorieGoal * 0.2);
        const plateauAnalysis = detectPlateau(weightHistory, user.dailyCalorieGoal, estimatedDeficit);

        if (plateauAnalysis.suggestion === 'maintenance_week') {
            return {
                shouldAdjust: true,
                reason: 'plateau_detected',
                previousGoal: user.dailyCalorieGoal,
                suggestedGoal: user.dailyCalorieGoal + 300, // Temporary increase
                difference: 300,
                message: '🔄 Platô detectado. Sugerimos uma semana de manutenção para resetar o metabolismo.',
                severity: 'warning'
            };
        }

        return {
            shouldAdjust: true,
            reason: 'plateau_detected',
            previousGoal: user.dailyCalorieGoal,
            suggestedGoal: newCalorieGoal - 100, // Slight reduction
            difference: (newCalorieGoal - 100) - user.dailyCalorieGoal,
            message: plateauAnalysis.message,
            severity: 'warning'
        };
    }

    return {
        shouldAdjust: true,
        reason: 'weight_changed',
        previousGoal: user.dailyCalorieGoal,
        suggestedGoal: newCalorieGoal,
        difference,
        message: `${reason}. Novas metas calculadas.`,
        severity: 'info'
    };
}

/**
 * Recalculates macros when calories change
 */
export function recalculateMacrosForAdjustment(
    newCalorieGoal: number,
    user: User
): { protein: number; carbs: number; fats: number } {
    // Use adjusted weight for protein calculation if obese
    let proteinWeight = user.weight || 70;

    if (user.weightGoal) {
        const adjusted = calculateAdjustedWeight(
            user.weight || 70,
            user.weightGoal.targetWeight,
            user.height || 170
        );
        proteinWeight = adjusted.weightForCalc;
    }

    const goal = getUserGoal(user);
    const protein = calculateProtein(proteinWeight, goal, user.isClinicalMode);
    const fats = calculateFat(proteinWeight);
    const carbResult = calculateCarbs(newCalorieGoal, protein, fats);

    return {
        protein,
        carbs: carbResult.carbGrams,
        fats
    };
}
