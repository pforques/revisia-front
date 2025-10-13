/**
 * Utilitaire pour l'analytics avec PostHog
 * Désactive automatiquement PostHog en développement
 */

import posthog from "posthog-js";

// Vérifier si PostHog est activé
const isPostHogEnabled = () => {
    return process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_POSTHOG_KEY;
};

// Wrapper pour les méthodes PostHog avec vérification
export const analytics = {
    capture: (event: string, properties?: Record<string, unknown>) => {
        if (isPostHogEnabled()) {
            posthog.capture(event, properties);
        } else {
            console.log(`📊 [Analytics] ${event}`, properties);
        }
    },

    identify: (userId: string, properties?: Record<string, unknown>) => {
        if (isPostHogEnabled()) {
            posthog.identify(userId, properties);
        } else {
            console.log(`📊 [Analytics] Identify: ${userId}`, properties);
        }
    },

    alias: (alias: string) => {
        if (isPostHogEnabled()) {
            posthog.alias(alias);
        } else {
            console.log(`📊 [Analytics] Alias: ${alias}`);
        }
    },

    track: (event: string, properties?: Record<string, unknown>) => {
        if (isPostHogEnabled()) {
            posthog.capture(event, properties);
        } else {
            console.log(`📊 [Analytics] Track: ${event}`, properties);
        }
    },

    reset: () => {
        if (isPostHogEnabled()) {
            posthog.reset();
        } else {
            console.log(`📊 [Analytics] Reset`);
        }
    },

    isEnabled: () => isPostHogEnabled(),
};

// Export par défaut pour compatibilité
export default analytics;
