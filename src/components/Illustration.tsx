import type { SvgProps } from 'react-native-svg';

import PustaListaDark from '@/assets/illustrations/pusta-lista-dark.svg';
import PustaLista from '@/assets/illustrations/pusta-lista.svg';
import { useTheme } from '@/hooks';

/**
 * Empty-state illustrations, one pair per name.
 *
 * Unlike icons, illustrations carry their own colours rather than
 * `currentColor`, so each needs a light and a dark file. The dark variants are
 * derived from the light ones by mirroring each stroke's lightness around the
 * surface token — see docs/DESIGN.md.
 */
const ILLUSTRATIONS = {
  'pusta-lista': { light: PustaLista, dark: PustaListaDark, width: 152, height: 112 },
} as const satisfies Record<
  string,
  { light: React.FC<SvgProps>; dark: React.FC<SvgProps>; width: number; height: number }
>;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

type IllustrationProps = {
  name: IllustrationName;
  /** Scales the artwork, keeping its aspect ratio. Defaults to its natural size. */
  scale?: number;
};

export function Illustration({ name, scale = 1 }: IllustrationProps) {
  const { scheme } = useTheme();
  const { width, height, ...variants } = ILLUSTRATIONS[name];
  const Art = variants[scheme];

  return <Art width={width * scale} height={height * scale} />;
}
