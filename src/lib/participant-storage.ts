export const PARTICIPANT_STORAGE_KEY = "tavariando:participant-id";
export const PARTICIPANT_CHANGED_EVENT = "tavariando:participant-changed";

export function getStoredParticipantId(): string | null {
  try {
    return window.localStorage.getItem(PARTICIPANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getServerParticipantId(): string | null {
  return null;
}

export function subscribeToParticipantChanges(onChange: () => void) {
  window.addEventListener(PARTICIPANT_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(PARTICIPANT_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function storeParticipantId(participantId: string) {
  try {
    window.localStorage.setItem(PARTICIPANT_STORAGE_KEY, participantId);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}

export function clearStoredParticipantId() {
  try {
    window.localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}
