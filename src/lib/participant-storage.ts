"use client";

import { useEffect, useState } from "react";

export const PARTICIPANT_STORAGE_KEY = "tavariando:participant-id";
export const PARTICIPANT_TOKEN_STORAGE_KEY = "tavariando:participant-token";
export const PARTICIPANT_PHONE_STORAGE_KEY = "tavariando:participant-phone";
export const PARTICIPANT_CHANGED_EVENT = "tavariando:participant-changed";
export const PARTICIPANT_STEP_EVENT = "tavariando:participant-step";

export type ParticipantStep = "presence" | "contribution";

export type ParticipantSession = {
  participantId: string;
  participantToken: string;
  phone?: string;
};

const VALID_ID_PATTERN = /^[a-z0-9]{1,40}$/i;
const VALID_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;

export function isValidStoredSession(
  participantId: string | null,
  participantToken: string | null,
): boolean {
  if (!participantId || !participantToken) return false;
  return (
    VALID_ID_PATTERN.test(participantId.trim()) &&
    VALID_TOKEN_PATTERN.test(participantToken.trim())
  );
}

function readStoredSession(): ParticipantSession | null {
  if (typeof window === "undefined") return null;

  try {
    const rawId = window.localStorage.getItem(PARTICIPANT_STORAGE_KEY);
    const rawToken = window.localStorage.getItem(PARTICIPANT_TOKEN_STORAGE_KEY);

    if (!isValidStoredSession(rawId, rawToken)) {
      return null;
    }

    const phone =
      window.localStorage.getItem(PARTICIPANT_PHONE_STORAGE_KEY)?.trim() ||
      undefined;

    return {
      participantId: rawId!.trim(),
      participantToken: rawToken!.trim(),
      phone,
    };
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
  phone?: string,
  clearPhone = false,
) {
  try {
    window.localStorage.setItem(PARTICIPANT_STORAGE_KEY, participantId.trim());
    window.localStorage.setItem(
      PARTICIPANT_TOKEN_STORAGE_KEY,
      participantToken.trim(),
    );
    if (clearPhone) {
      window.localStorage.removeItem(PARTICIPANT_PHONE_STORAGE_KEY);
    } else if (typeof phone === "string" && phone.trim().length > 0) {
      window.localStorage.setItem(
        PARTICIPANT_PHONE_STORAGE_KEY,
        phone.trim(),
      );
    }
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}

export function clearStoredParticipantSession() {
  try {
    window.localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
    window.localStorage.removeItem(PARTICIPANT_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(PARTICIPANT_PHONE_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }

  window.dispatchEvent(new Event(PARTICIPANT_CHANGED_EVENT));
}

export function requestParticipantStep(
  step: ParticipantStep,
  targetId = "confirmacao",
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ParticipantStep>(PARTICIPANT_STEP_EVENT, { detail: step }),
  );

  const element = document.getElementById(targetId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
