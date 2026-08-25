import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "../components/NavBar";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Study Hub",
  description: "Lecture notes, flashcards, and quizzes that actually help you understand.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body min-h-screen">
        <NavBar />
        <main className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">{children}</main>
      </body>
    </html>
  );
}
