/**
 * Operation Saga — Solaris World-Class (#27)
 *
 * Multi-step transactions with automatic rollback.
 * Either ALL steps succeed or ALL are rolled back.
 * No more half-created entities.
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'

interface SagaStep<T = unknown> {
  name: string
  execute: (context: Record<string, unknown>) => Promise<T>
  compensate: (context: Record<string, unknown>) => Promise<void>
}

export async function runSaga(
  sagaName: string,
  steps: SagaStep[],
  initialContext: Record<string, unknown> = {}
): Promise<Result<Record<string, unknown>>> {
  const context = { ...initialContext }
  const completedSteps: SagaStep[] = []

  for (const step of steps) {
    try {
      logger.info(`Saga ${sagaName}: executing ${step.name}`)
      const result = await step.execute(context)
      context[step.name] = result
      completedSteps.push(step)
    } catch (error) {
      // Step failed — compensate all completed steps in reverse
      logger.error(`Saga ${sagaName}: ${step.name} failed, compensating`, {
        error: error instanceof Error ? error.message : 'Unknown',
        completedSteps: completedSteps.map((s) => s.name),
      })

      for (const completed of completedSteps.reverse()) {
        try {
          logger.info(`Saga ${sagaName}: compensating ${completed.name}`)
          await completed.compensate(context)
        } catch (compError) {
          // Compensation failed — critical, needs human attention
          logger.error(`Saga ${sagaName}: COMPENSATION FAILED for ${completed.name}`, {
            error: compError instanceof Error ? compError.message : 'Unknown',
          })
        }
      }

      return fail(
        `${sagaName} failed at step "${step.name}": ${error instanceof Error ? error.message : 'Unknown'}`,
        'INTERNAL_ERROR'
      )
    }
  }

  logger.info(`Saga ${sagaName}: completed successfully`, {
    steps: completedSteps.map((s) => s.name),
  })

  return ok(context)
}
