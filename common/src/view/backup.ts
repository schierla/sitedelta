import { Action, Effecter } from "hyperapp";
import { getDefaultConfig } from "@sitedelta/common/src/model/configUtils";
import { Config } from "@sitedelta/common/src/model/config";
import {
  exportConfig,
  exportPages,
  importConfig,
  importPages,
} from "@sitedelta/common/src/model/transferUtils";

type State = { importResult: string; config: Config };

const SetImportResult: Action<State, string> = (state, importResult) => ({
  ...state,
  importResult,
});

const SetConfig: Action<State, Config> = (state, config) => ({
  ...state,
  config,
});

export const BackupPages: Action<State> = (state) => [state, backupPages];

export const BackupSettings: Action<State, string[]> = (
  state,
  hiddenFields
) => [state, [backupSettings, hiddenFields]];

export const BackupAll: Action<State, string[]> = (state, hiddenFields) => [
  state,
  [backupAll, hiddenFields],
];

export const RestoreFile: Action<State, string[]> = (state, hiddenFields) => [
  state,
  [restoreFile, hiddenFields],
];

const backupPages: Effecter<State> = async () => {
  const pages = await exportPages();
  download(JSON.stringify(pages), "sitedelta-pages.json");
};
const backupSettings: Effecter<State, string[]> = async (_, hiddenFields) => {
  const config = await exportConfig(hiddenFields);
  download(JSON.stringify(config), "sitedelta-config.json");
};
const backupAll: Effecter<State, string[]> = async (_, hiddenFields) => {
  const pages = await exportPages();
  const config = await exportConfig(hiddenFields);
  download(JSON.stringify({ config, pages }), "sitedelta-backup.json");
};
const restoreFile: Effecter<State, string[]> = async (
  dispatch,
  hiddenFields
) => {
  dispatch([SetImportResult, ""]);
  const content = await upload();
  if (!content) return;
  const data = JSON.parse(content);
  let importResult = "";
  if (Array.isArray(data)) {
    const pages = await importPages(data);
    importResult += chrome.i18n.getMessage("configRestoredPages", [
      `${pages.imported}`,
      `${pages.skipped}`,
    ]);
  } else if (data.pages) {
    const pages = await importPages(data.pages);
    importResult += chrome.i18n.getMessage("configRestoredPages", [
      `${pages.imported}`,
      `${pages.skipped}`,
    ]);
    const config = await importConfig(data.config, hiddenFields);
    importResult += chrome.i18n.getMessage("configRestoredConfig", [
      `${config.imported}`,
      `${config.skipped}`,
    ]);
  } else {
    const config = await importConfig(data, hiddenFields);
    importResult += chrome.i18n.getMessage("configRestoredConfig", [
      `${config.imported}`,
      `${config.skipped}`,
    ]);
  }
  getDefaultConfig().then((config) =>
    requestAnimationFrame(() => {
      dispatch([SetConfig, config]);
      dispatch([SetImportResult, importResult]);
    })
  );
};

const download = (content: string, name: string) => {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    URL.createObjectURL(new Blob([content], { type: "application/json" }))
  );
  element.setAttribute("download", name);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const upload = () => {
  return new Promise<string | undefined>((resolve) => {
    var element = document.createElement("input");
    element.type = "file";
    element.style.display = "none";
    const handle = () => {
      for (let i = 0; i < element.files?.length; i++) {
        const file = element.files?.item(i);
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve(e.target?.result?.toString() ?? undefined);
        reader.readAsText(file);
      }
    };
    document.body.appendChild(element);
    element.addEventListener("change", handle);
    element.click();
    document.body.removeChild(element);
  });
};
