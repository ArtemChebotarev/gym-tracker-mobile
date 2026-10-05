// Reads which first-run windows were already closed (08.11 · Onboarding, GT-36) through the
// usecase layer via TanStack Query. The query is the only copy of the flags in the UI: a window
// asks it whether to show, and closing one writes through `useMarkOnboardingSeen`.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OnboardingFlag } from '@repositories/settings';
import { markOnboardingSeen, readOnboardingFlags } from '@usecases/onboarding';

import { useOnboardingDeps } from './mesocycleStore';

const ONBOARDING_QUERY_KEY = ['onboarding'];

export function useOnboardingFlags() {
  const deps = useOnboardingDeps();

  return useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: () => readOnboardingFlags(deps),
  });
}

export function useMarkOnboardingSeen() {
  const queryClient = useQueryClient();
  const deps = useOnboardingDeps();

  return useMutation({
    meta: { operation: 'markOnboardingSeen' },
    mutationFn: (flag: OnboardingFlag) => markOnboardingSeen(flag, deps),
    onSuccess: (flags) => queryClient.setQueryData(ONBOARDING_QUERY_KEY, flags),
  });
}
