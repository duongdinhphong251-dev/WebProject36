import type { VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/libs/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      // Headings - giữ sizes lớn cho headings
      h1: 'scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl',
      h2: 'scroll-m-20 text-xl font-bold tracking-tight',
      h3: 'scroll-m-20 text-lg font-semibold tracking-tight',
      h4: 'scroll-m-20 text-base font-semibold tracking-tight',
      h5: 'scroll-m-20 text-sm font-semibold tracking-tight',
      h6: 'scroll-m-20 text-sm font-semibold tracking-tight',

      // Subtitles - theo pattern của project
      subtitle1: 'text-base leading-relaxed font-medium',
      subtitle2: 'text-sm leading-relaxed font-medium',

      // Body text - theo sizes của project
      body1: 'text-sm leading-6', // 14px - size phổ biến nhất
      body2: 'text-[0.8125rem] leading-(--text-sm--line-height)', // 13px - size đặc biệt của project

      // Small text
      caption: 'text-muted-foreground text-xs', // 12px
      small: 'text-[0.6875rem] leading-[0.75rem]', // 11px

      // Special variants
      overline: 'text-xs font-medium tracking-wider uppercase',
      button: 'text-[0.8125rem] leading-(--text-sm--line-height) font-medium',

      // Inherit
      inherit: '',
    },
    color: {
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      success: 'text-[var(--color-success-accent,var(--color-green-600))] dark:text-[var(--color-success-soft,var(--color-green-400))]',
      warning: 'text-[var(--color-warning-accent,var(--color-yellow-600))] dark:text-[var(--color-warning-soft,var(--color-yellow-400))]',
      danger: 'text-destructive',
      info: 'text-[var(--color-info-accent,var(--color-violet-600))] dark:text-[var(--color-info-soft,var(--color-violet-400))]',
      muted: 'text-muted-foreground',
      foreground: 'text-foreground',
      accent: 'text-accent-foreground',
      inherit: '',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
      inherit: '',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      inherit: '',
    },
    gutterBottom: {
      true: 'mb-4',
      false: '',
    },
    noWrap: {
      true: 'truncate',
      false: '',
    },
    paragraph: {
      true: 'mb-4',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body1',
    color: 'foreground',
    align: 'inherit',
    weight: 'inherit',
    gutterBottom: false,
    noWrap: false,
    paragraph: false,
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
  VariantProps<typeof typographyVariants> {
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component?: React.ElementType;
  /**
   * If true, the component will be rendered as a child within a Slot component
   */
  asChild?: boolean;
}

// Mapping variants to default HTML elements
const variantMapping: Record<string, React.ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  small: 'small',
  overline: 'span',
  button: 'span',
  inherit: 'p',
};

const Typography = (
  { ref, className, variant = 'body1', color, align, weight, gutterBottom, noWrap, paragraph, component, asChild = false, children, ...props }: TypographyProps & { ref?: React.RefObject<HTMLElement | null> },
) => {
  // Determine the component to render
  const Component = asChild
    ? SlotPrimitive
    : component || variantMapping[variant || 'body1'] || 'p';

  // If paragraph is true and variant is a heading, override to 'p'
  const finalComponent = paragraph && !component ? 'p' : Component;

  return React.createElement(
    finalComponent,
    {
      ref,
      "className": cn(
        typographyVariants({
          variant,
          color,
          align,
          weight,
          gutterBottom,
          noWrap,
          paragraph,
        }),
        className,
      ),
      'data-slot': 'typography',
      ...props,
    },
    children,
  );
};

Typography.displayName = 'Typography';

export { Typography, typographyVariants };
