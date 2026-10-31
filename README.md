# Living EPK

## What it is

This is a place that serves as:

* My personal home page
* An EPK for my bands
* A perpetually updated repository of personal media related to both of the above

## How this whole thing works

From bottom to top:

### Desktop

The Desktop is the core component. It is the single component within which everything lives.

The Desktop has three `slots`:

* One for Icons
* One for Windows
* One for fullscreen Apps

The Desktop also contains logic to handle mouse clicks and manipulate Icons and Windows according to
what is being
clicked. This is useful for, say, telling a Window to lose focus when another Window is clicked, or
telling an Icon to
de-highlight if another Icon is clicked.

### Icon

Icons can live in one of two places: the Desktop, or in a Window.

An Icon is a component that contains the following information:

* A graphic
* A title
* A path to a file
* An initializer function for an instance of an Application

When an Icon is double-clicked, this triggers a `launch` event. The Desktop handles this event and
does the following:

1. Create a Window.
2. Initialize the Icon's target Application.
3. Attach the Application to the Window (see section: Window for more information)
4. Attach the Window to the Desktop's slot for Windows

### Window

A Window is NOT an Application. A Window is a component that contains an instance of an Application.

A Window consists of a title bar and a slot for an Application.

Windows also contain logic to handle resizing, fullscreening, minimizing, etc.

### File System

The following is a brief overview of the data types modeling the website's underlying file store.

#### FsRecord

Upon first visit, the site populates the browser's IndexedDB with structures called `FsRecord`s.

An `FsRecord` contains the following data:

* The path to the folder
* The relative URL to a JSON file on the server containing metadata for the files in the folder
  (see: `FolderNode` below)
* An array of paths to nested folders

_**The FsRecord type is for kernel use only and should never need to be touched by the user.**_

#### FolderNode

When the UI needs to render the contents of a folder, for example in the File Explorer, it calls the
`loadFolderNode()` function exported by `lib/fs`. This function fetches the `FsRecord` associated
with a provided path from IndexedDB and returns a `FolderNode`, which contains the following data:

* The path to the folder
* An array of file metadata representing the files in the folder
* An array of folder metadata representing nested folders in the folder

The latter two data types are modeled via `LinkNode` data types.

#### LinkNode

A `LinkNode` is analogous to Unix's beloved `inode`. It contains the following data:

* The type of the `LinkNode`: either a `folder` or a `file`.
* The relative path to the file that the `LinkNode` represents on the server
    * If the `LinkNode`'s type is `file`, then this is the actual file itself.
    * If the `LinkNode`'s type is `folder`, then this is the `FolderNode` representing the folder.
* The timestamp of the file. This is purposely vague: it could be the created date, or it could be
  the last modified date.

Additional metadata fields may be implemented at a later date.

### Application

An Application is a component that contains three sub-components:

1. A Toolbar
2. The primary application content
3. A Status Bar

The Toolbar and Status Bar are optional. The primary application content is not.

#### Full-screen applications

If an Application is launched with `fullscreen: true` in its launch options, then it is launched
with no encapsulating
window, and is inserted into the Desktop's `fullscreen` slot. All other behavior remains the same.

## Kernel space vs user space

The Desktop, Icon, and Window components comprise "kernel space". They form the basis of the
"operating system".

The Application, however, lives in "user space". This is the primary gateway with which to add
functionality to the
website.

The Application has a robust API for defining your own applications and how they behave.

## Defining an application

1. Define two string properties: `windowTitle` and `windowIcon`, for the title and icon that the
   containing window
   should have. Set sensible defaults for both. Keep the icon file in `/public/img/`.

```typescript
@property({type: String})
windowTitle = 'My App'

@property({type: String})
windowIcon = '/img/my-app.ico'
```

2. Begin with a `div` with `app` as its class.

```html

<div class="app">
</div>
```

3. (OPTIONAL) If the app should have a toolbar, put an `epk-toolbar` at the top with `toolbar` as
   its `id`. Don't forget
   to give
   it a `.toolbarSpec` property, and give your `div.app` element the base `EpkApp.handleClick()` as
   its click handler (or override it with your own, but make sure the supermethod is called too).

Example 1:

```typescript
const toolbarSpec: ToolbarSpec[] = [
  {
    ... // see: lib/toolbar.ts for type definitions
  }
]

...

handleClick(event
:
Event
)
{
  super.handleClick(event)
  // Additional click-handling logic
}
```

```html

<div class="app" @click="${this.handleClick}">
  <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
</div>
```

4. Define the content. Give it `content` as its class.

```html

<div class="app">
  <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
  <div class="content">
    <p>Hello, world!</p>
  </div>
</div>
```

5. (OPTIONAL) Give it a status
   bar [as specified in the docs for XP.css](https://botoxparty.github.io/XP.css/#status-bar).

```html

<div class="app">
  <epk-toolbar class="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
  <div class="content">
    <p>Hello, world!</p>
  </div>
  <div class="status-bar">
    <p class="status-bar-field">Hi!</p>
  </div>
</div>
```

That's it!