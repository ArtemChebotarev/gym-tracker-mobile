import { ArchiveIcon } from '@design/icons/ArchiveIcon';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { CheckIcon } from '@design/icons/CheckIcon';
import { CopyIcon } from '@design/icons/CopyIcon';
import { EditIcon } from '@design/icons/EditIcon';
import { GridIcon } from '@design/icons/GridIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { InfoIcon } from '@design/icons/InfoIcon';
import { MinusIcon } from '@design/icons/MinusIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { PlayIcon } from '@design/icons/PlayIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { StopIcon } from '@design/icons/StopIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabMesocyclesIcon } from '@design/icons/TabMesocyclesIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import { TrashIcon } from '@design/icons/TrashIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import { render } from '@testing-library/react-native';

const ICONS: [string, IconComponent][] = [
  ['tab-today', TabTodayIcon],
  ['tab-mesocycles', TabMesocyclesIcon],
  ['tab-library', TabLibraryIcon],
  ['check', CheckIcon],
  ['grid', GridIcon],
  ['more', MoreIcon],
  ['history', HistoryIcon],
  ['swap', SwapIcon],
  ['plus', PlusIcon],
  ['minus', MinusIcon],
  ['skip', SkipIcon],
  ['play', PlayIcon],
  ['copy', CopyIcon],
  ['archive', ArchiveIcon],
  ['trash', TrashIcon],
  ['edit', EditIcon],
  ['stop', StopIcon],
  ['info', InfoIcon],
  ['arrow-up', ArrowUpIcon],
  ['arrow-down', ArrowDownIcon],
];

describe('design/icons', () => {
  test.each(ICONS)('%s renders on the 24×24 grid at the given size', (_name, Icon) => {
    const { toJSON } = render(<Icon size={ICON_SIZES['icon/button']} color={COLORS['text/primary']} />);
    const svg = toJSON();

    expect(svg).not.toBeNull();
    expect(svg).not.toBeInstanceOf(Array);
    const props = (svg as { props: Record<string, unknown> }).props;
    expect(props.width).toBe(ICON_SIZES['icon/button']);
    expect(props.height).toBe(ICON_SIZES['icon/button']);
    expect(props.vbWidth).toBe(24);
    expect(props.vbHeight).toBe(24);
  });
});
