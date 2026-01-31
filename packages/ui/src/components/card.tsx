import * as React from 'react';
import { cn } from '../utils/cn';

const Card = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="card-header" className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  React.ElementRef<'h3'>,
  React.ComponentPropsWithoutRef<'h3'>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="card-content" className={cn('px-6 pb-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="card-footer" className={cn('flex items-center px-6 pb-6', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
