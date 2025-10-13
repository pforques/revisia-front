'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface RegisterWithEmailVerificationProps {
    onSuccess: (user: unknown, tokens: unknown) => void;
    onError: (error: string) => void;
}

export default function RegisterWithEmailVerification({ onSuccess }: RegisterWithEmailVerificationProps) {
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Formulaire d'inscription
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Vérification email
    const [verificationCode, setVerificationCode] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSendingCode, setIsSendingCode] = useState(false);

    // Gérer le countdown
    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation côté client
        if (formData.password !== formData.confirm_password) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setSuccess('');

            await api.post('/auth/register/', formData);

            // Passer à l'étape de vérification
            setUserEmail(formData.email);
            setStep('verify');
            setSuccess('Compte créé avec succès ! Vérifiez votre email pour continuer.');
            setCountdown(60); // 60 secondes avant de pouvoir redemander

        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de la création du compte';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();

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

            setSuccess('Email vérifié avec succès !');

            // Appeler le callback de succès
            setTimeout(() => {
                onSuccess(response.data.user, response.data.tokens);
            }, 1500);

        } catch (error: unknown) {
            setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de la vérification');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            setIsSendingCode(true);
            setError('');

            await api.post('/auth/email/send-verification/');
            setSuccess('Code de vérification renvoyé !');
            setCountdown(60);

        } catch (error: unknown) {
            setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de l\'envoi du code');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setVerificationCode(value);
        setError('');
    };

    if (step === 'register') {
        return (
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Créer un compte
                    </h2>
                    <p className="text-gray-600">
                        Remplissez le formulaire pour créer votre compte Révisia
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Prénom
                            </label>
                            <input
                                id="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nom
                            </label>
                            <input
                                id="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <input
                                id="confirm_password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirm_password}
                                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Création...
                            </div>
                        ) : (
                            'Créer mon compte'
                        )}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Vérification email
                </h2>
                <p className="text-gray-600">
                    Nous avons envoyé un code de vérification à <strong>{userEmail}</strong>
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-green-700">{success}</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                    <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                        Code de vérification
                    </label>
                    <input
                        id="verification-code"
                        type="text"
                        value={verificationCode}
                        onChange={handleCodeChange}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Saisissez le code à 6 chiffres envoyé à votre email
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                        Vous n&apos;avez pas reçu le code ?
                    </p>

                    {countdown > 0 ? (
                        <div className="flex items-center justify-center text-sm text-gray-500">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Nouveau code disponible dans {countdown}s
                        </div>
                    ) : (
                        <button
                            onClick={handleResendCode}
                            disabled={isSendingCode}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center mx-auto"
                        >
                            {isSendingCode ? (
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
        </div>
    );
}
