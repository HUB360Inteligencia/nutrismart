import React, { useState, useEffect } from 'react';
import { Check, ShoppingCart, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { ShoppingListCategory } from '../types';
import {
    saveShoppingListToStorage,
    loadShoppingListFromStorage,
    clearShoppingListStorage,
} from '../services/shoppingListService';

interface ShoppingListProps {
    initialCategories?: ShoppingListCategory[];
    onClear?: () => void;
}

// Category icons and colors mapping
const CATEGORY_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
    'Hortifruti': { icon: '🥬', color: 'text-green-600', bg: 'bg-green-50' },
    'Açougue': { icon: '🥩', color: 'text-red-600', bg: 'bg-red-50' },
    'Laticínios': { icon: '🥛', color: 'text-blue-600', bg: 'bg-blue-50' },
    'Mercearia': { icon: '🥫', color: 'text-amber-600', bg: 'bg-amber-50' },
    'Bebidas': { icon: '🥤', color: 'text-purple-600', bg: 'bg-purple-50' },
    'Congelados': { icon: '❄️', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    'Padaria': { icon: '🥖', color: 'text-orange-600', bg: 'bg-orange-50' },
    'Outros': { icon: '📦', color: 'text-gray-600', bg: 'bg-gray-50' },
};

const ShoppingList: React.FC<ShoppingListProps> = ({ initialCategories, onClear }) => {
    const [categories, setCategories] = useState<ShoppingListCategory[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [createdAt, setCreatedAt] = useState<string | null>(null);

    // Load from storage or use initial categories
    useEffect(() => {
        if (initialCategories && initialCategories.length > 0) {
            setCategories(initialCategories);
            setExpandedCategories(new Set(initialCategories.map(c => c.category)));
            saveShoppingListToStorage(initialCategories);
            setCreatedAt(new Date().toISOString());
        } else {
            const stored = loadShoppingListFromStorage();
            if (stored) {
                setCategories(stored.categories);
                setExpandedCategories(new Set(stored.categories.map(c => c.category)));
                setCreatedAt(stored.createdAt);
            }
        }
    }, [initialCategories]);

    // Save to storage on changes
    useEffect(() => {
        if (categories.length > 0) {
            saveShoppingListToStorage(categories);
        }
    }, [categories]);

    const toggleItem = (categoryIndex: number, itemIndex: number) => {
        setCategories(prev => {
            const updated = [...prev];
            updated[categoryIndex] = {
                ...updated[categoryIndex],
                items: updated[categoryIndex].items.map((item, idx) =>
                    idx === itemIndex ? { ...item, checked: !item.checked } : item
                ),
            };
            return updated;
        });
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const updated = new Set(prev);
            if (updated.has(category)) {
                updated.delete(category);
            } else {
                updated.add(category);
            }
            return updated;
        });
    };

    const clearChecked = () => {
        setCategories(prev =>
            prev
                .map(cat => ({
                    ...cat,
                    items: cat.items.filter(item => !item.checked),
                }))
                .filter(cat => cat.items.length > 0)
        );
    };

    const handleClearAll = () => {
        setCategories([]);
        setCreatedAt(null);
        clearShoppingListStorage();
        onClear?.();
    };

    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const checkedItems = categories.reduce(
        (sum, cat) => sum + cat.items.filter(i => i.checked).length,
        0
    );
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma lista de compras</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                    Gere uma lista a partir do seu planejador de refeições ou adicione itens manualmente.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {checkedItems} de {totalItems} itens
                        </h3>
                        {createdAt && (
                            <p className="text-xs text-gray-500">
                                Criada em {new Date(createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        )}
                    </div>
                    <span className="text-2xl font-bold text-nutri-600">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-nutri-500 to-nutri-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={clearChecked}
                        disabled={checkedItems === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Limpar Marcados
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Limpar Tudo
                    </button>
                </div>
            </div>

            {/* Categories */}
            {categories.map((category, catIndex) => {
                const style = CATEGORY_STYLES[category.category] || CATEGORY_STYLES['Outros'];
                const isExpanded = expandedCategories.has(category.category);
                const categoryChecked = category.items.filter(i => i.checked).length;

                return (
                    <div
                        key={category.category}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.category)}
                            className={`w-full flex items-center justify-between p-4 ${style.bg} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{style.icon}</span>
                                <div className="text-left">
                                    <h4 className={`font-semibold ${style.color}`}>{category.category}</h4>
                                    <p className="text-xs text-gray-500">
                                        {categoryChecked}/{category.items.length} itens
                                    </p>
                                </div>
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {/* Items */}
                        {isExpanded && (
                            <div className="divide-y divide-gray-100">
                                {category.items.map((item, itemIndex) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(catIndex, itemIndex)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked
                                                    ? 'bg-nutri-500 border-nutri-500'
                                                    : 'border-gray-300'
                                                }`}
                                        >
                                            {item.checked && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <span
                                            className={`flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'
                                                }`}
                                        >
                                            {item.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ShoppingList;
