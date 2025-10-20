'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import EmailVerificationRequired from './EmailVerificationRequired';

interface EmailVerificationBlockerProps {
    children: React.ReactNode;
}

export default function EmailVerificationBlocker({ children }: EmailVerificationBlockerProps) {
    const { user, refreshUser, loading } = useAuth();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        // Pages publiques qui ne nécessitent pas de vérification email
        const publicPages = [
            '/login',
            '/register',
            '/verify-email',
        ];

        const checkEmailVerification = async () => {
            // Tant que l'état d'auth global charge, ne pas décider (évite le flash)
            if (loading) {
                setIsChecking(true);
                return;
            }

            // Si c'est une page publique, ne pas bloquer
            if (publicPages.includes(pathname)) {
                setIsChecking(false);
                return;
            }

            // Si l'utilisateur n'est pas connecté, ne pas bloquer
            if (!user) {
                setIsChecking(false);
                return;
            }

            // BLOQUER TOUT LE RESTE si l'email n'est pas vérifié
            if (!user.email_verified) {
                setShowVerification(true);
            }

            setIsChecking(false);
        };

        checkEmailVerification();
    }, [user, pathname, loading]);

    // Pendant la vérification
    if (isChecking) {
        return (
            <div className="min-h-screen dashboard-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Vérification en cours...</p>
                </div>
            </div>
        );
    }

    // Si l'email n'est pas vérifié, afficher la page de vérification
    if (showVerification && user) {
        return (
            <EmailVerificationRequired
                userEmail={user.email}
                onVerified={async () => {
                    setShowVerification(false);
                    // Mettre à jour l'état utilisateur au lieu de recharger la page
                    if (refreshUser) {
                        await refreshUser();
                    }
                }}
            />
        );
    }

    // Si tout est OK, afficher l'application normale
    return <>{children}</>;
}