import { t } from "./helpers";
import { Action } from "hyperapp";
import { Config } from "../model/config";

function hexColor(color: string | undefined): string {
  if (color === undefined) return "white";
  if (color.length == 4)
    return (
      color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    );
  else return color;
}

export function ConfigColors<S>({
  config,
  background,
  border,
  label,
  UpdateConfig,
}: {
  config: Config;
  background?: string;
  border: string;
  label: string;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  return (
    <label>
      {background !== undefined && (
        <input
          type="color"
          class="mr-1 w-4 h-4"
          value={hexColor(config[background])}
          oninput={(_, e: Event) => [
            UpdateConfig,
            { [background]: (e.target as HTMLInputElement).value },
          ]}
          title={t("configBackground")}
        />
      )}
      <input
        type="color"
        class="mr-1 w-4 h-4"
        value={hexColor(config[border])}
        oninput={(_, e) => [
          UpdateConfig,
          { [border]: (e.target as HTMLInputElement).value },
        ]}
        title={t("configBorder")}
      />
      <span
        class="border-dotted border-2 p-1"
        style={{
          backgroundColor: background && config[background],
          borderColor: config[border],
        }}
      >
        {label}
      </span>
    </label>
  );
}
