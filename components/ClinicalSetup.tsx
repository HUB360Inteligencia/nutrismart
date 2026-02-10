import React, { useState, useEffect } from 'react';
import { Syringe, Calendar, Pill, AlertCircle, Clock } from 'lucide-react';
import { ClinicalSettings } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

interface ClinicalSetupProps {
    onComplete: (settings: ClinicalSettings | undefined) => void;
    initialSettings?: ClinicalSettings;
    isEditing?: boolean;
}

const MEDICATIONS = [
    { value: 'Mounjaro', label: 'Tirzepatida (Mounjaro, Tirzec, TG, Lipoless, Lipoland)' },
    { value: 'Ozempic', label: 'Semaglutida (Ozempic, Wegovy)' },
    { value: 'Saxenda', label: 'Liraglutida (Saxenda)' },
    { value: 'Rybelsus', label: 'Semaglutida oral (Rybelsus)' },
    { value: 'Outro', label: 'Outro medicamento (Digitar nome)' },
];

const FREQUENCIES = [
    { value: 7, label: 'Semanal (7 dias)' },
    { value: 1, label: 'Diário' },
    { value: 5, label: 'A cada 5 dias' },
    { value: 10, label: 'A cada 10 dias' },
    { value: 14, label: 'Quinzenal (14 dias)' },
    { value: 30, label: 'Mensal (30 dias)' },
];

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
];

const ClinicalSetup: React.FC<ClinicalSetupProps> = ({ onComplete, initialSettings, isEditing = false }) => {
    // Determine initial medication state checking if it's in predefined list
    const getInitialMedicationState = () => {
        if (!initialSettings?.medication) return { type: '', custom: '' };

        const isPredefined = MEDICATIONS.some(m => m.value === initialSettings.medication);
        return {
            type: isPredefined ? initialSettings.medication : 'Outro',
            custom: isPredefined ? '' : initialSettings.medication
        };
    };

    const initialState = getInitialMedicationState();

    const [medication, setMedication] = useState(initialState.type);
    const [customMedication, setCustomMedication] = useState(initialState.custom);
    const [dosage, setDosage] = useState(initialSettings?.dosage || '');
    const [intervalDays, setIntervalDays] = useState(initialSettings?.intervalDays ?? 7);
    const [injectionDay, setInjectionDay] = useState(initialSettings?.injectionDay ?? 1);
    const [startDate, setStartDate] = useState(
        initialSettings?.startDate || getLocalDateString()
    );

    useEffect(() => {
        const finalMedicationName = medication === 'Outro' ? customMedication : medication;
        const isValid = finalMedicationName && dosage && startDate && intervalDays > 0;

        if (isValid) {
            onComplete({
                medication: finalMedicationName,
                dosage,
                injectionDay: intervalDays === 7 ? injectionDay : undefined, // Only save day of week if weekly
                intervalDays,
                startDate,
                proteinGoalPerKg: 1.6, // Default for GLP-1 patients
            });
        } else {
            onComplete(undefined);
        }
    }, [medication, customMedication, dosage, injectionDay, intervalDays, startDate, onComplete]);

    return (
        <div className="space-y-6 animate-fade-in text-left">
            {/* Header - Only show if not editing or explicitly requested */}
            {!isEditing && (
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Syringe size={32} className="text-teal-600" />
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-gray-900">Configuração Clínica</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Informe detalhes do seu tratamento para personalizar sua experiência
                    </p>
                </div>
            )}

            {/* Info Banner */}
            {!isEditing && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        Esses dados são usados apenas para personalizar suas recomendações nutricionais.
                        Priorizaremos proteínas e alimentos leves para suportar seu tratamento.
                    </p>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Medication Select */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                        <Pill size={18} className="text-teal-500" />
                        Medicamento
                    </label>
                    <select
                        value={medication}
                        onChange={(e) => setMedication(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-teal-500 focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Selecione seu medicamento</option>
                        {MEDICATIONS.map((med) => (
                            <option key={med.value} value={med.value}>
                                {med.label}
                            </option>
                        ))}
                    </select>

                    {/* Custom Medication Input */}
                    {medication === 'Outro' && (
                        <input
                            type="text"
                            value={customMedication}
                            onChange={(e) => setCustomMedication(e.target.value)}
                            placeholder="Digite o nome do medicamento"
                            className="w-full mt-3 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-teal-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300 animate-slide-in-top"
                            autoFocus
                        />
                    )}
                </div>

                {/* Dosage Input */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                        <Syringe size={18} className="text-teal-500" />
                        Dosagem Atual
                    </label>
                    <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="Ex: 0.25mg, 0.5mg, 1.0mg"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-teal-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                    />
                </div>

                {/* Frequency Selector */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                        <Clock size={18} className="text-teal-500" />
                        Frequência de Aplicação
                    </label>
                    <select
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Number(e.target.value))}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-teal-500 focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                    >
                        {FREQUENCIES.map((freq) => (
                            <option key={freq.value} value={freq.value}>
                                {freq.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Injection Day - Only show if weekly (7 days) */}
                {intervalDays === 7 && (
                    <div className="animate-fade-in">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                            <Calendar size={18} className="text-teal-500" />
                            Dia da Semana Preferido
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day.value}
                                    onClick={() => setInjectionDay(day.value)}
                                    className={`py - 3 rounded - xl text - xs font - bold transition - all ${injectionDay === day.value
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        } `}
                                >
                                    {day.label.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Start Date */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                        <Calendar size={18} className="text-teal-500" />
                        {intervalDays === 7 ? 'Início do Tratamento' : 'Data da Última (ou Próxima) Aplicação'}
                    </label>
                    <p className="text-xs text-gray-400 mb-2 px-1">
                        Isso nos ajuda a calcular suas próximas doses corretamente.
                    </p>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-teal-500 focus:ring-0 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
};

export default ClinicalSetup;
