import { FunctionComponent, Fragment, h } from "preact";
import { Button } from "./Button";
import { t } from "../hooks/UseTranslation";
import { ConfigAccess } from "../hooks/UseConfig";

export const ConfigRegionList: FunctionComponent<{
  config: ConfigAccess;
  configKey: string;
  selectedRegion: string | undefined;
  setSelectedRegion: (region: string | undefined) => void;
  addRegion: () => Promise<string | undefined>;
}> = ({ config, configKey, selectedRegion, setSelectedRegion, addRegion }) => {
  const regions: string[] = config.value?.[configKey] ?? [];
  return (
    <Fragment>
      <select
        style={{ width: "100%" }}
        size={3}
        onChange={(e: Event) =>
          setSelectedRegion((e.target as HTMLSelectElement).value)
        }
      >
        {regions.map((region) => (
          <option value={region} selected={region === selectedRegion}>
            {region}
          </option>
        ))}
      </select>

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
          setSelectedRegion(region);
        }}
      >
        {t("configRegionsAdd")}
      </Button>
      {selectedRegion !== undefined && regions.indexOf(selectedRegion) !== -1 && (
        <Button
          onClick={() => {
            config.update({
              [configKey]: regions.filter((r) => r !== selectedRegion),
            });
            setSelectedRegion(undefined);
          }}
        >
          {t("configRegionsRemove")}
        </Button>
      )}
    </Fragment>
  );
};
