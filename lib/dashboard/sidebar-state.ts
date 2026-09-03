/**
 * Shared contract for the sidebar's collapsed state.
 *
 * The Sidebar owns the toggle; DashboardShell and TopBar need the same value to
 * offset their layout. They used to stay in sync by polling localStorage on a
 * 300ms setInterval — four reads a second, forever, on every dashboard page,
 * with up to 300ms of visible lag between the click and the layout shifting.
 *
 * The `storage` event only fires in *other* tabs, which is why polling was
 * reached for. A custom event covers the same-tab case; localStorage stays as
 * the persistence layer so the choice survives a reload.
 */

export const SIDEBAR_LS_KEY = "imprint_sidebar_collapsed";
export const SIDEBAR_EVENT = "imprint:sidebar-collapsed";

export const SIDEBAR_COLLAPSED_W = 68;
export const SIDEBAR_EXPANDED_W = 240;

/** Read the persisted state. Defaults to collapsed. */
export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SIDEBAR_LS_KEY) !== "false";
  } catch {
    // Private mode or blocked storage — fall back to the default.
    return true;
  }
}

/** Persist the state and notify listeners in this tab. */
export function setSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_LS_KEY, String(collapsed));
  } catch {
    // Non-fatal: the event below still keeps the current session in sync.
  }
  window.dispatchEvent(
    new CustomEvent<boolean>(SIDEBAR_EVENT, { detail: collapsed })
  );
}

/**
 * Subscribe to changes. Handles this tab (custom event) and other tabs
 * (storage event). Returns an unsubscribe function.
 */
export function onSidebarCollapsedChange(
  handler: (collapsed: boolean) => void
): () => void {
  const onCustom = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SIDEBAR_LS_KEY) handler(e.newValue !== "false");
  };
  window.addEventListener(SIDEBAR_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
