import type { FeatureFlags, MeResponse } from "../api/types";

export function hasPermission(me: MeResponse | null, permission: string) {
  if (!permission) return true;
  return Boolean(me?.permissions?.includes(permission));
}

export function featureEnabled(flags: FeatureFlags | undefined, feature: string) {
  if (!feature) return true;
  return Boolean(flags?.[feature]);
}
