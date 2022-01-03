import { FunctionComponent, h } from "preact";
import { HighlightIcon } from "../icons/HighlightIcon";
import "./LoadingScreen.css";

export const LoadingScreen: FunctionComponent = ({}) => (
  <div className="maximized">
    <div id="progress"></div>
    <div id="pulser">
      <HighlightIcon />
    </div>
  </div>
);
