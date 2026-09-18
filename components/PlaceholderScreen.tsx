// PlaceholderScreen — a pushed screen that exists only so a link has somewhere to go before the
// real screen is designed (task 098: exercise history and mesocycle detail). An `EmptyState`
// saying what will show up here, with `Go back` as its action; the real screens replace it once
// they're designed per 06 · History & Analytics and 08 · Screens & Navigation.

import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@design/components/EmptyState';

import { styles } from './PlaceholderScreenStyles';

export type PlaceholderScreenProps = {
  title: string;
  description: string;
  onBack: () => void;
};

export function PlaceholderScreen({ title, description, onBack }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title={title} description={description} actionLabel="Go back" onAction={onBack} />
    </SafeAreaView>
  );
}
