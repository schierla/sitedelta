import { Config } from "@sitedelta/common/src/scripts/config";
import * as configUtils from "@sitedelta/common/src/scripts/configUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import { useState, useEffect, useCallback } from "preact/hooks";

export type ConfigAccess = {
  value: Config | undefined;
  update: (update: Partial<Config>) => void;
};

export const useDefaultConfig: () => ConfigAccess = () => {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    configUtils.getDefaultConfig().then(setConfig);
  }, [setConfig]);
  const update = useCallback((update) => {
    configUtils
      .setDefaultConfigProperties(update)
      .then(() => configUtils.getDefaultConfig().then(setConfig));
  }, []);
  return { value: config, update: update };
};

export const usePageConfig: (url: string) => ConfigAccess = (url) => {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    pageUtils
      .getEffectiveConfig(url)
      .then((config) => setConfig(config ?? undefined));
  }, [url, setConfig]);
  const update = useCallback(async (update: Partial<Config>) => {
    for (let key in update) {
      await pageUtils.setConfigProperty(url, key as keyof Config, update[key]);
    }
    setConfig((await pageUtils.getEffectiveConfig(url)) ?? undefined);
  }, []);
  return { value: config, update: update };
};
