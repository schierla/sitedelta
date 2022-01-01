import { runBackgroundScript } from "./background";

const documentParser = (content: string): Document => {
  return new DOMParser().parseFromString(content, "text/html");
};

runBackgroundScript(documentParser);
