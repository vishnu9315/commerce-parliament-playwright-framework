/** Sidecar file (next to a storageState JSON) holding that role's sessionStorage snapshot. */
export function sessionStorageSidecarPath(storageStatePath: string): string {
  return storageStatePath.replace(/\.json$/, '.session.json');
}
