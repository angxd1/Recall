import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Preserve the server value during hydration, then use the current client value.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot) ? client : server;
}
