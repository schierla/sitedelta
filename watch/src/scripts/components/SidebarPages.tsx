import { Fragment, VNode, h } from "preact";
import { useState } from "preact/hooks";
import { Button } from "./Button";
import "./SidebarPages.css";

export const SidebarPages: (props: {
  children: VNode<{ label: string }>[];
}) => VNode = ({ children }) => {
  const [selectedPage, setSelectedPage] = useState<string>(
    children[0].props.label
  );
  return (
    <Fragment>
      <div class="sidebar">
        {children.map((c) => (
          <Button
            isDefault={c.props.label === selectedPage}
            onClick={() => setSelectedPage(c.props.label)}
          >
            {c.props.label}
          </Button>
        ))}
      </div>
      <div class="main">
        {children.filter((c) => c.props.label === selectedPage)}
      </div>
    </Fragment>
  );
};
