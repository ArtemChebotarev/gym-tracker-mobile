// EmptyState — see 08.0 · Design SDK, "Компоненты": title + line + action, meant to read as an
// invitation rather than an apology (08.0: "Приглашение, а не извинение. Без «ничего нет»") — a
// copy rule for callers. The action is required, never optional, so an EmptyState always
// renders a way forward (08.0: "EmptyState всегда рендерит действие"). Reuses Button for the
// action rather than a second button implementation.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';
import { Button } from './Button';

export type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.action}>
        <Button label={actionLabel} onPress={onAction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING['space/screen'],
    paddingVertical: SPACING['space/section'],
    gap: SPACING['space/gap-tight'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['text/disabled'],
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/disabled'],
    textAlign: 'center',
  },
  action: {
    marginTop: SPACING['space/gap'],
  },
});
