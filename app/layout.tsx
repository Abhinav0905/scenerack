import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SceneRack | A costume plan before you spend",
  description:
    "Preview the look. Resolve the shared wardrobe. Know what to pull, borrow and rent before the first fitting.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
