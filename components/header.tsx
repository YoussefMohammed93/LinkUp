import Link from "next/link";
import Image from "next/image";
import UserButton from "./user-button";
import SearchField from "./search-field";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-6 px-6 py-4 sm:gap-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-primary"
          aria-label="Home"
        >
          <Image
            src="/logo.svg"
            alt="Loop logo"
            width={40}
            height={40}
            priority
          />
          <span>Loop</span>
        </Link>
        <div className="flex-grow ml-10 sm:ml-2 md:ml-0">
          <SearchField />
        </div>
        <UserButton />
      </div>
    </header>
  );
};
