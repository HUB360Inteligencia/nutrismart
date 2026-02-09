import React from 'react';
import { Syringe, Calendar, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { ClinicalSettings } from '../types';

interface MedicationTrackerProps {
    settings: ClinicalSettings;
    onLogSymptom: () => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function calculateDaysUntilInjection(settings: ClinicalSettings): number {
    const { startDate, intervalDays = 7, injectionDay } = settings;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Option 1: Weekly fixed day strategy (Legacy/Preferred for 7 days)
    if (intervalDays === 7 && injectionDay !== undefined) {
        const currentDay = today.getDay();
        let daysUntil = injectionDay - currentDay;

        // If today is the day, return 0 (Is Today)
        if (daysUntil === 0) return 0;

        // If passed, add 7 to get next week
        if (daysUntil < 0) daysUntil += 7;

        return daysUntil;
    }

    // Option 2: Interval strategy (from Start Date)
    const start = new Date(startDate + 'T00:00:00'); // Ensure local time treatment
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        // Start date is in future
        return Math.abs(diffDays);
    }

    const daysIntoCycle = diffDays % intervalDays;

    // If modulo is 0, it's today
    if (daysIntoCycle === 0) return 0;

    return intervalDays - daysIntoCycle;
}

function getWeeksSinceTreatment(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

const MedicationTracker: React.FC<MedicationTrackerProps> = ({ settings, onLogSymptom }) => {
    const daysUntil = calculateDaysUntilInjection(settings);
    const isToday = daysUntil === 0;
    const weeksSinceTreatment = getWeeksSinceTreatment(settings.startDate);

    // Calculate next date string
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysUntil);
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const nextDateString = nextDate.toLocaleDateString('pt-BR', dateOptions);

    return (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-5 border border-teal-100/50 shadow-sm animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Syringe size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Modo Clínico</h3>
                        <p className="text-xs text-teal-600 font-medium">{settings.medication} • {settings.dosage}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full">
                    <TrendingUp size={12} />
                    <span className="font-medium">Semana {weeksSinceTreatment + 1}</span>
                </div>
            </div>

            {/* Next Injection Card */}
            <div className={`rounded-2xl p-4 mb-3 transition-colors ${isToday
                ? 'bg-amber-100 border border-amber-200'
                : daysUntil <= 2
                    ? 'bg-teal-100 border border-teal-200'
                    : 'bg-white border border-gray-100'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isToday
                            ? 'bg-amber-500 text-white'
                            : 'bg-teal-500/10 text-teal-600'
                            }`}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className={`text-xs font-medium ${isToday ? 'text-amber-700' : 'text-gray-500'}`}>
                                Próxima aplicação
                            </p>
                            <p className={`font-bold text-lg ${isToday ? 'text-amber-800' : 'text-gray-900'}`}>
                                {isToday ? (
                                    'Hoje!'
                                ) : daysUntil === 1 ? (
                                    'Amanhã'
                                ) : (
                                    <span className="flex items-center gap-1">
                                        {nextDateString}
                                        <span className="text-xs font-normal text-gray-400 ml-1">
                                            (em {daysUntil} dias)
                                        </span>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {isToday && (
                        <span className="animate-pulse text-2xl">💉</span>
                    )}
                </div>
            </div>

            {/* Info Pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-500 whitespace-nowrap">
                    <Clock size={12} className="text-teal-500" />
                    <span>
                        Frequência: {settings.intervalDays === 7 ? 'Semanal' : `A cada ${settings.intervalDays} dias`}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <button
                onClick={onLogSymptom}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-sm font-medium text-gray-700 shadow-sm hover:shadow"
            >
                <AlertCircle size={16} className="text-gray-500" />
                Registrar sintomas
            </button>

            {/* Protein Reminder */}
            <div className="mt-3 text-center">
                <p className="text-xs text-teal-600">
                    🥩 Meta de proteína: <span className="font-bold">{settings.proteinGoalPerKg || 1.6}g/kg</span> de peso corporal
                </p>
            </div>
        </div>
    );
};

export default MedicationTracker;
