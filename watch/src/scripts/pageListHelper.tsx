import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import * as watchUtils from "@sitedelta/common/src/scripts/watchUtils";
import * as configUtils from "@sitedelta/common/src/scripts/configUtils";
import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { FunctionComponent, h } from "preact";
import { StateUpdater } from "preact/hooks";

export const PageList: FunctionComponent<{
  selectedPages: string[];
  setSelection: (newPages: string[]) => void;
  onDblClick: (newPages: string[]) => void;
  onContextMenu?: (e: MouseEvent) => void;
  index: ioUtils.Index;
  filter?: string;
}> = ({
  selectedPages,
  index,
  filter,
  setSelection,
  onContextMenu,
  onDblClick,
}) => {
  return (
    <select
      size={10}
      multiple
      onDblClick={() => onDblClick(selectedPages)}
      onChange={(e: Event) =>
        setSelection(
          Array.from((e.target as HTMLSelectElement).selectedOptions).map(
            (o) => o.value
          )
        )
      }
      onContextMenu={onContextMenu ? onContextMenu : (e: Event) => {}}
    >
      {Object.keys(index)
        .filter(
          (key) =>
            filter === "" || index[key].title?.indexOf(filter ?? "") !== -1
        )
        .sort((ka, kb) =>
          index[ka].title !== undefined &&
          index[kb].title !== undefined &&
          (index[ka].title?.toLowerCase() ?? "") <
            (index[kb].title?.toLowerCase() ?? "")
            ? 1
            : -1
        )
        .map((key) => {
          const data = index[key];
          var title =
            key +
            (data.nextScan != 0
              ? "\n" +
                chrome.i18n.getMessage(
                  "watchNextScan",
                  new Date(data.nextScan ?? 0).toLocaleString()
                )
              : "");
          const className =
            data.changes === undefined
              ? ""
              : data.changes > 0
              ? "changed"
              : data.changes == 0
              ? "unchanged"
              : data.changes == -1
              ? "failed"
              : "";
          return (
            <option
              key={key}
              value={key}
              title={title}
              className={className}
              selected={selectedPages.indexOf(key) !== -1}
              onContextMenu={() =>
                selectedPages.indexOf(key) === -1 && setSelection([key])
              }
            >
              {"title" in data ? data.title : key}
            </option>
          );
        })}
    </select>
  );
};

function documentParser(content: string): Document {
  return new DOMParser().parseFromString(content, "text/html");
}

export const scanPages = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  for (const url of pages) {
    await watchUtils.scanPage(url, documentParser);
    setSelection((selection: string[]) =>
      selection.filter((page) => page != url)
    );
  }
};

export const markSeen = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  for (const url of pages) {
    await watchUtils.markSeen(url, documentParser);
    setSelection((selection) => selection.filter((page) => page != url));
  }
};

export const deletePages = (pages: string[]) => {
  for (const url of pages) {
    ioUtils.remove(url);
  }
};

export const setWatchDelay = async (pages: string[]) => {
  let oldValue: string | null = null;
  for (var key of pages) {
    var config = await pageUtils.getEffectiveConfig(key);
    if (config != null) {
      if (oldValue === null) oldValue = config.watchDelay + "";
      else if (oldValue != config.watchDelay + "") oldValue = "";
    }
  }
  if (oldValue === null) {
    oldValue = (await configUtils.getDefaultConfig()).watchDelay + "";
  }
  var delay = prompt(chrome.i18n.getMessage("configWatchDelay"), oldValue);
  if (delay !== null)
    for (var key of pages) {
      await pageUtils.setConfigProperty(
        key,
        "watchDelay",
        parseInt(delay || "0")
      );
      await watchUtils.scanPage(key, documentParser);
    }
};

export const openPages = async (
  pages: string[],
  setSelection: StateUpdater<string[]>
) => {
  setSelection(pages);
  if (pages.length === 1) {
    tabUtils.openResource("show.htm?" + pages[0]);
  } else {
    for (const url of pages) {
      await tabUtils.openResourceInBackground("show.htm?" + url);
      setSelection((selection) => selection.filter((page) => page != url));
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};
