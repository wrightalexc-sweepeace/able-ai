import { redirect } from "next/navigation";
import UserMgmtContainer from "./UserMgmtContainer";
import React, { Suspense } from "react";

export default function Page({ searchParams }: { searchParams: { mode?: string; oobCode?: string; continueUrl?: string } }) {
  const { mode, oobCode, continueUrl } = searchParams || {};
  if (!mode || !oobCode) {
    redirect("/signin");
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserMgmtContainer mode={mode} oobCode={oobCode} continueUrl={continueUrl} />
    </Suspense>
  );
}
