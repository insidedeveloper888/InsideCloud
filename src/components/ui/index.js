/**
 * UI Components Barrel Export
 * Import all shared components from this file.
 *
 * Usage:
 * import { Button, Card, MemberSelect } from '@/components/ui';
 * // or
 * import { Button, MemberSelect } from 'src/components/ui';
 */

// Existing shadcn components
export { Button, buttonVariants } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// Custom shared components
export { MemberSelect } from './member-select';
export { Pagination } from './pagination';
export { ConfirmDialog } from './confirm-dialog';

// Planned components (uncomment when created)
// export { FormField } from './form-field';
// export { SearchableSelect } from './searchable-select';
// export { StatusBadge } from './status-badge';
