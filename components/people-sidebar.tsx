import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

type Friend = {
  id: number;
  name: string;
  title: string;
  avatar: string;
};

const suggestedFriends: Friend[] = [
  {
    id: 1,
    name: "Abdelrahman Mohammed",
    title: "Project Manager",
    avatar: "/avatar-placeholder.png",
  },
  {
    id: 2,
    name: "Ahmed Kareem",
    title: "Graphic Designer",
    avatar: "/avatar-placeholder.png",
  },
  {
    id: 3,
    name: "Eslam Hamdy",
    title: "Data Scientist",
    avatar: "/avatar-placeholder.png",
  },
];

export default function PeopleSidebar() {
  return (
    <aside className="sticky top-[6rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <div className="space-y-5 rounded-lg border bg-card p-4">
        <h2 className="text-xl font-semibold">Suggested Friends</h2>
        <div className="flex flex-col gap-5">
          {suggestedFriends.map((friend, index) => (
            <div
              key={friend.id}
              className={`flex items-center justify-between ${index !== suggestedFriends.length - 1 ? "border-b pb-3" : ""}`}
            >
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src={friend.avatar}
                  alt={`${friend.name}'s avatar`}
                  width={48}
                  height={48}
                  loading="lazy"
                  className="object-cover rounded-full"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold truncate">
                    {friend.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {friend.title}
                  </p>
                </div>
              </Link>
              <Button size="icon" variant="outline" title="Follow">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
