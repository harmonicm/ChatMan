const suitableNode = (node) => {
  return (
    node.nodeType === Node.ELEMENT_NODE &&
    node.getAttribute("data-testid") === "transcript-row" &&
    node.getAttribute("data-index") &&
    parseInt(node.getAttribute("data-index", 10)) % 2 === 0
  );
};

const handleChat = async () => {
  const scroller = await obtainScollerHandle();
  //   myLog(scroller);
  if (scroller.children.length > 0) {
    for (let node of scroller.children) {
      if (suitableNode(node)) {
        currentChatElements.push(node);
      }
    }
    buildDialerUI(0);
  }

  const observer = new MutationObserver((mutationList, observer) => {
    const newNodes = [];
    // let url;
    for (let mutation of mutationList) {
      if (mutation.type == "childList") {
        let all_nodes = mutation.addedNodes;
        for (const node of all_nodes) {
          //   myLog(node);
          if (suitableNode(node)) {
            newNodes.push(node);
          }
        }
        all_nodes = mutation.removedNodes;
        for (const node of all_nodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            newNodes.push(node);
          }
        }
      }
    }
    if (newNodes.length > 0) {
      //not using child nodes because the children will skip the raw text and comments
      currentChatElements = [];
      for (let node of scroller.children) {
        if (suitableNode(node)) {
          currentChatElements.push(node);
        }
      }
      buildDialerUI(0);
    }
  });

  observer.observe(scroller, {
    childList: true,
  });
};

const obtainScollerHandle = async () => {
  myLog("Welcome to the ChatMan!");
  //wait for the chat history class to appear on the screen
  //so we need some sort of await on a promise
  //chat history class is a much smaller subset of what all is happening to the DOM
  const target = await getElementFromScreen(
    document,
    'div[data-testid="transcript-sizer"]',
  );
  return target;
};

let currentChatElements = [];
// let currUrl = window.location.pathname;
// Tracks the scroll position of the dialer

const buildDialerUI = (rotation = 0) => {
  const n = currentChatElements.length;
  if (n === 0) return;

  // --- 1. Stepped Radius Expansion (50 to 400) ---
  // Base radius: 95px (fits comfortably on small screens)
  // Increases by 18px every 50 chats, capped at 8 steps (400 chats = ~239px)
  const baseRadius = 95;
  const step = Math.min(8, Math.floor(n / 50));
  const dynamicRadius = baseRadius + step * 18;

  // --- 2. Dynamic Dial & Font Scaling ---
  // Smoothly scales down as n grows from 1 to 400
  let dialSize = 18;
  let fontSize = 8;
  let letterSpacing = "0px";

  if (n > 8) {
    // Linear interpolation factor from 8 to 400 queries (0.0 to 1.0)
    const t = Math.min(1, (n - 8) / (400 - 8));

    // Dials shrink from 22px down to 10px min
    dialSize = Math.round(dialSize - t * (dialSize - 10));

    // Font shrinks from 12px down to 5.5px min
    fontSize = +(fontSize - t * (fontSize - 4.5)).toFixed(1);

    // Tighten kerning for 3-digit numbers (100+)
    if (n >= 100) {
      letterSpacing = "-0.5px";
    }
  }

  // --- 3. Setup DOM & Apply Variables ---
  let wrapper = document.getElementById("promptnav-wrapper");
  let wheel = document.getElementById("promptnav-wheel");
  let tooltip = document.getElementById("promptnav-tooltip");

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "promptnav-wrapper";

    wheel = document.createElement("div");
    wheel.id = "promptnav-wheel";

    let brand = document.createElement("div");
    brand.id = "promptnav-brand";
    brand.textContent = "ChatMan";

    tooltip = document.createElement("div");
    tooltip.id = "promptnav-tooltip";

    let utilities = document.createElement("div");
    utilities.id = "promptnav-utilities";

    let downloadBtn = document.createElement("div");
    downloadBtn.className = "promptnav-utility-btn";
    downloadBtn.id = "promptnav-download-btn";

    // Clean, crisp inline SVG for the download icon
    downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;

    // Click Listener Placeholder
    // Download Button Click Logic
    downloadBtn.addEventListener("click", () => {
      // 1. Your prompt engineering template
      const header =
        "The following is the conversation history between a user and AI, please internalise and understand the complete context of the discussion before starting and take up the further conversation from the end of this discussion only.\n\n==================================================\n\n";

      // 2. Extract and format the text from all tracked nodes
      const chatText = currentChatElements
        .map((node, index) => {
          const text = (node.textContent || "").trim();
          return `[User Query ${index + 1}]:\n${text}`;
        })
        .join("\n\n--------------------------------------------------\n\n");

      const fullContent = header + chatText;

      // 3. Create a temporary file in the browser
      const blob = new Blob([fullContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      // 4. Create a hidden link, click it, and clean up
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Generate a filename with today's date
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Context_README_${dateStr}.md`;

      document.body.appendChild(a);
      a.click();

      // 5. Cleanup the DOM and memory
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 150);

      // Optional UI Feedback: Flash the button to show it worked
      downloadBtn.style.background = "#ffffff";
      downloadBtn.style.color = "#000000";
      setTimeout(() => {
        downloadBtn.style.background = "";
        downloadBtn.style.color = "";
      }, 300);
    });

    // Tooltip Hover Logic for Download Button
    downloadBtn.addEventListener("mouseenter", () => {
      tooltip.textContent = "Download Chat History";
      const rect = downloadBtn.getBoundingClientRect();
      // Position identically to how dial tooltips are positioned
      tooltip.style.left = `${rect.left - 240}px`;
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltip.offsetHeight / 2}px`;
      tooltip.classList.add("visible");
    });

    downloadBtn.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });

    utilities.appendChild(downloadBtn);

    wrapper.appendChild(brand);
    wrapper.appendChild(wheel);
    wrapper.appendChild(utilities);

    document.body.appendChild(wrapper);
    document.body.appendChild(tooltip);

    wrapper.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        rotation += e.deltaY * 0.5;
        wheel.style.setProperty("--wheel-rot", `${rotation}deg`);
      },
      { passive: false },
    );
  }

  // Inject the calculated properties into CSS
  wrapper.style.setProperty("--container-size", `${dynamicRadius}px`);
  wrapper.style.setProperty("--dial-size", `${dialSize}px`);
  wrapper.style.setProperty("--font-size", `${fontSize}px`);
  wrapper.style.setProperty("--letter-spacing", letterSpacing);

  // --- 4. Rebuild Dials ---
  wheel.innerHTML = "";
  const angleStep = 360 / n;

  currentChatElements.forEach((node, index) => {
    const dialWrapper = document.createElement("div");
    dialWrapper.className = "promptnav-dial-wrapper";

    const angle = index * angleStep;
    dialWrapper.style.setProperty("--angle", `${angle}deg`);
    dialWrapper.style.setProperty("--radius", `${dynamicRadius}px`);

    const dialInner = document.createElement("div");
    dialInner.className = "promptnav-dial-inner";
    dialInner.textContent = index + 1;

    dialInner.addEventListener("click", () => {
      node.scrollIntoView({ behavior: "smooth" });
      node.style.transition = "background 0.5s";
      node.style.background = "rgba(60, 130, 246, 0.3)";
      setTimeout(() => (node.style.background = "transparent"), 1000);
    });

    dialInner.addEventListener("mouseenter", () => {
      tooltip.textContent =
        (node.querySelector("p").textContent || "").trim().slice(0, 50) ||
        "Image/Attachment Query";
      tooltip.textContent += "...";
      const rect = dialInner.getBoundingClientRect();
      tooltip.style.left = `${rect.left - 240}px`;
      tooltip.style.top = `${rect.top + rect.height / 2 - tooltip.offsetHeight / 2}px`;
      tooltip.classList.add("visible");
    });

    dialInner.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });

    dialWrapper.appendChild(dialInner);
    wheel.appendChild(dialWrapper);
  });
};

handleChat();
