import { Text } from './Text';

/** Uppercase grey heading above a group, e.g. "DZIŚ W PRZESTRZENI" on 03. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" tone="muted">
      {children}
    </Text>
  );
}
