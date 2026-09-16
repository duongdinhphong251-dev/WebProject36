"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/libs/I18nNavigation";
import Image from "next/image";
import "@/styles/global.css";

function Index() {
  const router = useRouter();
  const pathname = usePathname();

  const isAccountPath = pathname.includes("/account");

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-app-bg px-4 selection:bg-[#5B7A4F] selection:text-white">
      <div className="flex flex-col items-center justify-center rounded-[32px] bg-white p-8 px-6 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sm:p-12 md:max-w-md lg:max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/assets/images/common/logo_x.png"
            alt="Nhom36 Logo"
            width={140}
            height={50}
            className="h-auto w-auto object-contain"
            priority
          />
        </div>

        {/* 404 Typography */}
        <div className="relative mb-6 w-full py-4 sm:py-8">
          <h1 className="select-none text-[7rem] font-black leading-none tracking-tighter text-slate-50 sm:text-[10rem]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Oops! Page Not Found
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="mb-10 max-w-[280px] text-sm leading-relaxed text-slate-500 sm:max-w-sm sm:text-base">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full max-w-[260px] rounded-2xl border-0 bg-[#5B7A4F] font-semibold text-white shadow-lg shadow-[#5B7A4F]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-[#4A6340] hover:shadow-[#5B7A4F]/40 active:translate-y-0 active:shadow-none"
          onClick={() => {
            const redirectTo =
              pathname.includes("/account") || pathname.includes("account")
                ? "/account"
                : "/";
            router.push(redirectTo);
          }}
        >
          {isAccountPath ? "Go To Account" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
}

export default Index;
