import { h } from "./hooks/h";
import { t } from "./hooks/t";
import { Action, app, Dispatch, Subscription, VNode } from "hyperapp";
import { Index, observeIndex } from "@sitedelta/common/src/scripts/ioUtils";
import { Button } from "./components/Button";
import { ChangedIcon } from "./icons/ChangedIcon";
import { FailedIcon } from "./icons/FailedIcon";
import { HighlightIcon } from "./icons/HighlightIcon";
import { UnchangedIcon } from "./icons/UnchangedIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import {
  executeScript,
  getActive,
  openResource,
} from "@sitedelta/common/src/scripts/tabUtils";
import { getOrCreateEffectiveConfig } from "@sitedelta/common/src/scripts/pageUtils";

const SHOW_PREFIX = chrome.runtime.getURL("show.htm?");

type State = {
  title: string;
  url: string;
  tabId: number;
  index: Index;
  isShow: boolean;
  isBusy: boolean;
};

const SetBusy: Action<State, boolean> = (state, isBusy) => [
  { ...state, isBusy },
];

const OpenPageInNewTab: Action<State, string> = (state, url) => [
  state,
  [open, url],
  close,
];

const SwitchToOriginalPage: Action<State, { tabId: number; url: string }> = (
  state,
  props
) => [state, [showOriginal, props], close];

const SwitchToWatchedPage: Action<
  State,
  { tabId: number; url: string; title: string }
> = (state, props) => [state, [showWatched, props]];

const OpenSidebar: Action<State> = (state) => [state, showSidebar, close];

const TriggerBackgroundCommand: Action<State, string> = (state, command) => [
  state,
  [sendCommand, command],
];

const AwaitBackgroundCommand: Action<State, string> = (state, command) => [
  state,
  [sendCommandBusy, command],
];

const SetIndex: Action<State, Index> = (state, index) => ({ ...state, index });

const SetTabInfo: Action<
  State,
  { tabId: number; title: string; url: string; isShow: boolean }
> = (state, tabInfo) => ({ ...state, ...tabInfo });

const close = () => {
  window.close();
};

const showSidebar = () => {
  if ((chrome as any)?.sidebarAction?.open)
    (chrome as any).sidebarAction.open();
  else openResource("pages.htm");
};

const showWatched = (
  _,
  { tabId, url, title }: { tabId: number; url: string; title: string }
) => {
  getOrCreateEffectiveConfig(url, title).then(() =>
    chrome.tabs.update(tabId, { url: SHOW_PREFIX + url, active: true }, close)
  );
};

const showOriginal = (_, { tabId, url }: { tabId: number; url: string }) => {
  chrome.tabs.update(tabId, { url: url, active: true });
};

const open = (_, url: string) => {
  openResource("show.htm?" + url);
};

const sendCommand = function (_, command: string) {
  chrome.runtime.sendMessage({ command });
};

const sendCommandBusy = function (dispatch: Dispatch<State>, command: string) {
  requestAnimationFrame(() => dispatch([SetBusy, true]));
  chrome.runtime.sendMessage({ command: command }, () =>
    requestAnimationFrame(() => dispatch([SetBusy, false]))
  );
};

function PageList(index: Index, icon: VNode<any>, urls: string[]) {
  return (
    <select
      size={urls.length > 5 ? 5 : urls.length}
      multiple
      class="p-0 w-full block text-sm border-gray-300"
    >
      {urls.map((url) => (
        <option
          class="flex flex-row gap-1 items-baseline"
          ondblclick={[OpenPageInNewTab, url]}
          key={url}
          value={url}
          title={url}
        >
          {icon} {index?.[url].title}
        </option>
      ))}
    </select>
  );
}

const Content = ({ title, url, tabId, index, isShow, isBusy }: State) => {
  const changed = Object.keys(index).filter(
    (url) => (index[url]?.changes ?? 0) > 0
  );
  const failed = Object.keys(index).filter(
    (url) => (index[url]?.changes ?? 0) < 0
  );
  const supported = url.startsWith("http");
  const enabled = url in (index ?? {});

  const icon = !supported ? (
    <FailedIcon />
  ) : !enabled ? (
    <HighlightIcon />
  ) : changed.indexOf(url) == -1 ? (
    <UnchangedIcon />
  ) : (
    <ChangedIcon />
  );
  const headline = !supported
    ? t("watchUnsupported")
    : enabled
    ? t("watchEnabled")
    : t("watchDisabled");

  return (
    <body class="py-2 min-w-[260px] dark:bg-slate-900 dark:text-slate-200">
      <div class="mx-4 mb-4 flex flex-row gap-2 items-baseline">
        <span class="text-3xl">{icon}</span>
        <span class="text-lg mt-2">{headline}</span>
      </div>
      {supported && (
        <div class="mx-4 my-2 flex flex-row-reverse">
          {isShow ? (
            <Button isDefault onClick={[SwitchToOriginalPage, { tabId, url }]}>
              {t("pageOpen")}
            </Button>
          ) : (
            <Button
              isDefault
              onClick={[SwitchToWatchedPage, { tabId, url, title }]}
            >
              {enabled ? t("pageShowChanges") : t("pageEnable")}
            </Button>
          )}
        </div>
      )}
      <div class="my-2 border-t border-slate-400/20" />

      <div class="mx-4 my-2 flex flex-row gap-2">
        <Button onClick={OpenSidebar}>{t("pagesSidebar")}</Button>
        <Button disabled={isBusy} onClick={[AwaitBackgroundCommand, "scanAll"]}>
          {t("pagesScanAll")}
        </Button>
        {isBusy && <SpinnerIcon />}
      </div>

      {changed.length > 0 && [
        <div class="my-2 border-t border-slate-400/20" />,
        <div class="mx-4 my-2">{t("watchChangedPages")}</div>,
        <div class="mx-4 my-2">
          {PageList(index, <ChangedIcon />, changed)}
        </div>,
        <div class="mx-4 my-2">
          <Button onClick={[TriggerBackgroundCommand, "openChanged"]}>
            {t("pagesOpenChanged")}
          </Button>
        </div>,
      ]}

      {failed.length > 0 && [
        <div class="my-2 border-t border-slate-400/20" />,
        <div class="mx-4 my-2">{t("watchFailedPages")}</div>,
        <div class="mx-4 my-2">{PageList(index, <FailedIcon />, failed)}</div>,
        <div class="mx-4 my-2 flex flex-row gap-2">
          <Button
            disabled={isBusy}
            onClick={[AwaitBackgroundCommand, "scanFailed"]}
          >
            {t("pagesScanFailed")}
          </Button>
          <Button onClick={[TriggerBackgroundCommand, "openFailed"]}>
            {t("pagesOpenFailed")}
          </Button>
        </div>,
      ]}
    </body>
  );
};

const indexSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    return observeIndex((index) =>
      requestAnimationFrame(() => dispatch([SetIndex, index]))
    );
  },
  {},
];

const tabSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    getActive().then((tab) => {
      if (tab.id && tab.url == "https://sitedelta.schierla.de/transfer/") {
        executeScript(tab.id, "/scripts/transferScript.js").then(close);
        return;
      }
      requestAnimationFrame(() => {
        if (tab.url?.startsWith(SHOW_PREFIX))
          dispatch([
            SetTabInfo,
            {
              tabId: tab.id ?? -1,
              title: tab.title ?? "",
              url: tab.url?.substring(SHOW_PREFIX.length) ?? "",
              isShow: true,
            },
          ]);
        else
          dispatch([
            SetTabInfo,
            {
              tabId: tab.id ?? -1,
              title: tab.title ?? "",
              url: tab.url ?? "",
              isShow: false,
            },
          ]);
      });
    });
    return () => {};
  },
  {},
];

app<State>({
  init: {
    title: "",
    url: "",
    tabId: -1,
    index: {},
    isShow: false,
    isBusy: false,
  },
  view: (state) => h(<Content {...state} />),
  node: document.body,
  subscriptions: () => [indexSubscription, tabSubscription],
});
