import MenuBar from "@/components/menu-bar";
import { Header } from "@/components/header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#FAFBFF] dark:bg-background">
      <Header />
      <div className="mx-auto flex w-full max-w-[1320px] grow gap-5 px-5">
        <MenuBar className="sticky top-[6rem] hidden h-fit flex-none rounded-lg border bg-card sm:block sm:p-3 lg:p-0 xl:w-80" />
        {children}
      </div>
      <MenuBar className="sticky bottom-0 w-full flex justify-center gap-5 border-t bg-card p-3 sm:hidden" />
    </main>
  );
}
