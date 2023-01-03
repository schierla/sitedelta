import { h } from "./hooks/h";
import { t } from "./hooks/t";
import { Config } from "@sitedelta/common/src/scripts/config";
import { Action, app, Effecter, Subscription } from "hyperapp";
import { Index, observeIndex } from "@sitedelta/common/src/scripts/ioUtils";
import {
  getDefaultConfig,
  setDefaultConfigProperties,
} from "@sitedelta/common/src/scripts/configUtils";
import { SidebarPages } from "./components/SidebarPages";
import { SidebarPage } from "./components/SidebarPage";
import { PageList } from "./components/PageList";
import { getActions, openPages } from "./components/PageListActions";
import { Button } from "./components/Button";
import { ConfigCheckbox } from "./components/ConfigCheckbox";
import { ConfigColors } from "./components/ConfigColors";

type State = {
  advancedPermission: boolean;
  index: Index;
  config?: Config;
  selectedTab: string;
  selectedPages: string[];
};

const ADVANCDED_PERMISSION = { permissions: [], origins: ["<all_urls>"] };

const SetConfig: Action<State, Config> = (state, config) => [
  {
    ...state,
    config,
  },
  checkAdvancedPermission,
];

const SetIndex: Action<State, Index> = (state, index) => ({ ...state, index });

const SetSelectedTab: Action<State, string> = (state, selectedTab) => [
  { ...state, selectedTab },
];

const SetSelection: Action<State, string[]> = (state, selectedPages) => [
  { ...state, selectedPages },
];

const Navigate: Action<State, string> = (state, selectedTab) => [
  state,
  () => {
    window.location.hash = "#" + selectedTab;
  },
];

const CheckPermission: Action<State> = (state) => [
  state,
  checkAdvancedPermission,
];

const RequestAdvancedPermission: Action<State> = (state) => [
  state,
  requestAdvancedPermission,
];

const SetAdvancedPermission: Action<State, boolean> = (
  state,
  advancedPermission
) => ({ ...state, advancedPermission });

const OpenImportExport: Action<State> = (state) => [state, openImportExport];

const OpenPages: Action<State, string[]> = (state, pages) => [
  state,
  [openPages, { pages, SetSelection }],
];

const UpdateConfig: Action<State, Partial<Config>> = (state, update) => {
  if (update.scanOnLoad === false) update.highlightOnLoad = false;
  if (update.scanOnLoad && !state.advancedPermission) update.scanOnLoad = false;
  if (update.highlightOnLoad && !state.config?.scanOnLoad)
    update.highlightOnLoad = false;
  const newConfig = {
    ...state,
    config: state.config ? { ...state.config, ...update } : undefined,
  };
  return [newConfig, [applyConfigUpdate, update]];
};

const applyConfigUpdate: Effecter<State, Partial<Config>> = (
  dispatch,
  update
) => {
  setDefaultConfigProperties(update).then(() =>
    getDefaultConfig().then((config) => {
      requestAnimationFrame(() => dispatch([SetConfig, config]));
      chrome.runtime.sendMessage({ command: "reinitialize" });
    })
  );
};

const openImportExport: Effecter<State> = () => {
  chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" });
};

const checkAdvancedPermission: Effecter<State> = (dispatch) => {
  if (chrome.permissions) {
    chrome.permissions.contains(ADVANCDED_PERMISSION, (success) => {
      requestAnimationFrame(() => dispatch([SetAdvancedPermission, success]));
    });
  }
};

const requestAdvancedPermission: Effecter<State> = (dispatch) => {
  try {
    chrome.permissions.request(ADVANCDED_PERMISSION, () => {
      requestAnimationFrame(() => dispatch(CheckPermission));
      chrome.runtime.sendMessage({ command: "reinitialize" });
    });
  } catch (e) {
    requestAnimationFrame(() => dispatch(CheckPermission));
  }
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
  config,
  advancedPermission,
  selectedTab,
  selectedPages,
  index,
}: State) => {
  if (!config) return <body></body>;
  const Unlock = advancedPermission ? undefined : RequestAdvancedPermission;

  const UnlockBanner = (
    <div class="rounded-md bg-slate-200 dark:bg-slate-800 px-4 pb-2">
      <div class="my-2">{t("configAdvancedDisabled")} </div>
      <Button onClick={RequestAdvancedPermission}>
        {t("configEnableAdvanced")}
      </Button>
    </div>
  );
  return (
    <body class="font-sans text-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-200 h-screen flex flex-row">
      <SidebarPages selectedTab={selectedTab} SelectTab={Navigate}>
        <SidebarPage key="pages" label={t("pagesList")}>
          {Unlock && UnlockBanner}
          <PageList
            selectedPages={selectedPages}
            SetSelection={SetSelection}
            OnDblClick={[OpenPages, selectedPages]}
            index={index}
          />
          <div class="flex flex-row gap-2 items-stretch">
            {getActions(index, selectedPages, Unlock ?? true, SetSelection).map(
              ([label, action]) => (
                <Button onClick={action}>{label}</Button>
              )
            )}
          </div>
          <Button onClick={OpenImportExport}>{t("configTransfer")}</Button>
        </SidebarPage>

        <SidebarPage key="behavior" label={t("configBehavior")}>
          {Unlock && UnlockBanner}
          <ConfigCheckbox
            config={config}
            configKey="scanOnLoad"
            label={t("configScanOnLoad")}
            UpdateConfig={UpdateConfig}
            Unlock={Unlock}
          />
          <ConfigCheckbox
            config={config}
            configKey="highlightOnLoad"
            label={t("configHighlightOnLoad")}
            UpdateConfig={UpdateConfig}
            Unlock={Unlock}
          />
          <ConfigCheckbox
            config={config}
            configKey="enableContextMenu"
            label={t("configEnableContextMenu")}
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
            configKey="checkImages"
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
      </SidebarPages>
    </body>
  );
};

document.title = t("highlightExtensionName");
app<State>({
  init: {
    advancedPermission: false,
    index: {},
    selectedTab: "pages",
    selectedPages: [],
  },
  view: (state) => h(<Content {...state} />),
  node: document.body,
  subscriptions: () => [
    indexSubscription,
    defaultConfigSubscription,
    urlSubscription,
  ],
});
