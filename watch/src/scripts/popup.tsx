import {
  Index,
  listIndex,
  observeIndex,
} from "@sitedelta/common/src/scripts/ioUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { Fragment, h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Button } from "./components/Button";
import { t } from "./hooks/UseTranslation";
import "./popup.css";

const showSidebar = function () {
  if (
    chrome &&
    (chrome as any).sidebarAction &&
    (chrome as any).sidebarAction.open
  )
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
};

const scanAll = function () {
  chrome.runtime.sendMessage({ command: "scanAll" });
};

const openChanged = function () {
  chrome.runtime.sendMessage({ command: "openChanged" });
  window.close();
};

const openFailed = function () {
  chrome.runtime.sendMessage({ command: "openFailed" });
  window.close();
};

const scanFailed = function () {
  chrome.runtime.sendMessage({ command: "scanFailed" });
};

function PageList(index: Index, urls: string[]) {
  return (
    <select size={5}>
      {urls.map((url) => (
        <option
          onDblClick={() => open(showPrefix + url)}
          key={url}
          value={url}
          title={url}
        >
          {index?.[url].title}
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

  return (
    <Fragment>
      <div class="browser-style">
        {supported
          ? enabled
            ? t("watchEnabled")
            : t("watchDisabled")
          : t("watchUnsupported")}
      </div>

      {supported && (
        <div class="browser-style buttons">
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

      <div class="browser-style buttons">
        <Button onClick={showSidebar}>{t("pagesSidebar")}</Button>
        <Button onClick={scanAll}>{t("pagesScanAll")}</Button>
      </div>

      {changed.length > 0 && (
        <div>
          <div class="browser-style section">{t("watchChangedPages")}</div>
          <div class="browser-style">{PageList(index, changed)}</div>

          <div class="browser-style buttons">
            <Button onClick={openChanged}>{t("pagesOpenChanged")}</Button>
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div>
          <div class="browser-style section">{t("watchFailedPages")}</div>
          <div class="browser-style">{PageList(index, failed)}</div>

          <div class="browser-style buttons">
            <Button onClick={scanFailed}>{t("pagesScanFailed")}</Button>
            <Button onClick={openFailed}>{t("pagesOpenFailed")}</Button>
          </div>
        </div>
      )}
    </Fragment>
  );
};

render(h(Content, {}), document.body);
