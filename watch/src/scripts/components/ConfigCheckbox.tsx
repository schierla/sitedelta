import { h } from "../hooks/h";
import { Action } from "hyperapp";
import { Config } from "@sitedelta/common/src/scripts/config";

export function ConfigCheckbox<S>({
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
    <label class="select-none">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 mr-1"
        checked={config[configKey] === true}
        oninput={[UpdateConfig, { [configKey]: !config[configKey] }]}
      />{" "}
      {label}
    </label>
  );
}
