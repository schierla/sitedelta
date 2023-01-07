import { Config } from "./config";

export type Index = Record<string, Status>;

export interface Status {
	changes?: number;
	nextScan?: number;
	title?: string;
}

export function clean(url: string): string {
	return url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
}

export async function getConfig(): Promise<Partial<Config>> {
	var config = await _get("config");
	if(config) return config as Partial<Config>; else return {};
}

export async function setConfig(config: Partial<Config>): Promise<void> {
	await _set("config", config);
}

export async function listIndex(): Promise<Index> {
	var index = await _get("index");
	if(index) return index as Index; else return {};
}

export function observeIndex(observer: (index: Index) => void) {
	const listener = (changes: any, scope: string) => {
		if (scope == "local" && "index" in changes) {
			observer(changes["index"].newValue as Index);
		}
	}
	chrome.storage.onChanged.addListener(listener);
	listIndex().then(observer);
	return () => chrome.storage.onChanged.removeListener(listener);
}

export async function findInIndex<T>(selector: (url: string, status: Status) => T | null): Promise<T[]> {
	var index = await listIndex();
	var ret: T[] = [];
	if (index) {
		for (var url in index) {
			var result = selector(url, index[url]);
			if (result !== null) ret.push(result);
		}
	}
	return ret;
}

export async function setInIndex(url: string, status: Status) {
	var index = await listIndex();
	index[clean(url)] = status;
	await _set("index", index);
}

export async function get(url: string, key: string): Promise<any> {
	var storagekey = clean(url);
	var data = await _get(storagekey);
	if (data && key in data) {
		return data[key];
	} else {
		return null; 
	}
}

export async function put(url: string, key: string, data: any): Promise<void> {
	var storagekey = clean(url);
	var olddata = await _get(storagekey);
	if (!olddata) {
		olddata = {};
		await setInIndex(url, {});
	}
	olddata[key] = data;
	await _set(storagekey, olddata);
}

export async function remove(url: string): Promise<void> {
	var storagekey = clean(url);
	await _remove(storagekey);
	var index = await _get("index");
	delete index[url];
	await _set("index", index);
}

async function _get(key: string): Promise<any> {
	return new Promise(resolve => {
		chrome.storage.local.get(key, data => {
			if(key in data) 
				resolve(data[key]); 
			else 
				resolve(null); 
		});
	});
}

async function _set(key: string, value: any): Promise<void> {
	var data = {}; 
	data[key] = value;
	return new Promise(resolve => {
		chrome.storage.local.set(data, resolve);
	});
}

async function _remove(key: string): Promise<void> {
	return new Promise(resolve => {
		chrome.storage.local.remove(key, resolve);
	});
}