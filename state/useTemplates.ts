// Reads every template for Flow B's step T (08.10, "Шаг T"; GT-6) through the usecase layer via
// TanStack Query. Same shape as useMesocycles.ts.

import { useQuery } from '@tanstack/react-query';

import { listAllTemplates } from '@usecases/templateLibrary';

import { useTemplateLibraryDeps } from './mesocycleStore';

export function useTemplates() {
  const deps = useTemplateLibraryDeps();

  return useQuery({
    queryKey: ['templates'],
    queryFn: () => listAllTemplates(deps),
  });
}
