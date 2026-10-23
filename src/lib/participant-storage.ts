export const PARTICIPANT_STORAGE_KEY = "tavariando:participant-id";
export const PARTICIPANT_CHANGED_EVENT = "tavariando:participant-changed";

const SERVER_PARTICIPANT_ID = null;
let cachedParticipantId: string | null | undefined;

function readStoredParticipantId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(PARTICIPANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredParticipantId(): string | null {
  if (cachedParticipantId === undefined) {
    cachedParticipantId = readStoredParticipantId();
  }

  return cachedParticipantId;
}

export function getServerParticipantId(): string | null {
  return SERVER_PARTICIPANT_ID;
}

export function subscribeToParticipantChanges(onChange: () => void) {
  function handleStoreChange() {
    cachedParticipantId = readStoredParticipantId();
    onChange();
  }

  window.addEventListener(PARTICIPANT_CHANGED_EVENT, handleStoreChange);
  window.addEventListener("storage", handleStoreChange);

  return () => {
    window.removeEventListener(PARTICIPANT_CHANGED_EVENT, handleStoreChange);
    window.removeEventListener("storage", handleStoreChange);
  };
}

export function storeParticipantId(participantId: string) {
  cachedParticipantId = participantId;

  try {
    window.localStorage.setItem(PARTICIPANT_STORAGE_KEY, participantId);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}

export function clearStoredParticipantId() {
  cachedParticipantId = null;

  try {
    window.localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}
