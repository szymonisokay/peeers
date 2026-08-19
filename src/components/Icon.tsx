import type { SvgProps } from 'react-native-svg';

import ArrowUp from '@/assets/icons/arrow-up.svg';
import Basket from '@/assets/icons/basket.svg';
import CheckBold from '@/assets/icons/check-bold.svg';
import Check from '@/assets/icons/check.svg';
import Checklist from '@/assets/icons/checklist.svg';
import ChevronDown from '@/assets/icons/chevron-down.svg';
import ChevronLeft from '@/assets/icons/chevron-left.svg';
import ChevronRight from '@/assets/icons/chevron-right.svg';
import Clock from '@/assets/icons/clock.svg';
import Close from '@/assets/icons/close.svg';
import Home from '@/assets/icons/home.svg';
import Info from '@/assets/icons/info.svg';
import MinusCircle from '@/assets/icons/minus-circle.svg';
import More from '@/assets/icons/more.svg';
import Note from '@/assets/icons/note.svg';
import Person from '@/assets/icons/person.svg';
import Pin from '@/assets/icons/pin.svg';
import Plus from '@/assets/icons/plus.svg';
import PullDown from '@/assets/icons/pull-down.svg';
import Search from '@/assets/icons/search.svg';
import Shield from '@/assets/icons/shield.svg';
import Warning from '@/assets/icons/warning.svg';

/**
 * Every icon in assets/icons/, keyed by file name.
 *
 * Imports are static on purpose: Metro cannot bundle a path built at runtime,
 * so a dynamic `require(...)` here would fail at load time rather than at build.
 */
const ICONS = {
  'arrow-up': ArrowUp,
  basket: Basket,
  check: Check,
  'check-bold': CheckBold,
  checklist: Checklist,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  close: Close,
  home: Home,
  info: Info,
  'minus-circle': MinusCircle,
  more: More,
  note: Note,
  person: Person,
  pin: Pin,
  plus: Plus,
  'pull-down': PullDown,
  search: Search,
  shield: Shield,
  warning: Warning,
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
