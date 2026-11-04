// The popup after Finish workout and Skip workout (GT-220; 08.11 · Onboarding, "После Finish",
// boards FinishPopup, FinishLong, FinishCycle). It replaces the read-only screen as the first thing
// seen after a day is closed, and says what the app did with it: next week's same day already has
// the progression in it. A list, not a recap screen — someone who knows the app reads it in a
// glance and taps on.
//
// Its only way out is its button (Artem, 04.11.2026): `Next workout`, `Finish cycle` on the last
// workout of the block, or `Done` when nothing comes next. A tap on the scrim and Android's back do
// nothing, as on every Dialog without `onClose`. `Next workout` stays on the read-only screen, for
// when the session is opened again later.
//
// The list shows seven exercises at most; a longer day scrolls inside it, its scroll bar flashed once
// as the popup opens so the rest is found, and the title and the button stay in view.

import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@design/components/Button';
import { Dialog } from '@design/components/Dialog';
import { PlateText } from '@design/components/PlateText';

import type { FinishAction, FinishSummary } from './FinishDialogLogic';
import { styles } from './FinishDialogStyles';

export type FinishDialogProps = {
  summary: FinishSummary | undefined;
  onAction: (action: FinishAction) => void;
};

export function FinishDialog({ summary, onAction }: FinishDialogProps) {
  return (
    <Dialog visible={summary !== undefined}>
      {summary !== undefined && <FinishBody summary={summary} onAction={onAction} />}
    </Dialog>
  );
}

function FinishBody({
  summary,
  onAction,
}: {
  summary: FinishSummary;
  onAction: (action: FinishAction) => void;
}) {
  const listRef = useRef<ScrollView>(null);
  useEffect(() => {
    listRef.current?.flashScrollIndicators();
  }, []);

  return (
    <>
      <Text style={styles.title}>{summary.title}</Text>
      <Text style={styles.subtitle}>{summary.subtitle}</Text>
      {summary.kind === 'cycle' ? (
        <View style={styles.plate}>
          <Text style={styles.body}>{summary.body}</Text>
        </View>
      ) : (
        <>
          {summary.lead !== undefined && <PlateText parts={summary.lead} style={styles.lead} />}
          <ScrollView
            ref={listRef}
            testID="finish-rows"
            style={styles.list}
            contentContainerStyle={styles.plateRows}
          >
            {summary.rows.map((row) => (
              <View key={row.key} style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.value}>{row.value}</Text>
                <Text style={styles.delta}>{row.delta ?? ''}</Text>
              </View>
            ))}
          </ScrollView>
          {summary.upNext !== undefined && (
            <Text style={styles.upNext}>
              Up next: <Text style={styles.upNextDay}>{summary.upNext}</Text>
            </Text>
          )}
        </>
      )}
      <View style={styles.button}>
        <Button label={summary.buttonLabel} onPress={() => onAction(summary.action)} />
      </View>
    </>
  );
}
