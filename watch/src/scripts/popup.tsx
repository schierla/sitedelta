import {
  Index,
  listIndex,
  observeIndex,
} from "@sitedelta/common/src/scripts/ioUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { Fragment, h, render, VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Button } from "./components/Button";
import { t } from "./hooks/UseTranslation";
import { ChangedIcon } from "./icons/ChangedIcon";
import { FailedIcon } from "./icons/FailedIcon";
import { HighlightIcon } from "./icons/HighlightIcon";
import { UnchangedIcon } from "./icons/UnchangedIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";

const showSidebar = function () {
  if ((chrome as any)?.sidebarAction?.open)
    (chrome as any).sidebarAction.open();
  else tabUtils.openResource("pages.htm");
  window.close();
};

const showPrefix = chrome.runtime.getURL("show.htm?");

const watch = async function (tabId: number, url: string, title: string) {
  await pageUtils.getOrCreateEffectiveConfig(url, title);
  chrome.tabs.update(tabId, { url: showPrefix + url, active: true });
  window.close();
};

const showOriginal = function (tabId: number, url: string) {
  chrome.tabs.update(tabId, { url: url, active: true });
  window.close();
};

const open = (url: string) => {
  tabUtils.openResource("show.htm?" + url);
  window.close();
};

const scanAll = function (setBusy: (busy: boolean) => void) {
  setBusy(true);
  chrome.runtime.sendMessage({ command: "scanAll" }, () => setBusy(false));
};

const openChanged = function () {
  chrome.runtime.sendMessage({ command: "openChanged" });
  window.close();
};

const openFailed = function () {
  chrome.runtime.sendMessage({ command: "openFailed" });
  window.close();
};

const scanFailed = function (setBusy: (busy: boolean) => void) {
  setBusy(true);
  chrome.runtime.sendMessage({ command: "scanFailed" }, () => setBusy(false));
};

function PageList(index: Index, icon: VNode, urls: string[]) {
  return (
    <select
      size={urls.length > 5 ? 5 : urls.length}
      multiple
      class="p-0 w-full block text-sm border-gray-300"
    >
      {urls.map((url) => (
        <option
          class="flex flex-row gap-1 items-baseline"
          onDblClick={() => open(url)}
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

const Content = () => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tabId, setTabId] = useState(-1);
  const [index, setIndex] = useState<Index>({});
  const [isShow, setIsShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setIndex(await listIndex());
      var tab = await tabUtils.getActive();
      setTabId(tab.id ?? 0);
      setTitle(tab.title ?? "");

      if (tab.id && tab.url == "https://sitedelta.schierla.de/transfer/") {
        await tabUtils.executeScript(tab.id, "/scripts/transferScript.js");
        window.close();
      } else if (tab.url?.startsWith(showPrefix)) {
        setUrl(tab.url.substring(showPrefix.length));
        setIsShow(true);
      } else {
        setUrl(tab.url ?? "");
        setIsShow(false);
      }
    })();
  }, []);

  useEffect(() => {
    return observeIndex(setIndex);
  }, []);

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
    <div class="py-2 min-w-[260px]">
      <div class="mx-4 mb-4 flex flex-row gap-2 items-baseline">
        <span class="text-3xl">{icon}</span>
        <span class="text-lg mt-2">{headline}</span>
      </div>
      {supported && (
        <div class="mx-4 my-2 flex flex-row-reverse">
          {isShow ? (
            <Button isDefault onClick={() => showOriginal(tabId, url)}>
              {t("pageOpen")}
            </Button>
          ) : (
            <Button isDefault onClick={() => watch(tabId, url, title)}>
              {enabled ? t("pageShowChanges") : t("pageEnable")}
            </Button>
          )}
        </div>
      )}
      <div class="my-2 border-t border-slate-400/20" />

      <div class="mx-4 my-2 flex flex-row gap-2">
        <Button onClick={showSidebar}>{t("pagesSidebar")}</Button>
        <Button
          disabled={busy}
          onClick={() => {
            scanAll(setBusy);
          }}
        >
          {t("pagesScanAll")}
        </Button>
        {busy && <SpinnerIcon />}
      </div>

      {changed.length > 0 && (
        <Fragment>
          <div class="my-2 border-t border-slate-400/20" />
          <div class="mx-4 my-2">{t("watchChangedPages")}</div>
          <div class="mx-4 my-2">
            {PageList(index, <ChangedIcon />, changed)}
          </div>
          <div class="mx-4 my-2">
            <Button onClick={openChanged}>{t("pagesOpenChanged")}</Button>
          </div>
        </Fragment>
      )}

      {failed.length > 0 && (
        <Fragment>
          <div class="my-2 border-t border-slate-400/20" />
          <div class="mx-4 my-2">{t("watchFailedPages")}</div>
          <div class="mx-4 my-2">{PageList(index, <FailedIcon />, failed)}</div>
          <div class="mx-4 my-2 flex flex-row gap-2">
            <Button disabled={busy} onClick={() => scanFailed(setBusy)}>
              {t("pagesScanFailed")}
            </Button>
            <Button onClick={openFailed}>{t("pagesOpenFailed")}</Button>
          </div>
        </Fragment>
      )}
    </div>
  );
};

render(h(Content, {}), document.body);
