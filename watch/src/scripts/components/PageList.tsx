import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { FunctionComponent, h } from "preact";
import { ChangedIcon } from "../icons/ChangedIcon";
import { FailedIcon } from "../icons/FailedIcon";
import { UnchangedIcon } from "../icons/UnchangedIcon";

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
  const filterTitle = (key: string) =>
    filter === "" || index[key].title?.indexOf(filter ?? "") !== -1;

  const compareTitle = (ka: string, kb: string): 1 | -1 =>
    index[ka].title !== undefined &&
    index[kb].title !== undefined &&
    (index[ka].title?.toLowerCase() ?? "") <
      (index[kb].title?.toLowerCase() ?? "")
      ? 1
      : -1;

  const formatTooltip = (key: string, data: ioUtils.Status) =>
    key +
    (data.nextScan != 0
      ? "\n" +
        chrome.i18n.getMessage(
          "watchNextScan",
          new Date(data.nextScan ?? 0).toLocaleString()
        )
      : "");

  const statusIcon = (changes: number | undefined) =>
    changes === undefined ? (
      <FailedIcon />
    ) : changes > 0 ? (
      <ChangedIcon />
    ) : changes == 0 ? (
      <UnchangedIcon />
    ) : (
      <FailedIcon />
    );

  return (
    <select
      class="w-full block flex-1 p-0 border-gray-300"
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
      onContextMenu={onContextMenu}
    >
      {Object.keys(index)
        .filter(filterTitle)
        .sort(compareTitle)
        .map((key) => {
          const data = index[key];
          return (
            <option
              key={key}
              value={key}
              title={formatTooltip(key, data)}
              selected={selectedPages.indexOf(key) !== -1}
              onContextMenu={() =>
                selectedPages.indexOf(key) === -1 && setSelection([key])
              }
            >
              {statusIcon(data.changes)} {"title" in data ? data.title : key}
            </option>
          );
        })}
    </select>
  );
};
