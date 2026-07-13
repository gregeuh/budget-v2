// Transition partagée (View Transitions API) avec repli propre.
export function transitionPartagee(action) {
  if (typeof document === "undefined") return action();
  const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduit || !document.startViewTransition) return action();
  return document.startViewTransition(action);
}
