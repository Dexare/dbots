import { DexareModule, DexareClient, BaseConfig } from 'dexare';
import { Poster } from 'dbots';

export interface DBotsConfig extends BaseConfig {
  dbots?: DBotsModuleOptions;
}

export interface DBotsModuleOptions {
  keys?: { [service: string]: string };
  interval?: number;
  autopost?: boolean;
  customServices?: any[];
}

export default class DBotsModule<T extends DexareClient<DBotsConfig>> extends DexareModule<T> {
  private _keys?: { [service: string]: string };
  private _interval?: number;
  private _customServices?: any[];
  /** The poster for the client. This gets created when the client is ready. */
  poster?: Poster;

  constructor(client: T) {
    super(client, {
      name: 'dbots',
      description: 'A module for the NPM package dbots'
    });

    this.filePath = __filename;
  }

  /** @hidden */
  load() {
    this.registerEvent('ready', this.onReady.bind(this));
  }

  /** @hidden */
  unload() {
    this.unregisterAllEvents();
    if (this.poster) this.poster.stopInterval();
  }

  /** The keys for the poster. Defaults to `dbots.keys` in the config. */
  get keys() {
    if (!this._keys) this._keys = (this.client.config.dbots && this.client.config.dbots.keys) || {};
    return this._keys;
  }

  set keys(keys) {
    this._keys = keys;
    if (this.poster) this.poster.apiKeys = keys;
  }

  /** The keys for the poster. Defaults to `dbots.customServices` in the config. */
  get customServices() {
    if (!this._customServices)
      this._customServices = (this.client.config.dbots && this.client.config.dbots.customServices) || [];
    return this._customServices;
  }

  set customServices(customServices) {
    this._customServices = customServices;
    if (this.poster) this.poster.customServices = customServices;
  }

  /** The interval for the poster. Defaults to `dbots.interval` in the config. */
  get interval() {
    if (this._interval === undefined)
      this._interval = (this.client.config.dbots && this.client.config.dbots.interval) || 1800000;
    return this._interval;
  }

  set interval(interval) {
    this._interval = interval;
    if (this.poster) this.poster.startInterval(interval);
  }

  /** Short-hand for poster.startInterval */
  startInterval(interval?: number) {
    return this.poster?.startInterval(interval || this.interval);
  }

  onReady() {
    if (!this.poster) {
      this.poster = new Poster({
        client: this.client.bot,
        apiKeys: this.keys,
        useSharding: false,
        clientLibrary: 'eris'
      });

      // Logging
      this.poster.addHandler('autopostSuccess', (result) => {
        let hostname: string;
        if (Array.isArray(result))
          hostname = result.map((r) => (r as any).request.socket.servername).join(', ');
        else hostname = (result as any).request.socket.servername;

        this.logger.log(`Auto-posted to ${hostname}.`);
      });

      this.poster.addHandler('autopostFail', (errors) => {
        const errs = Array.isArray(errors) ? errors : [errors];

        for (const err of errs) {
          const url = (err as any).config?.url;
          const hostname = url ? new URL(url).hostname : '[unknown]';

          this.logger.error(`Failed to auto-post to ${hostname}.`, err);
        }
      });

      this.logger.log('Initialized poster.');
    }

    const autopost =
      this.client.config.dbots?.autopost !== undefined ? this.client.config.dbots.autopost : true;

    if (Object.keys(this.keys).length && autopost) {
      this.poster.startInterval(this.interval);
      this.poster
        .post()
        .then((r) => this.poster!.runHandlers('autopostSuccess', r))
        .catch((e) => this.poster!.runHandlers('autopostFail', e));
    }
  }
}
