import { FunctionComponent, Fragment, h } from "preact";
import { t } from "../hooks/UseTranslation";
import { ConfigAccess } from "../hooks/UseConfig";

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
  <label>
    {background !== undefined && (
      <input
        type="color"
        class="mr-1 w-4 h-4"
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
      class="mr-1 w-4 h-4"
      value={hexColor(config.value?.[border])}
      onInput={(e: Event) =>
        config.update({ [border]: (e.target as HTMLInputElement).value })
      }
      title={t("configBorder")}
    />
    <span
      class="border-dotted border-2 p-1"
      style={{
        backgroundColor: background && config.value?.[background],
        borderColor: config.value?.[border]
      }}
    >
      {label}
    </span>
  </label>
);
