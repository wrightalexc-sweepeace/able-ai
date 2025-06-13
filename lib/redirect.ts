export function getLastPathByRole(role: string): string | null {
  if (role === "GIG_WORKER") {
    return localStorage.getItem("lastPath_GIG_WORKER");
  } else if (role === "BUYER") {
    return localStorage.getItem("lastPath_BUYER");
  }

  return null;
}
