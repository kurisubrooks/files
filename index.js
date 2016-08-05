const { app, BrowserWindow } = require("electron")

let window = null

let start = function() {
    let options = {
        minWidth: 700,
        minHeight: 460,
        width: 900,
        height: 550,
        icon: "icon.png",
        frame: false,
        show: false
    }

    window = new BrowserWindow(options)
    window.loadURL(`file://${__dirname}/app/index.html`)
    window.once("ready-to-show", () => window.show())
    window.on("closed", () => {
        window = null
    })
}

app.on("ready", start)
