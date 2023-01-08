import { Config } from "@sitedelta/common/src/model/config";
import {
  getDefaultConfig,
  setDefaultConfigProperties,
  watchHiddenFields,
} from "@sitedelta/common/src/model/configUtils";
import { Index, observeIndex } from "@sitedelta/common/src/model/ioUtils";
import {
  BackupAll,
  BackupPages,
  BackupSettings,
  RestoreFile,
} from "@sitedelta/common/src/view/backup";
import { Button } from "@sitedelta/common/src/view/Button";
import { ConfigCheckbox } from "@sitedelta/common/src/view/ConfigCheckbox";
import { ConfigColors } from "@sitedelta/common/src/view/ConfigColors";
import { ConfigNumber } from "@sitedelta/common/src/view/ConfigNumber";
import { t } from "@sitedelta/common/src/view/helpers";
import { SidebarPage } from "@sitedelta/common/src/view/SidebarPage";
import { SidebarPages } from "@sitedelta/common/src/view/SidebarPages";
import { Action, app, Effecter, Subscription } from "hyperapp";
import { PageList } from "./PageList";
import { getActions, openPages } from "./PageListActions";

type State = {
  index: Index;
  selectedPages: string[];
  config: Config | undefined;
  selectedTab: string;
  importResult: string;
};

const SetConfig: Action<State, Config> = (state, config) => ({
  ...state,
  config,
});

const SetIndex: Action<State, Index> = (state, index) => ({ ...state, index });

const SetSelection: Action<State, string[]> = (state, selectedPages) => [
  { ...state, selectedPages },
];

const SetSelectedTab: Action<State, string> = (state, selectedTab) => [
  { ...state, selectedTab },
];

const Navigate: Action<State, string> = (state, selectedTab) => [
  state,
  () => {
    window.location.hash = "#" + selectedTab;
  },
];

const OpenPages: Action<State, string[]> = (state, pages) => [
  state,
  [openPages, { pages, SetSelection }],
];

const UpdateConfig: Action<State, Partial<Config>> = (state, update) => [
  {
    ...state,
    config: state.config ? { ...state.config, ...update } : undefined,
  },
  [applyConfigUpdate, update],
];

const applyConfigUpdate: Effecter<State, Partial<Config>> = (
  dispatch,
  update
) => {
  setDefaultConfigProperties(update).then(() =>
    getDefaultConfig().then((config) =>
      requestAnimationFrame(() => dispatch([SetConfig, config]))
    )
  );
};

const OpenImportExport: Action<State> = (state) => [state, openImportExport];

const openImportExport: Effecter<State> = () => {
  chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" });
};

const indexSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    return observeIndex((index) =>
      requestAnimationFrame(() => dispatch([SetIndex, index]))
    );
  },
  {},
];

const defaultConfigSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    getDefaultConfig().then((config) =>
      requestAnimationFrame(() => dispatch([SetConfig, config]))
    );
    return () => {};
  },
  {},
];

const urlSubscription: Subscription<State> = [
  (dispatch, _) => {
    const handler = () => {
      const tab = window.location.hash.substring(1);
      requestAnimationFrame(() => dispatch([SetSelectedTab, tab]));
    };
    window.addEventListener("hashchange", handler);
    handler();
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  },
  {},
];

const Content = ({
  index,
  selectedTab: selectedTab,
  selectedPages,
  config,
  importResult,
}: State) => {
  if (!config) return <body></body>;

  return (
    <body class="font-sans text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-200 h-screen flex flex-col sm:flex-row">
      <SidebarPages selectedTab={selectedTab} SelectTab={Navigate}>
        <SidebarPage key="pages" label={t("pagesList")}>
          <PageList
            selectedPages={selectedPages}
            SetSelection={SetSelection}
            OnDblClick={[OpenPages, selectedPages]}
            index={index}
          />
          <div class="flex flex-row gap-2 items-stretch">
            {getActions(index, selectedPages, SetSelection).map(
              ([label, action]) => (
                <Button onClick={action}>{label}</Button>
              )
            )}
          </div>
        </SidebarPage>

        <SidebarPage key="behavior" label={t("configBehavior")}>
          <ConfigCheckbox
            config={config}
            configKey="scanOnLoad"
            label={t("configScanOnLoad")}
            UpdateConfig={UpdateConfig}
          />
        </SidebarPage>

        <SidebarPage key="appearance" label={t("configAppearance")}>
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
          <ConfigCheckbox
            config={config}
            configKey="showRegions"
            label={t("configShowRegions")}
            UpdateConfig={UpdateConfig}
          />
          <ConfigColors
            config={config}
            border="includeRegion"
            label={t("configIncludeColors")}
            UpdateConfig={UpdateConfig}
          />
          <ConfigColors
            config={config}
            border="excludeRegion"
            label={t("configExcludeColors")}
            UpdateConfig={UpdateConfig}
          />
          <ConfigColors
            config={config}
            background="addBackground"
            border="addBorder"
            label={t("configAddColors")}
            UpdateConfig={UpdateConfig}
          />
        </SidebarPage>

        <SidebarPage key="checks" label={t("configChecks")}>
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
        </SidebarPage>

        <SidebarPage key="ignores" label={t("configIgnores")}>
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
        </SidebarPage>

        <SidebarPage key="watch" label={t("configWatch")}>
          <ConfigNumber
            config={config}
            configKey="watchDelay"
            label={t("configWatchDelay")}
            UpdateConfig={UpdateConfig}
          />
          <ConfigCheckbox
            config={config}
            configKey="notifyChanged"
            label={t("configNotifyChanged")}
            UpdateConfig={UpdateConfig}
          />
          <ConfigCheckbox
            config={config}
            configKey="notifyFailed"
            label={t("configNotifyFailed")}
            UpdateConfig={UpdateConfig}
          />
        </SidebarPage>

        <SidebarPage key="backup" label={t("configBackupRestore")}>
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex flex-col gap-4 flex-1">
              <h2 class="mt-4 text-lg text-center">{t("configBackup")}</h2>
              <Button onClick={[BackupAll, watchHiddenFields]}>
                {t("configBackupAll")}
              </Button>
              <Button onClick={BackupPages}>{t("configBackupPages")}</Button>
              <Button onClick={[BackupSettings, watchHiddenFields]}>
                {t("configBackupSettings")}
              </Button>
            </div>
            <div class="flex flex-col gap-4 flex-1">
              <h2 class="mt-4 text-lg text-center">{t("configRestore")}</h2>
              <Button onClick={[RestoreFile, watchHiddenFields]}>
                {t("configRestoreFile")}
              </Button>
              {importResult}
            </div>
          </div>
          <h2 class="mt-4 text-lg text-center">{t("configTransfer")}</h2>
          <Button onClick={OpenImportExport}>{t("configTransfer")}</Button>
        </SidebarPage>
      </SidebarPages>
    </body>
  );
};

document.title = t("watchExtensionName");
app<State>({
  init: {
    config: undefined,
    index: {},
    selectedPages: [],
    selectedTab: "",
    importResult: "",
  },
  view: (state) => <Content {...state} />,
  node: document.body,
  subscriptions: () => [
    indexSubscription,
    defaultConfigSubscription,
    urlSubscription,
  ],
});
