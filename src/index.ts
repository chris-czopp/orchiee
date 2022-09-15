/* eslint @typescript-eslint/no-explicit-any: off */

enum ObservationStateType {
  calling = 'calling',
  called = 'called',
  failed = 'failed',
  notCalled = 'notCalled'
}

type ObservableType = {
  type: ObservationStateType;
  action: (...args: unknown[]) => unknown;
  isInitial: boolean;
  observables: ObservableType[];
};

type EventType = {
  observable: ObservableType;
  handler: (result: any) => void;
  hasBeenTriggered?: boolean;
};

type ActionRegistryType = {
  wrappedAction: (...args: unknown[]) => unknown;
  originalAction: (...args: unknown[]) => unknown;
  recentArgs?: unknown[];
};

const events: EventType[] = []
const actionRegistry: ActionRegistryType[] = []

const notifyListeners = (
  observationState: ObservationStateType,
  action: (...args: unknown[]) => unknown,
  result: unknown
): void => {
  events.forEach((event) => {
    if (
      event.observable.type === observationState &&
      actionRegistry.find(
        ({ wrappedAction }) => wrappedAction === event.observable.action
      )?.originalAction === action
    ) {
      if (event.observable.isInitial && event.hasBeenTriggered) {
        return
      }

      if (
        event.observable.type === ObservationStateType.notCalled &&
        event.hasBeenTriggered
      ) {
        return
      }

      event.hasBeenTriggered = true
      event.handler(result)
    }
  })
}

export const be = <T extends (...args: any[]) => any>(action: T): T => {
  const wrappedAction = (...args: unknown[]): unknown => {
    const actionRegistryEntry = actionRegistry.find(
      ({ originalAction }) => originalAction === action
    ) as ActionRegistryType

    actionRegistryEntry.recentArgs = args
    notifyListeners(ObservationStateType.notCalled, action, false)

    const actionBeingExecuted = action(...args)

    if (actionBeingExecuted instanceof Promise) {
      notifyListeners(ObservationStateType.calling, action, true)

      return actionBeingExecuted
        .then((result) => {
          notifyListeners(ObservationStateType.calling, action, false)
          notifyListeners(ObservationStateType.called, action, result)

          return result
        })
        .catch((err) => {
          notifyListeners(ObservationStateType.failed, action, err)
        })
    }

    notifyListeners(ObservationStateType.called, action, actionBeingExecuted)
  }

  actionRegistry.push({
    originalAction: action,
    wrappedAction
  })

  return (wrappedAction as unknown) as T
}

export const observe = <T>(
  observable: T,
  handler: (result: Awaited<T>) => void
): void => {
  const castedObservable = (observable as unknown) as ObservableType

  if (
    castedObservable.type === ObservationStateType.notCalled &&
    !actionRegistry.find(
      ({ wrappedAction }) => wrappedAction === castedObservable.action
    )?.recentArgs
  ) {
    handler((true as unknown) as Awaited<T>)
  }

  events.push({ observable: castedObservable, handler })

  if (castedObservable.type === ObservationStateType.called) {
    castedObservable.observables.forEach((nestedObservable) => {
      events.push({
        observable: nestedObservable,
        handler: () =>
          castedObservable.action(
            ...(actionRegistry.find(
              ({ wrappedAction }) => wrappedAction === castedObservable.action
            )?.recentArgs || [])
          )
      })
    })
  }
}

export const calling = <T extends (...args: any[]) => any>(
  action: T
): boolean => {
  return ({
    type: ObservationStateType.calling,
    action
  } as unknown) as boolean
}

export const called = <T extends (...args: any[]) => any>(
  action: T,
  ...observables: unknown[]
): ReturnType<T> => {
  return {
    type: ObservationStateType.called,
    action,
    observables
  } as ReturnType<T>
}

export const initially = {
  calling: <T extends (...args: unknown[]) => unknown>(action: T): boolean => {
    const observable = calling(action)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    observable.isInitial = true

    return observable as boolean
  },
  called: <T extends (...args: any[]) => any>(
    action: T,
    ...observables: unknown[]
  ): ReturnType<T> => {
    const observable = called(action, ...observables)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    observable.isInitial = true

    return observable as ReturnType<T>
  }
}

export const not = {
  called: <T extends (...args: unknown[]) => unknown>(action: T): boolean => {
    return ({
      type: ObservationStateType.notCalled,
      action
    } as unknown) as boolean
  }
}

export const failed = <T extends (...args: any[]) => any>(action: T): Error => {
  return ({
    type: ObservationStateType.failed,
    action
  } as unknown) as Error
}

export const cleanup = async (): Promise<void> => {
  events.length = 0

  actionRegistry.forEach((entry) => {
    delete entry.recentArgs
  })
}
