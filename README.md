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

1. Put a `cssconfig.json` in your project root, or set the config in the setting `csscomb.preset`. You can start with one of the [predefined configs](https://github.com/csscomb/csscomb.js/tree/dev/config) or [generate a config](http://csscomb.com/config). See details in [config docs](https://github.com/csscomb/csscomb.js/blob/dev/doc/configuration.md).
1. Run `CSSComb` in the Command Palette (<kbd>F1</kbd>, <kbd>Ctrl+Shift+P</kbd> on Windows, <kbd>Cmd+Shift+P</kbd> on macOS).

## Supported languages

  * Styles: CSS, Less, Sass, SCSS
  * Styles inside `<style>` or `<style lang="LANGUAGE">` tags: HTML, Vue

    > ⚠️ The plugin does not support formatting when saving template files (HTML, Vue) by `formatOnSave` option and formatting of the selected fragments (selections).

## Supported settings

#### csscomb.preset

  * Type: `Object` or `String`
  * Defaut: `{}`
  * Example: `'~/path/to/file/csscomb.json'` or `'csscomb'`

Config file. Can be built-in config (`csscomb`, `zen`, or `yandex`), path to a config file, or an object containing custom configuration. 

> **Warning!**
>
> If you want to specify a file in the current directory, the path must begin with a `./` or `../` if relative to the current directory. Also you can use HOME directory as `~` symbol.

#### csscomb.ignoreFilesOnSave

  * Type: `Array`
  * Default: `[]`
  * Example: `["variables.less", "mixins/**/*"]`

An optional array of glob-patterns to ignore files on save.

#### csscomb.supportEmbeddedStyles

  * Type: `Boolean`
  * Default: `true`

Support embedded CSS into HTML.

#### csscomb.formatOnSave

  * Type: `Boolean`
  * Default: `false`

Auto format on save.

#### csscomb.syntaxAssociations

  * Type: `Object`
  * Default: `{}`

Configuration of syntax associations.

```json
{
	"csscomb.syntaxAssociations": {
		"postcss": "scss"
	}
}
```

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
