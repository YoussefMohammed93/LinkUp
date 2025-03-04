import MenuBar from "@/components/menu-bar";
import { Header } from "@/components/header";
import { ToastNotifications } from "@/components/toast-notifications";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#f2f4f7] dark:bg-background">
      <Header />
      <div className="mx-auto flex w-full max-w-[1200px] grow gap-5 px-5">
        <MenuBar className="sticky top-[6rem] hidden h-fit flex-none rounded-lg border bg-card sm:block sm:p-3 lg:p-0 xl:w-[220px]" />
        {children}
      </div>
      <MenuBar className="sticky bottom-0 w-full flex justify-center gap-5 border-t bg-card p-3 sm:hidden" />
      <ToastNotifications />
    </main>
  );
}
