# Dispatch Proxy GUI

This is a little GUI for Windows made with Electron.
**It does not include  dispatch-proxy sources and binaries**
Please, visit : [https://github.com/alexkirsz/dispatch-proxy](https://github.com/alexkirsz/dispatch-proxy)

**Warning:** I wrote this GUI __for my personal use__, so I'm sorry if the code is ugly.

## Dependencies (you must install)
- dispatch-proxy
- electron
- optional : electron-packager (to make a standalone .exe)

## To Use

Clone this repository:

```bash
# Clone this repository
git clone https://github.com/steevelefort/dispatch-proxy-gui
# Go into the repository
cd dispatch-proxy-gui
```
Copy dispatch-proxy.exe binary in the new directory then 
```bash
# Install dependencies
npm install

# Run the app with electron
electron .
```
Optionnaly to generate a standalone application :
```bash
electron-packager.cmd . DispatchProxyGUI --platform win32 --overwrite --icon icons\win\app.ico
```

## License

Licensed under MIT