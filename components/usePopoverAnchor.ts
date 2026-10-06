// What a button needs to open a Popover that points at it (08.7.1): a ref to measure, whether the
// plate is open, and where the button sits in the window. Shared by the card's two ⓘ buttons.
//
// The plate points at the button, so opening measures it — and opens either way: a platform that
// answers nothing gets a centred plate rather than a tap that did nothing (see Popover).

import { useRef, useState } from 'react';
import type { View } from 'react-native';

import type { AnchorRect } from '@design/popoverLayout';

export function usePopoverAnchor() {
  const ref = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  function open() {
    ref.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
    setVisible(true);
  }

  // The anchor stays where it was. A Popover fades out rather than vanishing, and for that fade it
  // is still drawn: with the anchor cleared it was drawn without one — centred, no arrow — so the
  // plate visibly jumped to the middle of the screen before it was gone. The next `open` measures
  // the button again and overwrites it.
  function close() {
    setVisible(false);
  }

  return { ref, visible, anchor, open, close };
}
