import Link from "next/link";
import Image from "next/image";
import UserButton from "./user-button";
import SearchField from "./search-field";

export const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:gap-5">
        <Link
          href="/"
          className="flex items-center ga-2 sm:gap-3 text-2xl md:text-3xl font-bold text-primary"
        >
          <Image src="/logo.svg" alt="logo" width={40} height={40} />
          <span>Loop</span>
        </Link>
        <div className="flex-grow flex justify-center">
          <SearchField />
        </div>
        <UserButton />
      </div>
    </header>
  );
};
