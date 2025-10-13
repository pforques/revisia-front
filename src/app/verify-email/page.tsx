'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EmailVerificationRequired from '@/components/EmailVerificationRequired';

export default function VerifyEmailPage() {
    const [userEmail, setUserEmail] = useState('');
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Récupérer l'email depuis le localStorage ou l'utilisateur connecté
        const pendingEmail = localStorage.getItem('pending_verification_email');

        if (pendingEmail) {
            setUserEmail(pendingEmail);
            // Nettoyer le localStorage
            localStorage.removeItem('pending_verification_email');
        } else if (user?.email) {
            setUserEmail(user.email);
        } else {
            // Si pas d'email, rediriger vers la connexion
            router.push('/login');
            return;
        }
    }, [user, router]);

    const handleEmailVerified = () => {
        // Recharger la page ou rediriger vers le dashboard
        window.location.href = '/dashboard';
    };

    if (!userEmail) {
        return (
            <div className="min-h-screen dashboard-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <EmailVerificationRequired
            userEmail={userEmail}
            onVerified={handleEmailVerified}
        />
    );
}
