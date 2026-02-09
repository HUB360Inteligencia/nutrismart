import React, { useState } from 'react';
import { X, AlertCircle, Check, ChevronRight } from 'lucide-react';

interface SymptomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (symptom: string, severity: number, notes?: string) => Promise<void>;
}

const SYMPTOMS = [
    { id: 'nausea', label: 'Náusea', emoji: '🤢' },
    { id: 'tontura', label: 'Tontura', emoji: '😵' },
    { id: 'fadiga', label: 'Fadiga', emoji: '😴' },
    { id: 'dor_cabeca', label: 'Dor de cabeça', emoji: '🤕' },
    { id: 'azia', label: 'Azia / Refluxo', emoji: '🔥' },
    { id: 'constipacao', label: 'Constipação', emoji: '😣' },
    { id: 'diarreia', label: 'Diarreia', emoji: '💨' },
    { id: 'apetite_reduzido', label: 'Apetite reduzido', emoji: '🍽️' },
    { id: 'outro', label: 'Outro', emoji: '📝' },
];

const SEVERITY_LEVELS = [
    { value: 1, label: 'Muito leve', emoji: '😊', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 2, label: 'Leve', emoji: '🙂', color: 'bg-lime-100 text-lime-700 border-lime-200' },
    { value: 3, label: 'Moderado', emoji: '😐', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 4, label: 'Intenso', emoji: '😟', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 5, label: 'Muito intenso', emoji: '😖', color: 'bg-red-100 text-red-700 border-red-200' },
];

const SymptomModal: React.FC<SymptomModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [selectedSymptom, setSelectedSymptom] = useState('');
    const [severity, setSeverity] = useState(3);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedSymptom) return;

        setIsSubmitting(true);
        try {
            await onSubmit(selectedSymptom, severity, notes || undefined);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setSelectedSymptom('');
                setSeverity(3);
                setNotes('');
                onClose();
            }, 1500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const symptomLabel = SYMPTOMS.find(s => s.id === selectedSymptom)?.label || selectedSymptom;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Registrar Sintoma</h2>
                            <p className="text-xs text-gray-500">Como você está se sentindo?</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {showSuccess ? (
                        <div className="text-center py-10 animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-green-600" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 mb-2">Registrado!</h3>
                            <p className="text-gray-500">Seu sintoma foi salvo com sucesso.</p>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Symptom Selection */}
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-3 block">
                                    Qual sintoma você está sentindo?
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SYMPTOMS.map((symptom) => (
                                        <button
                                            key={symptom.id}
                                            onClick={() => setSelectedSymptom(symptom.id)}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${selectedSymptom === symptom.id
                                                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className="text-xl block mb-1">{symptom.emoji}</span>
                                            <span className={`text-xs font-medium ${selectedSymptom === symptom.id ? 'text-teal-700' : 'text-gray-600'
                                                }`}>
                                                {symptom.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Severity */}
                            {selectedSymptom && (
                                <div className="animate-fade-in">
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                                        Qual a intensidade?
                                    </label>
                                    <div className="flex gap-2">
                                        {SEVERITY_LEVELS.map((level) => (
                                            <button
                                                key={level.value}
                                                onClick={() => setSeverity(level.value)}
                                                className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${severity === level.value
                                                        ? level.color + ' shadow-sm'
                                                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-xl block">{level.emoji}</span>
                                                <span className="text-[10px] font-medium block mt-0.5">
                                                    {level.value}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs text-gray-500 mt-2">
                                        {SEVERITY_LEVELS.find(l => l.value === severity)?.label}
                                    </p>
                                </div>
                            )}

                            {/* Step 3: Notes (Optional) */}
                            {selectedSymptom && (
                                <div className="animate-fade-in">
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">
                                        Observações (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ex: Senti após a refeição, durou 2 horas..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-teal-500 focus:ring-0 outline-none resize-none text-sm placeholder:text-gray-300"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!showSuccess && (
                    <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedSymptom || isSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-all font-bold"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    Registrar {symptomLabel}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomModal;
