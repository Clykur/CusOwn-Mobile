// src/hooks/useOptimisticMutation.ts

import {
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

type OptimisticMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
>;

export function useOptimisticMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: OptimisticMutationOptions<
    TData,
    TError,
    TVariables,
    TContext
  >
) {
  return useMutation<
    TData,
    TError,
    TVariables,
    TContext
  >(options);
}