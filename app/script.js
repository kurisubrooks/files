window.$ = window.jQuery = require("jquery")
const { remote, shell } = require("electron")
const moment = require("moment")
const path = require("path")
const fs = require("fs")
const os = require("os").platform()
const _ = require("lodash")

let lastDir = null
let currentDir = null
let config = require("./config.json")

let platform =
    os === "darwin" ? "mac" :
    os === "win32"  ? "win" :
    os === "linux"  ? "linux" : "unknown"

let fileType = function(filename) {
    let types = require("./modules/files.json")
    let split = filename.toLowerCase().split(".")
    let last = split[split.length - 1]

    if (last in types) {
        return "file_" + types[last]
    } else {
        return "file"
    }
}

let isHidden = function(path) {
    let blacklist = require("./modules/hidden.json")
    let check = (/(^|\/)\.[^\/\.]/g).test(path)

    if (blacklist[platform].indexOf(path) >= 0) {
        return true
    } else if (check) {
        return true
    } else {
        return false
    }
}

let normalizeSize = function(bytes) {
    if (bytes === 0) return "0.00 B"
    var e = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, e))) + " " + " KMGTP".charAt(e) + "B"
}

let openFile = function(filedir) {
    shell.openItem(filedir)
}

let upDir = function(dirname) {
    if (dirname === path.join(dirname, "../")) return
    changeDir(path.join(dirname, "../"))
}

let changeDir = function(dirname) {
    currentDir = dirname
    //lastDir = !lastDir ? dirname : ""

    fs.readdir(dirname, (error, files) => {
        if (error) throw error

        let $title = $("#path").text(dirname)
        let $parent = $("#files")
        let $page = $("<tbody></tbody>")

        _.forEach(files.sort(), (files) => {
            let name = files
            let file = dirname + "/" + files
            let home = os.platform === "win32" ? process.env.USERPROFILE : process.env.HOME

            fs.stat(file, function(err, stats) {
                let type = function() {
                    if (stats.isFile()) {
                        return "file"
                    } else if (stats.isDirectory()) {
                        let split = name.toLowerCase().split(".")
                        let last = split[split.length - 1]

                        if (last === "app") {
                            return "file"
                        } else {
                            return "folder"
                        }
                    } else {
                        return undefined
                    }
                }

                let location = file
                let size = type() == "folder" ? "—" : normalizeSize(stats.size)
                let modified = moment(stats.mtime).format("MMM D, YYYY")
                let invisible = isHidden(name)
                let check = type() == "file" ? fileType(name) : null
                let icon = function() {
                    if (type() === "file" && !invisible) {
                        return `${fileType(name)}`
                    } else if (type() === "folder") {
                        if (dirname === home && name === "Google Drive") {
                            return "folder_google_drive"
                        } else {
                            return "folder"
                        }
                    } else {
                        return "file"
                    }
                }

                if (!config.showHiddenFiles && invisible) return

                let $contain = $("<tr></tr>")
                let $name = $("<td></td>")
                let $size = $("<td></td>")
                let $modif = $("<td></td>")

                if (invisible) {
                    $name.addClass("invisible")
                    $size.addClass("invisible")
                    $modif.addClass("invisible")
                    $name.html(`<span class="file_icon"><img src="res/${icon()}_invisible.svg"></span>${name}`)
                } else {
                    $name.html(`<span class="file_icon"><img src="res/${icon()}.svg"></span>${name}`)
                }

                $size.text(size)
                $modif.text(modified)

                $contain.attr("data-location", location)
                $contain.attr("data-type", type)

                $contain.on("click", function(e) {
                    let location = e.currentTarget.attributes[0].value
                    let type = e.currentTarget.attributes[1].value

                    if (type === "folder") {
                        changeDir(location)
                    } else if (type === "file") {
                        openFile(location)
                    }
                })

                $contain.append($name)
                $contain.append($size)
                $contain.append($modif)
                $page.append($contain)
            })
        })

        if ($("#files tbody")) $("#files tbody").remove()
        $parent.append($page)
    })
}

let setSidebar = function(object) {
    let icon = "home"
    let title = "Home"

    let $container = $("<li></li>")
    let $template = $(`<span class="file_icon"><img src="res/${icon}.svg"></span>${title}`)

    $container.append($template)
}

$(function() {
    $("#control_updir").on("click", (e) => {
        upDir(currentDir)
    })

    $("#window_minimize").on("click", (e) => {
        let window = remote.getCurrentWindow()
        let minimize = window.minimize()
    })

    $("#window_maximize").on("click", (e) => {
        let window = remote.getCurrentWindow()
        let maximize = !window.isMaximized() ? window.maximize() : window.unmaximize()
    })

    $("#window_close").on("click", (e) => {
        let window = remote.getCurrentWindow()
        let close = window.close()
    })

    if      (platform === "win") changeDir(process.env.USERPROFILE)
    else if (platform === "mac") changeDir(process.env.HOME)
    else                         changeDir(process.env.PWD)

    setSidebar()
})
