// Template preview sheet — 08.10 · Редактор мезоцикла — Flow B, "Лист превью шаблона". Opened by a
// row of the template list: the template's title and line under it, `Day 1…N` tabs, and each day's
// slots with the muscle group up front and the suggested exercise under it — the reverse of the
// editor, where the exercise leads (08.10, "Иерархия перевёрнута").
//
// No chips for days or length: the days are in the title, and a template has no length (02).
//
// Fixed height, so moving from one template to the next doesn't make the sheet jump: the days
// scroll inside it, and `Use this template` spans the footer, as 08.10's mockup draws them.
//
// Presentational: what `Use this template` does comes in as `onUseTemplate` — applying the template
// and moving the wizard on are the host's (GT-6). The day picked is the sheet's own state, and goes
// back to Day 1 whenever a different template is shown.
//
// JSX only — styles live in TemplatePreviewSheetStyles.ts and pure helpers in
// TemplatePreviewSheetLogic.ts, per AGENTS.md's "Code organization".

import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import type { Exercise } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';

import { DayTabs } from './DayTabs';
import { formatTemplateSubtitle, formatTemplateTitle } from './templateLabels';
import { buildPreviewRows, templateDayNumbers } from './TemplatePreviewSheetLogic';
import { styles } from './TemplatePreviewSheetStyles';

export type TemplatePreviewSheetProps = {
  visible: boolean;
  onClose: () => void;
  template: MesoTemplate;
  /** The library — at least every exercise the template suggests; each row's group is read here. */
  exercises: readonly Exercise[];
  onUseTemplate: (template: MesoTemplate) => void;
};

export function TemplatePreviewSheet({
  visible,
  onClose,
  template,
  exercises,
  onUseTemplate,
}: TemplatePreviewSheetProps) {
  const dayNumbers = useMemo(() => templateDayNumbers(template), [template]);
  const [picked, setPicked] = useState<{ templateId: string; day: number } | null>(null);
  const activeDay = picked?.templateId === template.id ? picked.day : (dayNumbers[0] ?? 1);
  const rows = useMemo(
    () => buildPreviewRows(template, activeDay, exercises),
    [template, activeDay, exercises],
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={formatTemplateTitle(template)}
      subtitle={formatTemplateSubtitle(template)}
      height="fixed"
      footer={
        <View style={styles.footerButton}>
          <Button label="Use this template" onPress={() => onUseTemplate(template)} />
        </View>
      }
    >
      <DayTabs
        dayNumbers={dayNumbers}
        activeDay={activeDay}
        onChangeDay={(day) => setPicked({ templateId: template.id, day })}
        contentContainerStyle={styles.tabsContent}
      />
      {rows.map((row, index) => (
        <View key={row.key} style={[styles.row, index === rows.length - 1 && styles.lastRow]}>
          <Text style={styles.number}>{row.number}</Text>
          <View
            style={[styles.dot, row.dotColor !== undefined && { backgroundColor: row.dotColor }]}
          />
          <View style={styles.main}>
            <Text style={styles.group}>{row.muscleGroup}</Text>
            <Text style={styles.exercise} numberOfLines={1}>
              {row.exerciseName}
            </Text>
          </View>
          <Text style={styles.sets}>{row.sets}</Text>
        </View>
      ))}
    </BottomSheet>
  );
}
