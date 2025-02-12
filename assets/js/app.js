// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"
import { basicSetup, EditorView } from "codemirror"
import { EditorState } from "@codemirror/state"
import { json } from "@codemirror/lang-json"

const Hooks = {}

Hooks.RequestEditor = {
  mounted() {
    this.input = this.el.querySelector("input")
    this.editorContainer = this.el.querySelector("#request-editor-container")
    this.editor = new EditorView({
      parent: this.editorContainer,
      extensions: [basicSetup, json(), EditorView.updateListener.of(update => {
        if (update.docChanged) {
          this.input.value = update.state.doc.toString()
        }
      })],
      doc: this.input.value,
    })
  },
  beforeUpdate() {
    this.editor = null
  },
  updated() {
    this.editor = new EditorView({
      parent: this.editorContainer,
      extensions: [basicSetup, json(), EditorView.updateListener.of(update => {
        if (update.docChanged) {
          this.input.value = update.state.doc.toString()
        }
      })],
      doc: this.input.value,
    })
  },
  destroyed() {
    this.editor = null
  },
}

Hooks.ResponseEditor = {
  mounted() {
    this.editorContainer = this.el.querySelector("#response-editor-container")
    this.content = this.el.dataset.content

    this.editor = new EditorView({
      lineWrapping: true,
      parent: this.editorContainer,
      extensions: [basicSetup, json(), EditorView.editable.of(false), EditorState.readOnly.of(true), EditorView.lineWrapping],
      doc: this.content,
    })
  },
  destroyed() {
    this.editor = null
  },
}

Hooks.ToCurl = {
  updated() {
    this.button = this.el.querySelector("button")
    this.button.addEventListener("click", this.handleButtonClick.bind(this))
  },

  destroyed() {
    if (this.button) {
      this.button.removeEventListener("click", this.handleButtonClick.bind(this))
      this.button = null
    }
  },

  handleButtonClick() {
    const output = this.el.querySelector("code")

    if (output) {
      this.writeToClipboard(output.textContent.trim())
    }
  },

  async writeToClipboard(value) {
    try {
      await navigator.clipboard.writeText(value)
    } catch (error) {
      console.error(error)
    }
  }
}

Hooks.Response = {
  mounted() {
    this.actions = this.el.querySelector("#response-actions")
    this.copyButton = this.actions.querySelector("#copy-response")
    this.copyButton.addEventListener("click", this.handleButtonClick.bind(this))
  },

  updated() {
    if (this.url) {
      URL.revokeObjectURL(this.url)
    }

    const output = this.el.querySelector("#response-editor")?.dataset?.content
    const downloadButton = this.actions.querySelector("#download-response")

    if (output && downloadButton) {
      const blob = new Blob([output], { type: "application/json" })
      this.url = URL.createObjectURL(blob)
      downloadButton.href = this.url
    }
  },

  destroyed() {
    if (this.copyButton) {
      this.copyButton.removeEventListener("click", this.handleButtonClick.bind(this))
      this.copyButton = null
    }
  },

  handleButtonClick() {
    const output = this.el.querySelector("#response-editor").dataset.content

    if (output) {
      this.writeToClipboard(output)
    }
  },

  async writeToClipboard(value) {
    try {
      await navigator.clipboard.writeText(value)
    } catch (error) {
      console.error(error)
    }
  }
}

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket("/live", Socket, { hooks: Hooks, params: { _csrf_token: csrfToken } })

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" })
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

