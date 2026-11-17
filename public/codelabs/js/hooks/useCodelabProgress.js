// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});
  const STORAGE_KEY = 'maudev_codelabs_progress_v1';

  /** @type {Record<string, any>} */
  let memoryFallbackStore = {};

  function readStore() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...memoryFallbackStore };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Ignore restricted storage exceptions
    }
    return { ...memoryFallbackStore };
  }

  /**
   * @param {Record<string, any>} nextStore
   */
  function writeStore(nextStore) {
    memoryFallbackStore = { ...nextStore };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    } catch {
      // Ignore quota/security exceptions
    }
  }

  /**
   * @param {string} codelabId
   * @param {number} totalSteps
   */
  function getCodelabProgressSnapshot(codelabId, totalSteps) {
    const safeTotal = Math.max(1, totalSteps);
    const store = readStore();
    const entry = store[codelabId];

    if (!entry) {
      return {
        id: codelabId,
        totalSteps: safeTotal,
        currentStep: 0,
        completedSteps: /** @type {number[]} */ ([]),
        hasStarted: false,
        isFinished: false,
        percent: 0,
      };
    }

    const clampedCurrent = Math.min(safeTotal - 1, Math.max(0, Number(entry.currentStep) || 0));
    const validCompleted = Array.isArray(entry.completedSteps)
      ? Array.from(
          new Set(
            entry.completedSteps
              .map((/** @type {any} */ n) => Number(n))
              .filter((/** @type {number} */ n) => Number.isInteger(n) && n >= 0 && n < safeTotal)
          )
        ).sort((a, b) => a - b)
      : [];

    const isFinished = Boolean(entry.isFinished) || validCompleted.length >= safeTotal;
    const rawRatio = isFinished
      ? 1
      : Math.max(validCompleted.length, clampedCurrent > 0 ? 1 : 0) / safeTotal;
    const percent = isFinished ? 100 : Math.min(99, Math.round(rawRatio * 100));

    return {
      id: codelabId,
      totalSteps: safeTotal,
      currentStep: clampedCurrent,
      completedSteps: validCompleted,
      hasStarted: true,
      isFinished,
      percent,
    };
  }

  /**
   * @param {string} codelabId
   * @param {number} totalSteps
   */
  function useCodelabProgress(codelabId, totalSteps) {
    const safeTotal = Math.max(1, totalSteps);
    /** @type {Set<(snapshot: any) => void>} */
    const listeners = new Set();

    const notify = () => {
      const snapshot = getCodelabProgressSnapshot(codelabId, safeTotal);
      listeners.forEach((fn) => fn(snapshot));
    };

    function ensureInitialized() {
      const store = readStore();
      if (!store[codelabId]) {
        const now = new Date().toISOString();
        store[codelabId] = {
          currentStep: 0,
          completedSteps: [],
          isFinished: false,
          startedAt: now,
          updatedAt: now,
        };
        writeStore(store);
      }
    }

    /**
     * @param {number} stepIndex
     * @param {{ markPreviousCompleted?: boolean, previousStep?: number }} [opts]
     */
    function goToStep(stepIndex, opts = {}) {
      const clampedTarget = Math.min(safeTotal - 1, Math.max(0, stepIndex));
      const store = readStore();
      const now = new Date().toISOString();
      const prev = store[codelabId] || {
        currentStep: 0,
        completedSteps: [],
        isFinished: false,
        startedAt: now,
        updatedAt: now,
      };

      const completedSet = new Set(prev.completedSteps || []);
      if (opts.markPreviousCompleted && typeof opts.previousStep === 'number') {
        if (opts.previousStep >= 0 && opts.previousStep < safeTotal) {
          completedSet.add(opts.previousStep);
        }
      }

      const completedSteps = Array.from(completedSet).sort((a, b) => a - b);
      store[codelabId] = {
        ...prev,
        currentStep: clampedTarget,
        completedSteps,
        isFinished: prev.isFinished || completedSteps.length >= safeTotal,
        updatedAt: now,
      };

      writeStore(store);
      notify();
    }

    function nextStep() {
      const current = getCodelabProgressSnapshot(codelabId, safeTotal).currentStep;
      if (current < safeTotal - 1) {
        goToStep(current + 1, { markPreviousCompleted: true, previousStep: current });
      }
    }

    function prevStep() {
      const current = getCodelabProgressSnapshot(codelabId, safeTotal).currentStep;
      if (current > 0) {
        goToStep(current - 1, { markPreviousCompleted: false });
      }
    }

    function finishCodelab() {
      const store = readStore();
      const now = new Date().toISOString();
      const prev = store[codelabId];
      const completedSet = new Set();
      for (let s = 0; s < safeTotal; s += 1) {
        completedSet.add(s);
      }

      store[codelabId] = {
        currentStep: safeTotal - 1,
        completedSteps: Array.from(completedSet).sort((a, b) => a - b),
        isFinished: true,
        startedAt: prev ? prev.startedAt : now,
        updatedAt: now,
      };

      writeStore(store);
      notify();
    }

    function resetProgress() {
      const store = readStore();
      delete store[codelabId];
      writeStore(store);
      notify();
    }

    /**
     * @param {(snapshot: any) => void} listener
     * @returns {() => void}
     */
    function subscribe(listener) {
      listeners.add(listener);
      /** @param {StorageEvent} event */
      const onStorage = (event) => {
        if (event.key === STORAGE_KEY) {
          notify();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    }

    ensureInitialized();

    return {
      getState: () => getCodelabProgressSnapshot(codelabId, safeTotal),
      goToStep,
      nextStep,
      prevStep,
      finishCodelab,
      resetProgress,
      subscribe,
    };
  }

  ns.progress = {
    getCodelabProgressSnapshot,
    useCodelabProgress,
  };
})();
