import { ConfigAccess } from "../hooks/UseConfig";
import { FunctionComponent, h } from "preact";

export const ConfigCheckbox: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  label: string;
}> = ({ config, configKey, label }) => {
  return (
    <label style={{ display: "block", padding: "2px 0" }}>
      <input
        type="checkbox"
        className="browser-style"
        checked={config.value?.[configKey] === true}
        onInput={() => {
          config.update({ [configKey]: !config.value?.[configKey] });
        }}
      />{" "}
      {label}
    </label>
  );
};
