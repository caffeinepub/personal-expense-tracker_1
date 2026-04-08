// Re-export useActor from core-infrastructure, pre-bound to the app's createActor.
// This shim exists because core-infrastructure provides a generic useActor(createActor)
// while the rest of the app calls useActor() without arguments.
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import type { Backend } from "../backend";
import { createActor } from "../backend";

type CreateActorFn = typeof createActor;

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  const result = _useActor<Backend>(createActor as unknown as CreateActorFn);
  return result as { actor: Backend | null; isFetching: boolean };
}
