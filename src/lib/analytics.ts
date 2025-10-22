// Lightweight analytics wrapper with safe fallbacks
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    // PostHog
    const posthog = (window as any)?.posthog;
    if (posthog && typeof posthog.capture === "function") {
      posthog.capture(eventName, properties);
      return;
    }

    // Mixpanel
    const mixpanel = (window as any)?.mixpanel;
    if (mixpanel && typeof mixpanel.track === "function") {
      mixpanel.track(eventName, properties);
      return;
    }

    // Fallback to console for local dev visibility
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${eventName}`, properties);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug("analytics error", err);
  }
}