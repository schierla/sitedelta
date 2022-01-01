import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import { render, h, Fragment, FunctionComponent } from "preact";
import { t } from "./ui";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  deletePages,
  markSeen,
  openPages,
  PageList,
  scanPages,
  setWatchDelay,
} from "./pageListHelper";
import { createPopper, VirtualElement } from "@popperjs/core";
import "../styles/pages.css";

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

const Menu: FunctionComponent = ({ children }) => (
  <ul className="menu">{children}</ul>
);
const MenuItem = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <li tabIndex={0} onClick={onClick}>
    {label}
  </li>
);

const Content = () => {
  const [index, setIndex] = useState<ioUtils.Index>({});
  const [selectedPages, setSelection] = useState<string[]>([]);
  useEffect(() => ioUtils.observeIndex(setIndex), [setIndex]);
  const [filter, setFilter] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<Element | VirtualElement>();
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (menuAnchor && menuRef.current) {
      const popper = createPopper(menuAnchor, menuRef.current, {
        placement: "bottom-end",
      });
      menuRef.current.style.display = "block";
      const listener = () => setMenuAnchor(undefined);
      window.addEventListener("click", listener);
      return () => {
        window.removeEventListener("click", listener);
        if (menuRef.current) menuRef.current.style.display = "none";
        popper.destroy();
      };
    } else {
      if (menuRef.current) menuRef.current.style.display = "none";
    }
  }, [menuAnchor, menuRef]);

  return (
    <Fragment>
      <div id="sidebar">
        <div id="title">
          <input
            value={filter}
            onInput={(e) =>
              setFilter("" + (e.target as HTMLInputElement).value)
            }
            placeholder={t("pagesFilter")}
            autofocus
          />
          <button
            ref={expandButtonRef}
            class="browser-style expander"
            onClick={() =>
              menuAnchor === undefined &&
              setMenuAnchor(expandButtonRef.current ?? undefined)
            }
          ></button>
        </div>
        <PageList
          index={index}
          filter={filter}
          selectedPages={selectedPages}
          setSelection={setSelection}
          onDblClick={() => openPages(selectedPages, setSelection)}
          onContextMenu={(e: MouseEvent) =>
            setMenuAnchor({
              getBoundingClientRect: () =>
                new DOMRect(e.clientX, e.clientY, 0, 0),
            })
          }
        />

        <div ref={menuRef} class="buttons browser-style">
          <Menu>
            {selectedPages.length == 0 && (
              <Fragment>
                <MenuItem
                  onClick={() => scanPages(Object.keys(index), setSelection)}
                  label={t("pagesScanAll")}
                />
                <MenuItem
                  onClick={() => markSeen(Object.keys(index), setSelection)}
                  label={t("pagesMarkSeenAll")}
                />
                <MenuItem
                  onClick={() =>
                    openPages(
                      Object.keys(index).filter(
                        (key) => (index[key].changes ?? 0) > 0
                      ),
                      setSelection
                    )
                  }
                  label={t("pagesOpenChanged")}
                />
              </Fragment>
            )}
            {selectedPages.length == 1 && (
              <Fragment>
                <MenuItem
                  onClick={() => scanPages(selectedPages, setSelection)}
                  label={t("pagesScanOne")}
                />
                <MenuItem
                  onClick={() => markSeen(selectedPages, setSelection)}
                  label={t("pagesMarkSeenOne")}
                />
                <MenuItem
                  onClick={() => deletePages(selectedPages)}
                  label={t("pagesDeleteOne")}
                />
                <MenuItem
                  onClick={() => setWatchDelay(selectedPages)}
                  label={t("pagesWatchDelay")}
                />
                <MenuItem
                  onClick={() => openPages(selectedPages, setSelection)}
                  label={t("pagesOpenOne")}
                />
              </Fragment>
            )}
            {selectedPages.length > 1 && (
              <Fragment>
                <MenuItem
                  onClick={() => scanPages(selectedPages, setSelection)}
                  label={t("pagesScanMultiple")}
                />
                <MenuItem
                  onClick={() => markSeen(selectedPages, setSelection)}
                  label={t("pagesMarkSeenMultiple")}
                />
                <MenuItem
                  onClick={() => deletePages(selectedPages)}
                  label={t("pagesDeleteMultiple")}
                />
                <MenuItem
                  onClick={() => setWatchDelay(selectedPages)}
                  label={t("pagesWatchDelay")}
                />
                <MenuItem
                  onClick={() => openPages(selectedPages, setSelection)}
                  label={t("pagesOpenMultiple")}
                />
              </Fragment>
            )}
            <MenuItem
              onClick={() => tabUtils.openResource("manage.htm")}
              label={t("pagesConfiguration")}
            />
          </Menu>
        </div>
      </div>

      <iframe
        id="preview"
        src={
          selectedPages.length === 1
            ? chrome.runtime.getURL("show.htm?" + selectedPages[0])
            : "about:blank"
        }
      ></iframe>
    </Fragment>
  );
};

render(h(Content, {}), document.body);
document.title = t("watchExtensionName");
