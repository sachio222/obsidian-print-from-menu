var d = require("obsidian");

class PrintNotePlugin extends d.Plugin {
  async onload() {
    this.addCommand({
      id: "print-current-note",
      name: "Print current note",
      checkCallback: (checking) => {
        var view = this.app.workspace.getActiveViewOfType(d.MarkdownView);
        if (!view) return false;
        if (checking) return true;
        this.printNote(view);
      }
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof d.TFile) || file.extension !== "md") return;
        menu.addItem((item) => {
          item
            .setTitle("Print\u2026")
            .setIcon("printer")
            .setSection("action")
            .onClick(async () => {
              var leaf = this.app.workspace.getLeaf(false);
              await leaf.openFile(file);
              var view = this.app.workspace.getActiveViewOfType(d.MarkdownView);
              if (view) this.printNote(view);
            });
        });
      })
    );
  }

  async printNote(view) {
    var file = view.file;
    if (!file) return;

    var content = await this.app.vault.read(file);
    var container = document.createElement("div");
    await d.MarkdownRenderer.render(this.app, content, container, file.path, view);

    var css = [
      "body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 750px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; font-size: 14px; }",
      "h1 { font-size: 1.8em; border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }",
      "h2 { font-size: 1.4em; } h3 { font-size: 1.2em; }",
      "code { background: #f4f4f4; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.9em; }",
      "pre { background: #f4f4f4; padding: 12px 16px; border-radius: 4px; overflow-x: auto; }",
      "pre code { background: none; padding: 0; }",
      "blockquote { border-left: 3px solid #888; margin: 0.8em 0; padding: 0.4em 1em; color: #555; }",
      "table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }",
      "th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }",
      "th { background: #f4f4f4; } img { max-width: 100%; }",
      "a { color: #1a1a1a; text-decoration: underline; }",
      "@media print { body { margin: 0; padding: 0; } }"
    ].join("\n");

    var html = [
      "<!DOCTYPE html><html><head>",
      "<title>" + this.esc(file.basename) + "</title>",
      "<style>" + css + "</style>",
      "</head><body>",
      "<h1>" + this.esc(file.basename) + "</h1>",
      container.innerHTML,
      "</body></html>"
    ].join("\n");

    // Use a hidden iframe instead of window.open (Electron blocks popups)
    var iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:800px;height:600px;border:none;";
    document.body.appendChild(iframe);

    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content to render, then print
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  }

  esc(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  onunload() {}
}

module.exports = PrintNotePlugin;
