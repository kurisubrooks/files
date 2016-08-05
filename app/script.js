window.$ = window.jQuery = require("jquery")
const { remote, shell } = require("electron")
const moment = require("moment")
const path = require("path")
const fs = require("fs")
const os = require("os")

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
    return (/(^|\/)\.[^\/\.]/g).test(path)
}

let normalizeSize = function(bytes) {
    if (bytes === 0) return "0.00 B"
    var e = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, e))) + " " + " KMGTP".charAt(e) + "B"
}

let openFile = function(filedir) {
    shell.openItem(filedir)
}

let changeDir = function(dirname) {
    fs.readdir(dirname, (error, files) => {
        if (error) throw error

        let $parent = $("#files")
        let $page = $("<tbody></tbody>")

        files.forEach(function(files) {
            let name = files
            let file = dirname + "/" + files
            let home = os.platform === "win32" ? process.env.USERPROFILE : process.env.HOME

            fs.stat(file, function(err, stats) {
                let type = stats.isFile() ? "file" : stats.isDirectory() ? "folder" : undefined
                let location = file
                let size = type == "folder" ? "—" : normalizeSize(stats.size)
                let modified = moment(stats.mtime).format("MMM D, YYYY")
                let invisible = isHidden(name)
                let check = type == "file" ? fileType(name) : null
                let icon = function() {
                    if (type === "file" && !invisible) return `${fileType(name)}`
                    else if (type === "folder") {
                        if (dirname === home && name === "Google Drive") return "folder_google_drive"
                        else return "folder"
                    } else return "file"
                }

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

let setSidebar = function() {

}

$(function() {
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

    if (os.platform() === "win32") {
        changeDir(process.env.USERPROFILE)
    } else if (os.platform() === "darwin") {
        changeDir(process.env.HOME)
    } else {
        changeDir(process.env.PWD)
    }

    setSidebar()
})