'use client';

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { ChevronDown, Plus } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/libs/utils';

// Variants
const accordionRootVariants = cva('', {
  variants: {
    variant: {
      default: '',
      outline: 'space-y-2',
      solid: 'space-y-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionItemVariants = cva('', {
  variants: {
    variant: {
      default: 'border-border border-b',
      outline: 'border-border rounded-lg border px-4',
      solid: 'bg-accent/70 rounded-lg px-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionTriggerVariants = cva(
  'text-foreground flex flex-1 cursor-pointer items-center justify-between gap-2.5 py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: '',
        outline: '',
        solid: '',
      },
      indicator: {
        arrow: '',
        plus: '[&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      indicator: 'arrow',
    },
  },
);

const accordionContentVariants = cva(
  'text-accent-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all',
  {
    variants: {
      variant: {
        default: '',
        outline: '',
        solid: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// Context
interface AccordionContextType {
  variant?: 'default' | 'outline' | 'solid';
  indicator?: 'arrow' | 'plus' | 'none';
}

const AccordionContext = React.createContext<AccordionContextType>({
  variant: 'default',
  indicator: 'arrow',
});

// Components
function Accordion(
  props: React.ComponentProps<typeof AccordionPrimitive.Root>
    & VariantProps<typeof accordionRootVariants> & {
      indicator?: 'arrow' | 'plus';
    },
) {
  const { className, variant = 'default', indicator = 'arrow', children, ...rest } = props;

  return (
    <AccordionContext value={{ variant: variant || 'default', indicator }}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        className={cn(accordionRootVariants({ variant }), className)}
        {...rest}
      >
        {children}
      </AccordionPrimitive.Root>
    </AccordionContext>
  );
}

function AccordionItem(props: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const { className, children, ...rest } = props;
  const { variant } = React.use(AccordionContext);

  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants({ variant }), className)}
      {...rest}
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

function AccordionTrigger(props: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const { className, children, ...rest } = props;
  const { variant, indicator } = React.use(AccordionContext);

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(accordionTriggerVariants({ variant, indicator }), className)}
        {...rest}
      >
        {children}
        {indicator === 'plus' && <Plus className="size-4 shrink-0 transition-transform duration-200" strokeWidth={1} />}
        {indicator === 'arrow' && (
          <ChevronDown className="size-4 shrink-0 transition-transform duration-200" strokeWidth={1} />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent(props: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const { className, children, ...rest } = props;
  const { variant } = React.use(AccordionContext);

  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(accordionContentVariants({ variant }), className)}
      {...rest}
    >
      <div className={cn('pb-5 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

// Exports
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
