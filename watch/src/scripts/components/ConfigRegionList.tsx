import { FunctionComponent, Fragment, h } from "preact";
import { Button } from "./Button";
import { t } from "../hooks/UseTranslation";
import { ConfigAccess } from "../hooks/UseConfig";

export const ConfigRegionList: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  selectedRegions: string[] | undefined;
  setSelectedRegions: (regions: string[] | undefined) => void;
  addRegion: () => Promise<string | undefined>;
}> = ({ config, configKey, selectedRegions, setSelectedRegions, addRegion }) => {
  const regions: string[] = config.value?.[configKey] ?? [];
  return (
    <Fragment>
      <select
        size={3}
        multiple
        class="p-0 border-gray-300"
        onChange={(e: Event) =>
          setSelectedRegions(Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value))
        }
      >
        {regions.map((region) => (
          <option value={region} selected={selectedRegions && selectedRegions?.indexOf(region) !== -1}>
            {region}
          </option>
        ))}
      </select>
      <div class="flex flex-row gap-2 mt-1">
      <Button
        onClick={async () => {
          const region = await addRegion();
          if (
            region !== undefined &&
            region !== "" &&
            regions.indexOf(region) === -1
          )
            config.update({
              [configKey]: [...regions, region],
            });
          setSelectedRegions(region ? [region] : undefined);
        }}
      >
        {t("configRegionsAdd")}
      </Button>
      {selectedRegions !== undefined && selectedRegions?.length > 0 && (
        <Button
          onClick={() => {
            config.update({
              [configKey]: regions.filter((r) => selectedRegions.indexOf(r) === -1),
            });
            setSelectedRegions(undefined);
          }}
        >
          {t("configRegionsRemove")}
        </Button>
      )}
      </div>
    </Fragment>
  );
};
