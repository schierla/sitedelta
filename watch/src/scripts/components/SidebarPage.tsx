import { Fragment, FunctionComponent, h } from "preact";

export const SidebarPage: FunctionComponent<{ label: string }> = ({
  label,
  children,
}) => {
  return (
    <Fragment>
      <h1 class="mb-4 text-xl">{label}</h1>
      <div class="flex flex-col gap-4">{children}</div>
    </Fragment>
  );
};
