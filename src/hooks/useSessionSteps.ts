import { useEffect, useState } from 'react';
import { getStepsForTimeRange } from './useHealth';

export function useSessionSteps(startTime: number, endTime: number): number | null {
  const [steps, setSteps] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSteps(null);
    getStepsForTimeRange(new Date(startTime), new Date(endTime))
      .then((v) => { if (!cancelled) setSteps(v); })
      .catch(() => { if (!cancelled) setSteps(0); });
    return () => { cancelled = true; };
  }, [startTime, endTime]);

  return steps;
}
