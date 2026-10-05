// The mesocycle editor, Flow B — from a template (04 · Meso Creation Flows, "Flow B"; 08.10 ·
// Редактор мезоцикла — Flow B, GT-6). Owns step T: the template list, the preview sheet a row
// opens, and applying the chosen template to the draft. Everything after that is the ordinary
// editor — this renders MesoEditorScreen with step T as its `leadStep`, so all four steps share one
// mounted wizard, the same way Flow C's step S does.
//
// Step T has no Continue: a template is chosen in its preview, and `Use this template` is the way
// forward (08.10). It applies the template (`useApplyTemplate`, GT-9's rules), writes the draft and
// moves the wizard on; the sheet closes without its slide, since Basics is arriving in its place.
//
// Stepping back to step T and using the same template again keeps whatever was edited on steps
// 1–2 — the draft already came from it — while a different template replaces the draft. The same
// rule as Flow C's source week (`sourceWeekKey`).
//
// JSX/state only — no styles or pure helpers of its own: the step, the list and the sheet carry them.

import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { MesoEditorScreen } from '@components/MesoEditorScreen';
import { toExerciseId } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';
import { useDraftStore } from '@state/draftStore';
import { useApplyTemplate } from '@state/useApplyTemplate';
import { useConfirmTemplateDraft } from '@state/useConfirmTemplateDraft';
import { useExercisesByIds } from '@state/useExercisesByIds';
import { useTemplates } from '@state/useTemplates';

import { MesoTemplateStep } from './MesoTemplateStep';
import { TemplatePreviewSheet } from './TemplatePreviewSheet';

/** The template whose preview is up, and how its sheet closes — see the note above. */
type Preview = { template: MesoTemplate; visible: boolean; animated: boolean };

export function MesoTemplateEditorScreen() {
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
  const confirmTemplateDraft = useConfirmTemplateDraft();
  const applyTemplate = useApplyTemplate();
  const templatesQuery = useTemplates();

  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const previewExerciseIds = useMemo(
    () =>
      (preview?.template.weekPlan.days ?? []).flatMap((day) =>
        day.exercises.map((exercise) => toExerciseId(exercise.exerciseId)),
      ),
    [preview?.template],
  );
  const previewExercisesQuery = useExercisesByIds(previewExerciseIds);
  const previewExercises = useMemo(
    () => Object.values(previewExercisesQuery.data ?? {}),
    [previewExercisesQuery.data],
  );

  function handleUseTemplate(template: MesoTemplate, next: () => void) {
    const handOff = () => {
      setPreview({ template, visible: false, animated: false });
      next();
    };
    if (template.id === appliedTemplateId) {
      handOff();
      return;
    }
    applyTemplate.mutate(template.id, {
      onSuccess: (draft) => {
        setDraft(draft);
        setAppliedTemplateId(template.id);
        handOff();
      },
      onError: () => {
        Alert.alert("Couldn't use this template", 'Something went wrong. Try again.');
      },
    });
  }

  return (
    <MesoEditorScreen
      title="New training cycle"
      saveMutation={confirmTemplateDraft}
      leadStep={{
        title: 'Choose a template',
        numbered: true,
        content: (next) => (
          <>
            <MesoTemplateStep
              templates={templatesQuery.data ?? []}
              search={search}
              onSearchChange={setSearch}
              onSelectTemplate={(template) =>
                setPreview({ template, visible: true, animated: true })
              }
            />
            {preview !== null && (
              <TemplatePreviewSheet
                visible={preview.visible}
                animated={preview.animated}
                onClose={() => setPreview({ ...preview, visible: false, animated: true })}
                template={preview.template}
                exercises={previewExercises}
                onUseTemplate={(template) => handleUseTemplate(template, next)}
              />
            )}
          </>
        ),
      }}
    />
  );
}
