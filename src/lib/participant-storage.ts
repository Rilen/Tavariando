"use client";

import { useEffect, useState } from "react";

export const PARTICIPANT_STORAGE_KEY = "tavariando:participant-id";
export const PARTICIPANT_TOKEN_STORAGE_KEY = "tavariando:participant-token";
export const PARTICIPANT_CHANGED_EVENT = "tavariando:participant-changed";

export type ParticipantSession = {
  participantId: string;
  participantToken: string;
};

function readStoredSession(): ParticipantSession | null {
  if (typeof window === "undefined") return null;

  try {
    const participantId = window.localStorage.getItem(PARTICIPANT_STORAGE_KEY);
    const participantToken = window.localStorage.getItem(
      PARTICIPANT_TOKEN_STORAGE_KEY,
    );

    return participantId && participantToken
      ? { participantId, participantToken }
      : null;
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

export function useParticipantSession() {
  const [session, setSession] = useState<
    ParticipantSession | null | undefined
  >(undefined);

  useEffect(() => {
    return subscribeToParticipantChanges(() => {
      setSession(readStoredSession());
    });
  }, []);

  return session;
}

export function storeParticipantSession(
  participantId: string,
  participantToken: string,
) {
  try {
    window.localStorage.setItem(PARTICIPANT_STORAGE_KEY, participantId);
    window.localStorage.setItem(
      PARTICIPANT_TOKEN_STORAGE_KEY,
      participantToken,
    );
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}

export function clearStoredParticipantSession() {
  try {
    window.localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
    window.localStorage.removeItem(PARTICIPANT_TOKEN_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}
