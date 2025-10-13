'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { extractErrorMessage, DEFAULT_ERROR_MESSAGES } from '@/lib/errorUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Input, Typography, Alert } from '@/components/ui';
import { useGuestSession } from '@/hooks/useGuestSession';
import { lessonsAPI } from '@/lib/api';
import { CheckCircle, Gift } from 'lucide-react';

const registerSchema = z.object({
    email: z.string().email('Email invalide'),
    username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
    first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    education_level: z.string().optional(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [transferringData, setTransferringData] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState(false);
    const [transferredLessons, setTransferredLessons] = useState<{
        id: number;
        title: string;
        score: number;
        status: string;
    }[]>([]);
    const { register: registerUser } = useAuth();
    const { sessionId, isGuest, clearGuestSession } = useGuestSession();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError('');

        console.log('🔍 Register - isGuest:', isGuest, 'sessionId:', sessionId);

        try {
            // Créer le compte utilisateur
            await registerUser(data);

            // Si on était invité, transférer les données
            if (isGuest && sessionId) {
                console.log('🔄 Début du transfert des données...');
                setTransferringData(true);
                try {
                    const transferResult = await lessonsAPI.transferGuestData(sessionId);
                    setTransferredLessons(transferResult.transferred_lessons);
                    setTransferSuccess(true);

                    // Nettoyer la session invité
                    clearGuestSession();

                    // Attendre un peu pour montrer le succès du transfert
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 2000);
                } catch (transferError) {
                    console.error('❌ Erreur lors du transfert des données:', transferError);
                    // Même si le transfert échoue, on continue vers le dashboard
                    router.push('/dashboard');
                } finally {
                    setTransferringData(false);
                }
            } else {
                console.log('❌ Pas de transfert - isGuest:', isGuest, 'sessionId:', sessionId);
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            setError(extractErrorMessage(err, DEFAULT_ERROR_MESSAGES.REGISTER));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen dashboard-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="text-center">
                        <Link href="/">
                            <Typography variant="h3" className="font-bold text-foreground">
                                Révisia
                            </Typography>
                        </Link>
                    </div>
                    <Typography variant="h2" className="mt-6 text-center">
                        Créez votre compte
                    </Typography>
                    <Typography variant="body" color="muted" className="mt-2 text-center">
                        Ou{' '}
                        <Link
                            href="/login"
                            className="font-medium text-orange-700 hover:text-orange-600"
                        >
                            connectez-vous à votre compte existant
                        </Link>
                    </Typography>
                </div>

                {/* Message pour les invités */}
                {isGuest && sessionId && (
                    <Card padding="lg" className="mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-soft rounded-xl flex items-center justify-center">
                                <Gift className="w-5 h-5 text-orange-700" />
                            </div>
                            <div>
                                <Typography variant="body" className="font-medium text-orange-800">
                                    🎁 Bonus : Vos résultats seront sauvegardés !
                                </Typography>
                                <Typography variant="body" className="text-orange-700 text-sm">
                                    En vous inscrivant, vous pourrez voir vos résultats détaillés et les conserver.
                                </Typography>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Message de succès du transfert */}
                {transferSuccess && transferredLessons.length > 0 && (
                    <Card padding="lg" className="mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-soft rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <Typography variant="body" className="font-medium text-green-800">
                                    ✅ Données transférées avec succès !
                                </Typography>
                                <Typography variant="body" className="text-green-700 text-sm">
                                    {transferredLessons.length} quiz transféré{transferredLessons.length > 1 ? 's' : ''}. Redirection vers votre tableau de bord...
                                </Typography>
                            </div>
                        </div>
                    </Card>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <Card padding="lg">
                        {error && (
                            <Alert variant="error" className="mb-6">
                                {error}
                            </Alert>
                        )}

                        <div className="space-y-6">
                            <Input
                                {...register('email')}
                                type="email"
                                label="Adresse email"
                                placeholder="votre@email.com"
                                error={errors.email?.message}
                                autoComplete="email"
                            />

                            <Input
                                {...register('username')}
                                type="text"
                                label="Nom d'utilisateur"
                                placeholder="nom_utilisateur"
                                error={errors.username?.message}
                                autoComplete="username"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    {...register('first_name')}
                                    type="text"
                                    label="Prénom"
                                    placeholder="Jean"
                                    error={errors.first_name?.message}
                                    autoComplete="given-name"
                                />

                                <Input
                                    {...register('last_name')}
                                    type="text"
                                    label="Nom"
                                    placeholder="Dupont"
                                    error={errors.last_name?.message}
                                    autoComplete="family-name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Niveau d&apos;éducation
                                </label>
                                <select
                                    {...register('education_level')}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">Sélectionnez votre niveau</option>

                                    <optgroup label="🏫 Collège">
                                        <option value="6ème">6ème</option>
                                        <option value="5ème">5ème</option>
                                        <option value="4ème">4ème</option>
                                        <option value="3ème">3ème</option>
                                    </optgroup>

                                    <optgroup label="🎓 Lycée">
                                        <option value="2nde">2nde</option>
                                        <option value="1ère">1ère</option>
                                        <option value="Terminale">Terminale</option>
                                        <option value="Bac Pro">Bac Pro</option>
                                        <option value="Bac Techno">Bac Techno</option>
                                        <option value="CAP">CAP</option>
                                    </optgroup>

                                    <optgroup label="🎓 Supérieur">
                                        <option value="BTS">BTS</option>
                                        <option value="DUT">DUT</option>
                                        <option value="BUT">BUT</option>
                                        <option value="Licence">Licence</option>
                                        <option value="Licence Pro">Licence Pro</option>
                                        <option value="Master">Master</option>
                                        <option value="Master Pro">Master Pro</option>
                                        <option value="Doctorat">Doctorat</option>
                                        <option value="École d&apos;ingénieur">École d&apos;ingénieur</option>
                                        <option value="École de commerce">École de commerce</option>
                                        <option value="École spécialisée">École spécialisée</option>
                                        <option value="Formation continue">Formation continue</option>
                                    </optgroup>

                                    <optgroup label="👨‍💼 Professionnel">
                                        <option value="En activité">En activité</option>
                                        <option value="En recherche d&apos;emploi">En recherche d&apos;emploi</option>
                                        <option value="Retraité">Retraité</option>
                                    </optgroup>

                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <Input
                                {...register('password')}
                                type="password"
                                label="Mot de passe"
                                placeholder="Votre mot de passe"
                                error={errors.password?.message}
                                autoComplete="new-password"
                            />

                            <Input
                                {...register('password_confirm')}
                                type="password"
                                label="Confirmer le mot de passe"
                                placeholder="Confirmez votre mot de passe"
                                error={errors.password_confirm?.message}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="mt-8">
                            <Button
                                type="submit"
                                disabled={isLoading || transferringData}
                                variant="primary"
                                size="lg"
                                className="w-full"
                            >
                                {isLoading ? 'Création du compte...' :
                                    transferringData ? 'Transfert des données...' :
                                        'Créer mon compte'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
}