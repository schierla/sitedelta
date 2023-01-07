import { Index, Status } from "@sitedelta/common/src/model/ioUtils";
import { Dispatchable } from "hyperapp";

export type PageSortOrder = "title" | "url" | "status";

export const PageList = ({
  sortOrder = "title",
  selectedPages,
  SetSelection,
  OnDblClick,
  OnContextMenu,
  index,
  filter,
}: {
  sortOrder?: PageSortOrder;
  selectedPages: string[];
  SetSelection: Dispatchable<any, string[]>;
  OnDblClick: Dispatchable<any>;
  OnContextMenu?: Dispatchable<any, MouseEvent>;
  index: Index;
  filter?: string;
}) => {
  const filterTitle = (key: string) =>
    filter === "" || index[key].title?.indexOf(filter ?? "") !== -1;

  const compare: Record<PageSortOrder, (ka: string, kb: string) => 1 | -1> = {
    url: (ka, kb) => (ka < kb ? -1 : 1),
    status: (ka, kb) =>
      (index[ka].changes ?? -1) < (index[kb].changes ?? -1) ? 1 : -1,
    title: (ka, kb) =>
      (index[ka].title?.toLowerCase() ?? "") <
      (index[kb].title?.toLowerCase() ?? "")
        ? -1
        : 1,
  };

  const formatTooltip = (key: string, _: Status) => key;

  const statusClass = (changes: number | undefined) =>
    changes === undefined
      ? "bg-failed"
      : changes > 0
      ? "bg-changed"
      : changes == 0
      ? "bg-unchanged"
      : "bg-failed";

  return (
    <select
      class="w-full block flex-1 p-0 border-gray-300  dark:bg-slate-800 dark:text-slate-200 dark:border-gray-600"
      size={10}
      multiple
      ondblclick={OnDblClick}
      onchange={(_, e: Event) => [
        SetSelection,
        Array.from((e.target as HTMLSelectElement).selectedOptions).map(
          (o) => o.value
        ),
      ]}
      oncontextmenu={OnContextMenu}
    >
      {Object.keys(index)
        .filter(filterTitle)
        .sort(compare[sortOrder])
        .map((key) => {
          const data = index[key];
          return (
            <option
              key={key}
              value={key}
              title={formatTooltip(key, data)}
              class={
                statusClass(data.changes) + " bg-no-repeat bg-[0.25rem] pl-7"
              }
              selected={selectedPages.indexOf(key) !== -1}
              oncontextmenu={() =>
                selectedPages.indexOf(key) === -1
                  ? [SetSelection, [key]]
                  : [SetSelection, selectedPages]
              }
            >
              {"title" in data ? data.title : key}
              {"\xa0"}
            </option>
          );
        })}
    </select>
  );
};
