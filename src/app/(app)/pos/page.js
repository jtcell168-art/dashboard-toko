"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pos/retail");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
}
