'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Typography } from '@/components/ui';
import { X, CheckCircle, XCircle, Target } from 'lucide-react';

interface AttemptDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    attemptData: {
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
    };
    lessonTitle: string;
}

export default function AttemptDetailsModal({ isOpen, onClose, attemptData, lessonTitle }: AttemptDetailsModalProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Fonctions pour changer de question en maintenant la position de scroll
    const goToPreviousQuestion = useCallback(() => {
        const modalElement = document.querySelector('.attempt-modal-content');
        if (modalElement) {
            setScrollPosition(modalElement.scrollTop);
        }
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    }, [currentQuestionIndex]);

    const goToNextQuestion = useCallback(() => {
        const modalElement = document.querySelector('.attempt-modal-content');
        if (modalElement) {
            setScrollPosition(modalElement.scrollTop);
        }
        setCurrentQuestionIndex(Math.min((attemptData?.user_answers.length || 1) - 1, currentQuestionIndex + 1));
    }, [currentQuestionIndex, attemptData?.user_answers.length]);

    // Restaurer la position de scroll après le changement de question
    useEffect(() => {
        const modalElement = document.querySelector('.attempt-modal-content');
        if (modalElement && scrollPosition > 0) {
            modalElement.scrollTop = scrollPosition;
        }
    }, [currentQuestionIndex, scrollPosition]);

    // Gestion des touches clavier
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || !attemptData) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToNextQuestion();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPreviousQuestion();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, attemptData, goToNextQuestion, goToPreviousQuestion]);

    // Gestion du swipe tactile horizontal (mobile)
    useEffect(() => {
        let startY = 0;
        let startX = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (!isOpen) return;
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isOpen) return;

            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            const deltaY = startY - endY;
            const deltaX = startX - endX;

            // Seuil minimum pour considérer un swipe
            const minSwipeDistance = 50;

            // Swipe horizontal (priorité sur vertical)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe vers la gauche - question suivante
                    goToNextQuestion();
                } else {
                    // Swipe vers la droite - question précédente
                    goToPreviousQuestion();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isOpen, attemptData, goToNextQuestion, goToPreviousQuestion]);

    if (!isOpen || !attemptData) return null;

    const { attempt_number, score, completed_at, user_answers } = attemptData;
    const currentQuestion = user_answers[currentQuestionIndex];

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'hard': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'Facile';
            case 'medium': return 'Moyen';
            case 'hard': return 'Difficile';
            default: return difficulty;
        }
    };

    const correctAnswers = user_answers.filter(answer => answer.is_correct).length;
    const totalQuestions = user_answers.length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <Card
                className="widget-card attempt-modal-content max-w-4xl w-full p-3 sm:p-6 relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <Typography variant="h4" className="font-bold text-foreground">
                                Tentative {attempt_number}
                            </Typography>
                            <Typography variant="body" color="muted" className="text-sm">
                                {lessonTitle}
                            </Typography>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="p-2"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 text-center">
                        <Typography variant="h4" className="font-bold text-orange-700 mb-1">
                            {score}%
                        </Typography>
                        <Typography variant="caption" color="muted">Score final</Typography>
                    </Card>
                    <Card className="p-4 text-center">
                        <Typography variant="h4" className="font-bold text-green-600 mb-1">
                            {correctAnswers}/{totalQuestions}
                        </Typography>
                        <Typography variant="caption" color="muted">Bonnes réponses</Typography>
                    </Card>
                    <Card className="p-4 text-center">
                        <Typography variant="h4" className="font-bold text-blue-600 mb-1">
                            {new Date(completed_at).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Typography variant="caption" color="muted">Date</Typography>
                    </Card>
                </div>

                {/* Question Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Typography variant="h6" className="font-semibold">
                        Question {currentQuestionIndex + 1} sur {totalQuestions}
                    </Typography>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                        >
                            Précédente
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextQuestion}
                            disabled={currentQuestionIndex === totalQuestions - 1}
                        >
                            Suivante
                        </Button>
                    </div>
                </div>


                {/* Question Content */}
                <Card className="p-4 sm:p-6 mb-4 sm:mb-6 transition-all duration-300 ease-in-out">
                    <div className="space-y-4">
                        {/* Difficulty Badge */}
                        <div className="flex justify-start mb-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                                {getDifficultyLabel(currentQuestion.difficulty)}
                            </div>
                        </div>

                        {/* Question Header */}
                        <div className="mb-4">
                            <Typography variant="h6" className="font-semibold text-foreground">
                                {currentQuestion.question_text}
                            </Typography>
                        </div>

                        {/* Result Status */}
                        <div className="flex items-center space-x-2">
                            {currentQuestion.is_correct ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <Typography variant="body" className="text-green-600 font-medium">
                                        Bonne réponse !
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <Typography variant="body" className="text-red-600 font-medium">
                                        Mauvaise réponse
                                    </Typography>
                                </>
                            )}
                        </div>

                        {/* Answers */}
                        <div className="space-y-2 sm:space-y-3">
                            {currentQuestion.all_answers.map((answer) => {
                                const isUserAnswer = answer.id === currentQuestion.user_answer_id;
                                const isCorrectAnswer = answer.is_correct;

                                let answerClass = "p-3 sm:p-4 rounded-lg border-2 transition-colors ";

                                if (isCorrectAnswer) {
                                    answerClass += "border-green-500 bg-green-50 text-green-800";
                                } else if (isUserAnswer) {
                                    answerClass += "border-red-500 bg-red-50 text-red-800";
                                } else {
                                    answerClass += "border-gray-200 bg-gray-50 text-gray-700";
                                }

                                return (
                                    <div key={answer.id} className={answerClass}>
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            {isCorrectAnswer && (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 hidden sm:block" />
                                            )}
                                            {isUserAnswer && !isCorrectAnswer && (
                                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 hidden sm:block" />
                                            )}
                                            <Typography variant="body" className="flex-1">
                                                {answer.text}
                                            </Typography>
                                            {isUserAnswer && (
                                                <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded hidden sm:inline-block">
                                                    Votre réponse
                                                </span>
                                            )}
                                            {isCorrectAnswer && !isUserAnswer && (
                                                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded hidden sm:inline-block">
                                                    Bonne réponse
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Question Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Progression</span>
                        <span>{currentQuestionIndex + 1}/{totalQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Fermer
                    </Button>
                </div>
            </Card>
        </div>
    );
}
