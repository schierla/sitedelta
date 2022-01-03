import * as regionUtils from "@sitedelta/common/src/scripts/regionUtils";
import * as textUtils from "@sitedelta/common/src/scripts/textUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as highlightUtils from "@sitedelta/common/src/scripts/highlightUtils";
import * as watchUtils from "@sitedelta/common/src/scripts/watchUtils";
import { Fragment, render, h } from "preact";
import { Button, t } from "./ui";
import {
  ConfigCheckbox,
  ConfigNumber,
  ConfigRegionList,
  usePageConfig,
} from "./configHelper";
import { useEffect, useRef, useState } from "preact/hooks";

const Expand = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 14">
    <path d="M8,12L3,7,4,6l4,4,4-4,1,1Z" fill="#6A6A6A" />
  </svg>
);

// async function highlight(): Promise<void> {
//   if (document.body.classList.contains("selecting")) {
//     regionUtils.abortSelect();
//   }
//   if (document.body.classList.contains("loadfail")) return;
//   document.body.classList.remove(
//     "selecting",
//     "unchanged",
//     "changed",
//     "expanded"
//   );
//   document.body.classList.add("known");
//   var config = await pageUtils.getOrCreateEffectiveConfig(url, title);
//   var content = await pageUtils.getContent(url);
//   oldContent = content;

//   if (!_iframe.contentWindow) return;
//   var idoc = _iframe.contentWindow.document;

//   var newcontent = textUtils.getText(idoc, config) || "";
//   pageUtils.setContent(url, newcontent);

//   changes = highlightUtils.highlightChanges(idoc, config, content);
//   if (changes > 0) {
//     document.body.classList.add("changed");
//     current = 0;
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     current = highlightUtils.highlightNext(idoc, 0);
//   } else if (changes == 0) {
//     document.body.classList.add("unchanged");
//   } else {
//     document.body.classList.add("failed");
//   }
//   await watchUtils.setChanges(url, changes >= 0 ? 0 : -1);
// }

// async function showData(): Promise<void> {
//   document.title = title;
//   (element("changed").firstChild as CharacterData).data =
//     chrome.i18n.getMessage("pageChanged", [current, changes]);
//   var config = await pageUtils.getEffectiveConfig(url);
//   if (!config) return;
//   if (config.makeVisible) {
//     setTimeout(function () {
//       if (_iframe.contentWindow)
//         highlightUtils.makeVisible(
//           _iframe.contentWindow.document,
//           config as Config
//         );
//     }, 200);
//   }
// }

// async function editRegion(xpath) {
//   await showOutline(null);
//   return prompt(chrome.i18n.getMessage("configRegionXpath"), xpath);
// }

// async function selectRegion(): Promise<string | null> {
//   if (!_iframe.contentWindow) return null;
//   var idoc = _iframe.contentWindow.document;
//   if (
//     document.body.classList.contains("selecting") ||
//     document.body.classList.contains("loadfail")
//   ) {
//     regionUtils.abortSelect();
//     document.body.classList.remove("selecting");
//     var region = prompt(chrome.i18n.getMessage("configRegionXpath"), "");
//     return region;
//   } else {
//     document.body.classList.add("selecting");
//     var region: string | null = await regionUtils.selectRegionOverlay(
//       element("overlay"),
//       idoc
//     );
//     document.body.classList.remove("selecting");
//     return region;
//   }
// }

// async function showOutline(
//   outline: string | null,
//   property?: keyof Config
// ): Promise<void> {
//   if (!_iframe.contentWindow) return;
//   var idoc = _iframe.contentWindow.document;
//   if (outline) {
//     var color = await pageUtils.getEffectiveConfigProperty(
//       url,
//       property || "includeRegion"
//     );
//     regionUtils.showOutline(idoc, outline, color as string);
//   } else {
//     regionUtils.removeOutline(idoc);
//   }
// }

function addBodyIfEmpty(list: string[]) {
  if (list.length == 0) list.push("/html/body[1]");
  if (list.length > 1 && list[0] == "/html/body[1]") list.splice(0, 1);
  return list;
}

// async function expand() {
//   if (oldContent !== null) pageUtils.setContent(url, oldContent);
//   var config = await pageUtils.getOrCreateEffectiveConfig(url, title);
//   document.body.classList.remove("unchanged", "changed", "failed");
//   document.body.classList.add("expanded", "known");
//   (changes = -1), (current = -1);
//   showPage(loadedDocument);
//   if (!_iframe.contentWindow) return;
//   if (config.stripStyles)
//     highlightUtils.stripStyles(_iframe.contentWindow.document);
//   if (config.isolateRegions)
//     highlightUtils.isolateRegions(_iframe.contentWindow.document, config);
// }

/// new

type Status =
  | "unknown"
  | "enabled"
  | "loading"
  | "loaded"
  | "loadfailed"
  | "failed"
  | "changed"
  | "unchanged"
  | "disabled";

function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

const Content = () => {
  let url = window.location.search.substring(1) + window.location.hash;
  if (url == "") url = "about:blank";
  const [hasPermission, setPermission] = useState<boolean>();
  const [title, setTitle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<Status>("unknown");
  const [progress, setProgress] = useState("100%");
  const [highlight, setHighlight] = useState(false);
  const [changes, setChanges] = useState(-1);
  const [current, setCurrent] = useState(-1);
  const [doc, setDoc] = useState<Document>();
  const [idoc, setIdoc] = useState<Document>();
  const [oldContent, setOldContent] = useState<string>();
  const iframe = useRef<HTMLIFrameElement>(null);
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

  useEffect(() => {
    chrome.permissions.contains({ origins: [url] }, setPermission);
    pageUtils.getTitle(url).then(setTitle);
  }, [url]);

  useEffect(() => {
    (async () => {
      if (hasPermission) {
        setDoc(undefined);
        setProgress("0%");
        setStatus("loading");
        var doc = await watchUtils.loadPage(
          url,
          documentParser,
          (loaded, total) => {
            setProgress((loaded / total) * 100 + "%");
          }
        );
        setProgress("100%");
        if (doc === null) {
          setStatus("loadfailed");
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
        setDoc(doc);
        setStatus("loaded");
      }
    })();
  }, [url, hasPermission]);

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
        if (config.value.stripStyles) highlightUtils.stripStyles(idoc);
        if (config.value.isolateRegions)
          highlightUtils.isolateRegions(idoc, config.value);
        if (config.value.makeVisible)
          highlightUtils.makeVisible(idoc, config.value);
      }

      if (highlight) {
        var newConfig = await pageUtils.getOrCreateEffectiveConfig(
          url,
          title ?? ""
        );
        var content = await pageUtils.getContent(url);
        setOldContent(content);
        var newcontent = textUtils.getText(idoc, newConfig) || "";
        pageUtils.setContent(url, newcontent);

        const changes = highlightUtils.highlightChanges(
          idoc,
          newConfig,
          content
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
      } else {
        setChanges(-1);
        setCurrent(-1);
        setStatus("loaded");
      }
    })();
  }, [doc, iframe.current, config.value, highlight]);

  useEffect(() => {}, [idoc, highlight]);

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
      : t("watchEnabled")
    : t("watchDisabled");

  return (
    <Fragment>
      <div id="status">
        <div id="buttons" class="browser-style buttons">
          {!expanded && (
            <Button
              onClick={() => {
                if (oldContent !== undefined)
                  pageUtils.setContent(url, oldContent);
                setHighlight(false);
                setExpanded(true);
              }}
            >
              <Expand />
            </Button>
          )}
          <Button
            onClick={() => {
              window.location.href = url;
            }}
          >
            {t("pageOpen")}
          </Button>
          {known && (
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
          )}
          {known ? (
            changes > 0 ? (
              <Button
                isDefault
                onClick={() => {
                  if (idoc)
                    setCurrent(highlightUtils.highlightNext(idoc, current));
                }}
              >
                {t("pageNextChange")}
              </Button>
            ) : (
              <Button
                isDefault
                onClick={() => {
                  setExpanded(false);
                  setHighlight(true);
                }}
              >
                {t("pageShowChanges")}
              </Button>
            )
          ) : (
            <Button
              isDefault
              onClick={() => {
                setExpanded(false);
                setHighlight(true);
              }}
            >
              {t("pageEnable")}
            </Button>
          )}
        </div>
        <div id="statustext">
          {statusMessage}
          {/* t("pageSelectRegion") */}
        </div>
      </div>
      {expanded && (
        <div id="config">
          <div id="textfields" class="browser-style">
            <input
              class="wide"
              type="text"
              value={title ?? ""}
              onInput={(e: Event) => {
                setTitle((e.target as HTMLInputElement).value);
              }}
              onChange={(e: Event) => {
                pageUtils.setTitle(url, (e.target as HTMLInputElement).value);
              }}
            />
          </div>
          <div class="browser-style section i18n">{t("configChecks")}</div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="checkDeleted"
              label={t("configCheckDeleted")}
            />
          </div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="scanImages"
              label={t("configCheckImages")}
            />
          </div>

          <div class="browser-style section i18n">{t("configIgnores")}</div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="ignoreCase"
              label={t("configIgnoreCase")}
            />
          </div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="ignoreNumbers"
              label={t("configIgnoreNumbers")}
            />
          </div>

          <div class="browser-style section i18n">{t("configAppearance")}</div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="makeVisible"
              label={t("configMakeVisible")}
            />
          </div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="stripStyles"
              label={t("configStripStyles")}
            />
          </div>
          <div class="browser-style">
            <ConfigCheckbox
              config={config}
              configKey="isolateRegions"
              label={t("configIsolateRegions")}
            />
          </div>

          <div class="browser-style section i18n">
            {t("configRegionsInclude")}
          </div>
          <div class="browser-style">
            <ConfigRegionList config={config} configKey="includes" />
          </div>
          <div class="browser-style buttons">
            <button class="browser-style i18n" id="includeadd">
              {t("configRegionsAdd")}
            </button>
            <button class="browser-style i18n" disabled id="includedel">
              {t("configRegionsRemove")}
            </button>
          </div>

          <div class="browser-style section i18n">
            {t("configRegionsExclude")}
          </div>
          <div class="browser-style">
            <ConfigRegionList config={config} configKey="excludes" />
          </div>
          <div class="browser-style buttons">
            <button class="browser-style i18n" id="excludeadd">
              {t("configRegionsAdd")}
            </button>
            <button class="browser-style i18n" disabled id="excludedel">
              {t("configRegionsRemove")}
            </button>
          </div>

          <div class="browser-style section i18n">{t("configWatch")}</div>
          <div class="browser-style">
            <ConfigNumber
              config={config}
              configKey="watchDelay"
              label={t("configWatchDelay")}
            />
          </div>
        </div>
      )}
      <div id="content">
        {status === "loading" && (
          <Fragment>
            <div
              id="progress"
              style={{
                width: progress,
                background: "red",
                height: "2px",
              }}
            ></div>
            <img src="icons/highlight-64.png" />
          </Fragment>
        )}
        <iframe
          ref={iframe}
          style={{
            display:
              status === "loaded" ||
              status === "changed" ||
              status === "unchanged"
                ? "block"
                : "none",
          }}
          sandbox="allow-same-origin"
        ></iframe>
        {hasPermission === false && (
          <div id="permissionDenied">
            <p id="permissionHost" class="browser-style section">
              {new URL(url).origin}
            </p>
            <p id="requirePermission" class="browser-style i18n">
              {t("pageRequirePermission")}
            </p>
            <Button
              onClick={() =>
                chrome.permissions.request({ origins: [url] }, setPermission)
              }
            >
              {t("pageGrantHost")}
            </Button>
            <Button
              onClick={() =>
                chrome.permissions.request(
                  { origins: ["<all_urls>"] },
                  setPermission
                )
              }
            >
              {t("pageGrantAll")}
            </Button>
          </div>
        )}
      </div>
      <div id="overlay"></div>
    </Fragment>
  );
};

render(h(Content, {}), document.body);
