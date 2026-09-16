import * as React from "react";
import { cn } from "@/libs/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | false;
  fixed?: boolean;
  disableGutters?: boolean;
}

const Container = ({ ref, className, maxWidth = "lg", fixed = false, disableGutters = false, ...props }: ContainerProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const getMaxWidthClass = () => {
    if (maxWidth === false) {
      return "";
    }

    const maxWidthMap = {
      "xs": "max-w-xs",
      "sm": "max-w-sm",
      "md": "max-w-md",
      "lg": "max-w-4xl",
      "xl": "max-w-6xl",
      "2xl": "max-w-7xl",
    };

    return maxWidthMap[maxWidth];
  };

  return (
    <div
      className={cn(
        "w-full mx-auto",
        !disableGutters && "px-4 sm:px-6 lg:px-8",
        !fixed && getMaxWidthClass(),
        className,
      )}
      ref={ref}
      {...props}
    />
  );
};

Container.displayName = "Container";

export { Container };
