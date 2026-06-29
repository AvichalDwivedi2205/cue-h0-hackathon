import type { Metadata } from "next";
import { CueWorkspaceApp } from "@/components/CueWorkspaceApp";

export const metadata: Metadata = {
  title: "Cue for Teams",
  description: "Ask across company tools, verify the evidence, and approve the next action.",
};

export default function AppPage() {
  return <CueWorkspaceApp />;
}
