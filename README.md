# atom-file-watchers package
Automatically compiles to the specified type of files.
Currently only supports the Sass, Less, TypeScript. CoffeeScript files. The next version will support custom file types.

## Install

Using `apm`:

```
apm install atom-file-watchers
```

Or search for `atom-file-watchers` in Atom settings view.

## Usage
**Please read documentation before usage**
* Important: Install `node.js`
* Sass files: `npm install -g node-sass`
* Less files: `npm install -g less`
* TypeScript files: `npm install -g typescript`
* CoffeeScript files: `npm install -g coffee-script`

### Placeholder List
**FilePath:** `/usr/top-chao/github/atom-file-watchers/examples/scss/mixins/css3.animate.scss`

<table>
<tr>
  <th>key</th>
  <th>value</th>
</tr>
  <tr>
    <td>$FileName$</td>
    <td>css3.animate.scss</td>
  </tr>
  <tr>
    <td>$FileNameWithoutExtension$</td>
    <td>css3.animate</td>
  </tr>
  <tr>
    <td>$FileNameWithoutAllExtension$</td>
    <td>css3</td>
  </tr>
  <tr>
    <td>$ProjectDir$</td>
    <td>/usr/top-chao/github/atom-file-watchers</td>
  </tr>
  <tr>
    <td>$FileDir$</td>
    <td>$ProjectDir$/examples/scss/mixins</td>
  </tr>
  <tr>
    <td>$FilePath$</td>
    <td>$ProjectDir$/examples/scss/mixins/css3.animate.scss</td>
  </tr>
  <tr>
    <td>$FileDirRelativeToProjectRoot$</td>
    <td>examples/scss/mixins</td>
  </tr>
  <tr>
    <td>$FileDirName$</td>
    <td>mixins</td>
  </tr>
  <tr>
    <td>$FileDirPathFromParent(examples)$</td>
    <td>scss/mixins</td>
  </tr>
  <tr>
    <td>$FileDirPathFromParent(scss)$</td>
    <td>mixins</td>
  </tr>
  <tr>
    <td>$FileDirPathFromParent(abc)$</td>
    <td></td>
  </tr>
  <tr>
    <td>$FileDirPathFromParent()$</td>
    <td></td>
  </tr>
</table>
