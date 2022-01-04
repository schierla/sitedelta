import { Fragment, FunctionComponent, h } from "preact";
import "./SidebarPage.css";

export const SidebarPage: FunctionComponent<{ label: string }> = ({
  label,
  children,
}) => {
  return (
    <Fragment>
      <h1 className="sidebarpage">{label}</h1>
      {children}
    </Fragment>
  );
};
