"use client";

import { useEffect, useState } from "react";

export const PARTICIPANT_STORAGE_KEY = "tavariando:participant-id";
export const PARTICIPANT_CHANGED_EVENT = "tavariando:participant-changed";

function readStoredParticipantId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(PARTICIPANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribeToParticipantChanges(onChange: () => void) {
  function handleStoreChange() {
    onChange();
  }

  window.addEventListener(PARTICIPANT_CHANGED_EVENT, handleStoreChange);
  window.addEventListener("storage", handleStoreChange);

  onChange();

  return () => {
    window.removeEventListener(PARTICIPANT_CHANGED_EVENT, handleStoreChange);
    window.removeEventListener("storage", handleStoreChange);
  };
}

export function useParticipantId() {
  const [participantId, setParticipantId] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    return subscribeToParticipantChanges(() => {
      setParticipantId(readStoredParticipantId());
    });
  }, []);

  return participantId;
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
