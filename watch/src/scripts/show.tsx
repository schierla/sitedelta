import * as regionUtils from "@sitedelta/common/src/scripts/regionUtils";
import * as textUtils from "@sitedelta/common/src/scripts/textUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as highlightUtils from "@sitedelta/common/src/scripts/highlightUtils";
import * as watchUtils from "@sitedelta/common/src/scripts/watchUtils";
import { Config } from "@sitedelta/common/src/scripts/config";
import { Fragment, render, h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "./components/Button";
import { t } from "./hooks/UseTranslation";
import { ExpandIcon } from "./icons/ExpandIcon";
import { ConfigAccess, usePageConfig } from "./hooks/UseConfig";
import { useDocument } from "./hooks/UseDocument";
import { PermissionScreen } from "./show/PermissionScreen";
import { LoadingScreen } from "./show/LoadingScreen";
import { PageConfigPanel } from "./show/PageConfigPanel";
import "./show.css";

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

export function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

export type LoadStatus = "loading" | "loaded" | "failed";

const Content = () => {
  let url = window.location.search.substring(1) + window.location.hash;
  if (url == "") url = "about:blank";
  const [hasPermission, setPermission] = useState<boolean>();
  const [title, setTitle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [highlight, setHighlight] = useState(false);
  const [changes, setChanges] = useState(-1);
  const [current, setCurrent] = useState(-1);
  const [idoc, setIdoc] = useState<Document>();
  const [oldContent, setOldContent] = useState<string>();
  const [selectedIncludeRegion, setSelectedIncludeRegion] = useState<string>();
  const [selectedExcludeRegion, setSelectedExcludeRegion] = useState<string>();
  const iframe = useRef<HTMLIFrameElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const config = usePageConfig(url);
  const known = title !== null;

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

  const selectRegion = async () => {
    if (overlay.current && idoc) {
      if (status === "selecting") {
        setStatus("loaded");
        regionUtils.abortSelect();
        const region = prompt(chrome.i18n.getMessage("configRegionXpath"), "");
        return region == null ? undefined : region;
      } else {
        setStatus("selecting");
        const region = await regionUtils.selectRegionOverlay(
          overlay.current,
          idoc
        );
        setStatus("loaded");
        return region == null ? undefined : region;
      }
    }
    return undefined;
  };

  useEffect(() => {
    chrome.permissions.contains({ origins: [url] }, setPermission);
    pageUtils.getTitle(url).then(setTitle);
  }, [url]);

  const doc = useDocument(hasPermission ? url : undefined, setStatus);

  useEffect(() => {
    if (doc !== undefined && highlight && title === null) {
      pageUtils.setTitle(url, doc.title);
      setTitle(doc.title);
    }
  }, [doc, title, highlight]);

  useEffect(() => {
    (async () => {
      if (doc === undefined) return;
      const _iframe = iframe.current;
      if (!_iframe || !_iframe.contentWindow) return;
      var idoc = _iframe.contentWindow.document;
      while (idoc.firstChild) idoc.removeChild(idoc.firstChild);
      idoc.appendChild(idoc.importNode(doc.documentElement, true));
      idoc.body.addEventListener("click", stopIt, true);
      setIdoc(idoc);

      if (config.value) {
        applyVisibilityOptions(config.value, idoc);
        showOutline(
          config.value,
          idoc,
          selectedIncludeRegion,
          selectedExcludeRegion
        );
      }

      if (highlight) {
        var newConfig = await pageUtils.getOrCreateEffectiveConfig(
          url,
          title ?? ""
        );
        var oldContent = await pageUtils.getContent(url);
        setOldContent(oldContent);
        var newcontent = textUtils.getText(idoc, newConfig) || "";
        pageUtils.setContent(url, newcontent);

        if (oldContent === null) {
          await watchUtils.setChanges(url, 0);
          setChanges(-1);
          setCurrent(-1);
        } else {
          const changes = highlightUtils.highlightChanges(
            idoc,
            newConfig,
            oldContent
          );
          setChanges(changes);
          if (changes > 0) {
            setStatus("changed");
            setCurrent(current);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setCurrent(highlightUtils.highlightNext(idoc, 0));
          } else if (changes == 0) {
            setStatus("unchanged");
          } else {
            setStatus("failed");
          }
          await watchUtils.setChanges(url, changes >= 0 ? 0 : -1);
        }
      } else {
        setChanges(-1);
        setCurrent(-1);
        setStatus("loaded");
      }
    })();
  }, [
    doc,
    iframe.current,
    config.value,
    highlight,
    selectedIncludeRegion,
    selectedExcludeRegion,
  ]);

  cleanupIncludeRegions(config);

  useEffect(() => {
    if (doc && !expanded && known) setHighlight(true);
  }, [known, doc, expanded]);

  document.title = title ?? t("watchExtensionName");

  const statusMessage = known
    ? status === "loadfailed"
      ? t("watchFailed")
      : status === "failed"
      ? t("pageFailed")
      : status === "unchanged"
      ? t("pageUnchanged")
      : status === "changed" && current > -1
      ? chrome.i18n.getMessage("pageChanged", [current, changes])
      : status === "selecting"
      ? t("pageSelectRegion")
      : t("watchEnabled")
    : t("watchDisabled");

  const nextChangeButton = (
    <Button
      isDefault
      onClick={() => {
        if (idoc) setCurrent(highlightUtils.highlightNext(idoc, current));
      }}
    >
      {t("pageNextChange")}
    </Button>
  );

  const showChangesButton = (
    <Button
      isDefault
      onClick={() => {
        setExpanded(false);
        setHighlight(true);
      }}
    >
      {t("pageShowChanges")}
    </Button>
  );

  const highlightChangesButton = (
    <Button
      isDefault
      onClick={() => {
        setExpanded(false);
        setHighlight(true);
      }}
    >
      {t("pageEnable")}
    </Button>
  );

  const disableButton = (
    <Button
      onClick={() => {
        pageUtils.remove(url).then(() => {
          setTitle(null);
          setHighlight(false);
          setExpanded(false);
        });
      }}
    >
      {t("pageDisable")}
    </Button>
  );

  const openButton = (
    <Button
      onClick={() => {
        window.location.href = url;
      }}
    >
      {t("pageOpen")}
    </Button>
  );

  const expandButton = (
    <Button
      onClick={() => {
        if (oldContent !== undefined) pageUtils.setContent(url, oldContent);
        setHighlight(false);
        setExpanded(true);
      }}
    >
      <ExpandIcon />
    </Button>
  );

  const previewPanel = (
    <Fragment>
      <iframe
        frameBorder={0}
        width="100%"
        height="100%"
        className="maximized"
        style={{
          display:
            status === "loaded" ||
            status === "changed" ||
            status === "unchanged" ||
            status === "selecting"
              ? "block"
              : "none",
        }}
        ref={iframe}
        sandbox="allow-same-origin"
      ></iframe>
      <div
        ref={overlay}
        className="maxmimized"
        style={{
          display: status === "selecting" ? "block" : "none",
          overflow: "auto",
        }}
      />
    </Fragment>
  );

  return (
    <Fragment>
      <div id="topbar">
        <div id="actions">
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
        <div id="status">{statusMessage}</div>
      </div>
      <div id="main">
        {expanded && (
          <div id="config">
            <PageConfigPanel
              url={url}
              config={config}
              selectRegion={selectRegion}
              selectedExcludeRegion={selectedExcludeRegion}
              setSelectedExcludeRegion={setSelectedExcludeRegion}
              selectedIncludeRegion={selectedIncludeRegion}
              setSelectedIncludeRegion={setSelectedIncludeRegion}
              title={title}
              setTitle={setTitle}
            />
          </div>
        )}
        <div id="content">
          {hasPermission === false && (
            <PermissionScreen url={url} onGranted={setPermission} />
          )}
          {status === "loading" && <LoadingScreen />}
          {previewPanel}
        </div>
      </div>
    </Fragment>
  );
};

render(h(Content, {}), document.body);

function showOutline(
  config: Config,
  idoc: Document,
  selectedIncludeRegion: string | undefined,
  selectedExcludeRegion: string | undefined
) {
  if (selectedIncludeRegion !== undefined) {
    regionUtils.showOutline(idoc, selectedIncludeRegion, config.includeRegion);
  } else if (selectedExcludeRegion !== undefined) {
    regionUtils.showOutline(idoc, selectedExcludeRegion, config.excludeRegion);
  } else {
    regionUtils.removeOutline(idoc);
  }
}

function applyVisibilityOptions(config: Config, idoc: Document) {
  if (config.stripStyles) highlightUtils.stripStyles(idoc);
  if (config.isolateRegions) highlightUtils.isolateRegions(idoc, config);
  if (config.makeVisible) highlightUtils.makeVisible(idoc, config);
}

function cleanupIncludeRegions(config: ConfigAccess) {
  useEffect(() => {
    if (!config.value) return;
    if (config.value.includes.length === 0)
      config.update({ includes: ["/html/body[1]"] });
    else if (
      config.value.includes.length > 1 &&
      config.value.includes.indexOf("/html/body[1]") !== -1
    )
      config.update({
        includes: config.value.includes.filter((r) => r !== "/html/body[1]"),
      });
  }, [config.value, config.update]);
}
