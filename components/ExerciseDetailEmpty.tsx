// The Exercise screen's empty state — a line plus a caption, with nothing to press (08.6,
// "Пустое состояние"). Not the Design SDK's EmptyState, which always renders an action
// ("EmptyState всегда рендерит действие") and would have to invent one here.
//
// Two looks. `framed` is Overview's (GT-195, canvas 4.8): a card in the place the tiles take once
// something is logged, so the sections under it keep their places. Unframed and centered is
// History's, where the line is the whole tab — with no set ever logged, or when the only sets are
// of a workout still in progress.
//
// JSX/rendering only — styles live in ExerciseDetailEmptyStyles.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { styles } from './ExerciseDetailEmptyStyles';

export type ExerciseDetailEmptyProps = {
  title: string;
  description: string;
  framed?: boolean;
};

export function ExerciseDetailEmpty({
  title,
  description,
  framed = false,
}: ExerciseDetailEmptyProps) {
  return (
    <View testID="exercise-detail-empty" style={framed ? styles.framed : styles.empty}>
      <Text style={[styles.title, framed && styles.framedTitle]}>{title}</Text>
      <Text style={[styles.description, framed && styles.framedDescription]}>{description}</Text>
    </View>
  );
}
