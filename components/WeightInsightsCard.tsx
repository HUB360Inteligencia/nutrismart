import { useState, useEffect, useMemo } from 'react';
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    Target,
    Calendar,
    Lightbulb,
    RefreshCw,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { WeightGoal, WeightEntry, User } from '../types';
import { calculateWeeklyChange } from '../services/CalorieAdjustmentService';
import { callGeminiApi } from '../services/geminiService';

interface WeightInsightsCardProps {
    user: User;
    weightHistory: WeightEntry[];
    compact?: boolean;
}

interface AIInsights {
    assessment: string;
    trend: 'accelerating' | 'consistent' | 'slowing' | 'plateau' | 'fluctuating';
    trendLabel: string;
    tip: string;
    estimatedGoalDate?: string;
    weeklyRateAdvice: 'safe' | 'too_fast' | 'too_slow';
    motivationalMessage: string;
}

export default function WeightInsightsCard({
    user,
    weightHistory,
    compact = false
}: WeightInsightsCardProps) {
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const weightGoal = user.weightGoal;
    const currentWeight = user.weight || 0;

    const weeklyChange = useMemo(() =>
        calculateWeeklyChange(weightHistory),
        [weightHistory]
    );

    // Only show if user has an active weight goal
    if (!weightGoal || weightGoal.status !== 'active') {
        return null;
    }

    const fetchInsights = async () => {
        if (!weightGoal || weightHistory.length < 2) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await callGeminiApi('analyze-weight-progress', {
                weightHistory: weightHistory.slice(-14), // Last 2 weeks
                weightGoal: {
                    startWeight: weightGoal.startWeight,
                    targetWeight: weightGoal.targetWeight,
                    startDate: weightGoal.startDate
                },
                currentWeight,
                weeklyChange,
                isClinicalMode: user.isClinicalMode,
                medication: user.clinicalSettings?.medication
            });

            if (response) {
                const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                setInsights(parsed);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch weight insights:', err);
            setError('Não foi possível analisar seu progresso');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch on mount if we have enough data
    useEffect(() => {
        if (weightHistory.length >= 2 && !insights && !isLoading) {
            fetchInsights();
        }
    }, [weightHistory.length]);

    const getTrendIcon = () => {
        if (!insights) return <Minus className="w-5 h-5" />;

        switch (insights.trend) {
            case 'accelerating':
                return <TrendingDown className="w-5 h-5 text-emerald-400" />;
            case 'consistent':
                return <Target className="w-5 h-5 text-blue-400" />;
            case 'slowing':
                return <TrendingUp className="w-5 h-5 text-amber-400" />;
            case 'plateau':
                return <Minus className="w-5 h-5 text-orange-400" />;
            case 'fluctuating':
                return <RefreshCw className="w-5 h-5 text-purple-400" />;
            default:
                return <Minus className="w-5 h-5" />;
        }
    };

    const getRateAdviceIcon = () => {
        if (!insights) return null;

        switch (insights.weeklyRateAdvice) {
            case 'safe':
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'too_fast':
                return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'too_slow':
                return <AlertTriangle className="w-4 h-4 text-blue-400" />;
            default:
                return null;
        }
    };

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border border-purple-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-white text-sm">Insights IA</span>
                    </div>
                    <button
                        onClick={fetchInsights}
                        disabled={isLoading}
                        className="text-purple-400 hover:text-purple-300 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-gray-400">{error}</p>
                ) : insights ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {getTrendIcon()}
                            <span className="text-sm text-gray-300">{insights.trendLabel}</span>
                        </div>
                        <p className="text-xs text-gray-400">{insights.tip}</p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">
                        {weightHistory.length < 2
                            ? 'Registre mais peso para análise'
                            : 'Clique para analisar'}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 via-purple-900/20 to-gray-900 rounded-2xl p-6 border border-purple-700/30 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Análise de Progresso</h3>
                        <p className="text-sm text-gray-400">Insights personalizados com IA</p>
                    </div>
                </div>

                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Analisando...' : 'Atualizar'}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Analisando seu progresso...</p>
                </div>
            ) : error ? (
                <div className="text-center py-6">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">{error}</p>
                    <button
                        onClick={fetchInsights}
                        className="mt-3 text-sm text-purple-400 hover:text-purple-300"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : insights ? (
                <div className="space-y-5">
                    {/* Trend Badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg">
                            {getTrendIcon()}
                            <span className="text-sm font-medium text-gray-200">{insights.trendLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {getRateAdviceIcon()}
                            <span className="text-xs text-gray-400">
                                {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}kg/sem
                            </span>
                        </div>
                    </div>

                    {/* Assessment */}
                    <div className="bg-gray-800/30 rounded-xl p-4">
                        <p className="text-gray-200 leading-relaxed">{insights.assessment}</p>
                    </div>

                    {/* Tip */}
                    <div className="flex gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-300 mb-1">Dica da Semana</p>
                            <p className="text-sm text-gray-300">{insights.tip}</p>
                        </div>
                    </div>

                    {/* Estimated Date & Motivation */}
                    <div className="grid grid-cols-2 gap-4">
                        {insights.estimatedGoalDate && (
                            <div className="bg-gray-800/50 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-gray-400">Projeção</span>
                                </div>
                                <p className="text-sm font-medium text-white">{insights.estimatedGoalDate}</p>
                            </div>
                        )}

                        <div className={`bg-gray-800/50 rounded-xl p-3 ${!insights.estimatedGoalDate ? 'col-span-2' : ''}`}>
                            <p className="text-sm text-center text-gray-300 italic">
                                "{insights.motivationalMessage}"
                            </p>
                        </div>
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <p className="text-xs text-gray-500 text-center">
                            Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">
                        {weightHistory.length < 2
                            ? 'Registre pelo menos 2 entradas de peso para ver análises personalizadas'
                            : 'Clique em "Atualizar" para receber insights baseados em IA sobre seu progresso'}
                    </p>
                    {weightHistory.length >= 2 && (
                        <button
                            onClick={fetchInsights}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition font-medium"
                        >
                            Analisar Progresso
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
