import { FunctionComponent, h } from "preact";
import { ConfigAccess } from "../hooks/UseConfig";

export const ConfigNumber: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  label: string;
}> = ({ config, configKey, label }) => (
  <label>
    <input
      type="number"
      size={6}
      class="py-0 px-1"
      value={config.value?.[configKey]}
      onInput={(e: Event) => {
        config.update({
          [configKey]: parseFloat((e.target as HTMLInputElement).value),
        });
      }}
    />{" "}
    {label}
  </label>
);
