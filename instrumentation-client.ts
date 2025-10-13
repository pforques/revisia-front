import posthog from "posthog-js"

// Désactiver PostHog en développement
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    debug: false, // Pas de debug en production
  });
} else {
  // Mode développement ou clé manquante - PostHog désactivé
  console.log("📊 PostHog désactivé en mode développement");
}