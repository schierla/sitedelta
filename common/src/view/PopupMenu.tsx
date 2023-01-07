import { Dispatch, Dispatchable, MaybeVNode, VNode } from "hyperapp";
import { createPopper, Instance, VirtualElement } from "@popperjs/core";

let popper: Instance | undefined = undefined;

export function showPopupMenu(
  _: Dispatch<any>,
  anchor: VirtualElement | Element | undefined
) {
  hidePopupMenu();
  const node = document.getElementById("popupMenu");
  if (node && anchor) {
    node.style.display = "block";
    popper = createPopper(anchor, node, {
      placement: "bottom-end",
    });
    requestAnimationFrame(() =>
      window.addEventListener("click", hidePopupMenu)
    );
  } else {
    hidePopupMenu();
  }
}
export function hidePopupMenu() {
  if (popper) {
    popper.destroy();
    popper = undefined;
  }
  window.removeEventListener("click", hidePopupMenu);
  const node = document.getElementById("popupMenu");
  if (node) {
    node.style.display = "none";
  }
  popper = undefined;
}

export function PopupMenu<S>(_: {}, ...children: MaybeVNode<S>[]): VNode<S> {
  return (
    <ul
      id="popupMenu"
      class="absolute hidden rounded-lg bg-white text-slate-700 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 p-1 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-200/10"
    >
      {children}
    </ul>
  );
}

export function MenuItem<S>({
  onClick,
  label,
  checked,
}: {
  onClick: Dispatchable<S>;
  label: string;
  checked?: boolean;
}): VNode<S> {
  return (
    <li class="flex items-stretch flex-col">
      <button
        onclick={onClick}
        class="block text-left rounded-md px-2 py-1 hover:bg-indigo-600 hover:text-white"
      >
        {checked !== undefined && (
          <span class="w-4 inline-block">{checked && "✓"} </span>
        )}
        {label}
      </button>
    </li>
  );
}

export function MenuSeparator<S>(): VNode<S> {
  return <li class="border-t border-slate-400/20 my-1"></li>;
}
