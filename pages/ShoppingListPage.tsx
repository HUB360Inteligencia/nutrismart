import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ShoppingCart,
    Loader2,
    AlertCircle,
    Sparkles,
    RefreshCw,
} from 'lucide-react';
import ShoppingList from '../components/ShoppingList';
import {
    loadShoppingListFromStorage,
    parseShoppingListResponse,
    consolidateIngredients,
} from '../services/shoppingListService';
import type { ShoppingListCategory } from '../types';

interface ShoppingListPageProps {
    onBack: () => void;
    ingredients?: string[];
}

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ onBack, ingredients }) => {
    const [categories, setCategories] = useState<ShoppingListCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasStoredList, setHasStoredList] = useState(false);

    // Check for stored list on mount
    useEffect(() => {
        const stored = loadShoppingListFromStorage();
        if (stored && stored.categories.length > 0) {
            setCategories(stored.categories);
            setHasStoredList(true);
        }
    }, []);

    // Generate list from ingredients if provided
    useEffect(() => {
        if (ingredients && ingredients.length > 0 && !hasStoredList) {
            generateList(ingredients);
        }
    }, [ingredients, hasStoredList]);

    const generateList = async (rawIngredients: string[]) => {
        setIsLoading(true);
        setError(null);

        try {
            // Consolidate duplicates
            const consolidated = consolidateIngredients(rawIngredients);

            // Call Gemini API
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-shopping-list',
                    payload: { ingredients: consolidated },
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar lista de compras');
            }

            const data = await response.json();
            const parsed = JSON.parse(data.result);
            const newCategories = parseShoppingListResponse(parsed);

            setCategories(newCategories);
            setHasStoredList(true);
        } catch (err) {
            console.error('Error generating shopping list:', err);
            setError('Erro ao gerar lista de compras. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = () => {
        if (ingredients && ingredients.length > 0) {
            generateList(ingredients);
        }
    };

    const handleClear = () => {
        setCategories([]);
        setHasStoredList(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">Lista de Compras</h1>
                    <div className="w-10" /> {/* Spacer for alignment */}
                </div>
            </div>

            <div className="max-w-lg mx-auto p-4 space-y-4">
                {/* Info Card */}
                {!hasStoredList && !isLoading && (
                    <div className="bg-gradient-to-br from-nutri-50 to-emerald-50 rounded-2xl p-6 border border-nutri-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-nutri-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-nutri-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Lista Inteligente</h3>
                                <p className="text-sm text-gray-600">
                                    Gere uma lista de compras organizada por setores do supermercado a partir do seu planejamento de refeições.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-12 h-12 text-nutri-500 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Organizando sua lista...</p>
                        <p className="text-sm text-gray-500">A IA está agrupando os itens por setor</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-medium">{error}</p>
                            <button
                                onClick={handleRegenerate}
                                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                )}

                {/* Shopping List */}
                {!isLoading && (
                    <ShoppingList initialCategories={categories} onClear={handleClear} />
                )}

                {/* Regenerate Button */}
                {hasStoredList && ingredients && ingredients.length > 0 && (
                    <button
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Gerar Nova Lista
                    </button>
                )}
            </div>
        </div>
    );
};

export default ShoppingListPage;
