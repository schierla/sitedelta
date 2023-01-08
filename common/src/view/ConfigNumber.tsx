import { Action } from "hyperapp";
import { Config } from "../model/config";

export function ConfigNumber<S>({
  config,
  configKey,
  label,
  UpdateConfig,
}: {
  config: Config;
  configKey: string;
  label: string;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  return (
    <label>
      <input
        type="number"
        size={6}
        class="py-0 px-1 border-gray-300  dark:bg-slate-800 dark:text-slate-200 dark:border-gray-600"
        value={config[configKey]}
        oninput={(_, e) => [
          UpdateConfig,
          {
            [configKey]: parseFloat((e.target as HTMLInputElement).value),
          },
        ]}
      />{" "}
      {label}
    </label>
  );
}
