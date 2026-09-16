/**
 * Local debounce — based on the lodash debounce implementation.
 * Used instead of importing from lodash to avoid @types/lodash dependency.
 */

interface DebouncedFunc<T extends (...args: any[]) => any> {

  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 0,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {},
): DebouncedFunc<T> {
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let result: ReturnType<T> | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;
  const maxing = 'maxWait' in options;
  const maxWait = maxing ? Math.max(Number(options.maxWait) || 0, wait) : 0;

  function now() {
    return Date.now();
  }

  function invokeFunc(time: number) {
    const args = lastArgs!;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;

    result = (func as any).apply(thisArg, args);
    return result;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      lastCallTime === undefined
      || timeSinceLastCall >= wait
      || timeSinceLastCall < 0
      || (maxing && timeSinceLastInvoke >= maxWait)
    );
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }

  function trailingEdge(time: number) {
    timerId = undefined;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function timerExpired(): ReturnType<T> | undefined {
    const time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
    return undefined;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced(this: unknown, ...args: Parameters<T>) {
    const time = now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    // eslint-disable-next-line ts/no-this-alias
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced as DebouncedFunc<T>;
}
