import { FunctionComponent, h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { createPopper, VirtualElement } from "@popperjs/core";

export const PopupMenu: FunctionComponent<{
  anchor: Element | VirtualElement | undefined;
  onClose: () => void;
}> = ({ children, anchor, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (anchor && menuRef.current) {
      const popper = createPopper(anchor, menuRef.current, {
        placement: "bottom-end",
      });
      menuRef.current.style.display = "block";
      window.addEventListener("click", onClose);
      return () => {
        window.removeEventListener("click", onClose);
        if (menuRef.current) menuRef.current.style.display = "none";
        popper.destroy();
      };
    } else {
      if (menuRef.current) menuRef.current.style.display = "none";
    }
  }, [anchor, menuRef]);

  return (
    <div ref={menuRef}>
      <ul class="rounded-lg bg-white text-slate-700 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 p-1">{children}</ul>
    </div>
  );
};

export const MenuItem = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <li class="flex items-stretch flex-col">
    <button onClick={onClick} class="block text-left rounded-md p-1.5 hover:bg-indigo-600 hover:text-white">{label}</button>
  </li>
);

export const MenuSeparator = () => <li class="border-t border-slate-400/20 my-1"></li>;
