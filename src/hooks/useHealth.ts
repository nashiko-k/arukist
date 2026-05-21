import { useCallback } from 'react';
import type {
  AppleHealthKit as AppleHealthKitType,
  HealthInputOptions,
  HealthKitPermissions,
  HealthObserver,
  HealthValue,
} from 'react-native-health';

// react-native-health の index.js は `export const HealthKit` と `module.exports = HealthKit` を
// 併記しており、Metro/Babel の interop によっては default 経由でしか取れない場合と、モジュール
// 自身が直接 AppleHealthKit になる場合の両方が起こる。両方に耐える形で取り出す。
const RNHealth = require('react-native-health');
const AppleHealthKit: AppleHealthKitType = RNHealth?.default ?? RNHealth;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

function requestPermissions(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) {
        reject(new Error(typeof err === 'string' ? err : '権限の取得に失敗しました'));
      } else {
        resolve();
      }
    });
  });
}

function getStepsForDate(date: Date): Promise<number> {
  const options: HealthInputOptions = {
    date: date.toISOString(),
    includeManuallyAdded: true,
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(options, (err, results: HealthValue) => {
      if (err) {
        reject(new Error(typeof err === 'string' ? err : '歩数の取得に失敗しました'));
      } else {
        resolve(results?.value ?? 0);
      }
    });
  });
}

function getTodaySteps(): Promise<number> {
  return getStepsForDate(new Date());
}

export type DailySteps = {
  date: string;
  value: number;
};

function getStepsForRange(start: Date, end: Date): Promise<DailySteps[]> {
  const options: HealthInputOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    includeManuallyAdded: true,
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
      if (err) {
        reject(new Error(typeof err === 'string' ? err : '歩数範囲の取得に失敗しました'));
      } else {
        resolve(
          (results ?? []).map((r) => ({
            date: r.startDate,
            value: r.value,
          })),
        );
      }
    });
  });
}

export function getStepsForTimeRange(start: Date, end: Date): Promise<number> {
  const options: HealthInputOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    type: 'StepCount' as HealthObserver,
    includeManuallyAdded: true,
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getSamples(options, (err, results) => {
      if (err) {
        reject(new Error(typeof err === 'string' ? err : '歩数の取得に失敗しました'));
      } else {
        const total = (results ?? []).reduce((sum, r) => sum + (r.value ?? 0), 0);
        resolve(total);
      }
    });
  });
}

export function useHealth() {
  return {
    requestPermissions: useCallback(requestPermissions, []),
    getTodaySteps: useCallback(getTodaySteps, []),
    getStepsForDate: useCallback(getStepsForDate, []),
    getStepsForRange: useCallback(getStepsForRange, []),
    getStepsForTimeRange: useCallback(getStepsForTimeRange, []),
  };
}
