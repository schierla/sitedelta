import { Fragment, FunctionComponent, h } from "preact";

export const ConfigSection: FunctionComponent<{ label: string }> = ({
  label,
  children,
}) => (
  <Fragment>
    <div style={{ fontWeight: 600, marginTop: "8px" }}>{label}</div>
    {children}
  </Fragment>
);
