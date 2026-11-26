// Reads and changes the unit new cycles start in (GT-269) through the usecase layer via TanStack
// Query. The Settings tab sets it; the cycle editor reads it to preselect a new cycle's unit. Nothing
// else re-reads on a change: no existing block, and so no workout, moves with it.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { WeightUnit } from '@domain/weightUnit';
import { readDefaultWeightUnit, setDefaultWeightUnit } from '@usecases/weightUnitSetting';

import { useRepositories } from './repositories';

const WEIGHT_UNIT_QUERY_KEY = ['defaultWeightUnit'];

export function useDefaultWeightUnit() {
  const { settingsRepo } = useRepositories();

  return useQuery({
    queryKey: WEIGHT_UNIT_QUERY_KEY,
    queryFn: () => readDefaultWeightUnit({ settingsRepo }),
  });
}

/** Changes the setting, shown at once and put back if the write fails. */
export function useSetDefaultWeightUnit() {
  const queryClient = useQueryClient();
  const { settingsRepo } = useRepositories();

  return useMutation({
    meta: { operation: 'setDefaultWeightUnit' },
    mutationFn: (weightUnit: WeightUnit) => setDefaultWeightUnit(weightUnit, { settingsRepo }),
    onMutate: (weightUnit) => queryClient.setQueryData(WEIGHT_UNIT_QUERY_KEY, weightUnit),
    onSuccess: (weightUnit) => queryClient.setQueryData(WEIGHT_UNIT_QUERY_KEY, weightUnit),
    onError: () => queryClient.invalidateQueries({ queryKey: WEIGHT_UNIT_QUERY_KEY }),
  });
}
