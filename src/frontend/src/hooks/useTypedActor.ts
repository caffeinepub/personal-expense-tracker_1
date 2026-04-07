// Typed actor hook — wraps useActor from @caffeineai/core-infrastructure
// with the generated createActor factory and casts to our BackendActor interface.
import { useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { BackendActor } from "../types";

export function useTypedActor(): {
  actor: BackendActor | null;
  isFetching: boolean;
} {
  const { actor, isFetching } = useActor(createActor);
  return { actor: actor as unknown as BackendActor | null, isFetching };
}
