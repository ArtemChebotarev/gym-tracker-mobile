// The mesocycle editor, Flow B — from a template (04 · Meso Creation Flows, "Flow B"; 08.10 ·
// Редактор мезоцикла — Flow B, GT-6). The screen itself lives in
// components/MesoTemplateEditorScreen.tsx; this route only mounts it. Both ways in — `+` →
// `From template` and the Cycles tab's empty state — land on step T.
import { MesoTemplateEditorScreen } from '@components/MesoTemplateEditorScreen';

export default function TemplateMesocycleRoute() {
  return <MesoTemplateEditorScreen />;
}
