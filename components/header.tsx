import Link from "next/link";
import UserButton from "./user-button";
import SearchField from "./search-field";
import { Protest_Revolution } from "next/font/google";

const grechenFuemen = Protest_Revolution({
  weight: "400",
  subsets: ["latin"],
});

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-card dark:bg-[#252728] border-b">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 px-6 py-3 sm:gap-5">
        <Link
          href="/"
          className={`flex items-center gap-3 text-2xl md:text-3xl font-bold text-primary dark:text-white ${grechenFuemen.className}`}
          aria-label="LinkUp"
        >
          <svg width="120" height="50" className="fill-current">
            <text x="0" y="40" fontSize="40">
              LinkUp
            </text>
          </svg>
        </Link>
        <div className="flex-grow">
          <SearchField />
        </div>
        <UserButton />
      </div>
    </header>
  );
};
