import { Config } from "./config";
import * as textUtils from "./textUtils";

export function extractText(content: string, config: Config) {
	const document = new DOMParser().parseFromString(content, "text/html");
	return textUtils.getText(document, config);
}

export function sniffCharset(content: string) {
	const sniffDoc = new DOMParser().parseFromString(content, "text/html");
	const metas = sniffDoc.getElementsByTagName("meta");
	const charsets: string[] = [];
	for (let i = 0; i < metas.length; i++) {
		const meta = metas.item(i);
		const charset = meta?.getAttribute("charset");
		if (charset) charsets.push(charset);
		const httpEquiv = meta?.getAttribute("http-equiv");
		const metaContent = meta?.getAttribute("content");
		if (httpEquiv && httpEquiv.toLowerCase() == "content-type" && metaContent) {
			const metaCharset = textUtils.getCharsetFromContentType(metaContent);
			if (metaCharset) charsets.push(metaCharset);
		}
	}
	return charsets;
}
