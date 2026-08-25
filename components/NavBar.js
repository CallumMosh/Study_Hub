"use client";

import Link from "next/link";

export default function NavBar() {
  return (
    <header className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex items-center justify-between">
      <Link href="/" className="font-display italic text-xl tracking-tight">
        Study Hub
      </Link>
      <span className="eyebrow">for you, only</span>
    </header>
  );
}
