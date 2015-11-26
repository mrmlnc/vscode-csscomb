# VS Code plugin for CSScomb

> VS Code plugin for CSScomb — CSS coding style formatter

## Install

To install, press `F1` and select `Extensions: Install Extensions` and then search for and select `CSScomb`.

## Usage

Press `F1` and run the command named `CSScomb`. Currently the following work fine: `css`, `less`, `sass` and `scss`.

## Supported settings

 * `csscomb.preset` {String|Object} — config's name. Should be one of the following: `csscomb` (*default*), `zen`, `yandex` or an object containing custom configuration.

For example:

```json
{
  "csscomb.preset": "yandex",
  "csscomb.preset": {
    "remove-empty-rulesets": true,
    "always-semicolon": true
  }
}
```

## Custom configuration

Custom configuration is fun and simple: just put `.csscomb.json` file in the project root.

You can read more about available options [in docs](https://github.com/csscomb/csscomb.js/blob/master/doc/options.md).

## License

This software is released under the terms of the MIT license.
