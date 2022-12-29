import { Fragment, VNode, h } from "preact";
import { useState } from "preact/hooks";
import { Button } from "./Button";

export const SidebarPages: (props: {
  children: VNode<{ label: string }>[];
}) => VNode = ({ children }) => {
  const [selectedPage, setSelectedPage] = useState<string>(
    children[0].props.label
  );
  return (
    <Fragment>
      <div class="flex flex-col basis-80 pt-16 pr-4 pb-2 pl-12 gap-2">
        {children.map((c) => (
          <Button
            isDefault={c.props.label === selectedPage}
            onClick={() => setSelectedPage(c.props.label)}
          >
            {c.props.label}
          </Button>
        ))}
      </div>
      <div class="flex flex-col flex-1 pt-16 pr-12 pb-2 pl-2 gap-2">
        {children.filter((c) => c.props.label === selectedPage)}
      </div>
    </Fragment>
  );
};
