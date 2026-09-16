'use client';

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/libs/utils';

// Define input size variants
const textareaVariants = cva(
  `
    bg-background border-input bg-background text-foreground placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive 
    aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/20 w-full 
    border shadow-xs shadow-black/5 transition-[color,box-shadow] focus-visible:ring-[3px]
    focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&[readonly]]:opacity-70
  `,
  {
    variants: {
      variant: {
        sm: 'rounded-md px-2.5 py-2.5 text-xs',
        md: 'rounded-md px-3 py-3 text-[0.8125rem] leading-(--text-sm--line-height)',
        lg: 'rounded-md px-4 py-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

function Textarea({
  className,
  variant,
  ...props
}: React.ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>) {
  return <textarea data-slot="textarea" className={cn(textareaVariants({ variant }), className)} {...props} />;
}

export { Textarea, textareaVariants };
