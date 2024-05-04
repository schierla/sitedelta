import { Action } from "hyperapp";
import { Config } from "../model/config";
import { t } from "@sitedelta/common/src/view/helpers";

const timeUnits = [10080, 1440, 60, 1];
export function chooseTimeUnit(value: number) {
  return timeUnits.filter(unit => Math.round(value / unit) * unit == value)[0] ?? 1
}

export function ConfigFrequency<S>({
  config,
  configKey,
  label,
  timeUnit, 
  UpdateConfig,
  UpdateTimeUnit
}: {
  config: Config;
  configKey: string;
  label: string;
  timeUnit: number | undefined,
  UpdateConfig: Action<S, Partial<Config>>;
  UpdateTimeUnit: Action<S, number>;
}) {
  return (
    <label>
      {label}
      {" "}
      <span class="whitespace-nowrap">
        <input
          type="number"
          size={6}
          class="py-0 px-1 border-gray-300  dark:bg-slate-800 dark:text-slate-200 dark:border-gray-600"
          value={config[configKey] / (timeUnit ?? 1)}
          oninput={(_, e) => [
            UpdateConfig,
            {
              [configKey]: parseFloat((e.target as HTMLInputElement).value) * (timeUnit ?? 1),
            },
          ]}
        />
        <select class="py-0 px-1 border-gray-300  dark:bg-slate-800 dark:text-slate-200 dark:border-gray-600" onchange={(_, e) => [UpdateTimeUnit, (e.target as HTMLSelectElement).value]}>
          {timeUnits.map(u => <option value={u} selected={(timeUnit ?? 1) == u}>{t("configTimeUnit" + u)}</option>)}
        </select>
      </span>
    </label>
  );
}
