export function getLastPathByRole(role: string): string | null {  
  if (role === "GIG_WORKER") {
    return localStorage.getItem("lastPathGigWorker");
  } else if (role === "BUYER") {
    return localStorage.getItem("lastPathBuyer");
  }

  return null;
}
