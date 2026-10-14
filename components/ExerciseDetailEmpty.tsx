// The Exercise screen's empty state — a line plus a caption, with nothing to press (08.6,
// "Пустое состояние"). Not the Design SDK's EmptyState, which always renders an action
// ("EmptyState всегда рендерит действие") and would have to invent one here. Shared by the
// Overview/History pair when no set was ever logged, and by History alone when the only sets are
// of a workout still in progress.
//
// JSX/rendering only — styles live in ExerciseDetailEmptyStyles.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { styles } from './ExerciseDetailEmptyStyles';

export type ExerciseDetailEmptyProps = {
  title: string;
  description: string;
};

export function ExerciseDetailEmpty({ title, description }: ExerciseDetailEmptyProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
