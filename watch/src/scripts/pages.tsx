import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { render, h, Fragment } from "preact";
import { t } from "./hooks/UseTranslation";
import { useEffect, useRef, useState } from "preact/hooks";
import { PageList } from "./components/PageList";
import { getActions, openPages } from "./components/PageListActions";
import { VirtualElement } from "@popperjs/core";
import { PopupMenu, MenuItem, MenuSeparator } from "./components/PopupMenu";
import { SearchIcon } from "./icons/SearchIcon";
import { ExpandIcon } from "./icons/ExpandIcon";
import { Button } from "./components/Button";

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

const Content = () => {
  const [index, setIndex] = useState<ioUtils.Index>({});
  const [selectedPages, setSelection] = useState<string[]>([]);
  useEffect(() => ioUtils.observeIndex(setIndex), [setIndex]);
  const [filter, setFilter] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<Element | VirtualElement>();
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  const filterInput = (
    <div class="relative rounded-sm shadow-sm flex-1">
      <div class="pointer-events-none absolute inset-y-0 left-0 pl-1 flex items-center">
        <SearchIcon />
      </div>
      <input
        class="block w-full h-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
        value={filter}
        onInput={(e) => setFilter("" + (e.target as HTMLInputElement).value)}
        placeholder={t("pagesFilter")}
        autoFocus
      />
    </div>
  );

  const actionsButton = (
    <Button
      buttonRef={expandButtonRef}
      onClick={() =>
        menuAnchor === undefined &&
        setMenuAnchor(expandButtonRef.current ?? undefined)
      }
    >
      <ExpandIcon />
    </Button>
  );

  const actionsMenu = (
    <PopupMenu anchor={menuAnchor} onClose={() => setMenuAnchor(undefined)}>
      {getActions(index, selectedPages, setSelection).map(([label, action]) => (
        <MenuItem key={label} label={label} onClick={action} />
      ))}
      <MenuSeparator />
      <MenuItem
        onClick={() => tabUtils.openResource("manage.htm")}
        label={t("pagesConfiguration")}
      />
    </PopupMenu>
  );

  const pageList = (
    <PageList
      index={index}
      filter={filter}
      selectedPages={selectedPages}
      setSelection={setSelection}
      onDblClick={() => openPages(selectedPages, setSelection)}
      onContextMenu={(e: MouseEvent) =>
        setMenuAnchor({
          getBoundingClientRect: () => new DOMRect(e.clientX, e.clientY, 0, 0),
        })
      }
    />
  );

  const previewFrame = window.matchMedia("(min-width: 640px)").matches && (
    <iframe
      class="flex-1 hidden sm:block"
      src={
        selectedPages.length === 1
          ? chrome.runtime.getURL("show.htm?" + selectedPages[0])
          : "about:blank"
      }
    ></iframe>
  );

  return (
    <div class="flex flex-row h-screen font-sans">
      <div class="flex flex-col gap-1 p-1 border-r border-r-gray-300 border-r-1 flex-1 sm:flex-initial sm:basis-64 lg:basis-96">
        <div class="flex flex-row flex-0 gap-1">
          {filterInput}
          {actionsButton}
        </div>
        {pageList}
        {actionsMenu}
      </div>
      {previewFrame}
    </div>
  );
};

render(h(Content, {}), document.body);
document.title = t("watchExtensionName");
