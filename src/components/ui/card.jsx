import * as React from "react";

import { cn } from "../../lib/utils";

/**
 * Card Component
 *
 * Container component for grouped content
 */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-neutral-200 bg-white shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

/**
 * CardHeader Component
 *
 * Header section of a card
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle Component
 *
 * Title within card header
 */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription Component
 *
 * Description text within card header
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-neutral-600", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent Component
 *
 * Main content area of a card
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter Component
 *
 * Footer section of a card
 */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
