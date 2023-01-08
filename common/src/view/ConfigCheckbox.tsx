import { Action } from "hyperapp";
import { Config } from "../model/config";

export function ConfigCheckbox<S>({
  config,
  configKey,
  label,
  Unlock,
  UpdateConfig,
}: {
  config: Config;
  configKey: string;
  label: string;
  Unlock?: Action<S>;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  return (
    <label class="select-none" onclick={Unlock}>
      {Unlock ? (
        "🔒"
      ) : (
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 mr-1"
          checked={config[configKey] === true}
          oninput={[UpdateConfig, { [configKey]: !config[configKey] }]}
        />
      )}{" "}
      {label}
    </label>
  );
}
