# atom-file-watchers (The project stop maintenance)
Save the files auto execute the command <br /> Mainly used to compile Sass, Less, TypeScript, CoffeeScript, ECMAScript 6 and other file

## Install
Using `apm`:

```
apm install atom-file-watchers
```

Or search for `atom-file-watchers` in Atom settings view.

## Usage
Please read documentation before usage
- Important: Install `node.js`
- Sass files: `npm install -g node-sass`
- Less files: `npm install -g less`
- TypeScript files: `npm install -g typescript`
- CoffeeScript files: `npm install -g coffee-script`
- ECMAScript 6 files: `npm install -g babel-cli`
- ......

## Options
- Show success notification

    If you enable. Successful execution the command will give prompt

    _Default:_ `true`

- Parse Sass and Less

    If you enable. Analytical reference relationship between files. [Example: File A reference file B, modification B, will compile A, B does not compile], **Do not mix .sass and .scss file**

    _Default:_ `true`

- _......_

## Placeholder List
- `FilePath` /usr/atom-file-watchers/examples/scss/mixins/css3.animate.scss

Key                                 | Value
----------------------------------- | -----------------------------------------------
`$FileName$`                        | `css3.animate.scss`
`$FileNameWithoutExtension$`        | `css3.animate`
`$FileNameWithoutAllExtension$`     | `css3`
`$ProjectDir$`                      | `/usr/atom-file-watchers`
`$FileDir$`                         | `/usr/atom-file-watchers/examples/scss/mixins/`
`$FilePath$`                        | `$FileDir$/css3.animate.scss`
`$FileDirName$`                     | `mixins`
`$FileDirPathFromParent(examples)$` | `css/mixins`
`$FileDirPathFromParent(scss)$`     | `mixins`
`$FileDirPathFromParent(mixins)$`   | &nbsp;
`$FileDirPathFromParent(abc)$`      | &nbsp;
`$FileDirPathFromParent()$`         | &nbsp;

## Expand
Please create a file `atom-file-watchers-config.json` in the project root directory </br /> Use the name [`Sass`, `Less`, `TypeScript`, `CoffeeScript`, `ES6`] will override configuration. The name is case sensitive

```json
//Save the configuration file to update the config
//$installationDir$ = npm default installation path
//Sass: Override the default settings
//ReactNativeCss: Create a new listener
[
    {
        "name": "Sass",
        "match": "{src,examples}/**/*.scss",
        "path": "$installationDir$/node-sass",
        "command": "$FilePath$ $ProjectDir$/examples/css/$FileDirPathFromParent(scss)$/$FileNameWithoutExtension$.css"
    },
    {
        "name": "ReactNativeCss",
        "match": "**/*.@(sass|scss)",
        "path": "$installationDir$/react-native-css",
        "command": "-i $FilePath$ -o $FileDir$/$FileNameWithoutExtension$.js"
    }
]
```

## minimatch
- `*` matches any string, not including than path separator
- `**` matches any string, including path separators
- `?` matches single character other than path separator

Pattern      | Matches                                     | Does not match
------------ | ------------------------------------------- | ------------------------------------------------
`xxx.*`      | `xxx.yyy`, `xxx.y.z`                        | `abcxxx.yyy`, `xxx.y/z`
`xxx/*/yyy`  | `xxx/abc/yyy`                               | `xxx/yyy`, `xxx/abc/def/yyy`, `xxx/.abc/yyy`
`xxx/**/yyy` | `xxx/abc/yyy`, `xxx/yyy`, `xxx/abc/def/yyy` | `xxx/.abc/yyy`
`xxx/**yyy`  | `xxx/yyy`                                   | `xxx/abc/yyy`, `xxx/abc/def/yyy`, `xxx/.abc/yyy`
`x?y`        | `xAy`                                       | `xy`, `xABy`, `x/y`

- `{foo,bar}` matches "foo" and "bar"
- `{1..3}` matches "1", "2" and "3"

Pattern     | Matches                | Does not match
----------- | ---------------------- | --------------
`{foo,bar}` | `foo`, `bar`           | `baz`
`{x,y/*}/z` | `x/z`, `y/a/z`         | `y/z`
`foo{1..3}` | `foo1`, `foo2`, `foo3` | `foo`, `foo0`

- `!`-prefixed patterns invert match

Pattern | Matches    | Does not match
------- | ---------- | --------------
`!abc`  | `a`, `xyz` | `abc`

- `#`-prefixed patterns are treated as comments and match nothing
- `\#` to escape

Pattern | Matches | Does not match
------- | ------- | --------------
`#abc`  |         | `abc`, `#abc`
`\#abc` | `#abc`  | `abc`

- `+(pattern)` matches one or more repetition of pattern (like `/(pattern)+/`)
- `*(pattern)` matches zero or more repetition of pattern (like `/(pattern)*/`)
- `?(pattern)` matches zero or one repetition of pattern (like `/(pattern)?/`)
- `@(pattern)` matches pattern (like `/(pattern)/`)
- `!(pattern)` matches anything except the pattern (like `/(?!pattern)/`)
- pattern can be joined by `|` (like `/(foo|bar)/`)

Pattern                     | Matches                      | Does not match
--------------------------- | ---------------------------- | --------------
`a+(xy)`                    | `axy`, `axyxy`               | `a`
`a*(xy)`                    | `a`, `axy`, `axyxy`          |
`a@(xy)`                    | `axy`                        | `a`, `axyxy`
`a!(xy)`                    | `ax`                         | `axy`, `axyz`
<code>a+(x&#x7C;y*z)</code> | `axx`, `ayzxyzxx`, `axyAAAz` | `axy`, `a`
