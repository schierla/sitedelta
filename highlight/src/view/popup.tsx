import { Config } from "@sitedelta/common/src/model/config";
import * as pageUtils from "@sitedelta/common/src/model/pageUtils";
import * as tabUtils from "@sitedelta/common/src/model/tabUtils";
import { executeScript, getActive } from "@sitedelta/common/src/model/tabUtils";
import { Button } from "@sitedelta/common/src/view/Button";
import { ChangedIcon } from "@sitedelta/common/src/view/ChangedIcon";
import { ConfigCheckbox } from "@sitedelta/common/src/view/ConfigCheckbox";
import { ConfigRegionList } from "@sitedelta/common/src/view/ConfigRegionList";
import { ConfigSection } from "@sitedelta/common/src/view/ConfigSection";
import { ExpandIcon } from "@sitedelta/common/src/view/ExpandIcon";
import { t } from "@sitedelta/common/src/view/helpers";
import { HighlightIcon } from "@sitedelta/common/src/view/HighlightIcon";
import { InactiveIcon } from "@sitedelta/common/src/view/InactiveIcon";
import { UnchangedIcon } from "@sitedelta/common/src/view/UnchangedIcon";
import { Action, app, Dispatchable, Effecter, Subscription } from "hyperapp";
import * as highlightScriptUtils from "./highlightScriptUtils";
import { HighlightState, PageState } from "./highlightState";

const ADVANCED_PERMISSION = { permissions: [], origins: ["<all_urls>"] };

type State = {
  title: string;
  url: string;
  advancedPermission: boolean;
  tabId: number;
  expanded: boolean;
  selectedIncludeRegions?: string[];
  selectedExcludeRegions?: string[];
  enabled?: boolean;
  status?: HighlightState;
  config?: Config;
};

const Delete: Action<State> = (state) => [
  { ...state, enabled: false, status: undefined },
  [deletePage, { url: state.url, tabId: state.tabId }],
];

const Highlight: Action<State> = (state) => [
  { ...state, enabled: true, expanded: false },
  [highlight, { url: state.url, title: state.title, tabId: state.tabId }],
];

const SetStatus: Action<State, HighlightState> = (state, status) => [
  { ...state, status },
  status && [
    handleHighlightState,
    { status, url: state.url, tabId: state.tabId },
  ],
];

const Expand: Action<State> = (state) => [
  { ...state, expanded: true, enabled: true },
  [expand, { url: state.url, title: state.title, tabId: state.tabId }],
];

const SetAdvancedPermission: Action<State, boolean> = (
  state,
  advancedPermission
) => ({ ...state, advancedPermission });

const ShowSidebar: Action<State> = (state) => [state, showSidebar];

const ScanAll: Action<State> = (state) => [state, scanAll];

const SetConfig: Action<State, Config> = (state, config) => ({
  ...state,
  config,
});

const SetTabInfo: Action<
  State,
  { url: string; tabId: number; enabled: boolean | undefined; title: string }
> = (state, { url, tabId, enabled, title }) => [
  { ...state, url, tabId, enabled, title },
];

function UpdateConfig(
  state: State,
  update: Partial<Config>
): Dispatchable<State> {
  const newState: State = {
    ...state,
    config: state.config ? { ...state.config, ...update } : undefined,
  };
  return [newState, [applyConfigUpdate, { url: state.url, update }]];
}

const SelectExcludeRegions: Action<State, string[] | undefined> = (
  state,
  selectedExcludeRegions
) => {
  const newState = {
    ...state,
    selectedExcludeRegions,
    selectedIncludeRegions: undefined,
  };
  return [
    newState,
    [
      showOutline,
      {
        region: selectedExcludeRegions,
        tabId: state.tabId,
        color: state.config?.excludeRegion ?? "0f0",
      },
    ],
  ];
};

const SelectIncludeRegions: Action<State, string[] | undefined> = (
  state,
  selectedIncludeRegions
) => {
  const newState: State = {
    ...state,
    selectedIncludeRegions,
    selectedExcludeRegions: undefined,
  };
  return [
    newState,
    [
      showOutline,
      {
        region: selectedIncludeRegions,
        tabId: state.tabId,
        color: state.config?.includeRegion ?? "f00",
      },
    ],
  ];
};

const PickIncludeRegion: Action<
  State,
  (region?: string) => Dispatchable<State>
> = (state, callback) => [
  state,
  [
    pickRegion,
    {
      callback,
      tabId: state.tabId,
      url: state.url,
      status: state.status,
      isInclude: true,
    },
  ],
];

const PickExcludeRegion: Action<
  State,
  (region?: string) => Dispatchable<State>
> = (state, callback) => [
  state,
  [
    pickRegion,
    {
      callback,
      tabId: state.tabId,
      url: state.url,
      status: state.status,
      isInclude: false,
    },
  ],
];

const UpdateTitle: Action<State, string> = (state, title) => [
  { ...state, title },
  [updateTitle, { title, url: state.url }],
];

const updateTitle: Effecter<State, { url: string; title: string }> = async (
  _,
  { title, url }
) => {
  await pageUtils.setTitle(url, title);
};

const pickRegion: Effecter<
  State,
  {
    tabId: number;
    url: string;
    status: HighlightState;
    isInclude: boolean;
    callback: (region?: string) => Dispatchable<State>;
  }
> = async (dispatch, { status, tabId, url, isInclude, callback }) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  dispatchLater(callback(undefined));
  if (isInclude) await highlightScriptUtils.selectInclude(tabId, url);
  else await highlightScriptUtils.selectExclude(tabId, url);
  dispatchLater([SetStatus, { state: PageState.SELECTREGION }]);
};

const applyConfigUpdate: Effecter<
  State,
  { update: Partial<Config>; url: string }
> = async (dispatch, { update, url }) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  for (let key in update) {
    let value = update[key];
    if (key === "includes") value = cleanupIncludeRegions(value);
    await pageUtils.setConfigProperty(url, key as keyof Config, value);
  }
  const newConfig = (await pageUtils.getEffectiveConfig(url)) ?? undefined;
  dispatchLater([SetConfig, newConfig]);
  if("includes" in update) dispatchLater([SelectIncludeRegions, []]);
  if("excludes" in update) dispatchLater([SelectExcludeRegions, []]);
};

const cleanupIncludeRegions = (includes: string[]) => {
  if (includes.length === 0) return ["/html/body[1]"];
  else if (includes.length > 1 && includes.indexOf("/html/body[1]") !== -1)
    return includes.filter((r) => r !== "/html/body[1]");
  else return includes;
};

const handleHighlightState: Effecter<
  State,
  { status: HighlightState; url: string; tabId: number }
> = (dispatch, { status, url, tabId }) => {
  if (status.state === PageState.HIGHLIGHTED) {
    tabUtils.showIcon(tabId, status.current, status.changes);
    pageUtils.setChanges(url, status.changes < 0 ? -1 : 0);
    if (status.changes < 0) dispatch(Expand);
  }
};

const expand: Effecter<
  State,
  { url: string; title: string; tabId: number }
> = async (dispatch, { url, title, tabId }) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  const config = await pageUtils.getOrCreateEffectiveConfig(url, title);
  dispatchLater([SetConfig, config]);
  var status = await highlightScriptUtils.getStatus(tabId);
  dispatchLater([SetStatus, status]);
};

const scanAll: Effecter<State> = (_) => {
  highlightScriptUtils.scanAll();
};

const showSidebar: Effecter<State> = (_) => {
  if (
    chrome &&
    (chrome as any).sidebarAction &&
    (chrome as any).sidebarAction.open
  )
    (chrome as any).sidebarAction.open();
  else tabUtils.openResource("pages.htm");
  window.close();
};

const highlight: Effecter<
  State,
  { url: string; title: string; tabId: number }
> = async (dispatch, { url, title, tabId }) => {
  await pageUtils.getOrCreateEffectiveConfig(url, title);
  var status = await highlightScriptUtils.highlightChanges(tabId, url);
  requestAnimationFrame(() => dispatch([SetStatus, status]));
};

const deletePage: Effecter<State, { url: string; tabId: number }> = async (
  _,
  { url, tabId }
) => {
  await pageUtils.remove(url);
  await tabUtils.showIcon(tabId);
  window.close();
};

const showOutline: Effecter<
  State,
  { region: string[] | undefined; tabId: number; color: string }
> = async (_, { region, tabId, color }) => {
  if (region) await highlightScriptUtils.showOutline(tabId, region, color);
  else await highlightScriptUtils.removeOutline(tabId);
};

const tabSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    const dispatchLater = (event: Dispatchable<State>) =>
      requestAnimationFrame(() => dispatch(event));

    if (chrome.permissions) {
      chrome.permissions.contains(ADVANCED_PERMISSION, (success) => {
        dispatchLater([SetAdvancedPermission, success]);
      });
    }

    getActive().then(async (tab) => {
      const tabId = tab.id || 0;
      const url = tab.url || "";

      if (url.substring(0, 4) != "http") {
        dispatchLater([SetTabInfo, { url, tabId, enabled: undefined }]);
        return;
      }

      if (url == "https://sitedelta.schierla.de/transfer/") {
        await executeScript(tabId, "/transferScript.js");
        window.close();
        return;
      }

      var title = await pageUtils.getTitle(url);
      if (title === null) {
        dispatchLater([
          SetTabInfo,
          { url, tabId, enabled: false, title: tab.title },
        ]);
      } else {
        dispatchLater([SetTabInfo, { url, tabId, enabled: true, title }]);
        var status = await highlightScriptUtils.getStatus(tabId);
        dispatchLater([SetStatus, status]);
      }
    });
    return () => {};
  },
  {},
];

const Content = ({
  config,
  status,
  title,
  enabled,
  expanded,
  advancedPermission,
  selectedExcludeRegions,
  selectedIncludeRegions,
}: State) => {
  const icon =
    enabled === false ? (
      <InactiveIcon />
    ) : status === undefined ? (
      <HighlightIcon />
    ) : status.state === PageState.SELECTREGION ? (
      <UnchangedIcon />
    ) : status.state === PageState.ERROR ? (
      <HighlightIcon />
    ) : status.state === PageState.LOADED ? (
      <UnchangedIcon />
    ) : status.state === PageState.HIGHLIGHTED && status.changes > 0 ? (
      <ChangedIcon />
    ) : status.state === PageState.HIGHLIGHTED && status.changes == 0 ? (
      <UnchangedIcon />
    ) : (
      <HighlightIcon />
    );

  const headline =
    enabled === false
      ? t("highlightDisabled")
      : status === undefined
      ? t("highlightUnsupported")
      : status.state === PageState.SELECTREGION
      ? t("pageSelectRegion")
      : status.state === PageState.ERROR
      ? t("pageFailed")
      : status.state === PageState.LOADED
      ? t("highlightEnabled")
      : status.state === PageState.HIGHLIGHTED && status.changes > 0
      ? chrome.i18n.getMessage("pageChanged", [
          `${status.current}`,
          `${status.changes}`,
        ])
      : status.state === PageState.HIGHLIGHTED && status.changes == 0
      ? t("pageUnchanged")
      : t("pageFailed");

  return (
    <body class="font-sans text-sm py-2 min-w-[360px] dark:bg-slate-900 dark:text-slate-200">
      <div class="mx-4 mb-4 flex flex-row gap-2 items-baseline">
        <span class="text-3xl">{icon}</span>
        <span class="text-lg mt-2">{headline}</span>
      </div>
      {enabled === true && (
        <div class="mx-4">
          <input
            class="w-full block px-2 py-1"
            type="text"
            onchange={(_, e: Event) => [
              UpdateTitle,
              (e.target as HTMLInputElement).value,
            ]}
            value={title}
          />
        </div>
      )}
      <div class="flex flex-row gap-2 my-2 mx-4">
        {enabled === true && (
          <Button onClick={Delete}>{t("pageDisable")}</Button>
        )}
        <div class="flex-1" />
        {enabled === false && (
          <Button isDefault onClick={Highlight}>
            {t("pageEnable")}
          </Button>
        )}
        {enabled === true && status?.state === PageState.LOADED && (
          <Button isDefault onClick={Highlight}>
            {t("pageShowChanges")}
          </Button>
        )}
        {enabled === true &&
          status?.state === PageState.HIGHLIGHTED &&
          status.changes > 0 && (
            <Button isDefault onClick={Highlight}>
              {t("pageNextChange")}
            </Button>
          )}
      </div>
      <div class="flex flex-row gap-1 mx-4">
        {enabled !== undefined &&
          status?.state !== PageState.HIGHLIGHTED &&
          !expanded && (
            <Button onClick={Expand}>
              <ExpandIcon />
            </Button>
          )}
        <div class="flex-1" />
        <Button onClick={ShowSidebar}>{t("pagesSidebar")}</Button>
        {advancedPermission && (
          <Button onClick={ScanAll}>{t("pagesScanAll")}</Button>
        )}
      </div>
      {expanded && config && (
        <div class="flex flex-col mx-4">
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
          </ConfigSection>
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
          </ConfigSection>

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
          </ConfigSection>

          <ConfigSection label={t("configRegionsInclude")}>
            <ConfigRegionList
              config={config}
              configKey="includes"
              selectedRegions={selectedIncludeRegions}
              SelectRegions={SelectIncludeRegions}
              PickRegion={PickIncludeRegion}
              UpdateConfig={UpdateConfig}
            />
          </ConfigSection>
          <ConfigSection label={t("configRegionsExclude")}>
            <ConfigRegionList
              config={config}
              configKey="excludes"
              selectedRegions={selectedExcludeRegions}
              SelectRegions={SelectExcludeRegions}
              PickRegion={PickExcludeRegion}
              UpdateConfig={UpdateConfig}
            />
          </ConfigSection>
        </div>
      )}
    </body>
  );
};

app<State>({
  init: {
    title: "",
    url: "",
    advancedPermission: false,
    tabId: -1,
    expanded: false,
  },
  view: (state) => <Content {...state} />,
  node: document.body,
  subscriptions: () => [tabSubscription],
});
