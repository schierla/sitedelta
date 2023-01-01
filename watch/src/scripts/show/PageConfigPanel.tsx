import { h } from "../hooks/h";
import { t } from "../hooks/t";
import { ConfigCheckbox } from "../components/ConfigCheckbox";
import { ConfigSection } from "../components/ConfigSection";
import { ConfigRegionList } from "../components/ConfigRegionList";
import { ConfigNumber } from "../components/ConfigNumber";
import { Config } from "@sitedelta/common/src/scripts/config";
import { Action, Dispatchable } from "hyperapp";

export function PageConfigPanel<S>({
  config,
  url,
  title,
  SetTitle,
  UpdateTitle,
  PickRegion,
  selectedIncludeRegions,
  SelectIncludeRegions,
  selectedExcludeRegions,
  SelectExcludeRegions,
  UpdateConfig,
}: {
  config?: Config;
  url?: string;
  title: string | null;
  SetTitle: Action<S, string>;
  UpdateTitle: Action<S, string>;
  PickRegion: Action<S, (region?: string) => Dispatchable<S>>;
  selectedIncludeRegions: string[] | undefined;
  SelectIncludeRegions: Action<S, string[] | undefined>;
  selectedExcludeRegions: string[] | undefined;
  SelectExcludeRegions: Action<S, string[] | undefined>;
  UpdateConfig: Action<S, Partial<Config>>;
}) {
  return (
    config &&
    url && [
      h(
        <input
          type="text"
          class="px-1 py-0 border-gray-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
          value={title ?? ""}
          oninput={(_, e: Event) => [
            SetTitle,
            (e.target as HTMLInputElement).value,
          ]}
          onchange={(_, e: Event) => [
            UpdateTitle,
            (e.target as HTMLInputElement).value,
          ]}
        />
      ),
      <ConfigSection label={t("configChecks")}>
        <ConfigCheckbox
          config={config}
          configKey="checkDeleted"
          label={t("configCheckDeleted")}
          UpdateConfig={UpdateConfig}
        />
        <ConfigCheckbox
          config={config}
          configKey="scanImages"
          label={t("configCheckImages")}
          UpdateConfig={UpdateConfig}
        />
      </ConfigSection>,

      <ConfigSection label={t("configIgnores")}>
        <ConfigCheckbox
          config={config}
          configKey="ignoreCase"
          label={t("configIgnoreCase")}
          UpdateConfig={UpdateConfig}
        />
        <ConfigCheckbox
          config={config}
          configKey="ignoreNumbers"
          label={t("configIgnoreNumbers")}
          UpdateConfig={UpdateConfig}
        />
      </ConfigSection>,

      <ConfigSection label={t("configAppearance")}>
        <ConfigCheckbox
          config={config}
          configKey="makeVisible"
          label={t("configMakeVisible")}
          UpdateConfig={UpdateConfig}
        />
        <ConfigCheckbox
          config={config}
          configKey="stripStyles"
          label={t("configStripStyles")}
          UpdateConfig={UpdateConfig}
        />
        <ConfigCheckbox
          config={config}
          configKey="isolateRegions"
          label={t("configIsolateRegions")}
          UpdateConfig={UpdateConfig}
        />
      </ConfigSection>,

      <ConfigSection label={t("configRegionsInclude")}>
        <ConfigRegionList
          config={config}
          configKey="includes"
          selectedRegions={selectedIncludeRegions}
          SelectRegions={SelectIncludeRegions}
          PickRegion={PickRegion}
          UpdateConfig={UpdateConfig}
        />
      </ConfigSection>,

      <ConfigSection label={t("configRegionsExclude")}>
        <ConfigRegionList
          config={config}
          configKey="excludes"
          selectedRegions={selectedExcludeRegions}
          SelectRegions={SelectExcludeRegions}
          PickRegion={PickRegion}
          UpdateConfig={UpdateConfig}
        />
      </ConfigSection>,

      <ConfigSection label={t("configWatch")}>
        <ConfigNumber
          config={config}
          configKey="watchDelay"
          label={t("configWatchDelay")}
          UpdateConfig={UpdateConfig}
        />{" "}
      </ConfigSection>,
    ]
  );
}
