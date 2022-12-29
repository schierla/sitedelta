import { ConfigAccess } from "../hooks/UseConfig";
import { FunctionComponent, h } from "preact";

export const ConfigCheckbox: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  label: string;
}> = ({ config, configKey, label }) => {
  return (
    <label class="select-none">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
        checked={config.value?.[configKey] === true}
        onInput={() => {
          config.update({ [configKey]: !config.value?.[configKey] });
        }}
      />{" "}
      {label}
    </label>
  );
};
