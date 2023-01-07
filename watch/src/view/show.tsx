import { Config } from "@sitedelta/common/src/model/config";
import {
  highlightChanges,
  highlightNext,
  isolateRegions as highlightIsolateRegions,
  makeVisible as highlightMakeVisible,
  stripStyles as highlightStripStyles,
} from "@sitedelta/common/src/model/highlightUtils";
import {
  getContent as pageGetContent,
  getEffectiveConfig as pageGetEffectiveConfig,
  getOrCreateEffectiveConfig as pageGetOrCreateEffectiveConfig,
  getTitle as pageGetTitle,
  remove as pageRemove,
  setConfigProperty as pageSetConfigProperty,
  setContent as pageSetContent,
  setTitle as pageSetTitle,
} from "@sitedelta/common/src/model/pageUtils";
import {
  abortSelect as regionAbortSelect,
  removeOutline as regionRemoveOutline,
  selectRegionOverlay,
  showOutline as regionShowOutline,
} from "@sitedelta/common/src/model/regionUtils";
import { getText } from "@sitedelta/common/src/model/textUtils";
import {
  loadPage as watchLoadPage,
  setChanges as watchSetChanges,
} from "@sitedelta/common/src/model/watchUtils";
import { Button } from "@sitedelta/common/src/view/Button";
import { ExpandIcon } from "@sitedelta/common/src/view/ExpandIcon";
import { t } from "@sitedelta/common/src/view/helpers";
import { Action, app, Dispatchable, Effecter, Subscription } from "hyperapp";
import { LoadingScreen } from "./LoadingScreen";
import { PageConfigPanel } from "./PageConfigPanel";
import { PermissionScreen } from "./PermissionScreen";

type Status =
  | "unknown"
  | "enabled"
  | "loading"
  | "loaded"
  | "loadfailed"
  | "failed"
  | "changed"
  | "unchanged"
  | "disabled"
  | "selecting";

export type LoadStatus = "loading" | "loaded" | "failed";

export function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

type State = {
  expanded: boolean;
  status: Status;
  highlight: boolean;
  changes: number;
  current: number;
  title: string | null;
  url?: string;
  oldContent?: string;
  selectedIncludeRegions?: string[];
  selectedExcludeRegions?: string[];
  hasPermission?: boolean;
  config?: Config;
  doc?: Document;
  idoc?: Document;
};

function UpdateConfig(
  state: State,
  update: Partial<Config>
): Dispatchable<State> {
  const newState: State = {
    ...state,
    config: state.config ? { ...state.config, ...update } : undefined,
    selectedIncludeRegions: update.includes
      ? undefined
      : state.selectedIncludeRegions,
    selectedExcludeRegions: update.excludes
      ? undefined
      : state.selectedExcludeRegions,
  };
  return [
    newState,
    [applyConfigUpdate, { url: state.url, update }],
    state.url && [updatePreview, newState],
  ];
}

const SetHasPermission: Action<State, boolean> = (state, hasPermission) => [
  {
    ...state,
    hasPermission,
  },
  state.url && hasPermission && [fetchUrl, state.url],
];

const SetTitle: Action<State, string> = (state, title) => ({ ...state, title });

const UpdateTitle: Action<State, string> = (state, title) => [
  { ...state, title },
  [saveTitle, { url: state.url, title: title }],
];

const SetUrl: Action<State, string> = (state, url) => [
  { ...state, url },
  url !== state.url && [updateUrlDetails, url],
  url !== state.url && state.hasPermission && [fetchUrl, url],
];

const SelectExcludeRegions: Action<State, string[] | undefined> = (
  state,
  selectedExcludeRegions
) => {
  const newState = {
    ...state,
    selectedExcludeRegions,
    selectedIncludeRegions: undefined,
  };
  return [newState, state.url && [updatePreview, newState]];
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
  return [newState, state.url && [updatePreview, newState]];
};

const SetConfig: Action<State, Config | undefined> = (state, config) => ({
  ...state,
  config,
});

const SetStatus: Action<State, Status> = (state, status) => ({
  ...state,
  status,
});

const SetCurrent: Action<State, number> = (state, current) => ({
  ...state,
  current,
});

const SetChanges: Action<State, number> = (state, changes) => ({
  ...state,
  changes,
});

const SetDoc: Action<State, Document | undefined> = (state, doc) => {
  const newState = {
    ...state,
    doc,
    highlight:
      doc && !state.expanded && state.title !== null ? true : state.highlight,
  };
  return [
    newState,
    state.url && [updatePreview, newState],
    doc &&
      state.highlight &&
      state.title === null && [
        updateTitle,
        { url: state.url, title: doc.title },
      ],
  ];
};

const SetIdoc: Action<State, Document | undefined> = (state, idoc) => ({
  ...state,
  idoc,
});

const SetOldContent: Action<State, string> = (state, oldContent) => ({
  ...state,
  oldContent,
});

const HighlightNext: Action<State> = (state) => [
  state,
  [triggerHighlightNext, { idoc: state.idoc, current: state.current }],
];

const ShowChanges: Action<State> = (state) => {
  const title = state.doc?.title ?? "";
  const newState = {
    ...state,
    expanded: false,
    highlight: true,
    title: state.title === null ? title : state.title,
  };
  return [
    newState,
    state.url && [updatePreview, newState],
    state.title === null &&
      state.url &&
      newState.title && [updateTitle, { url: state.url, title }],
  ];
};
const Disable: Action<State> = (state) => {
  const newState = { ...state, title: null, highlight: false, expanded: false };
  return [
    newState,
    [deletePage, state.url],
    state.url && [updatePreview, newState],
  ];
};

const Expand: Action<State> = (state) => [
  { ...state, highlight: false, expanded: true },
  state.oldContent && [
    saveContent,
    { url: state.url, content: state.oldContent },
  ],
  state.url && [updatePreview, { ...state, highlight: false, expanded: true }],
];

const OpenPage: Action<State> = (state) => [state, [openPage, state.url]];

const PickRegion: Action<State, (region?: string) => Dispatchable<State>> = (
  state,
  callback
) => [
  state,
  [pickRegion, { status: state.status, idoc: state.idoc, callback }],
];

const updateTitle: Effecter<State, { url: string; title: string }> = (
  dispatch,
  { url, title }
) => {
  pageSetTitle(url, title);
  dispatch([SetTitle, title]);
};

const updatePreview: Effecter<
  State,
  {
    doc?: Document;
    expanded: boolean;
    highlight: boolean;
    config?: Config;
    title?: string;
    url: string;
    selectedIncludeRegions: string[];
    selectedExcludeRegions: string[];
  }
> = async (
  dispatch,
  {
    doc,
    expanded,
    highlight,
    url,
    title,
    config,
    selectedIncludeRegions,
    selectedExcludeRegions,
  }
) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  const stopIt = (e: MouseEvent) => {
    if (expanded) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.ctrlKey) return;
    var target: Node | null = e.target as Node;
    while (target != null) {
      if ((target as any).href) {
        window.location.search = (target as any).href;
        return;
      }
      target = target.parentNode;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  if (doc === undefined) return;
  const _iframe = document.getElementById("iframe") as HTMLIFrameElement;
  if (!_iframe || !_iframe.contentWindow) return;
  var idoc = _iframe.contentWindow.document;
  while (idoc.firstChild) idoc.removeChild(idoc.firstChild);
  idoc.appendChild(idoc.importNode(doc.documentElement, true));
  idoc.body.addEventListener("click", stopIt, true);
  dispatchLater([SetIdoc, idoc]);

  if (config) {
    applyVisibilityOptions(config, idoc);
    showOutline(config, idoc, selectedIncludeRegions, selectedExcludeRegions);
  }

  if (highlight) {
    var newConfig = await pageGetOrCreateEffectiveConfig(url, title ?? "");
    dispatchLater([SetConfig, newConfig]);
    var oldContent = await pageGetContent(url);
    dispatchLater([SetOldContent, oldContent]);
    var newcontent = getText(idoc, newConfig) || "";
    pageSetContent(url, newcontent);

    if (oldContent === null) {
      await watchSetChanges(url, 0);
      dispatchLater([SetChanges, -1]);
      dispatchLater([SetCurrent, -1]);
    } else {
      const changes = highlightChanges(idoc, newConfig, oldContent);
      dispatchLater([SetChanges, changes]);
      if (changes > 0) {
        dispatchLater([SetStatus, "changed"]);
        dispatchLater([SetCurrent, 0]);
        await new Promise((resolve) => setTimeout(resolve, 300));
        dispatchLater([HighlightNext, 0]);
      } else if (changes == 0) {
        dispatchLater([SetStatus, "unchanged"]);
      } else {
        dispatchLater([SetStatus, "failed"]);
      }
      await watchSetChanges(url, changes >= 0 ? 0 : -1);
    }
  } else {
    dispatchLater([SetChanges, -1]);
    dispatchLater([SetCurrent, -1]);
    dispatchLater([SetStatus, "loaded"]);
  }
};

const fetchUrl: Effecter<State, string> = async (dispatch, url) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  if (url) {
    dispatchLater([SetDoc, undefined]);
    dispatchLater([SetStatus, "loading"]);
    var doc = await watchLoadPage(url, documentParser);
    if (doc === null) {
      dispatchLater([SetStatus, "failed"]);
      return;
    }
    var base = doc.createElement("base");
    base.setAttribute("href", url);
    var existingbase = doc.querySelector("base[href]") as HTMLBaseElement;
    if (existingbase && existingbase.parentNode) {
      existingbase.parentNode.removeChild(existingbase);
      base.setAttribute(
        "href",
        new URL(existingbase.getAttribute("href") || "", url).href
      );
    }
    doc.head.insertBefore(base, doc.head.firstChild);
    dispatchLater([SetDoc, doc]);
    dispatchLater([SetStatus, "loaded"]);
  }
};

const updateUrlDetails: Effecter<State, string> = (dispatch, url) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  chrome.permissions.contains({ origins: [url] }, (hasPermission) =>
    dispatchLater([SetHasPermission, hasPermission])
  );
  pageGetTitle(url).then((title) => dispatchLater([SetTitle, title]));
  pageGetEffectiveConfig(url).then((config) =>
    dispatchLater([SetConfig, config ?? undefined])
  );
};

const pickRegion: Effecter<
  State,
  {
    status: Status;
    idoc: Document;
    callback: (region?: string) => Dispatchable<State>;
  }
> = async (dispatch, { status, idoc, callback }) => {
  const dispatchLater = (event: Dispatchable<State>) =>
    requestAnimationFrame(() => dispatch(event));
  const overlay = document.getElementById("overlay");
  if (overlay && idoc) {
    if (status === "selecting") {
      dispatchLater([SetStatus, "loaded"]);
      regionAbortSelect();
      const region = prompt(chrome.i18n.getMessage("configRegionXpath"), "");
      dispatchLater(callback(region == null ? undefined : region));
    } else {
      dispatchLater([SetStatus, "selecting"]);
      const region = await selectRegionOverlay(overlay, idoc);
      dispatchLater([SetStatus, "loaded"]);
      dispatchLater(callback(region == null ? undefined : region));
    }
  }
  dispatchLater(callback(undefined));
};

const saveContent: Effecter<State, { url: string; content: string }> = (
  _,
  { url, content }
) => {
  pageSetContent(url, content);
};

const saveTitle: Effecter<State, { url: string; title: string }> = (
  _,
  { url, title }
) => {
  pageSetTitle(url, title);
};

const openPage: Effecter<State, string> = (_, url) => {
  window.location.href = url;
};

const deletePage: Effecter<State, string> = (_, url) => {
  pageRemove(url);
};

const triggerHighlightNext: Effecter<
  State,
  { idoc: Document; current: number }
> = (dispatch, { idoc, current }) => {
  if (idoc) {
    const next = highlightNext(idoc, current);
    dispatch([SetCurrent, next]);
  }
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
    await pageSetConfigProperty(url, key as keyof Config, value);
  }
  const newConfig = (await pageGetEffectiveConfig(url)) ?? undefined;
  dispatchLater([SetConfig, newConfig]);
};

const urlDetailSubscription: Subscription<State> = [
  (dispatch, _) => {
    const dispatchUrl = () => {
      let url = window.location.search.substring(1) + window.location.hash;
      if (url == "") url = "about:blank";
      requestAnimationFrame(() => dispatch([SetUrl, url]));
    };
    dispatchUrl();
    window.addEventListener("hashchange", dispatchUrl);
    return () => {
      window.removeEventListener("hashchange", dispatchUrl);
    };
  },
  {},
];

const cleanupIncludeRegions = (includes: string[]) => {
  if (includes.length === 0) return ["/html/body[1]"];
  else if (includes.length > 1 && includes.indexOf("/html/body[1]") !== -1)
    return includes.filter((r) => r !== "/html/body[1]");
  else return includes;
};

const Content = ({
  expanded,
  status,
  changes,
  current,
  url,
  selectedIncludeRegions,
  selectedExcludeRegions,
  hasPermission,
  title,
  config,
}: State) => {
  const known = title !== null;

  document.title = title ?? url ?? t("watchExtensionName");

  const statusMessage = known
    ? status === "loadfailed"
      ? t("watchFailed")
      : status === "failed"
      ? t("pageFailed")
      : status === "unchanged"
      ? t("pageUnchanged")
      : status === "changed" && current > -1
      ? chrome.i18n.getMessage("pageChanged", [`${current}`, `${changes}`])
      : status === "selecting"
      ? t("pageSelectRegion")
      : t("watchEnabled")
    : t("watchDisabled");

  const nextChangeButton = (
    <Button isDefault onClick={HighlightNext}>
      {t("pageNextChange")}
    </Button>
  );

  const showChangesButton = (
    <Button isDefault onClick={ShowChanges}>
      {t("pageShowChanges")}
    </Button>
  );

  const highlightChangesButton = (
    <Button isDefault onClick={ShowChanges}>
      {t("pageEnable")}
    </Button>
  );

  const disableButton = <Button onClick={Disable}>{t("pageDisable")}</Button>;

  const openButton = <Button onClick={OpenPage}>{t("pageOpen")}</Button>;

  const expandButton = (
    <Button onClick={Expand}>
      <ExpandIcon />
    </Button>
  );

  const previewPanel = [
    <iframe
      id="iframe"
      frameBorder={0}
      width="100%"
      height="100%"
      class="absolute inset-0"
      style={{
        display:
          status === "loaded" ||
          status === "changed" ||
          status === "unchanged" ||
          status === "selecting"
            ? "block"
            : "none",
      }}
      sandbox="allow-same-origin"
    />,
    <div
      id="overlay"
      class="absolute inset-0"
      style={{
        display: status === "selecting" ? "block" : "none",
        overflow: "auto",
      }}
    />,
  ];

  return (
    <body class="font-sans text-sm h-screen flex flex-col dark:bg-slate-900 dark:text-slate-200">
      <div class="flex flex-col sm:flex-row-reverse items-center border-b-2 border-indigo-600 gap-2 p-2">
        {" "}
        <div class="flex flex-row gap-2">
          {openButton}
          {known && disableButton}
          {hasPermission &&
            (known
              ? expanded
                ? showChangesButton
                : changes > 0
                ? nextChangeButton
                : false
              : highlightChangesButton)}
          {!expanded && hasPermission && expandButton}
        </div>
        <div class="flex-1 text-center">{statusMessage}</div>
      </div>
      <div class="flex-1 flex flex-row-reverse">
        {expanded && (
          <div class="basis-80 border-l-2 border-indigo-600 p-2 flex flex-col items-stretch">
            <PageConfigPanel
              url={url}
              config={config}
              PickRegion={PickRegion}
              selectedExcludeRegions={selectedExcludeRegions}
              SelectExcludeRegions={SelectExcludeRegions}
              selectedIncludeRegions={selectedIncludeRegions}
              SelectIncludeRegions={SelectIncludeRegions}
              title={title}
              SetTitle={SetTitle}
              UpdateTitle={UpdateTitle}
              UpdateConfig={UpdateConfig}
            />
          </div>
        )}
        <div class="flex-1 relative">
          {url && hasPermission === false && (
            <PermissionScreen url={url} OnGranted={SetHasPermission} />
          )}
          {status === "loading" && <LoadingScreen />}
          {previewPanel}
        </div>
      </div>
    </body>
  );
};

app<State>({
  init: {
    changes: -1,
    current: -1,
    expanded: false,
    highlight: false,
    status: "unknown",
    title: null,
  },
  view: (state) => <Content {...state} />,
  node: document.body,
  subscriptions: () => [urlDetailSubscription],
});

function showOutline(
  config: Config,
  idoc: Document,
  selectedIncludeRegion: string | string[] | undefined,
  selectedExcludeRegion: string | string[] | undefined
) {
  if (selectedIncludeRegion !== undefined) {
    regionShowOutline(idoc, selectedIncludeRegion, config.includeRegion);
  } else if (selectedExcludeRegion !== undefined) {
    regionShowOutline(idoc, selectedExcludeRegion, config.excludeRegion);
  } else {
    regionRemoveOutline(idoc);
  }
}

function applyVisibilityOptions(config: Config, idoc: Document) {
  if (config.stripStyles) highlightStripStyles(idoc);
  if (config.isolateRegions) highlightIsolateRegions(idoc, config);
  if (config.makeVisible) highlightMakeVisible(idoc, config);
}
