# VS Code plugin for CSScomb

> VS Code plugin for [CSScomb](http://csscomb.com/) — CSS coding style formatter

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

## Keyboard shortcuts

For changes keyboard shortcuts, create a new rule in `File -> Preferences -> Keyboard Shortcuts`:

```json
{
  "key": "ctrl+shift+c",
  "command": "csscomb.processEditor"
}
```

## Custom configuration

Custom configuration is fun and simple: just put `.csscomb.json` file in the project root or your `HOME` directory.

You can read more about available options [in docs](https://github.com/csscomb/csscomb.js/blob/master/doc/options.md).

## Changelog

See the [Releases section of our GitHub project](https://github.com/mrmlnc/vscode-csscomb/releases) for changelogs for each release version.

## License

This software is released under the terms of the MIT license.
