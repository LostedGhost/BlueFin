/**
 * Fait défiler la zone de messages jusqu'au dernier message, SANS faire
 * défiler la page entière.
 *
 * `element.scrollIntoView()` fait défiler tous les ancêtres, fenêtre
 * comprise : à l'ouverture d'une conversation, la page sautait jusqu'au champ
 * de saisie et les messages passaient sous l'en-tête. On ne fait défiler que
 * le premier conteneur défilable.
 */
export function scrollToEnd(marker: HTMLElement | null, smooth = true) {
  let el = marker?.parentElement ?? null;
  while (el && el !== document.body) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
      return;
    }
    el = el.parentElement;
  }
}

/**
 * Heure d'un message, « HH:MM » uniquement (demande client). Le serveur
 * envoie « 16:34 11/09/2026 » ou une date ISO selon les routes : les deux
 * sont acceptés.
 */
export function messageTime(value?: string | null): string {
  if (!value) return 'à l’instant';
  const hm = /^(\d{1,2}):(\d{2})/.exec(value);
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
