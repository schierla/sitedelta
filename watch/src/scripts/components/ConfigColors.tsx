import { FunctionComponent, Fragment, h } from "preact";
import { t } from "../hooks/UseTranslation";
import { ConfigAccess } from "../hooks/UseConfig";
import "./ConfigColors.css";

function hexColor(color: string | undefined): string {
  if (color === undefined) return "white";
  if (color.length == 4)
    return (
      color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
    );
  else return color;
}

export const ConfigColors: FunctionComponent<{
  config: ConfigAccess;
  background?: string;
  border: string;
  label: string;
}> = ({ config, background, border, label }) => (
  <label class="configcolors">
    {background !== undefined && (
      <input
        type="color"
        value={hexColor(config.value?.[background])}
        onInput={(e: Event) =>
          config.update({
            [background]: (e.target as HTMLInputElement).value,
          })
        }
        title={t("configBackground")}
      />
    )}
    <input
      type="color"
      value={hexColor(config.value?.[border])}
      onInput={(e: Event) =>
        config.update({ [border]: (e.target as HTMLInputElement).value })
      }
      title={t("configBorder")}
    />
    <span
      style={{
        background: background && config.value?.[background],
        border: `dotted ${config.value?.[border]} 2px`,
        padding: "2px 4px",
      }}
    >
      {label}
    </span>
  </label>
);
