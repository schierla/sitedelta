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
    if (region !== undefined && region !== "" && regions.indexOf(region) === -1)
      return [UpdateConfig, addRegionUpdate(configKey, regions, region)];
    else return (state: S) => state;
  };
}

function addRegionUpdate(configKey: string, existing: string[], toAdd: string) {
  return {
    [configKey]: [...existing, toAdd],
  };
}

function deleteRegionUpdate(
  configKey: string,
  existing: string[],
  toDelete: string[]
) {
  return {
    [configKey]: existing.filter((r) => toDelete.indexOf(r) === -1),
  };
}

export function ConfigRegionList<S>({
  config,
  configKey,
  selectedRegions,
  SelectRegions,
  PickRegion,
  UpdateConfig,
}: {
  config: Config;
  configKey: string;
  selectedRegions: string[] | undefined;
  SelectRegions: Action<S, string[] | undefined>;
  PickRegion: Action<S, (region?: string) => Dispatchable<S>>;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  const regions: string[] = config[configKey] ?? [];
  return [
    <select
      size={3}
      multiple
      class="p-0 border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      onchange={(_, e: Event) => [
        SelectRegions,
        Array.from((e.target as HTMLSelectElement).selectedOptions).map(
          (o) => o.value
        ),
      ]}
    >
      {regions.map((region) => (
        <option
          value={region}
          selected={selectedRegions && selectedRegions?.indexOf(region) !== -1}
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
            deleteRegionUpdate(configKey, regions, selectedRegions),
          ]}
        >
          {t("configRegionsRemove")}
        </Button>
      )}
    </div>,
  ];
}
