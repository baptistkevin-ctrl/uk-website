/**
 * Pipeline Pattern — Solaris World-Class (#20)
 *
 * Compose operations cleanly instead of deeply nested calls.
 * Each step does ONE thing — easy to test individually.
 */

export function pipe<T>(initial: T) {
  return {
    then<R>(fn: (value: T) => R) {
      return pipe(fn(initial))
    },
    value() {
      return initial
    },
  }
}

/**
 * Async pipeline for request processing.
 * Each step transforms the context and passes it to the next.
 */
export function asyncPipeline<T>(initial: T) {
  const steps: Array<(value: T) => Promise<T>> = []

  return {
    step(fn: (value: T) => Promise<T>) {
      steps.push(fn)
      return this
    },
    async run(): Promise<T> {
      let result = initial
      for (const step of steps) {
        result = await step(result)
      }
      return result
    },
  }
}
