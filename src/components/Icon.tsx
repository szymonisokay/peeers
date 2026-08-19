import type { SvgProps } from 'react-native-svg';

import ChevronLewo from '@/assets/icons/chevron-lewo.svg';
import ChevronPrawo from '@/assets/icons/chevron-prawo.svg';
import Informacja from '@/assets/icons/informacja.svg';
import ListaKontrolna from '@/assets/icons/lista-kontrolna.svg';
import MinusWKole from '@/assets/icons/minus-w-kole.svg';
import Notatka from '@/assets/icons/notatka.svg';
import OdhaczoneCienkie from '@/assets/icons/odhaczone-cienkie.svg';
import OdhaczoneGrube from '@/assets/icons/odhaczone-grube.svg';
import Ostrzezenie from '@/assets/icons/ostrzezenie.svg';
import Plus from '@/assets/icons/plus.svg';
import PociagnijWDol from '@/assets/icons/pociagnij-w-dol.svg';
import PrzestrzenHome from '@/assets/icons/przestrzen-home.svg';
import Przypnij from '@/assets/icons/przypnij.svg';
import StrzalkaDol from '@/assets/icons/strzalka-dol.svg';
import StrzalkaWGore from '@/assets/icons/strzalka-w-gore.svg';
import Szukaj from '@/assets/icons/szukaj.svg';
import Tarcza from '@/assets/icons/tarcza.svg';
import TyOsoba from '@/assets/icons/ty-osoba.svg';
import Wiecej from '@/assets/icons/wiecej.svg';
import ZakupyKoszyk from '@/assets/icons/zakupy-koszyk.svg';
import Zamknij from '@/assets/icons/zamknij.svg';
import Zegar from '@/assets/icons/zegar.svg';

/**
 * Every icon in assets/icons/, keyed by file name.
 *
 * Imports are static on purpose: Metro cannot bundle a path built at runtime,
 * so a dynamic `require(...)` here would fail at load time rather than at build.
 */
const ICONS = {
  'chevron-lewo': ChevronLewo,
  'chevron-prawo': ChevronPrawo,
  informacja: Informacja,
  'lista-kontrolna': ListaKontrolna,
  'minus-w-kole': MinusWKole,
  notatka: Notatka,
  'odhaczone-cienkie': OdhaczoneCienkie,
  'odhaczone-grube': OdhaczoneGrube,
  ostrzezenie: Ostrzezenie,
  plus: Plus,
  'pociagnij-w-dol': PociagnijWDol,
  'przestrzen-home': PrzestrzenHome,
  przypnij: Przypnij,
  'strzalka-dol': StrzalkaDol,
  'strzalka-w-gore': StrzalkaWGore,
  szukaj: Szukaj,
  tarcza: Tarcza,
  'ty-osoba': TyOsoba,
  wiecej: Wiecej,
  'zakupy-koszyk': ZakupyKoszyk,
  zamknij: Zamknij,
  zegar: Zegar,
} as const satisfies Record<string, React.FC<SvgProps>>;

export type IconName = keyof typeof ICONS;

export const iconNames = Object.keys(ICONS) as IconName[];

type IconProps = {
  name: IconName;
  /** Width and height in points. Icons are drawn on a 24x24 grid. */
  size?: number;
  /** Resolves the `currentColor` used by every icon's stroke and fill. */
  color: string;
};

export function Icon({ name, size = 24, color }: IconProps) {
  const Svg = ICONS[name];

  return <Svg width={size} height={size} color={color} />;
}
