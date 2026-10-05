// Flow B's step T — Choose a template (08.10 · Редактор мезоцикла — Flow B, "Шаг T"; GT-6). The
// reusable template list (GT-7) inside the wizard's content area, padded the way the other steps
// are so the list lands where Basics' fields will.
//
// Presentational, like MesoSourceWeekStep: the templates, the search text and what a tap does all
// come from MesoTemplateEditorScreen.

import { View } from 'react-native';

import type { MesoTemplate } from '@domain/plan';

import { styles } from './MesoTemplateStepStyles';
import { TemplateList } from './TemplateList';

export type MesoTemplateStepProps = {
  templates: readonly MesoTemplate[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelectTemplate: (template: MesoTemplate) => void;
};

export function MesoTemplateStep(props: MesoTemplateStepProps) {
  return (
    <View style={styles.content}>
      <TemplateList {...props} />
    </View>
  );
}
