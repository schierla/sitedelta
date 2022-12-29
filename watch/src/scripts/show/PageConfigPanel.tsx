import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import { Fragment, FunctionComponent, h } from "preact";
import { t } from "../hooks/UseTranslation";
import { ConfigAccess } from "../hooks/UseConfig";
import { ConfigCheckbox } from "../components/ConfigCheckbox";
import { ConfigSection } from "../components/ConfigSection";
import { ConfigRegionList } from "../components/ConfigRegionList";
import { ConfigNumber } from "../components/ConfigNumber";

export const PageConfigPanel: FunctionComponent<{
  config: ConfigAccess;
  url: string;
  title: string | null;
  setTitle: (title: string) => void;
  selectRegion: () => Promise<string | undefined>;
  selectedIncludeRegions: string[] | undefined;
  setSelectedIncludeRegions: (regions: string[] | undefined) => void;
  selectedExcludeRegions: string[] | undefined;
  setSelectedExcludeRegions: (regions: string[] | undefined) => void;
}> = ({
  config,
  url,
  title,
  setTitle,
  selectRegion,
  selectedIncludeRegions,
  setSelectedIncludeRegions,
  selectedExcludeRegions,
  setSelectedExcludeRegions,
}) => (
  <Fragment>
    <input
      type="text"
      class="px-1 py-0 border-gray-300"
      value={title ?? ""}
      onInput={(e: Event) => {
        setTitle((e.target as HTMLInputElement).value);
      }}
      onChange={(e: Event) => {
        pageUtils.setTitle(url, (e.target as HTMLInputElement).value);
      }}
    />
    <ConfigSection label={t("configChecks")}>
      <ConfigCheckbox
        config={config}
        configKey="checkDeleted"
        label={t("configCheckDeleted")}
      />
      <ConfigCheckbox
        config={config}
        configKey="scanImages"
        label={t("configCheckImages")}
      />
    </ConfigSection>

    <ConfigSection label={t("configIgnores")}>
      <ConfigCheckbox
        config={config}
        configKey="ignoreCase"
        label={t("configIgnoreCase")}
      />
      <ConfigCheckbox
        config={config}
        configKey="ignoreNumbers"
        label={t("configIgnoreNumbers")}
      />
    </ConfigSection>

    <ConfigSection label={t("configAppearance")}>
      <ConfigCheckbox
        config={config}
        configKey="makeVisible"
        label={t("configMakeVisible")}
      />
      <ConfigCheckbox
        config={config}
        configKey="stripStyles"
        label={t("configStripStyles")}
      />
      <ConfigCheckbox
        config={config}
        configKey="isolateRegions"
        label={t("configIsolateRegions")}
      />
    </ConfigSection>

    <ConfigSection label={t("configRegionsInclude")}>
      <ConfigRegionList
        config={config}
        configKey="includes"
        selectedRegions={selectedIncludeRegions}
        setSelectedRegions={(r) => {
          setSelectedIncludeRegions(r);
          setSelectedExcludeRegions(undefined);
        }}
        addRegion={selectRegion}
      />
    </ConfigSection>

    <ConfigSection label={t("configRegionsExclude")}>
      <ConfigRegionList
        config={config}
        configKey="excludes"
        selectedRegions={selectedExcludeRegions}
        setSelectedRegions={(r) => {
          setSelectedIncludeRegions(undefined);
          setSelectedExcludeRegions(r);
        }}
        addRegion={selectRegion}
      />
    </ConfigSection>

    <ConfigSection label={t("configWatch")}>
      <ConfigNumber
        config={config}
        configKey="watchDelay"
        label={t("configWatchDelay")}
      />{" "}
    </ConfigSection>
  </Fragment>
);
