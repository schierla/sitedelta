import { FunctionComponent, h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { createPopper, VirtualElement } from "@popperjs/core";
import "./PopupMenu.css";

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
      <ul className="menu">{children}</ul>
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
  <li tabIndex={0} onClick={onClick}>
    {label}
  </li>
);

export const MenuSeparator = () => <li className="separator"></li>;
