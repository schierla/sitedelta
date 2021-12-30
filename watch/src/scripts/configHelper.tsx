import { Config } from "@sitedelta/common/src/scripts/config";
import * as configUtils from "@sitedelta/common/src/scripts/configUtils";
import { FunctionComponent, h, Fragment } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { t } from "./ui";

function hexColor(color: string | undefined): string {
  if (color === undefined) return "white";
  if (color.length == 4)
    return (
      color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    );
  else return color;
}

type ConfigAccess = {
  value: Config;
  update: (update: Partial<Config>) => void;
};

export const useDefaultConfig: () => ConfigAccess = () => {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    configUtils.getDefaultConfig().then(setConfig);
  }, [setConfig]);
  const update = useCallback((update) => {
    configUtils
      .setDefaultConfigProperties(update)
      .then(() => configUtils.getDefaultConfig().then(setConfig));
  }, []);
  return { value: config, update: update };
};

export const ConfigCheckbox: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  label: string;
}> = ({ config, configKey, label }) => {
  return (
    <label>
      <input
        type="checkbox"
        className="browser-style"
        checked={config.value[configKey] === true}
        onInput={() => {
          config.update({ [configKey]: !config.value[configKey] });
        }}
      />{" "}
      {label}
    </label>
  );
};

export const ConfigNumber: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  label: string;
}> = ({ config, configKey, label }) => (
  <label>
    <input
      type="number"
      size="6"
      className="browser-style"
      value={config.value[configKey]}
      onInput={(e: InputEvent) => {
        config.update({
          [configKey]: parseFloat((e.target as HTMLInputElement).value),
        });
      }}
    />{" "}
    {label}
  </label>
);

export const ConfigColors: FunctionComponent<{
  config: ConfigAccess;
  background?: string;
  border: string;
  label: string;
}> = ({ config, background, border, label }) => (
  <>
    <label>
      {background !== undefined && (
        <input
          type="color"
          value={hexColor(config.value[background])}
          onInput={(e: InputEvent) =>
            config.update({
              [background]: (e.target as HTMLInputElement).value,
            })
          }
          title={t("configBackground")}
        />
      )}
      <input
        type="color"
        value={hexColor(config.value[border])}
        onInput={(e: InputEvent) =>
          config.update({ [border]: (e.target as HTMLInputElement).value })
        }
        title={t("configBorder")}
      />
      <span
        style={{
          background: background && config.value[background],
          border: `dotted ${config.value[border]} 2px`,
          padding: "2px 4px",
        }}
      >
        {label}
      </span>
    </label>
  </>
);
