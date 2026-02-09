import { useEffect, useState, useRef } from 'react';
import {
    Trophy,
    Star,
    Sparkles,
    X,
    Flame,
    Target,
    Medal,
    PartyPopper
} from 'lucide-react';
import { WeightMilestone } from '../types';
import confetti from 'canvas-confetti';

interface MilestoneModalProps {
    milestone: WeightMilestone;
    currentWeight: number;
    onClose: () => void;
    onClaimXP: (xp: number) => void;
}

export default function MilestoneModal({
    milestone,
    currentWeight,
    onClose,
    onClaimXP
}: MilestoneModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [xpClaimed, setXpClaimed] = useState(false);
    const [showXpAnimation, setShowXpAnimation] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Animate entrance
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Trigger confetti on mount
    useEffect(() => {
        // Initial burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Side cannons
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 250);

        // Stars effect
        setTimeout(() => {
            confetti({
                particleCount: 30,
                spread: 100,
                shapes: ['star'],
                colors: ['#FFD700', '#FFA500', '#FF6347']
            });
        }, 500);
    }, []);

    const handleClaimXP = () => {
        setShowXpAnimation(true);
        setXpClaimed(true);

        // Final celebration
        confetti({
            particleCount: 150,
            spread: 180,
            origin: { y: 0.5 }
        });

        // Notify parent
        setTimeout(() => {
            onClaimXP(milestone.xpReward);
        }, 1500);
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // Get milestone icon based on title/type
    const getMilestoneIcon = () => {
        const title = milestone.title.toLowerCase();

        if (title.includes('primeiro') || title.includes('first')) {
            return <Star className="w-12 h-12" />;
        }
        if (title.includes('metade') || title.includes('halfway')) {
            return <Target className="w-12 h-12" />;
        }
        if (title.includes('5kg') || title.includes('10kg')) {
            return <Medal className="w-12 h-12" />;
        }
        if (title.includes('meta') || title.includes('goal')) {
            return <Trophy className="w-12 h-12" />;
        }
        return <Flame className="w-12 h-12" />;
    };

    // Get gradient based on XP reward tier
    const getGradient = () => {
        if (milestone.xpReward >= 500) {
            return 'from-amber-500 via-yellow-400 to-orange-500'; // Legendary
        }
        if (milestone.xpReward >= 250) {
            return 'from-purple-500 via-pink-500 to-rose-500'; // Epic
        }
        if (milestone.xpReward >= 100) {
            return 'from-blue-500 via-cyan-500 to-teal-500'; // Rare
        }
        return 'from-emerald-500 via-green-500 to-lime-500'; // Common
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700 shadow-2xl transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Party icon */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <PartyPopper className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Main content */}
                <div className="text-center mt-4">
                    {/* Milestone Icon with animated glow */}
                    <div className="relative inline-block mb-6">
                        <div className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full blur-2xl opacity-50 animate-pulse`} />
                        <div className={`relative w-24 h-24 bg-gradient-to-br ${getGradient()} rounded-full flex items-center justify-center text-white shadow-2xl`}>
                            {getMilestoneIcon()}
                        </div>

                        {/* Floating sparkles */}
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                        <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-pink-400 animate-pulse delay-150" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-white mb-2">
                        🎉 Marco Alcançado!
                    </h2>

                    {/* Milestone name */}
                    <div className={`inline-block px-4 py-1.5 bg-gradient-to-r ${getGradient()} rounded-full mb-4`}>
                        <span className="font-bold text-white">{milestone.title}</span>
                    </div>

                    {/* Weight achieved */}
                    <div className="bg-gray-800/50 rounded-2xl p-4 mb-6">
                        <p className="text-gray-400 text-sm mb-1">Você chegou em</p>
                        <p className="text-4xl font-black text-white">
                            {currentWeight}<span className="text-2xl text-gray-400">kg</span>
                        </p>
                        <p className="text-emerald-400 text-sm mt-1 font-medium">
                            Meta: {milestone.targetWeight}kg ✓
                        </p>
                    </div>

                    {/* XP Reward */}
                    <div className="relative mb-6">
                        <div className={`bg-gradient-to-r ${getGradient()} p-[2px] rounded-2xl`}>
                            <div className="bg-gray-900 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-3">
                                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                    <span className="text-3xl font-black text-white">
                                        +{milestone.xpReward}
                                    </span>
                                    <span className="text-lg font-bold text-yellow-400">XP</span>
                                </div>
                            </div>
                        </div>

                        {/* XP animation overlay */}
                        {showXpAnimation && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-black text-yellow-400 animate-ping">
                                    +{milestone.xpReward} XP
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Claim button */}
                    {!xpClaimed ? (
                        <button
                            onClick={handleClaimXP}
                            className={`w-full py-4 bg-gradient-to-r ${getGradient()} text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5" />
                                Resgatar XP
                            </span>
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 font-bold">
                            <Sparkles className="w-5 h-5" />
                            <span>XP Resgatado!</span>
                        </div>
                    )}

                    {/* Motivational message */}
                    <p className="text-gray-400 text-sm mt-4">
                        Continue assim! Cada quilinho conta na sua jornada. 💪
                    </p>
                </div>
            </div>
        </div>
    );
}
