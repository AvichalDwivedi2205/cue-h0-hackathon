import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cue for Teams",
  description: "AI workplace command center for the H0 hackathon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
