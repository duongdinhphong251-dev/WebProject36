import * as React from "react";
import { cn } from "@/libs/utils";

type ResponsiveValue<T> = T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T };
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean;
  item?: boolean;

  xs?: number | "auto" | boolean;
  sm?: number | "auto" | boolean;
  md?: number | "auto" | boolean;
  lg?: number | "auto" | boolean;
  xl?: number | "auto" | boolean;
  size?: ResponsiveValue<number | "auto" | boolean>;

  offset?: ResponsiveValue<number | "auto">;
  xsOffset?: number | "auto";
  smOffset?: number | "auto";
  mdOffset?: number | "auto";
  lgOffset?: number | "auto";
  xlOffset?: number | "auto";

  spacing?: ResponsiveValue<SpacingValue>;
  columnSpacing?: ResponsiveValue<SpacingValue>;
  rowSpacing?: ResponsiveValue<SpacingValue>;

  columns?: ResponsiveValue<number>;

  direction?: ResponsiveValue<
        "row" | "column" | "row-reverse" | "column-reverse"
  >;
  wrap?: "wrap" | "nowrap" | "wrap-reverse";
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "between"
    | "around"
    | "evenly";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
}

const Grid = (
  { ref, className, container = false, item = false, xs, sm, md, lg, xl, size, offset, xsOffset, smOffset, mdOffset, lgOffset, xlOffset, spacing, columnSpacing, rowSpacing, columns = 12, direction = "row", justifyContent, alignItems, wrap = "wrap", ...props }: GridProps & { ref?: React.RefObject<HTMLDivElement | null> },
) => {
  // const getResponsiveValue = <T,>(
  //     value: ResponsiveValue<T> | undefined,
  //     breakpoint: "xs" | "sm" | "md" | "lg" | "xl",
  // ): T | undefined => {
  //     if (value === undefined) return undefined;
  //     if (typeof value === "object" && !Array.isArray(value)) {
  //         return (value as Record<string, T>)[breakpoint];
  //     }
  //     return value as T;
  // };

  const getColClass = (
    sizeValue: number | "auto" | boolean | undefined,
    breakpoint: string,
    totalColumns: number = 12,
  ) => {
    if (!sizeValue) {
      return "";
    }
    if (sizeValue === true) {
      return breakpoint ? `${breakpoint}:flex-1` : "flex-1";
    }
    if (sizeValue === "auto") {
      return breakpoint ? `${breakpoint}:flex-auto` : "flex-auto";
    }

    const prefix = breakpoint ? `${breakpoint}:` : "";
    const percentage = (sizeValue / totalColumns) * 100;
    return `${prefix}basis-[${percentage.toFixed(3)}%]`;
  };

  const getOffsetClass = (
    offsetValue: number | "auto" | undefined,
    breakpoint: string,
    totalColumns: number = 12,
  ) => {
    if (!offsetValue) {
      return "";
    }
    if (offsetValue === "auto") {
      return breakpoint ? `${breakpoint}:ml-auto` : "ml-auto";
    }
    const prefix = breakpoint ? `${breakpoint}:` : "";
    const percentage = (offsetValue / totalColumns) * 100;
    return `${prefix}ml-[${percentage.toFixed(3)}%]`;
  };

  const getJustifyClass = (justify: string | undefined) => {
    const map = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };
    return justify ? map[justify as keyof typeof map] : "";
  };

  const getAlignClass = (align: string | undefined) => {
    const map = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    };
    return align ? map[align as keyof typeof map] : "";
  };

  const getDirectionClass = (dir: string | undefined) => {
    const map = {
      "row": "flex-row",
      "column": "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    };
    return dir ? map[dir as keyof typeof map] : "flex-row";
  };

  const getWrapClass = (wrapValue: string | undefined) => {
    const map = {
      "wrap": "flex-wrap",
      "nowrap": "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
    };
    return wrapValue ? map[wrapValue as keyof typeof map] : "flex-wrap";
  };

  // compute spacing in rem
  const actualSpacing = typeof spacing === "number" ? spacing : 0;
  const actualColumnSpacing
    = typeof columnSpacing === "number" ? columnSpacing : actualSpacing;
  const actualRowSpacing
    = typeof rowSpacing === "number" ? rowSpacing : actualSpacing;

  // base 1 spacing = 0.25rem (4px)
  const columnGapRem = `${actualColumnSpacing * 0.25}rem`;
  const rowGapRem = `${actualRowSpacing * 0.25}rem`;

  // container style + classes
  const totalCols = typeof columns === "number" ? columns : 12;

  const containerClasses = cn(
    "flex",
    getDirectionClass(
      typeof direction === "string" ? direction : "row",
    ),
    getWrapClass(wrap),
    // MUI style spacing via negative margin + child padding
    container && "-m-[calc(var(--grid-column-spacing)/2)]",
    container && getJustifyClass(justifyContent),
    container && getAlignClass(alignItems),
    className,
  );

  const itemClasses = cn(
    item && "box-border min-w-0 flex-grow-0 flex-shrink-0",
    item && "p-[calc(var(--grid-column-spacing)/2)]",
    item && xs && getColClass(xs, "", totalCols),
    item && sm && getColClass(sm, "sm", totalCols),
    item && md && getColClass(md, "md", totalCols),
    item && lg && getColClass(lg, "lg", totalCols),
    item && xl && getColClass(xl, "xl", totalCols),
    item && xsOffset && getOffsetClass(xsOffset, "", totalCols),
    item && smOffset && getOffsetClass(smOffset, "sm", totalCols),
    item && mdOffset && getOffsetClass(mdOffset, "md", totalCols),
    item && lgOffset && getOffsetClass(lgOffset, "lg", totalCols),
    item && xlOffset && getOffsetClass(xlOffset, "xl", totalCols),
    !container && className,
  );

  const containerStyle = container
    ? ({
        "--grid-columns": totalCols,
        "--grid-column-spacing": columnGapRem,
        "--grid-row-spacing": rowGapRem,
        ...props.style,
      } as React.CSSProperties)
    : props.style;

  const itemStyle
    = item && xs && typeof xs === "number"
      ? ({
          width: `calc((${xs} / var(--grid-columns, ${totalCols})) * 100%)`,
          ...props.style,
        } as React.CSSProperties)
      : props.style;

  return (
    <div
      ref={ref}
      className={container ? containerClasses : itemClasses}
      style={container ? containerStyle : itemStyle}
      {...props}
    />
  );
};

Grid.displayName = "Grid";

export { Grid };
export type { GridProps };
