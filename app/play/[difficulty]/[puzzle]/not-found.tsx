"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Invalid Puzzle</h1>
        <p className="text-muted-foreground">
          This puzzle link is invalid or has expired. The puzzle may have been
          corrupted or the link may be incomplete.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ size: "lg" }), "inline-flex")}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
