import { FunctionComponent, h, Ref } from "preact";
import "./Button.css";

export const Button: FunctionComponent<{
  onClick: () => void;
  isDefault?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}> = ({ onClick, isDefault, children, buttonRef }) => (
  <button
    ref={buttonRef}
    className={isDefault ? "button default" : "button"}
    onClick={onClick}
  >
    {children}
  </button>
);
