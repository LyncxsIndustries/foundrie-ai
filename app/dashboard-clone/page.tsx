import React from "react";
import { MotionProvider } from "@/components/dashboard-clone/MotionProvider";
import { DashboardClone } from "@/components/dashboard-clone/DashboardClone";

export default function DashboardClonePage() {
  return (
    <MotionProvider>
      <DashboardClone />
    </MotionProvider>
  );
}
