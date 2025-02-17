import MenuBar from "@/components/menu-bar";
import { Header } from "@/components/header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#FAFBFF]">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl grow gap-5 p-5">
        <MenuBar className="sticky top-[5.25rem] hidden h-fit flex-none rounded-md border bg-card sm:block p-3 xl:w-80" />
        {children}
      </div>
      <MenuBar className="sticky bottom-0 flex w-full justify-center gap-5 border-t bg-card p-3 sm:hidden" />
    </main>
  );
}
