"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, lessonsAPI, Lesson } from '@/lib/api';
import { validateFileSize, getFileSizeMessage } from '@/lib/fileLimits';
import { Button, Card, Typography, Badge, ErrorAlert } from '@/components/ui';
import {
    Upload,
    FileText,
    Brain,
    Play,
    BookOpen,
    Zap,
    RotateCcw,
    Edit3,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AISettingsModal, { AISettings } from '@/components/AISettingsModal';
import ScoreChartModal from '@/components/ScoreChartModal';
import AttemptDetailsModal from '@/components/AttemptDetailsModal';
import RenameLessonModal from '@/components/RenameLessonModal';
import RoleLimits from '@/components/RoleLimits';

// Helper function pour mapper les difficultés
const getDifficultyLabel = (difficulty: string) => {
    const labels = {
        'easy': 'Facile',
        'medium': 'Moyen',
        'hard': 'Difficile'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
};

export default function Dashboard() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [resettingLesson, setResettingLesson] = useState<number | null>(null);
    const [showAISettings, setShowAISettings] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [showScoreChart, setShowScoreChart] = useState(false);
    const [showAttemptDetails, setShowAttemptDetails] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState<{
        attempt_number: number;
        score: number;
        completed_at: string;
        user_answers: Array<{
            question_id: number;
            question_text: string;
            difficulty: 'easy' | 'medium' | 'hard';
            user_answer_id: number | null;
            user_answer_text: string | null;
            is_correct: boolean;
            all_answers: Array<{
                id: number;
                text: string;
                is_correct: boolean;
            }>;
        }>;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [lessonToRename, setLessonToRename] = useState<Lesson | null>(null);
    const [isRenamingLesson, setIsRenamingLesson] = useState(false);
    const [showSubwaySurfers, setShowSubwaySurfers] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // Vérifier si l'utilisateur vient d'être upgradé
    useEffect(() => {
        if (searchParams.get('upgraded') === 'true') {
            // Nettoyer l'URL en supprimant le paramètre upgraded
            const url = new URL(window.location.href);
            url.searchParams.delete('upgraded');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams]);

    const loadData = async () => {
        try {
            const lessonsData = await lessonsAPI.getAll();
            setLessons(lessonsData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            await uploadFile(file);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        try {
            console.log("Uploading file:", file.name);
            setError(null); // Clear any previous errors

            // Déterminer le rôle utilisateur pour la validation
            let userRole = 'guest'
            if (user) {
                userRole = user.is_premium ? 'premium' : 'free'
            }

            // Valider la taille du fichier
            const validation = validateFileSize(file, userRole)
            if (!validation.isValid) {
                setError(validation.error || 'Fichier trop volumineux')
                return
            }

            // Au lieu d'uploader directement, on ouvre la popup de configuration
            setUploadedFile(file);
            setShowAISettings(true);
        } catch (error) {
            console.error("Upload error:", error);
            setError('Erreur lors de la préparation du fichier. Veuillez réessayer.');
        }
    };

    const handleAISettingsConfirm = async (settings: AISettings) => {
        if (!uploadedFile) return;

        try {
            setIsGeneratingQuestions(true);
            setError(null);
            console.log("Uploading file with settings:", settings);
            // Ici on enverra les paramètres au backend
            await documentsAPI.upload(uploadedFile, undefined, settings);
            console.log("Upload successful");
            loadData(); // Recharger les données
            setUploadedFile(null);
            setShowAISettings(false);
        } catch (error: unknown) {
            console.error("Upload error:", error);

            // Extraire le message d'erreur de la réponse
            let errorMessage = 'Erreur lors de la génération du quiz. Veuillez réessayer.';

            const errorWithResponse = error as { response?: { data?: { error?: string; details?: string } }; message?: string };
            if (errorWithResponse?.response?.data?.error) {
                errorMessage = errorWithResponse.response.data.error;
            } else if (errorWithResponse?.response?.data?.details) {
                errorMessage = errorWithResponse.response.data.details;
            } else if (errorWithResponse?.message) {
                errorMessage = errorWithResponse.message;
            }

            setError(errorMessage);
        } finally {
            setIsGeneratingQuestions(false);
        }
    };

    const resetLesson = async (lessonId: number) => {
        setResettingLesson(lessonId);
        try {
            await lessonsAPI.reset(lessonId);
            loadData(); // Recharger les données
            // Rediriger vers le quiz après reset
            window.location.href = `/quiz/${lessonId}`;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
        } finally {
            setResettingLesson(null);
        }
    };


    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-orange-700';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const handleLessonCardClick = (lesson: Lesson) => {
        setSelectedLesson(lesson);
        setShowScoreChart(true);
    };

    const handleDeleteLesson = async (lessonId: number) => {
        try {
            await lessonsAPI.deleteLesson(lessonId);
            // Recharger les données après suppression
            loadData();
            setError(null);
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression:', error);
            const errorWithResponse = error as { response?: { data?: { error?: string; details?: string } }; message?: string };
            let errorMessage = 'Erreur lors de la suppression de la leçon. Veuillez réessayer.';

            if (errorWithResponse?.response?.data?.error) {
                errorMessage = errorWithResponse.response.data.error;
            } else if (errorWithResponse?.response?.data?.details) {
                errorMessage = errorWithResponse.response.data.details;
            } else if (errorWithResponse?.message) {
                errorMessage = errorWithResponse.message;
            }

            setError(errorMessage);
        }
    };

    const handleLastScoreClick = async (lesson: Lesson) => {
        try {
            // Définir la leçon sélectionnée pour l'AttemptDetailsModal
            setSelectedLesson(lesson);

            const attempts = await lessonsAPI.getAttempts(lesson.id);
            if (attempts.length > 0) {
                // Prendre la dernière tentative (la plus récente)
                const lastAttempt = attempts[attempts.length - 1];
                setSelectedAttempt(lastAttempt);
                setShowAttemptDetails(true);
            } else {
                // Pas de tentatives disponibles
                console.log('Aucune tentative disponible pour cette leçon');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la dernière tentative:', error);
        }
    };

    const handleRenameLesson = (lesson: Lesson) => {
        setLessonToRename(lesson);
        setShowRenameModal(true);
    };

    const handleConfirmRename = async (newTitle: string) => {
        if (!lessonToRename) return;

        try {
            setIsRenamingLesson(true);
            await lessonsAPI.updateLesson(lessonToRename.id, newTitle);

            // Mettre à jour la liste des leçons
            loadData();

            // Fermer le modal
            setShowRenameModal(false);
            setLessonToRename(null);
            setError(null);
        } catch (error: unknown) {
            console.error('Erreur lors du renommage:', error);
            const errorWithResponse = error as { response?: { data?: { error?: string; details?: string } }; message?: string };
            let errorMessage = 'Erreur lors du renommage de la leçon. Veuillez réessayer.';

            if (errorWithResponse?.response?.data?.error) {
                errorMessage = errorWithResponse.response.data.error;
            } else if (errorWithResponse?.response?.data?.details) {
                errorMessage = errorWithResponse.response.data.details;
            } else if (errorWithResponse?.message) {
                errorMessage = errorWithResponse.message;
            }

            setError(errorMessage);
            throw error; // Re-throw pour que le modal puisse gérer l'erreur
        } finally {
            setIsRenamingLesson(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Chargement...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen dashboard-gradient relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 bg-blue-soft/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-orange-soft/20 rounded-full blur-xl animate-float-delayed"></div>
                <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-purple-soft/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-pink-soft/20 rounded-full blur-xl animate-float-delayed"></div>
            </div>


            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
                {/* Hero Section */}
                <section className="text-center space-y-4">
                    <Typography variant="h1" className="text-4xl lg:text-5xl font-bold text-balance leading-tight">
                        Mes <span className="text-orange-700">leçons</span> en cours
                    </Typography>
                    <Typography variant="body" color="muted" className="text-lg max-w-2xl mx-auto">
                        Continuez vos révisions et créez de nouvelles leçons pour progresser
                    </Typography>
                </section>



                {/* Role Limits */}
                <RoleLimits />

                {/* Upload Section */}
                <section>
                    <div
                        className={`upload-zone rounded-2xl p-8 text-center cursor-pointer ${isDragOver ? "drag-over" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file-input")?.click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="space-y-4">
                            <div className="flex justify-center space-x-2">
                                <div className="w-12 h-12 bg-orange-primary/20 rounded-xl flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-orange-700" />
                                </div>
                                <div className="w-12 h-12 bg-orange-primary/20 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-orange-700" />
                                </div>
                                <div className="w-12 h-12 bg-orange-primary/20 rounded-xl flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-orange-700" />
                                </div>
                            </div>

                            <div>
                                <Typography variant="h4" className="text-orange-700 mb-2">
                                    Glissez vos fichiers ici ou cliquez pour sélectionner
                                </Typography>
                                <Typography variant="body" color="muted" className="mb-2">
                                    PDF, images - Générez vos questions en quelques secondes
                                </Typography>
                                <Typography variant="caption" color="muted">
                                    {getFileSizeMessage(user ? (user.is_premium ? 'premium' : 'free') : 'guest')}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lessons Section */}
                <section>
                    <div className="mb-6">
                        <Typography variant="h2" className="text-2xl font-bold text-foreground mb-2">
                            Mes leçons en cours
                        </Typography>
                        <Typography variant="body" color="muted">
                            Continuez vos révisions et suivez votre progression
                        </Typography>
                    </div>

                    <div className="grid gap-6">
                        {lessons.length === 0 ? (
                            <Card className="widget-card p-8 text-center">
                                <div className="space-y-4">
                                    <div className="text-6xl text-muted-foreground">📚</div>
                                    <Typography variant="h5" className="font-semibold text-foreground">
                                        Aucune leçon en cours
                                    </Typography>
                                    <Typography variant="body" color="muted">
                                        Créez votre première leçon en uploadant un document
                                    </Typography>
                                </div>
                            </Card>
                        ) : (
                            lessons.map((lesson) => (
                                <Card
                                    key={lesson.id}
                                    className="widget-card p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                    onClick={() => handleLessonCardClick(lesson)}
                                >
                                    {/* Desktop layout - inchangé */}
                                    <div className="hidden md:flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-orange-soft rounded-xl flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-6 h-6 text-orange-700" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Typography variant="h5" className="font-semibold text-foreground">
                                                        {lesson.title}
                                                    </Typography>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRenameLesson(lesson);
                                                        }}
                                                        className="p-1 hover:bg-orange-100 rounded-md transition-colors group"
                                                        title="Renommer la leçon"
                                                    >
                                                        <Edit3 className="w-4 h-4 text-orange-600 group-hover:text-orange-700" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {getDifficultyLabel(lesson.difficulty)}
                                                    </Badge>
                                                    <Typography variant="caption" color="muted">
                                                        {lesson.total_questions} questions
                                                    </Typography>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            {/* Nombre de tentatives */}
                                            <div className="text-center">
                                                <Typography variant="h4" className="font-bold text-blue-700">
                                                    {lesson.total_attempts}
                                                </Typography>
                                                <Typography variant="caption" color="muted">
                                                    essai{lesson.total_attempts > 1 ? 's' : ''}
                                                </Typography>
                                            </div>

                                            {/* Dernier Score */}
                                            <div className="flex flex-col items-center justify-center cursor-pointer bg-orange-50 hover:bg-orange-100 rounded-lg p-3 transition-all duration-200 border border-orange-200 hover:border-orange-300 hover:shadow-sm group" onClick={(e) => { e.stopPropagation(); handleLastScoreClick(lesson); }}>
                                                <Typography variant="h4" className={`font-bold group-hover:scale-105 transition-transform ${getScoreColor(lesson.last_score)}`}>
                                                    {lesson.last_score}%
                                                </Typography>
                                                <Typography variant="caption" color="muted" className="group-hover:text-orange-700 transition-colors">Dernier score</Typography>
                                            </div>

                                            {/* Action Button */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                {lesson.status === 'termine' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => resetLesson(lesson.id)}
                                                        disabled={resettingLesson === lesson.id}
                                                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                        {resettingLesson === lesson.id ? 'Reset...' : 'Refaire'}
                                                    </Button>
                                                ) : (
                                                    <Link href={`/quiz/${lesson.id}`}>
                                                        <Button size="sm" className="bg-orange-primary text-white hover:bg-orange-700">
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Continuer
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile layout - nouveau */}
                                    <div className="md:hidden">
                                        {/* Header avec icône et titre */}
                                        <div className="flex items-start space-x-3 mb-4">
                                            <div className="w-10 h-10 bg-orange-soft rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <BookOpen className="w-5 h-5 text-orange-700" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Typography variant="h5" className="font-semibold text-foreground leading-tight break-words hyphens-auto flex-1">
                                                        {lesson.title}
                                                    </Typography>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRenameLesson(lesson);
                                                        }}
                                                        className="p-1 hover:bg-orange-100 rounded-md transition-colors group flex-shrink-0"
                                                        title="Renommer la leçon"
                                                    >
                                                        <Edit3 className="w-4 h-4 text-orange-600 group-hover:text-orange-700" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                                                        {getDifficultyLabel(lesson.difficulty)}
                                                    </Badge>
                                                    <Typography variant="caption" color="muted" className="flex-shrink-0">
                                                        {lesson.total_questions} questions
                                                    </Typography>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats et bouton */}
                                        <div className="flex flex-col space-y-3">
                                            {/* Stats */}
                                            <div className="flex items-center justify-between px-1">
                                                {/* Nombre de tentatives */}
                                                <div className="text-center flex-1">
                                                    <Typography variant="h4" className="font-bold text-blue-700 text-lg">
                                                        {lesson.total_attempts}
                                                    </Typography>
                                                    <Typography variant="caption" color="muted" className="text-xs">
                                                        essai{lesson.total_attempts > 1 ? 's' : ''}
                                                    </Typography>
                                                </div>

                                                {/* Dernier Score */}
                                                <div className="flex flex-col items-center justify-center flex-1 cursor-pointer bg-orange-50 hover:bg-orange-100 rounded-lg p-3 transition-all duration-200 border border-orange-200 hover:border-orange-300 hover:shadow-sm group" onClick={(e) => { e.stopPropagation(); handleLastScoreClick(lesson); }}>
                                                    <Typography variant="h4" className={`font-bold text-lg ${getScoreColor(lesson.last_score)} group-hover:scale-105 transition-transform`}>
                                                        {lesson.last_score}%
                                                    </Typography>
                                                    <Typography variant="caption" color="muted" className="text-xs group-hover:text-orange-700 transition-colors">
                                                        Dernier score
                                                    </Typography>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                {lesson.status === 'termine' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => resetLesson(lesson.id)}
                                                        disabled={resettingLesson === lesson.id}
                                                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                        {resettingLesson === lesson.id ? 'Reset...' : 'Refaire'}
                                                    </Button>
                                                ) : (
                                                    <Link href={`/quiz/${lesson.id}`} className="block w-full">
                                                        <Button size="sm" className="w-full bg-orange-primary text-white hover:bg-orange-700">
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Continuer
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

            </main>

            {/* AI Settings Modal */}
            <AISettingsModal
                isOpen={showAISettings}
                onClose={() => {
                    setShowAISettings(false);
                    setUploadedFile(null);
                }}
                onConfirm={handleAISettingsConfirm}
                fileName={uploadedFile?.name || ''}
                userEducationLevel={user?.education_level}
            />

            {/* Score Chart Modal */}
            <ScoreChartModal
                isOpen={showScoreChart}
                onClose={() => {
                    setShowScoreChart(false);
                    setSelectedLesson(null);
                }}
                lessonId={selectedLesson?.id || 0}
                lessonTitle={selectedLesson?.title || ''}
                lessonAverageScore={selectedLesson?.average_score}
                onDelete={handleDeleteLesson}
            />

            {/* Attempt Details Modal */}
            {selectedAttempt && (
                <AttemptDetailsModal
                    isOpen={showAttemptDetails}
                    onClose={() => {
                        setShowAttemptDetails(false);
                        setSelectedAttempt(null);
                    }}
                    attemptData={selectedAttempt}
                    lessonTitle={selectedLesson?.title || ''}
                />
            )}

            {/* Loading Modal for Question Generation */}
            {isGeneratingQuestions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="widget-card p-8 max-w-lg w-full mx-4">
                        <div className="text-center space-y-6">
                            {/* AI Generation Info */}
                            <div className="w-16 h-16 bg-orange-soft rounded-xl flex items-center justify-center mx-auto">
                                <Brain className="w-8 h-8 text-orange-700 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <Typography variant="h4" className="font-bold text-foreground">
                                    Génération en cours...
                                </Typography>
                                <Typography variant="body" color="muted">
                                    L&apos;IA analyse votre document et génère des questions personnalisées
                                </Typography>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <Typography variant="caption" color="muted">
                                    Cela peut prendre quelques dizaines de secondes...
                                </Typography>
                            </div>

                            {/* Subway Surfers Video */}
                            {showSubwaySurfers && (
                                <div className="relative mt-6">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4">
                                        <Typography variant="h6" className="text-white font-bold mb-3">
                                            🎮 Pendant que l&apos;IA travaille...
                                        </Typography>
                                        <div className="relative bg-black rounded-lg overflow-hidden flex justify-center">
                                            <iframe
                                                width="320"
                                                height="320"
                                                src="https://www.youtube.com/embed/-ZsF8xk3Vy0?autoplay=1&mute=1&loop=1&playlist=-ZsF8xk3Vy0&controls=0&showinfo=0&rel=0&modestbranding=1"
                                                title="Subway Surfers Gameplay"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="rounded-lg"
                                            ></iframe>
                                            <div className="absolute top-2 right-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setShowSubwaySurfers(false)}
                                                    className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 text-xs"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Typography variant="caption" className="text-white/80 mt-2 block">
                                            Amusez-vous pendant que l&apos;IA génère vos questions ! 🚀
                                        </Typography>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <ErrorAlert
                    message={error}
                    onDismiss={() => setError(null)}
                    onRetry={() => {
                        setError(null);
                        if (uploadedFile) {
                            setShowAISettings(true);
                        }
                    }}
                />
            )}

            {/* Rename Lesson Modal */}
            <RenameLessonModal
                isOpen={showRenameModal}
                onClose={() => {
                    setShowRenameModal(false);
                    setLessonToRename(null);
                }}
                onConfirm={handleConfirmRename}
                currentTitle={lessonToRename?.title || ''}
                isLoading={isRenamingLesson}
            />
        </div>
    );
}