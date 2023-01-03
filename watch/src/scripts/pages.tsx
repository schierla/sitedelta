import { h } from "./hooks/h";
import { t } from "./hooks/t";
import { Action, app, Dispatch, Dispatchable, Subscription } from "hyperapp";
import { PageList, PageSortOrder } from "./components/PageList";
import { getActions, openPages } from "./components/PageListActions";
import {
  PopupMenu,
  MenuItem,
  MenuSeparator,
  showPopupMenu,
  hidePopupMenu,
} from "./components/PopupMenu";
import { SearchIcon } from "./icons/SearchIcon";
import { ExpandIcon } from "./icons/ExpandIcon";
import { Button } from "./components/Button";
import { Index, observeIndex } from "@sitedelta/common/src/scripts/ioUtils";
import { openResource } from "@sitedelta/common/src/scripts/tabUtils";

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

type State = {
  index: Index;
  selectedPages: string[];
  filter: string;
  sortOrder: PageSortOrder;
  isContextMenu: boolean;
};

const SetSelection: Action<State, string[]> = (state, selectedPages) => [
  { ...state, selectedPages },
];

const SetIndex: Action<State, Index> = (state, index) => [{ ...state, index }];

const SetFilter: Action<State, string> = (state, filter) => [
  { ...state, filter },
];

const OpenPages: Action<State, string[]> = (state, pages) => [
  state,
  [openPages, { pages, SetSelection }],
];

const SetSortOrder: Action<State, PageSortOrder> = (state, sortOrder) => [
  { ...state, sortOrder },
];

function virtualElement(pos: { x: number; y: number }) {
  return { getBoundingClientRect: () => new DOMRect(pos.x, pos.y, 0, 0) };
}

const ShowMenuAtElement: Action<State, HTMLElement> = (state, element) => [
  { ...state, isContextMenu: false },
  [showPopupMenu, element],
];

const ShowMenuAtPosition: Action<State, { x: number; y: number }> = (
  state,
  pos
) => [{ ...state, isContextMenu: true }, [showPopupMenu, virtualElement(pos)]];

const OpenConfigurationFromContextMenu: Action<State> = (state) => [
  state,
  [openPage, "manage.htm"],
  hidePopupMenu,
];

const DispatchActionFromContextMenu: Action<State, Dispatchable<State>> = (
  state,
  action
) => [state, [dispatchAction, action], hidePopupMenu];

function openPage(_: Dispatch<State>, name: string) {
  openResource(name);
}

function dispatchAction<S>(dispatch: Dispatch<S>, action: Dispatchable<S>) {
  dispatch(action);
}

const indexSubscription: Subscription<State, any> = [
  (dispatch, _) => {
    return observeIndex((index) =>
      requestAnimationFrame(() => dispatch([SetIndex, index]))
    );
  },
  {},
];

const Content = ({
  index,
  selectedPages,
  filter,
  sortOrder,
  isContextMenu,
}: State) => {
  const filterInput = (
    <div class="relative rounded-sm shadow-sm flex-1">
      <div class="pointer-events-none absolute inset-y-0 left-0 pl-1 flex items-center">
        <SearchIcon />
      </div>
      <input
        class="block w-full h-full rounded-md border-gray-300 dark:bg-slate-800 dark:border-gray-600 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
        value={filter}
        oninput={(_, event: Event) => [
          SetFilter,
          "" + (event.target as HTMLInputElement).value,
        ]}
        placeholder={t("pagesFilter")}
        autoFocus
      />
    </div>
  );

  const actionsButton = (
    <div id="popupButton">
      <Button
        onClick={[ShowMenuAtElement, document.getElementById("popupButton")]}
      >
        <ExpandIcon />
      </Button>
    </div>
  );

  const actions = getActions(index, selectedPages, SetSelection);
  const actionsMenu = (
    <PopupMenu>
      {isContextMenu || [
        <li class="flex items-stretch flex-col px-2 py-1">{t("pagesSort")}</li>,
        <MenuItem
          checked={sortOrder === "title"}
          onClick={(_) => [SetSortOrder, "title"]}
          label={t("pagesSortTitle")}
        />,
        <MenuItem
          checked={sortOrder === "url"}
          onClick={(_) => [SetSortOrder, "url"]}
          label={t("pagesSortUrl")}
        />,
        <MenuItem
          checked={sortOrder === "status"}
          onClick={(_) => [SetSortOrder, "status"]}
          label={t("pagesSortStatus")}
        />,
        <MenuItem
          checked={sortOrder === "nextScan"}
          onClick={(_) => [SetSortOrder, "nextScan"]}
          label={t("pagesSortNextScan")}
        />,
        <MenuSeparator />,
      ]}

      {actions.map(([label, action]) => (
        <MenuItem
          label={label}
          onClick={() => [DispatchActionFromContextMenu, action]}
        />
      ))}
      {actions.length > 0 && <MenuSeparator />}
      <MenuItem
        onClick={OpenConfigurationFromContextMenu}
        label={t("pagesConfiguration")}
      />
    </PopupMenu>
  );

  const pageList = (
    <PageList
      index={index}
      filter={filter}
      sortOrder={sortOrder}
      selectedPages={selectedPages}
      SetSelection={SetSelection}
      OnDblClick={[OpenPages, selectedPages]}
      OnContextMenu={(_, e: MouseEvent) => [
        ShowMenuAtPosition,
        { x: e.clientX, y: e.clientY },
      ]}
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
    <body class="font-sans text-sm flex flex-row h-screen dark:bg-slate-900">
      <div class="flex flex-col gap-1 p-1 border-r border-r-gray-300 dark:border-r-gray-600 border-r-1 flex-1 sm:flex-initial sm:basis-64 lg:basis-96">
        <div class="flex flex-row flex-0 gap-1">
          {filterInput}
          {actionsButton}
        </div>
        {pageList}
        {actionsMenu}
      </div>
      {previewFrame}
    </body>
  );
};

app<State>({
  init: {
    index: {},
    selectedPages: [],
    filter: "",
    sortOrder: "title",
    isContextMenu: false,
  },
  view: (state) => h(<Content {...state} />),
  subscriptions: () => [indexSubscription],
  node: document.body,
});
document.title = t("watchExtensionName");
