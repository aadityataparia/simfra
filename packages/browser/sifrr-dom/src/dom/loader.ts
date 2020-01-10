import config from './config';

class Loader {
  private static all = {};

  private _exec: Promise<unknown>;
  public readonly elementName: string;
  public readonly url: string;

  constructor(elemName: string, url?: string) {
    if (!fetch) throw Error('Sifrr.Dom.load requires window.fetch API to work.');

    if ((<typeof Loader>this.constructor).all[elemName])
      return (<typeof Loader>this.constructor).all[elemName];
    this.elementName = elemName;
    (<typeof Loader>this.constructor).all[this.elementName] = this;
    this.url = url;
  }

  executeScripts() {
    this._exec =
      this._exec ||
      Promise.resolve(null)
        .then(() => (<typeof Loader>this.constructor).executeJS(this.getUrl()))
        .catch((e: any) => {
          console.error(e);
          console.log(`File for '${this.elementName}' gave error.`);
        });
    return this._exec;
  }

  getUrl() {
    if (this.url) return this.url;
    if (config.urls[this.elementName]) return config.urls[this.elementName];
    if (typeof config.url === 'function') return config.url(this.elementName);
    throw Error(
      `Can not get url for element: ${this.elementName}. Provide url in load or set urls or url function in config.`
    );
  }

  private static getFile(url: RequestInfo) {
    return window.fetch(url).then(resp => resp.text());
  }

  private static executeJS(url: string): Promise<unknown> {
    return this.getFile(url).then(script => {
      return new Function(script + `\n //# sourceURL=${url}`).call(window);
    });
  }
}

export default Loader;
