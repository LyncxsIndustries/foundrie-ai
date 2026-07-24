import React from "react";
import { auth } from "@clerk/nextjs/server";
import { MotionProvider } from "@/components/dashboard-clone/MotionProvider";
import { DashboardClone } from "@/components/dashboard-clone/DashboardClone";

export default async function DashboardClonePage() {
  await auth.protect();
  return (
    <MotionProvider>
      <DashboardClone />
    </MotionProvider>
  );
}
