"use client";

import { useRef } from "react";
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchField() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();

    if (!q) return;

    router.push(`/search?q=${encodeURIComponent(q)}`);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <form
      method="GET"
      action="/search"
      onSubmit={handleSubmit}
      className="w-full max-w-[250px] mt-1"
    >
      <div className="relative">
        <Input
          ref={inputRef}
          name="q"
          placeholder="Search"
          className="w-full pe-10 sm:pe-12 pl-5 rounded-full shadow-none"
        />
        <SearchIcon className="absolute right-4 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </div>
    </form>
  );
}
