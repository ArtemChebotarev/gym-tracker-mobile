// The Settings tab (08 · Screens & Navigation, "Настройки"). For now it holds one section, the rest
// timer of strength exercises (10.1 FR-5, GT-87; canvas 5.x): on or off, and the rest between sets.
// Its look is a task of its own; this is the wiring, from SDK pieces.
//
// The rest is set with `−` / `+` in 15 s steps, or straight away in the time picker by tapping the
// value — the same pair every rest in the app is set with. While the timer is off there is nothing
// to set, so the row is not shown.

import { useState } from 'react';
import { Text, View } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { StepperRow } from '@design/components/StepperRow';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { Toggle } from '@design/components/Toggle';
import { formatClock } from '@design/formatClock';
import { STRENGTH_REST_RANGE_SEC, type StrengthRestTimer } from '@domain/restTimer';
import type { LoadError } from '@state/loadError';

import { LoadErrorState } from './LoadErrorState';
import { styles } from './SettingsScreenStyles';
import { useTabBarClearance } from './useTabBarClearance';

/** What one tap of `−` / `+` moves the rest by. Picking a time in the picker goes in 5 s steps. */
const REST_STEP_SEC = 15;

export type SettingsScreenProps = {
  /** Absent while it loads, or when it could not be read. */
  strengthRestTimer?: StrengthRestTimer;
  loadError?: LoadError;
  onChangeStrengthRestTimer: (setting: StrengthRestTimer) => void;
};

export function SettingsScreen({
  strengthRestTimer,
  loadError,
  onChangeStrengthRestTimer,
}: SettingsScreenProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const tabBarClearance = useTabBarClearance();

  return (
    <RootScreen title="Settings">
      {loadError !== undefined && (
        <LoadErrorState loadError={loadError} bottomInset={tabBarClearance} />
      )}
      {strengthRestTimer !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rest timer</Text>
          <Toggle
            label="Rest timer for strength"
            description="Starts after you log a set"
            value={strengthRestTimer.enabled}
            onValueChange={(enabled) =>
              onChangeStrengthRestTimer({ ...strengthRestTimer, enabled })
            }
          />
          {strengthRestTimer.enabled && (
            <StepperRow
              label="Rest between sets"
              value={strengthRestTimer.restSec}
              onChange={(restSec) => onChangeStrengthRestTimer({ ...strengthRestTimer, restSec })}
              min={STRENGTH_REST_RANGE_SEC.min}
              max={STRENGTH_REST_RANGE_SEC.max}
              step={REST_STEP_SEC}
              formatValue={formatClock}
              onValuePress={() => setIsPickerOpen(true)}
            />
          )}
          <Text style={styles.note}>
            Power and interval exercises use the rest set on each exercise. The timer never changes
            your plan.
          </Text>
          <TimePickerSheet
            visible={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            title="Rest between sets"
            value={strengthRestTimer.restSec}
            onChange={(restSec) => onChangeStrengthRestTimer({ ...strengthRestTimer, restSec })}
            minSec={STRENGTH_REST_RANGE_SEC.min}
            maxSec={STRENGTH_REST_RANGE_SEC.max}
          />
        </View>
      )}
    </RootScreen>
  );
}
