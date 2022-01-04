import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { render, h, Fragment } from "preact";
import { t } from "./hooks/UseTranslation";
import { useEffect, useRef, useState } from "preact/hooks";
import { PageList } from "./components/PageList";
import { getActions, openPages } from "./components/PageListActions";
import { VirtualElement } from "@popperjs/core";
import { PopupMenu, MenuItem, MenuSeparator } from "./components/PopupMenu";
import { ExpandIcon } from "./icons/ExpandIcon";
import { Button } from "./components/Button";
import "./pages.css";

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
    <input
      value={filter}
      onInput={(e) => setFilter("" + (e.target as HTMLInputElement).value)}
      placeholder={t("pagesFilter")}
      autoFocus
    />
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

  const previewFrame = window.matchMedia("(min-width: 45em)").matches && (
    <iframe
      id="preview"
      src={
        selectedPages.length === 1
          ? chrome.runtime.getURL("show.htm?" + selectedPages[0])
          : "about:blank"
      }
    ></iframe>
  );

  return (
    <Fragment>
      <div id="sidebar">
        <div id="title">
          {filterInput}
          {actionsButton}
        </div>
        {pageList}
        {actionsMenu}
      </div>
      {previewFrame}
    </Fragment>
  );
};

render(h(Content, {}), document.body);
document.title = t("watchExtensionName");
