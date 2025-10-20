'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Mail, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EmailVerificationRequiredProps {
    userEmail: string;
    onVerified?: () => void;
}

interface VerificationStatus {
    email_verified: boolean;
    email: string;
    can_request_new_code: boolean;
    next_code_in_seconds?: number;
    last_code_expires_at?: string;
    last_code_is_expired?: boolean;
    last_code_attempts?: number;
}

export default function EmailVerificationRequired({
    userEmail,
    onVerified
}: EmailVerificationRequiredProps) {
    const router = useRouter();
    const [verificationCode, setVerificationCode] = useState('');
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Charger le statut initial
    useEffect(() => {
        loadVerificationStatus();
    }, []);

    // Gérer le countdown
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Rediriger/Notifier automatiquement si déjà vérifié
    useEffect(() => {
        if (status?.email_verified) {
            if (onVerified) {
                onVerified();
            } else {
                router.replace('/');
            }
        }
    }, [status?.email_verified, onVerified, router]);

    const loadVerificationStatus = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/auth/email/verification-status/');
            setStatus(response.data);

            if (response.data.next_code_in_seconds) {
                setCountdown(response.data.next_code_in_seconds);
            }
        } catch (error: unknown) {
            console.error('Erreur lors du chargement du statut:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendVerificationCode = async () => {
        try {
            setIsSending(true);
            setError('');
            setSuccess('');

            const response = await api.post('/auth/email/send-verification/');
            setSuccess(response.data.message);
            setCountdown(60); // 60 secondes avant de pouvoir redemander

            // Recharger le statut
            await loadVerificationStatus();
        } catch (error: unknown) {
            setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de l\'envoi du code');
        } finally {
            setIsSending(false);
        }
    };

    const verifyCode = async () => {
        if (!verificationCode.trim()) {
            setError('Veuillez saisir le code de vérification');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setSuccess('');

            const response = await api.post('/auth/email/verify-code/', {
                code: verificationCode.trim()
            });

            setSuccess(response.data.message);
            setVerificationCode('');

            // Recharger le statut
            await loadVerificationStatus();

            // Appeler le callback si fourni
            if (onVerified) {
                onVerified();
            }
        } catch (error: unknown) {
            setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de la vérification');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setVerificationCode(value);
        setError('');
    };

    // Si l'email est déjà vérifié, afficher un indicateur pendant la mise à jour/redirect
    if (status?.email_verified) {
        return (
            <div className="min-h-screen dashboard-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-orange-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Email vérifié, redirection en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dashboard-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-orange-700" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                        Vérification email requise
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Vous devez vérifier votre adresse email pour accéder à Révisia.
                    </p>
                </div>

                <div className="bg-card rounded-lg shadow-md p-6 border">
                    <div className="text-center mb-6">
                        <Mail className="w-12 h-12 text-orange-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Vérifiez votre email
                        </h3>
                        <p className="text-muted-foreground">
                            Nous avons envoyé un code de vérification à <strong className="text-orange-700">{userEmail}</strong>
                        </p>
                    </div>

                    {/* Messages d'erreur et de succès */}
                    {error && (
                        <div className="bg-red-soft border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-700 mr-2" />
                                <span className="text-red-800">{error}</span>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-soft border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-700 mr-2" />
                                <span className="text-green-800">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Formulaire de vérification */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="verification-code" className="block text-sm font-medium text-foreground mb-2">
                                Code de vérification
                            </label>
                            <input
                                id="verification-code"
                                type="text"
                                value={verificationCode}
                                onChange={handleCodeChange}
                                placeholder="123456"
                                maxLength={6}
                                className="w-full px-4 py-3 border border-border rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-orange-700 focus:border-orange-700 bg-background text-foreground"
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                Saisissez le code à 6 chiffres envoyé à votre email
                            </p>
                        </div>

                        <button
                            onClick={verifyCode}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full bg-orange-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Vérification...
                                </div>
                            ) : (
                                'Vérifier le code'
                            )}
                        </button>
                    </div>

                    {/* Bouton pour renvoyer le code */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                Vous n&apos;avez pas reçu le code ?
                            </p>

                            {countdown > 0 ? (
                                <div className="flex items-center justify-center text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Nouveau code disponible dans {countdown}s
                                </div>
                            ) : (
                                <button
                                    onClick={sendVerificationCode}
                                    disabled={isSending}
                                    className="text-orange-700 hover:text-orange-700 font-medium text-sm flex items-center mx-auto"
                                >
                                    {isSending ? (
                                        <div className="flex items-center">
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Envoi...
                                        </div>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Renvoyer le code
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Informations sur le dernier code */}
                    {status?.last_code_expires_at && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                Dernier code expiré le : {new Date(status.last_code_expires_at).toLocaleString('fr-FR')}
                            </p>
                            {status.last_code_attempts && status.last_code_attempts > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Tentatives : {status.last_code_attempts}/3
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        En cas de problème, contactez notre support technique.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center bg-foreground text-background px-4 py-2 rounded-md font-medium hover:opacity-90 transition-colors"
                    >
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}