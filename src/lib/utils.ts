// Minimal className joiner so lucide-animated icon sources (shadcn style) work unmodified.
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
