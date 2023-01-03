import { h } from "../hooks/h";
import { Action } from "hyperapp";
import { Config } from "@sitedelta/common/src/scripts/config";

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
  return h(
    <label>
      <input
        type="number"
        size={6}
        class="py-0 px-1 dark:bg-slate-800 dark:text-slate-200"
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
