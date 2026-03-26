'use client';

import { useUserRole } from '@/hooks/useUserRole';
import { Alert } from '@/components/ui';
import { Crown, User, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function RoleLimits() {
    const { roleInfo, loading, isGuest, isFree, isPremium, attemptsCountToday, maxAttemptsPerDay } = useUserRole();

    if (loading || !roleInfo) {
        return null;
    }

    // Masquer le composant pour les utilisateurs premium
    if (isPremium) {
        return null;
    }

    const getRoleIcon = () => {
        if (isGuest) return <User className="w-4 h-4" />;
        if (isFree) return <UserCheck className="w-4 h-4" />;
        if (isPremium) return <Crown className="w-4 h-4" />;
        return <User className="w-4 h-4" />;
    };

    const getRoleTitle = () => {
        if (isGuest) return 'Mode Test';
        if (isFree) return 'Compte Gratuit';
        if (isPremium) return 'Premium';
        return 'Utilisateur';
    };

    const getRoleDescription = () => {
        if (isGuest) {
            return 'Testez Revisia avec 5 questions maximum. Inscrivez-vous pour sauvegarder vos résultats !';
        }
        if (isFree) {
            const maxQuizzes = roleInfo.limits.max_quizzes_per_day || 0;
            const remainingQuizzes = Math.max(0, maxQuizzes - roleInfo.quiz_count_today);
            const remainingAttempts = Math.max(0, maxAttemptsPerDay - attemptsCountToday);
            return `Pour aujourd'hui, Il vous reste ${remainingQuizzes}/${maxQuizzes} génération de quiz. ${remainingAttempts}/${maxAttemptsPerDay} tentatives restantes.`;
        }
        if (isPremium) {
            return 'Premium : jusqu\'à 50 questions par quiz, quiz illimités, tentatives illimitées.';
        }
        return '';
    };

    const getUpgradeMessage = () => {
        if (isGuest) {
            return (
                <div className="mt-2">
                    <Link
                        href="/register"
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                        S&apos;inscrire gratuitement →
                    </Link>
                </div>
            );
        }
        if (isFree) {
            return (
                <div className="mt-2">
                    <Link
                        href="/pricing"
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                        Passer à Premium →
                    </Link>
                </div>
            );
        }
        return null;
    };

    const getAlertVariant = () => {
        if (isGuest) return 'warning';
        if (isFree) return 'info';
        if (isPremium) return 'success';
        return 'info';
    };

    return (
        <Alert variant={getAlertVariant()} className="mb-4">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    {getRoleIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">
                            {getRoleTitle()}
                        </h4>
                        {isPremium && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                    </div>
                    <p className="text-sm mt-1">
                        {getRoleDescription()}
                    </p>
                    {getUpgradeMessage()}
                </div>
            </div>
        </Alert>
    );
}


