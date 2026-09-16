import CustomLink from "@/components/common/link";

export default function LogoMain({ className }: { className?: string }) {
  return (
    <CustomLink href="/">
      <div className={`flex items-center ${className}`}>
        <span className="text-[24px] md:text-[28px] font-bold text-white tracking-tight">
          Nhom36
        </span>
      </div>
    </CustomLink>
  );
}