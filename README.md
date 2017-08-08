# vscode-csscomb

> VS Code plugin for [CSScomb](http://csscomb.com/) — CSS coding style formatter.

## Donate

If you want to thank me, or promote your Issue.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/mrmlnc)

> Sorry, but I have work and support for plugins and modules requires some time after work. I will be glad of your support or PR's.

## Install

  * Press <kbd>F1</kbd> and select `Extensions: Install Extensions`.
  * Search for and select `csscomb`.

See the [extension installation guide](https://code.visualstudio.com/docs/editor/extension-gallery) for details.

## Usage

Press <kbd>F1</kbd> and run the command named `CSSComb`.

## Supported languages

  * Styles: CSS, Less, Sass, SCSS
  * Styles inside `<style>` or `<style lang="LANGUAGE">` tags: HTML, Vue

## Supported settings

**csscomb.preset**

  * Type: `Object` or `String`
  * Defaut: `{}`

Config's name. Should be one of the following: `csscomb`, `zen`, `yandex` or an object containing custom configuration or path to config. You can use http://csscomb.com/config to easily generate a config file.

> **Warning!**
>
> If you want to specify a file in the current directory, the path must begin with a `./` or `../` if relative to the current directory. Also you can use HOME directory as `~` symbol.

**csscomb.formatOnSave**

  * Type: `Boolean`
  * Default: `false`

Auto format on save.

**csscomb.ignoreFilesOnSave**

  * Type: `Array`
  * Default: `[]`
  * Example: `["variables.less", "mixins/**/*"]`

An optional array of glob-patterns to ignore files on save.

For example:

```json
{
  "csscomb.formatOnSave": true,
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
  "command": "csscomb.execute"
}
```

## Custom configuration

We support the following configs:

  * `.csscomb.json` or `csscomb.json`
  * `.csscomb.js` or `csscomb.js`
  * Path in the `CSSCOMB_CONFIG` env variable
  * Config in the `csscombConfig` field in the `package.json` file

Custom configuration is fun and simple: just put `.csscomb.json` file in the project root or your `HOME` directory.

You can read more about available options [in docs](https://github.com/csscomb/csscomb.js/blob/master/doc/options.md).

## Changelog

See the [Releases section of our GitHub project](https://github.com/mrmlnc/vscode-csscomb/releases) for changelogs for each release version.

## License

This software is released under the terms of the MIT license.
