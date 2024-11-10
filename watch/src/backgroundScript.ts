import { extractText, sniffCharset } from "@sitedelta/common/src/model/domParseUtils";
import { runBackgroundScript } from "./background";

runBackgroundScript(extractText, sniffCharset);
