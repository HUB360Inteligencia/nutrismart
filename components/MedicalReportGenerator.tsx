import React, { useState } from 'react';
import { FileText, Download, Loader2, AlertCircle, Check } from 'lucide-react';
import { generateMedicalReport, downloadPDF, ReportData } from '../services/pdfService';
import type { User, Meal, Symptom } from '../types';

interface MedicalReportGeneratorProps {
    user: User;
    meals: Meal[];
    symptoms?: Symptom[];
    weightHistory?: { date: string; weight: number }[];
    onGenerateSummary?: (data: { proteinAdherence: number; symptoms: Symptom[] }) => Promise<string>;
}

type DateRangeOption = '7' | '15' | '30' | 'custom';

const MedicalReportGenerator: React.FC<MedicalReportGeneratorProps> = ({
    user,
    meals,
    symptoms = [],
    weightHistory = [],
    onGenerateSummary,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('30');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [error, setError] = useState<string | null>(null);

    const getDateRange = (): { start: Date; end: Date } => {
        const end = new Date();
        let start: Date;

        if (dateRangeOption === 'custom' && customStart && customEnd) {
            return {
                start: new Date(customStart),
                end: new Date(customEnd),
            };
        }

        const days = parseInt(dateRangeOption);
        start = new Date();
        start.setDate(start.getDate() - days);

        return { start, end };
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const dateRange = getDateRange();

            // Filter data by date range
            const startStr = dateRange.start.toISOString().split('T')[0];
            const endStr = dateRange.end.toISOString().split('T')[0];

            const filteredMeals = meals.filter(m => {
                const mealDate = m.date || m.time.split('T')[0];
                return mealDate >= startStr && mealDate <= endStr;
            });

            const filteredSymptoms = symptoms.filter(s => {
                return s.date >= startStr && s.date <= endStr;
            });

            const filteredWeight = weightHistory.filter(w => {
                return w.date >= startStr && w.date <= endStr;
            });

            // Generate AI summary if clinical mode and callback provided
            let aiSummary: string | undefined;
            if (user.isClinicalMode && onGenerateSummary && filteredSymptoms.length > 0) {
                try {
                    // Calculate protein adherence for AI context
                    const daysWithMeals = new Set(filteredMeals.map(m => m.date || m.time.split('T')[0])).size;
                    const daysMetProtein = filteredMeals.reduce((count, meal) => {
                        if (meal.macros.protein >= user.macros.protein * 0.9) count++;
                        return count;
                    }, 0);
                    const proteinAdherence = daysWithMeals > 0 ? Math.round((daysMetProtein / daysWithMeals) * 100) : 0;

                    aiSummary = await onGenerateSummary({
                        proteinAdherence,
                        symptoms: filteredSymptoms,
                    });
                } catch {
                    console.warn('Failed to generate AI summary, proceeding without it');
                }
            }

            const reportData: ReportData = {
                user,
                dateRange,
                meals: filteredMeals,
                symptoms: filteredSymptoms,
                weightHistory: filteredWeight,
                aiSummary,
            };

            const pdfBlob = await generateMedicalReport(reportData);

            const filename = `NutriSmart_Relatorio_${user.name.replace(/\s+/g, '_')}_${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}.pdf`;
            downloadPDF(pdfBlob, filename);

        } catch (err) {
            console.error('Error generating report:', err);
            setError('Erro ao gerar relatório. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const reportItems = [
        'Dados pessoais',
        'Resumo nutricional',
        'Evolução do peso',
        ...(user.isClinicalMode ? ['Tratamento GLP-1', 'Sintomas', 'Análise IA'] : []),
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-nutri-400 to-nutri-600 rounded-xl flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Relatório Médico</h3>
                        <p className="text-xs text-gray-500">PDF para consulta médica</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Period Selector - Compact Pills */}
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Período</span>
                    <div className="flex gap-2">
                        {(['7', '15', '30', 'custom'] as DateRangeOption[]).map((option) => (
                            <button
                                key={option}
                                onClick={() => setDateRangeOption(option)}
                                className={`px-4 py-2 text-sm rounded-full font-medium transition-all ${dateRangeOption === option
                                        ? 'bg-nutri-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {option === 'custom' ? 'Outro' : `${option}d`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Range */}
                {dateRangeOption === 'custom' && (
                    <div className="flex gap-3 animate-fade-in">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">De</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-nutri-500 focus:border-nutri-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Até</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-nutri-500 focus:border-nutri-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* What's Included - Compact Chips */}
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Inclui</span>
                    <div className="flex flex-wrap gap-2">
                        {reportItems.map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100"
                            >
                                <Check size={12} className="text-nutri-500" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (dateRangeOption === 'custom' && (!customStart || !customEnd))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-nutri-500/20"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Baixar PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MedicalReportGenerator;
