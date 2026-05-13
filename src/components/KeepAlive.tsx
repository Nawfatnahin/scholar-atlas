'use client';

import { useKeepAlive } from "@/hooks/useKeepAlive";

export function KeepAlive() {
  useKeepAlive();
  return null;
}
