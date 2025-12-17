(function () {
  function initWidget() {
    if (document.getElementById("axium-chat-widget-iframe")) return;

    // Dynamic Configuration based on where this script is hosted
    // This allows it to work on localhost, Vercel, or any other host automatically.
    let baseUrl = "";

    // Attempt to detect the script's own URL
    const scriptTag =
      document.currentScript ||
      (function () {
        const scripts = document.getElementsByTagName("script");
        // Look for the script that mimics this filename specifically or general last script
        for (let i = scripts.length - 1; i >= 0; i--) {
          const src = scripts[i].src;
          if (src && src.includes("widget.js")) {
            return scripts[i];
          }
        }
        return scripts[scripts.length - 1];
      })();

    if (scriptTag && scriptTag.src) {
      try {
        const url = new URL(scriptTag.src);
        baseUrl = url.origin;
        console.log("Axium Widget Origin Detected:", baseUrl);
      } catch (e) {
        console.warn("Could not determine widget origin", e);
      }
    }

    // Fallback if detection fails (e.g. inline script usage which shouldn't happen)
    if (!baseUrl) {
      console.warn(
        "Widget script origin not detected. Defaulting to production/local fallback."
      );
    }

    const WIDGET_URL = `${baseUrl}/embed`; // Points to the Next.js /embed page
    const INITIAL_WIDTH = "80px";
    const INITIAL_HEIGHT = "80px";
    const OPEN_WIDTH = "400px";
    const OPEN_HEIGHT = "650px";

    const iframe = document.createElement("iframe");
    iframe.id = "axium-chat-widget-iframe";
    iframe.src = WIDGET_URL;
    iframe.title = "Chat Widget";

    // Core Styles
    iframe.style.position = "fixed";
    iframe.style.bottom = "10px";
    iframe.style.right = "10px";
    iframe.style.width = INITIAL_WIDTH;
    iframe.style.height = INITIAL_HEIGHT;
    iframe.style.border = "none";
    iframe.style.zIndex = "999999";
    iframe.style.transition = "width 0.3s ease, height 0.3s ease";
    iframe.style.background = "transparent";
    iframe.style.colorScheme = "normal";

    document.body.appendChild(iframe);

    // Message Listener for Resize
    window.addEventListener("message", (event) => {
      // We accept messages from the origin we calculated
      if (event.origin !== baseUrl) return;

      if (event.data && event.data.type === "AXIUM_WIDGET_RESIZE") {
        const isOpen = event.data.isOpen;
        if (isOpen) {
          iframe.style.width = OPEN_WIDTH;
          iframe.style.height = OPEN_HEIGHT;
          // On mobile, full screen
          if (window.innerWidth < 480) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.bottom = "0";
            iframe.style.right = "0";
          }
        } else {
          iframe.style.width = INITIAL_WIDTH;
          iframe.style.height = INITIAL_HEIGHT;
          iframe.style.bottom = "10px";
          iframe.style.right = "10px";
        }
      }
    });
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    initWidget();
  } else {
    document.addEventListener("DOMContentLoaded", initWidget);
  }
})();
