import { FunctionComponent, h } from "preact";

export const Button: FunctionComponent<{
  onClick: () => void;
  isDefault?: boolean;
}> = ({ onClick, isDefault, children }) => (
  <button className={isDefault ? "default" : ""} onClick={onClick}>
    {children}
  </button>
);
