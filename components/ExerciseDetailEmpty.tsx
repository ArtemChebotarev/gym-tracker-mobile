// The Exercise screen's empty state — a line plus a caption in a card, with nothing to press (08.6,
// "Пустое состояние"; canvas 4.8). Not the Design SDK's EmptyState, which always renders an action
// ("EmptyState всегда рендерит действие") and would have to invent one here.
//
// One look on both tabs: on Overview it takes the tiles' place, so the sections under it keep
// theirs; on History it is the whole tab — with no set ever logged, or when the only sets are of a
// workout still in progress.
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
    <View testID="exercise-detail-empty" style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
