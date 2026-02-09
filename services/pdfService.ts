import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User, Meal, Symptom, ClinicalSettings } from '../types';

interface AutoTableOptions {
    startY?: number;
    head?: string[][];
    body?: (string | number)[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: { fillColor?: number[]; textColor?: number[]; fontStyle?: string };
    styles?: { fontSize?: number; cellPadding?: number };
    margin?: { left?: number; right?: number };
}

export interface ReportData {
    user: User;
    dateRange: { start: Date; end: Date };
    meals: Meal[];
    symptoms?: Symptom[];
    weightHistory?: { date: string; weight: number }[];
    aiSummary?: string;
}

export interface MacroAverages {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFats: number;
    daysTracked: number;
    proteinAdherence: number; // Percentage of days meeting protein goal
}

/**
 * Calculate macro averages from meals within a date range
 */
export function calculateMacroAverages(
    meals: Meal[],
    dateRange: { start: Date; end: Date },
    proteinGoal: number
): MacroAverages {
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];

    // Group meals by date
    const mealsByDate = new Map<string, Meal[]>();

    for (const meal of meals) {
        const mealDate = meal.date || meal.time.split('T')[0];
        if (mealDate >= startStr && mealDate <= endStr) {
            if (!mealsByDate.has(mealDate)) {
                mealsByDate.set(mealDate, []);
            }
            mealsByDate.get(mealDate)!.push(meal);
        }
    }

    const daysTracked = mealsByDate.size;
    if (daysTracked === 0) {
        return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFats: 0, daysTracked: 0, proteinAdherence: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let daysMetProteinGoal = 0;

    for (const [, dayMeals] of mealsByDate) {
        const dayCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
        const dayProtein = dayMeals.reduce((sum, m) => sum + m.macros.protein, 0);
        const dayCarbs = dayMeals.reduce((sum, m) => sum + m.macros.carbs, 0);
        const dayFats = dayMeals.reduce((sum, m) => sum + m.macros.fats, 0);

        totalCalories += dayCalories;
        totalProtein += dayProtein;
        totalCarbs += dayCarbs;
        totalFats += dayFats;

        if (dayProtein >= proteinGoal * 0.9) { // 90% threshold
            daysMetProteinGoal++;
        }
    }

    return {
        avgCalories: Math.round(totalCalories / daysTracked),
        avgProtein: Math.round(totalProtein / daysTracked),
        avgCarbs: Math.round(totalCarbs / daysTracked),
        avgFats: Math.round(totalFats / daysTracked),
        daysTracked,
        proteinAdherence: Math.round((daysMetProteinGoal / daysTracked) * 100),
    };
}

/**
 * Generate a medical report PDF
 */
export async function generateMedicalReport(data: ReportData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Colors
    const primaryColor: [number, number, number] = [20, 184, 166]; // Teal-500
    const textColor: [number, number, number] = [31, 41, 55]; // Gray-800

    // Helper functions
    const addHeader = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('NutriSmart', margin, 15);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Relatório de Acompanhamento Nutricional', margin, 25);

        yPos = 45;
    };

    const addSection = (title: string) => {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        yPos += 8;

        doc.setDrawColor(...primaryColor);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
    };

    // Header
    addHeader();

    // Patient Info Section
    addSection('Informações do Paciente');

    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');
    const periodStr = `${formatDate(data.dateRange.start)} a ${formatDate(data.dateRange.end)}`;

    doc.text(`Nome: ${data.user.name}`, margin, yPos);
    yPos += 6;
    doc.text(`Período do Relatório: ${periodStr}`, margin, yPos);
    yPos += 6;

    if (data.user.weight) {
        doc.text(`Peso Atual: ${data.user.weight} kg`, margin, yPos);
        yPos += 6;
    }
    if (data.user.height) {
        doc.text(`Altura: ${data.user.height} cm`, margin, yPos);
        yPos += 6;
    }
    if (data.user.age) {
        doc.text(`Idade: ${data.user.age} anos`, margin, yPos);
        yPos += 6;
    }

    yPos += 10;

    // Macro Averages Section
    addSection('Resumo Nutricional');

    const macroAverages = calculateMacroAverages(
        data.meals,
        data.dateRange,
        data.user.macros.protein
    );

    autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Média Diária', 'Meta', 'Adesão']],
        body: [
            ['Calorias', `${macroAverages.avgCalories} kcal`, `${data.user.dailyCalorieGoal} kcal`, `${Math.round((macroAverages.avgCalories / data.user.dailyCalorieGoal) * 100)}%`],
            ['Proteínas', `${macroAverages.avgProtein}g`, `${data.user.macros.protein}g`, `${macroAverages.proteinAdherence}%`],
            ['Carboidratos', `${macroAverages.avgCarbs}g`, `${data.user.macros.carbs}g`, '-'],
            ['Gorduras', `${macroAverages.avgFats}g`, `${data.user.macros.fats}g`, '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: margin, right: margin },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Weight History (if available)
    if (data.weightHistory && data.weightHistory.length > 1) {
        addSection('Evolução do Peso');

        const weightData = data.weightHistory.map(w => [w.date, `${w.weight} kg`]);

        autoTable(doc, {
            startY: yPos,
            head: [['Data', 'Peso']],
            body: weightData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            margin: { left: margin, right: margin },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // Clinical Mode Section
    if (data.user.isClinicalMode && data.user.clinicalSettings) {
        addSection('Acompanhamento Clínico (GLP-1)');

        const clinical = data.user.clinicalSettings;
        doc.text(`Medicamento: ${clinical.medication}`, margin, yPos);
        yPos += 6;
        doc.text(`Dosagem: ${clinical.dosage}`, margin, yPos);
        yPos += 6;
        doc.text(`Início do Tratamento: ${clinical.startDate}`, margin, yPos);
        yPos += 10;

        // Symptoms table
        if (data.symptoms && data.symptoms.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Sintomas Registrados:', margin, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');

            // Group symptoms by type and count occurrences
            const symptomCounts = new Map<string, number>();
            for (const s of data.symptoms) {
                symptomCounts.set(s.symptom, (symptomCounts.get(s.symptom) || 0) + 1);
            }

            const symptomData = Array.from(symptomCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([symptom, count]) => [symptom, count.toString()]);

            autoTable(doc, {
                startY: yPos,
                head: [['Sintoma', 'Ocorrências']],
                body: symptomData,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 4 },
                margin: { left: margin, right: margin },
            });

            yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
        }

        // AI Summary
        if (data.aiSummary) {
            addSection('Análise Clínica (IA)');

            const lines = doc.splitTextToSize(data.aiSummary, pageWidth - 2 * margin);
            doc.text(lines, margin, yPos);
            yPos += lines.length * 5 + 10;
        }
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} - NutriSmart`,
        margin,
        footerY
    );

    return doc.output('blob');
}

/**
 * Trigger download of the PDF report
 */
export function downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
