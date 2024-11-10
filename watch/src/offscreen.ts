import { sniffCharset, extractText } from "@sitedelta/common/src/model/domParseUtils";

chrome.runtime.onMessage.addListener((message, _, response) => {
    if(message.command == "extractText") response(extractText(message.data.content, message.data.config));
    if(message.command == "sniffCharset") response(sniffCharset(message.data.content));
});