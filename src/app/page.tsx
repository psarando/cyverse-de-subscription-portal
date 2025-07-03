import { auth } from "@/auth";
import LoginBtn from "@/components/LoginBtn";
import Image from "next/image";

export default async function Home() {
    const session = await auth();
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <Image
                    src="/cyverse_logo_2.png"
                    alt="CyVerse logo"
                    width={836}
                    height={170}
                    priority
                />
                <div className="flex gap-4 items-center flex-col">
                    Welcome {session?.user?.name}!
                    <LoginBtn />
                </div>
            </main>
        </div>
    );
}
