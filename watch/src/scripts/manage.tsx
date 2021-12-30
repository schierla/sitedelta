import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { render, h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button, t } from "./ui";
import {
  useDefaultConfig,
  ConfigCheckbox,
  ConfigColors,
  ConfigNumber,
} from "./configHelper";
import {
  PageList,
  scanPages,
  markSeen,
  openPages,
  deletePages,
  setWatchDelay,
} from "./pageListHelper";

const openImportExport = () =>
  chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" });

const Content = () => {
  const config = useDefaultConfig();
  const [index, setIndex] = useState<ioUtils.Index>({});
  const [selectedPages, setSelection] = useState<string[]>([]);
  useEffect(() => ioUtils.observeIndex(setIndex), [setIndex]);
  if (!config.value) return <></>;
  return (
    <>
      <div class="browser-style section">{t("pagesList")}</div>
      <PageList
        selectedPages={selectedPages}
        setSelection={setSelection}
        onDblClick={(pages) => openPages(pages, setSelection)}
        index={index}
      />
      <div class="buttons browser-style">
        <Button onClick={openImportExport}>{t("configTransfer")}</Button>{" "}
        {selectedPages.length == 0 && (
          <>
            <Button onClick={() => scanPages(Object.keys(index), setSelection)}>
              {t("pagesScanAll")}
            </Button>{" "}
            <Button onClick={() => markSeen(Object.keys(index), setSelection)}>
              {t("pagesMarkSeenAll")}
            </Button>{" "}
            <Button
              isDefault
              onClick={() =>
                openPages(
                  Object.keys(index).filter((key) => index[key].changes > 0),
                  setSelection
                )
              }
            >
              {t("pagesOpenChanged")}
            </Button>
          </>
        )}
        {selectedPages.length == 1 && (
          <>
            <Button onClick={() => scanPages(selectedPages, setSelection)}>
              {t("pagesScanOne")}
            </Button>{" "}
            <Button onClick={() => markSeen(selectedPages, setSelection)}>
              {t("pagesMarkSeenOne")}
            </Button>{" "}
            <Button onClick={() => deletePages(selectedPages)}>
              {t("pagesDeleteOne")}
            </Button>{" "}
            <Button onClick={() => setWatchDelay(selectedPages)}>
              {t("pagesWatchDelay")}
            </Button>{" "}
            <Button
              isDefault
              onClick={() => openPages(selectedPages, setSelection)}
            >
              {t("pagesOpenOne")}
            </Button>
          </>
        )}
        {selectedPages.length > 1 && (
          <>
            <Button onClick={() => scanPages(selectedPages, setSelection)}>
              {t("pagesScanMultiple")}
            </Button>{" "}
            <Button onClick={() => markSeen(selectedPages, setSelection)}>
              {t("pagesMarkSeenMultiple")}
            </Button>{" "}
            <Button onClick={() => deletePages(selectedPages)}>
              {t("pagesDeleteMultiple")}
            </Button>{" "}
            <Button onClick={() => setWatchDelay(selectedPages)}>
              {t("pagesWatchDelay")}
            </Button>{" "}
            <Button
              isDefault
              onClick={() => openPages(selectedPages, setSelection)}
            >
              {t("pagesOpenMultiple")}
            </Button>
          </>
        )}
      </div>

      <div class="browser-style section">{t("configBehavior")}</div>
      <div class="browser-style advanced">
        <ConfigCheckbox
          config={config}
          configKey="scanOnLoad"
          label={t("configScanOnLoad")}
        />
      </div>

      <div class="browser-style section">{t("configAppearance")}</div>
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
      <div class="browser-style">
        <ConfigCheckbox
          config={config}
          configKey="showRegions"
          label={t("configShowRegions")}
        />
      </div>
      <div class="browser-style">
        <ConfigColors
          config={config}
          border="includeRegion"
          label={t("configIncludeColors")}
        />
      </div>
      <div class="browser-style">
        <ConfigColors
          config={config}
          border="excludeRegion"
          label={t("configExcludeColors")}
        />
      </div>
      <div class="browser-style">
        <ConfigColors
          config={config}
          background="addBackground"
          border="addBorder"
          label={t("configAddColors")}
        />
      </div>

      <div class="browser-style section">{t("configChecks")}</div>
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

      <div class="browser-style section">{t("configIgnores")}</div>
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

      <div class="browser-style section">{t("configWatch")}</div>
      <div class="browser-style">
        <ConfigNumber
          config={config}
          configKey="watchDelay"
          label={t("configWatchDelay")}
        />
      </div>
      <div class="browser-style">
        <ConfigCheckbox
          config={config}
          configKey="notifyChanged"
          label={t("configNotifyChanged")}
        />
      </div>
      <div class="browser-style">
        <ConfigCheckbox
          config={config}
          configKey="notifyFailed"
          label={t("configNotifyFailed")}
        />
      </div>
    </>
  );
};

render(h(Content, {}), document.body);
document.title = t("watchExtensionName");
