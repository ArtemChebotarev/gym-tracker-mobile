// The frame every exercise card on the workout screen shares, whatever its type — 08.7 ·
// Тренировка, "Карточка упражнения"; 10.1 FR-14. The chip above the card (the muscle group, or the
// type for a power, interval or mobility card), the outlined card itself — dimmed when the exercise
// is skipped or abandoned — and its title row: the name, the equipment line, the type's badges, the
// history button and, in live mode, `⋯`. The name links to the exercise's Overview (GT-178). Under the title the type's card puts its own content; the
// frame closes with the `Not programmed yet` plate in preview, or the one `Skipped` / `Abandoned`
// line of an exercise closed with nothing logged.
//
// What shows is `exerciseCardView`'s call (WorkoutExerciseCardLogic.ts); the frame draws it and
// knows nothing about sets, rounds or RIR.

import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { IconButton } from '@design/components/IconButton';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { InfoIcon } from '@design/icons/InfoIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { ExerciseType, MuscleGroup } from '@domain/catalog';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { styles } from './ExerciseCardFrameStyles';
import type { CardChip, ExerciseCardView } from './WorkoutExerciseCardLogic';

export type ExerciseCardFrameProps = {
  exercise: Pick<WorkoutExercise, 'sessionExerciseId' | 'name'>;
  view: Pick<ExerciseCardView, 'showMenu' | 'isNotDone' | 'showNotProgrammed' | 'notDoneNote'>;
  /** The line under the name — each type words its equipment its own way. */
  equipmentLabel?: string;
  /** The chip above the card — see `cardChip`. */
  chip?: CardChip;
  /** The `⋯` menu's key — see `WorkoutExerciseCardProps.position`. */
  position: number;
  /** The type's badges, between the title and the history button (`N RIR`, `Deload`). */
  badges?: ReactNode;
  onOpenHistory: () => void;
  /** The name is a link to the exercise's own screen, on Overview (GT-178). */
  onOpenOverview: () => void;
  menuItems: ActionMenuItem[];
  /** The `⋯` sheet's subtitle — each type counts its own rows (`2 sets planned · 1 logged`). */
  menuSubtitle: string;
  /** The type's own content, under the title row. */
  children?: ReactNode;
  /** Drawn after the card, outside it — the popovers its ⓘ buttons open. */
  overlays?: ReactNode;
};

export function ExerciseCardFrame({
  exercise,
  view,
  equipmentLabel,
  chip,
  position,
  badges,
  onOpenHistory,
  onOpenOverview,
  menuItems,
  menuSubtitle,
  children,
  overlays,
}: ExerciseCardFrameProps) {
  return (
    <View style={styles.root}>
      {chip?.kind === 'group' && <GroupChip muscleGroup={chip.muscleGroup} />}
      {chip?.kind === 'type' && <TypeChip type={chip.type} />}
      <View
        testID={`exercise-card-${exercise.sessionExerciseId}`}
        style={[styles.card, view.isNotDone && styles.skipped]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            {/* Only the name is the link, marked by an accent `›` — the chevron the app's other
                links to a screen carry — so the equipment line under it stays plain text
                (GT-178). */}
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${exercise.name} details`}
              onPress={onOpenOverview}
              style={({ pressed }) => [styles.nameLink, pressed && styles.pressed]}
            >
              <Text style={[styles.name, styles.nameText]}>{exercise.name}</Text>
              <Text style={[styles.name, styles.nameChevron]}>{' ›'}</Text>
            </Pressable>
            {equipmentLabel !== undefined && (
              <Text style={styles.equipment}>{equipmentLabel}</Text>
            )}
          </View>
          <View style={styles.titleActions}>
            {badges}
            <IconButton accessibilityLabel={`${exercise.name} history`} onPress={onOpenHistory}>
              <HistoryIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
            </IconButton>
            {view.showMenu && (
              <ActionMenu
                key={`menu-${position}`}
                testID={`exercise-menu-${exercise.sessionExerciseId}`}
                accessibilityLabel={`${exercise.name} menu`}
                title={exercise.name}
                subtitle={menuSubtitle}
                items={menuItems}
              />
            )}
          </View>
        </View>

        {children}

        {view.showNotProgrammed && (
          <View style={styles.notProgrammed}>
            <InfoIcon size={ICON_SIZES['icon/inline']} color={COLORS['text/muted']} />
            <Text style={styles.notProgrammedText}>Not programmed yet</Text>
          </View>
        )}
        {view.notDoneNote !== undefined && (
          <Text style={styles.skippedNote}>{view.notDoneNote}</Text>
        )}
      </View>
      {overlays}
    </View>
  );
}

// Resolved once, outside any render: a component picked by a function call inside one is a new
// component every time it renders.
const TYPE_CHIP_ICONS: Record<ExerciseType, IconComponent> = {
  strength: getExerciseTypeIcon('strength'),
  power: getExerciseTypeIcon('power'),
  interval: getExerciseTypeIcon('interval'),
  mobility: getExerciseTypeIcon('mobility'),
};

/** The type chip of a power, interval or mobility card (10.1 FR-14): its mark and its name. */
function TypeChip({ type }: { type: ExerciseType }) {
  const Icon = TYPE_CHIP_ICONS[type];

  return (
    <View testID="exercise-type-chip" style={[styles.groupChip, styles.typeChip]}>
      <Icon size={ICON_SIZES['icon/small']} color={COLORS['text/secondary']} />
      <Text style={[styles.groupLabel, styles.typeLabel]}>{getExerciseTypeLabel(type)}</Text>
    </View>
  );
}

function GroupChip({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <View
      testID="exercise-group-chip"
      style={[styles.groupChip, { backgroundColor: colors.tint ?? COLORS['surface/card'] }]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.groupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.groupLabel, { color: colors.text ?? COLORS['text/secondary'] }]}>
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </View>
  );
}
