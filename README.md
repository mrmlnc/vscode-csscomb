# vscode-csscomb

> VS Code plugin for [CSScomb](http://csscomb.com/) — CSS coding style formatter

## Install

  * Press <kbd>F1</kbd> and select `Extensions: Install Extensions`.
  * Search for and select `csscomb`.

See the [extension installation guide](https://code.visualstudio.com/docs/editor/extension-gallery) for details.

## Usage

Press <kbd>F1</kbd> and run the command named `CSSComb`.

## Supported languages

  * CSS
  * Less
  * SCSS
  * Sass

## Supported settings

**csscomb.preset**

  * Type: `Object` or `String`
  * Defaut: `{}`

Config's name. Should be one of the following: `csscomb`, `zen`, `yandex` or an object containing custom configuration or path to config.

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

**csscomb.useLatestCore**

  * Type: `Boolean`
  * Default: `false`

Use CSScomb **v4.0.0** [see](https://github.com/csscomb/csscomb.js/blob/dev/CHANGELOG.md#400---2017-02-16) as [fork without `babel-polyfill`](https://github.com/mrmlnc/csscomb.js/tree/vscode).

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

Custom configuration is fun and simple: just put `.csscomb.json` file in the project root or your `HOME` directory.

You can read more about available options [in docs](https://github.com/csscomb/csscomb.js/blob/master/doc/options.md).

## How to run tests?

  * Close all instances of VS Code
  * Run `npm run build` command

## Changelog

See the [Releases section of our GitHub project](https://github.com/mrmlnc/vscode-csscomb/releases) for changelogs for each release version.

## License

This software is released under the terms of the MIT license.
