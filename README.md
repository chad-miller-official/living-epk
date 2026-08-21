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

The Desktop has two `slots`: one for Icons, and one for Windows.

The Desktop also contains logic to handle mouse clicks and manipulate Icons and Windows according to what is being
clicked. This is useful for, say, telling a Window to lose focus when another Window is clicked, or telling an Icon to
de-highlight if another Icon is clicked.

### Icon

Icons can live in one of two places: the Desktop, or in a Window.

An Icon is a component that contains the following information:

* A graphic
* A title
* A path to a file
* An initializer function for an instance of an Application

When an Icon is double-clicked, this triggers a `launch` event. The Desktop handles this event and does the following:

1. Create a Window.
2. Initialize the Icon's target Application.
3. Attach the Application to the Window (see section: Window for more information)
4. Attach the Window to the Desktop's slot for Windows

### Window

A Window is NOT an Application. A Window is a component that contains an instance of an Application.

A Window consists of a title bar and a slot for an Application.

Windows also contain logic to handle resizing, fullscreening, minimizing, etc.

### Application

An Application is a component that contains three sub-components:

1. A Toolbar
2. The primary application content
3. A Status Bar

The Toolbar and Status Bar are optional. The primary application content is not.

## Kernel space vs user space

The Desktop, Icon, and Window components comprise "kernel space". They form the basis of the "operating system".

The Application, however, lives in "user space". This is the primary gateway with which to add functionality to the website.

The Application has a robust API for defining your own applications and how they behave.