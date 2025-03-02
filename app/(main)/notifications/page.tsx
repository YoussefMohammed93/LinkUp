import PeopleSidebar from "@/components/people-sidebar";
import { NotificationsList } from "@/components/notifications-list";

export default function NotificationsPage() {
  return (
    <>
      <div className="w-full min-w-0 my-5">
        <NotificationsList />
      </div>
      <PeopleSidebar />
    </>
  );
}
