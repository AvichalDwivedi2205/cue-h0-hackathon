import type { Metadata } from "next";
import { CueLandingPage } from "@/components/CueLandingPage";

export const metadata: Metadata = {
  title: "Cue - Ask your work anything",
  description: "Ask your work anything. Get the answer with proof.",
};

export default function Page() {
  return <CueLandingPage />;
}
