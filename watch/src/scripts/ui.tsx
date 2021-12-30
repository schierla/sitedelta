import { FunctionComponent, Fragment, h } from "preact";

export const t = (key: string) => chrome.i18n.getMessage(key);

export const Button: FunctionComponent<{ onClick: () => void, isDefault?: boolean }> = ({
  onClick,
  isDefault,
  children,
}) => (
  <button className={`browser-style${isDefault ? " default":""}`} onClick={onClick}>
    {children}
  </button>
);
