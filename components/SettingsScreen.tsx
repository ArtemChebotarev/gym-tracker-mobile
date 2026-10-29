// The Settings tab (08 · Screens & Navigation, "Настройки"). For now it holds the timers (10.1 FR-5,
// FR-6; canvas 5.x): the rest between sets of strength and power exercises — on or off, and how
// long (GT-87) — the Get ready of interval rounds (GT-188), and the signals they give, sound and
// vibration, each on or off (GT-172). Laid out as canvas 5.x draws it: a
// card of rows under the section's label, a grey note under it.
//
// The rest is set with `−` / `+` in 15 s steps, or straight away in the time picker by tapping the
// value — the same pair every rest in the app is set with — between 1:00 and 5:00
// (`REST_BETWEEN_SETS_RANGE_SEC`). While the timer is off there is nothing to set, so the row is
// not shown. Get ready goes by the second, 0:00–0:10 (`GET_READY_RANGE_SEC`).

import { useState } from 'react';
import { Text, View } from 'react-native';

import { RootScreen } from '@design/components/RootScreen';
import { StepperRow } from '@design/components/StepperRow';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { Toggle } from '@design/components/Toggle';
import { formatClock } from '@design/formatClock';
import { GET_READY_RANGE_SEC, GET_READY_STEP_SEC } from '@domain/intervalTimer';
import { REST_BETWEEN_SETS_RANGE_SEC, type RestBetweenSets } from '@domain/restTimer';
import type { Signals } from '@domain/signals';
import type { LoadError } from '@state/loadError';

import { LoadErrorState } from './LoadErrorState';
import { styles } from './SettingsScreenStyles';
import { useTabBarClearance } from './useTabBarClearance';

/** What one tap of `−` / `+` moves the rest by. Picking a time in the picker goes in 5 s steps. */
const REST_STEP_SEC = 15;

/** The time picker that is open, if any. */
type OpenPicker = 'rest' | 'getReady' | null;

export type SettingsScreenProps = {
  /** Absent while they load, or when they could not be read. */
  restBetweenSets?: RestBetweenSets;
  getReadySec?: number;
  signals?: Signals;
  loadError?: LoadError;
  onChangeRestBetweenSets: (setting: RestBetweenSets) => void;
  onChangeGetReadySec: (getReadySec: number) => void;
  onChangeSignals: (signals: Signals) => void;
};

export function SettingsScreen({
  restBetweenSets,
  getReadySec,
  signals,
  loadError,
  onChangeRestBetweenSets,
  onChangeGetReadySec,
  onChangeSignals,
}: SettingsScreenProps) {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const tabBarClearance = useTabBarClearance();

  return (
    <RootScreen title="Settings">
      {loadError !== undefined && (
        <LoadErrorState loadError={loadError} bottomInset={tabBarClearance} />
      )}
      {restBetweenSets !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rest timer</Text>
          <View style={styles.card}>
            <View style={[styles.toggleRow, restBetweenSets.enabled && styles.rowDivider]}>
              <Toggle
                label="Rest timer"
                description="Starts after you log a strength or power set"
                value={restBetweenSets.enabled}
                onValueChange={(enabled) =>
                  onChangeRestBetweenSets({ ...restBetweenSets, enabled })
                }
              />
            </View>
            {restBetweenSets.enabled && (
              <StepperRow
                divider={false}
                label="Rest between sets"
                value={restBetweenSets.restSec}
                onChange={(restSec) => onChangeRestBetweenSets({ ...restBetweenSets, restSec })}
                min={REST_BETWEEN_SETS_RANGE_SEC.min}
                max={REST_BETWEEN_SETS_RANGE_SEC.max}
                step={REST_STEP_SEC}
                formatValue={formatClock}
                onValuePress={() => setOpenPicker('rest')}
              />
            )}
          </View>
          <Text style={styles.note}>
            Interval exercises rest by their own round times. The timer never changes your plan.
          </Text>
          <TimePickerSheet
            visible={openPicker === 'rest'}
            onClose={() => setOpenPicker(null)}
            title="Rest between sets"
            value={restBetweenSets.restSec}
            onChange={(restSec) => onChangeRestBetweenSets({ ...restBetweenSets, restSec })}
            minSec={REST_BETWEEN_SETS_RANGE_SEC.min}
            maxSec={REST_BETWEEN_SETS_RANGE_SEC.max}
          />
        </View>
      )}
      {getReadySec !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Interval timer</Text>
          <View style={styles.card}>
            <StepperRow
              divider={false}
              label="Get ready"
              value={getReadySec}
              onChange={onChangeGetReadySec}
              min={GET_READY_RANGE_SEC.min}
              max={GET_READY_RANGE_SEC.max}
              step={GET_READY_STEP_SEC}
              formatValue={formatClock}
              onValuePress={() => setOpenPicker('getReady')}
            />
          </View>
          <Text style={styles.note}>
            Before a round you start with a tap, and the last seconds of every rest between rounds.
          </Text>
          <TimePickerSheet
            visible={openPicker === 'getReady'}
            onClose={() => setOpenPicker(null)}
            title="Get ready"
            value={getReadySec}
            onChange={onChangeGetReadySec}
            minSec={GET_READY_RANGE_SEC.min}
            maxSec={GET_READY_RANGE_SEC.max}
            stepSec={GET_READY_STEP_SEC}
          />
        </View>
      )}
      {signals !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Signals</Text>
          <View style={styles.card}>
            <View style={[styles.toggleRow, styles.rowDivider]}>
              <Toggle
                label="Sound"
                description="End of rest, start of work and rest"
                value={signals.sound}
                onValueChange={(sound) => onChangeSignals({ ...signals, sound })}
              />
            </View>
            <View style={styles.toggleRow}>
              <Toggle
                label="Vibration"
                value={signals.vibration}
                onValueChange={(vibration) => onChangeSignals({ ...signals, vibration })}
              />
            </View>
          </View>
        </View>
      )}
    </RootScreen>
  );
}
