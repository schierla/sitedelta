import { t } from "./helpers";
import { Action, Dispatchable } from "hyperapp";
import { Button } from "./Button";
import { Config } from "../model/config";

function regionAddHandler<S>(
  regions: string[],
  configKey: string,
  UpdateConfig: Action<S, Partial<Config>>
) {
  return (region?: string) => {
    if (region && regions.indexOf(region) === -1)
      return [
        UpdateConfig,
        {
          [configKey]: [...regions, region],
        },
      ];
    else return (state: S) => state;
  };
}


function regionEditHandler<S>(
  regions: string[],
  index: number,
  configKey: string,
  UpdateConfig: Action<S, Partial<Config>>
) {
  return (region?: string) => {
    if (region)
      return [
        UpdateConfig,
        {
          [configKey]: [
            ...regions.slice(0, index),
            region,
            ...regions.slice(index + 1),
          ],
        },
      ];
    else return (state: S) => state;
  };
}
export function ConfigRegionList<S>({
  config,
  configKey,
  selectedRegions,
  SelectRegions,
  PickRegion,
  EditRegion,
  UpdateConfig,
}: {
  config: Config;
  configKey: string;
  selectedRegions: string[] | undefined;
  SelectRegions: Action<S, string[] | undefined>;
  PickRegion: Action<S, (region?: string) => Dispatchable<S>>;
  EditRegion: Action<
    S,
    { region: string; callback: (region?: string) => Dispatchable<S> }
  >;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  const regions: string[] = config[configKey] ?? [];
  return [
    <select
      size={3}
      multiple
      class="p-0 border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 max-w-sm"
      onchange={(_, e: Event) => [
        SelectRegions,
        Array.from((e.target as HTMLSelectElement).selectedOptions).map(
          (o) => o.value
        ),
      ]}
    >
      {regions.map((region, index) => (
        <option
          value={region}
          title={region}
          selected={selectedRegions && selectedRegions?.indexOf(region) !== -1}
          ondblclick={[
            EditRegion,
            {
              region,
              callback: regionEditHandler(
                regions,
                index,
                configKey,
                UpdateConfig
              ),
            },
          ]}
        >
          {region}
        </option>
      ))}
    </select>,
    <div class="flex flex-row gap-2 mt-1">
      <Button
        onClick={[
          PickRegion,
          regionAddHandler(regions, configKey, UpdateConfig),
        ]}
      >
        {t("configRegionsAdd")}
      </Button>
      {selectedRegions !== undefined && selectedRegions?.length > 0 && (
        <Button
          onClick={[
            UpdateConfig,
            {
              [configKey]: regions.filter(
                (r) => selectedRegions.indexOf(r) === -1
              ),
            },
          ]}
        >
          {t("configRegionsRemove")}
        </Button>
      )}
    </div>,
  ];
}
