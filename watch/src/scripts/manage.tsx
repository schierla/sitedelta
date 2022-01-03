import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { render, h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button } from "./components/Button";
import { t } from "./hooks/UseTranslation";
import { useDefaultConfig } from "./hooks/UseConfig";
import { ConfigCheckbox } from "./components/ConfigCheckbox";
import { ConfigColors } from "./components/ConfigColors";
import { ConfigNumber } from "./components/ConfigNumber";
import { PageList } from "./components/PageList";
import { openPages, getActions } from "./components/PageListActions";
import { ConfigSection } from "./components/ConfigSection";
import "./manage.css";

const openImportExport = () =>
  chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" });

const Content = () => {
  const config = useDefaultConfig();
  const [index, setIndex] = useState<ioUtils.Index>({});
  const [selectedPages, setSelection] = useState<string[]>([]);
  useEffect(() => ioUtils.observeIndex(setIndex), [setIndex]);
  if (!config.value) return <Fragment></Fragment>;

  return (
    <Fragment>
      <ConfigSection label={t("pagesList")}>
        <PageList
          selectedPages={selectedPages}
          setSelection={setSelection}
          onDblClick={(pages) => openPages(pages, setSelection)}
          index={index}
        />
        <Button onClick={openImportExport}>{t("configTransfer")}</Button>
        {getActions(index, selectedPages, setSelection).map(
          ([label, action]) => (
            <Button onClick={action}>{label}</Button>
          )
        )}
      </ConfigSection>

      <ConfigSection label={t("configBehavior")}>
        <ConfigCheckbox
          config={config}
          configKey="scanOnLoad"
          label={t("configScanOnLoad")}
        />
      </ConfigSection>

      <ConfigSection label={t("configAppearance")}>
        <ConfigCheckbox
          config={config}
          configKey="makeVisible"
          label={t("configMakeVisible")}
        />
        <ConfigCheckbox
          config={config}
          configKey="stripStyles"
          label={t("configStripStyles")}
        />
        <ConfigCheckbox
          config={config}
          configKey="isolateRegions"
          label={t("configIsolateRegions")}
        />
        <ConfigCheckbox
          config={config}
          configKey="showRegions"
          label={t("configShowRegions")}
        />
        <ConfigColors
          config={config}
          border="includeRegion"
          label={t("configIncludeColors")}
        />
        <ConfigColors
          config={config}
          border="excludeRegion"
          label={t("configExcludeColors")}
        />
        <ConfigColors
          config={config}
          background="addBackground"
          border="addBorder"
          label={t("configAddColors")}
        />
      </ConfigSection>

      <ConfigSection label={t("configChecks")}>
        <ConfigCheckbox
          config={config}
          configKey="checkDeleted"
          label={t("configCheckDeleted")}
        />
        <ConfigCheckbox
          config={config}
          configKey="scanImages"
          label={t("configCheckImages")}
        />
      </ConfigSection>

      <ConfigSection label={t("configIgnores")}>
        <ConfigCheckbox
          config={config}
          configKey="ignoreCase"
          label={t("configIgnoreCase")}
        />
        <ConfigCheckbox
          config={config}
          configKey="ignoreNumbers"
          label={t("configIgnoreNumbers")}
        />
      </ConfigSection>

      <ConfigSection label={t("configWatch")}>
        <ConfigNumber
          config={config}
          configKey="watchDelay"
          label={t("configWatchDelay")}
        />
        <ConfigCheckbox
          config={config}
          configKey="notifyChanged"
          label={t("configNotifyChanged")}
        />
        <ConfigCheckbox
          config={config}
          configKey="notifyFailed"
          label={t("configNotifyFailed")}
        />
      </ConfigSection>
    </Fragment>
  );
};

render(h(Content, {}), document.body);
document.title = t("watchExtensionName");
