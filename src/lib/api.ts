import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }

        // Gérer les erreurs de vérification email (403)
        if (error.response?.status === 403 && error.response?.data?.verification_required) {
            // Stocker l'email pour la page de vérification
            localStorage.setItem('pending_verification_email', error.response.data.email);
            window.location.href = '/verify-email';
        }

        return Promise.reject(error);
    }
);

export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    education_level?: string;
    is_premium?: boolean;
    email_verified?: boolean;
    created_at: string;
}

export interface UserRoleInfo {
    role: 'guest' | 'free' | 'premium';
    can_create_quiz: boolean;
    can_attempt_quiz: boolean;
    quiz_count_today: number;
    attempts_count_today: number;
    limits: {
        max_questions: number | null;
        max_quizzes_per_day: number | null;
        max_attempts_per_day: number | null;
        can_save_results: boolean;
    };
    user: User | null;
}

export interface AuthResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    education_level?: string;
    password: string;
    password_confirm: string;
}

export interface Document {
    id: number;
    title: string;
    file_type: string;
    created_at: string;
}

export interface Answer {
    id: number;
    answer_text: string;
    is_correct: boolean;
}

export interface Question {
    id: number;
    question_text: string;
    question_type: 'qcm' | 'open';
    difficulty: 'easy' | 'medium' | 'hard';
    answers: Answer[];
    created_at: string;
}

export interface Lesson {
    id: number;
    title: string;
    status: 'en_cours' | 'termine' | 'pause';
    difficulty: 'easy' | 'medium' | 'hard';
    total_questions: number;
    completed_questions: number;
    score: number;
    last_score: number;
    total_attempts: number;
    average_score: number;
    progress: number;
    is_completed: boolean;
    last_accessed: string;
    created_at: string;
    document_title: string;
}

export interface LessonStats {
    total_lessons: number;
    completed_lessons: number;
    average_score: number;
    total_study_time: number;
}

export interface CreateLessonData {
    document_id: number;
    title?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface SubmitAnswerData {
    question_id: number;
    selected_answer_id?: number;
    open_answer?: string;
}

export interface AISettings {
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionTypes: ('qcm' | 'open')[];
    educationLevel?: string;
    instructions?: string;
}

export const authAPI = {
    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await api.post('/auth/login/', data);
        return response.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post('/auth/register/', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    },

    getProfile: async (): Promise<User> => {
        const response = await api.get('/auth/profile/');
        return response.data;
    },

    updateProfile: async (data: { first_name?: string; last_name?: string; username?: string; education_level?: string }): Promise<User> => {
        const response = await api.put('/auth/profile/update/', data, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    },

    getRoleInfo: async (sessionId?: string): Promise<UserRoleInfo> => {
        const params = sessionId ? { session_id: sessionId } : {};
        const response = await api.get('/auth/role-info/', { params });
        return response.data;
    },
};

export const documentsAPI = {
    checkGuestLimits: async (sessionId?: string): Promise<{
        can_upload: boolean;
        error?: string;
        details?: string;
        action?: string;
    }> => {
        const params = sessionId ? { session_id: sessionId } : {};
        const response = await api.get('/auth/role-info/', { params });
        const roleInfo = response.data;

        // Vérifier les limites pour les invités
        if (roleInfo.role === 'guest') {
            if (!roleInfo.can_create_quiz) {
                return {
                    can_upload: false,
                    error: 'Limite d\'utilisation atteinte',
                    details: 'Vous avez déjà utilisé votre quota gratuit. Inscrivez-vous pour créer plus de quiz et sauvegarder vos résultats.',
                    action: 'signup_required'
                };
            }
        }

        return { can_upload: true };
    },

    upload: async (file: File, title?: string, aiSettings?: AISettings): Promise<Document & { lesson_id?: number; session_id?: string; remaining_uses?: number }> => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) {
            formData.append('title', title);
        }
        if (aiSettings) {
            formData.append('question_count', aiSettings.questionCount.toString());
            formData.append('difficulty', aiSettings.difficulty);
            formData.append('question_types', JSON.stringify(aiSettings.questionTypes));
            if (aiSettings.educationLevel) {
                formData.append('education_level', aiSettings.educationLevel);
            }
            if (aiSettings.instructions) {
                formData.append('instructions', aiSettings.instructions);
            }
        }

        const response = await api.post('/auth/documents/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAll: async (): Promise<Document[]> => {
        const response = await api.get('/auth/documents/');
        return response.data;
    },

    getQuestions: async (documentId: number): Promise<Question[]> => {
        const response = await api.get(`/auth/documents/${documentId}/questions/`);
        return response.data;
    },
};

export const lessonsAPI = {
    getAll: async (): Promise<Lesson[]> => {
        const response = await api.get('/auth/lessons/');
        return response.data;
    },

    create: async (data: CreateLessonData): Promise<Lesson> => {
        const response = await api.post('/auth/lessons/create/', data);
        return response.data;
    },

    getById: async (lessonId: number, sessionId?: string): Promise<{ lesson: Lesson; questions: Question[]; session_id?: string }> => {
        const params = sessionId ? { session_id: sessionId } : {};
        const response = await api.get(`/auth/lessons/${lessonId}/`, { params });
        return response.data;
    },

    submitAnswer: async (lessonId: number, data: SubmitAnswerData & { session_id?: string }): Promise<{
        is_correct: boolean;
        lesson_progress: number;
        lesson_score: number;
        session_id?: string;
    }> => {
        const response = await api.post(`/auth/lessons/${lessonId}/submit-answer/`, data);
        return response.data;
    },

    reset: async (lessonId: number): Promise<{ message: string }> => {
        const response = await api.post(`/auth/lessons/${lessonId}/reset/`);
        return response.data;
    },

    getAttempts: async (lessonId: number): Promise<{
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
    }[]> => {
        const response = await api.get(`/auth/lessons/${lessonId}/attempts/`);
        return response.data;
    },

    getStats: async (): Promise<LessonStats> => {
        const response = await api.get('/auth/lessons/stats/');
        return response.data;
    },

    // Fonctions pour les invités
    getGuestResults: async (lessonId: number, sessionId: string): Promise<{
        lesson_id: number;
        lesson_title: string;
        is_completed: boolean;
        total_questions: number;
        answered_questions: number;
        correct_answers: number;
        score_percentage: number;
        session_id: string;
        can_see_results: boolean;
        message: string;
    }> => {
        const response = await api.get(`/auth/lessons/${lessonId}/guest-results/`, {
            params: { session_id: sessionId }
        });
        return response.data;
    },

    transferGuestData: async (sessionId: string): Promise<{
        success: boolean;
        message: string;
        transferred_lessons: Array<{
            id: number;
            title: string;
            score: number;
            status: string;
        }>;
    }> => {
        const response = await api.post('/auth/transfer-guest-data/', { session_id: sessionId });
        return response.data;
    },

    deleteLesson: async (lessonId: number): Promise<{ message: string; lesson_id: number }> => {
        const response = await api.delete(`/auth/lessons/${lessonId}/delete/`);
        return response.data;
    },

    updateLesson: async (lessonId: number, title: string): Promise<{ message: string; lesson: Lesson }> => {
        const response = await api.put(`/auth/lessons/${lessonId}/update/`, { title });
        return response.data;
    },

    deleteQuestion: async (lessonId: number, questionId: number, sessionId?: string): Promise<{
        message: string;
        lesson_progress: number;
        lesson_score: number;
        total_questions: number;
        session_id?: string;
    }> => {
        const params = sessionId ? { session_id: sessionId } : {};
        const response = await api.delete(`/auth/lessons/${lessonId}/questions/${questionId}/delete/`, { params });
        return response.data;
    },
};

export const stripeAPI = {
    createPaymentIntent: async (amount: number): Promise<{
        client_secret: string;
        amount: number;
    }> => {
        const response = await api.post('/auth/stripe/create-payment-intent/', { amount });
        return response.data;
    },

    confirmPayment: async (paymentIntentId: string): Promise<{
        success: boolean;
        message: string;
        user: User;
    }> => {
        const response = await api.post('/auth/stripe/confirm-payment/', {
            payment_intent_id: paymentIntentId
        });
        return response.data;
    },
};

export const subscriptionAPI = {
    getSubscriptionInfo: async (): Promise<{
        is_premium: boolean;
        subscription_status: 'active' | 'expired' | 'permanent' | 'inactive';
        is_subscription_active: boolean;
        current_period_end: string | null;
        days_remaining: number | null;
        subscription_interval: string | null;
        cancel_at_period_end: boolean;
        canceled_at: string | null;
        user_role: string;
    }> => {
        const response = await api.get('/auth/subscription-info/');
        return response.data;
    },

    createSubscription: async (priceId: string): Promise<{
        subscription_id: string;
        client_secret: string;
        status: string;
    }> => {
        const response = await api.post('/auth/subscription/create/', {
            price_id: priceId
        });
        return response.data;
    },


    cancelSubscription: async (): Promise<{
        success: boolean;
        message: string;
        cancel_at: string;
    }> => {
        const response = await api.post('/auth/subscription/cancel/');
        return response.data;
    },

    // Email verification functions
    sendEmailVerification: async (): Promise<{
        message: string;
        email: string;
        expires_in_minutes: number;
    }> => {
        const response = await api.post('/auth/email/send-verification/');
        return response.data;
    },

    verifyEmailCode: async (code: string): Promise<{
        message: string;
        email_verified: boolean;
    }> => {
        const response = await api.post('/auth/email/verify-code/', {
            code: code
        });
        return response.data;
    },

    getEmailVerificationStatus: async (): Promise<{
        email_verified: boolean;
        email: string;
        can_request_new_code: boolean;
        next_code_in_seconds?: number;
        last_code_expires_at?: string;
        last_code_is_expired?: boolean;
        last_code_attempts?: number;
    }> => {
        const response = await api.get('/auth/email/verification-status/');
        return response.data;
    },
};

export default api;
