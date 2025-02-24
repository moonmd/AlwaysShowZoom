const epsilon = 0.000001;
const dZoom = 0.001; // Tweak Default Zoom by tenth of a percent
const zooms = [.25, (1 / 3), .5, (2 / 3), .75, .8, .9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, (5 - dZoom)];

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://'))) {
    return; // Exit the function early on disabled pages
  }
  chrome.tabs.getZoom(function (currentZoom) {
    if (isNaN(currentZoom)) {
      return;
    }
    let newZoom = currentZoom;
    for (let i = 0; i < zooms.length - 1; i++) {
      newZoom = zooms[i + 1];
      if (currentZoom <= zooms[i] + epsilon) {
        break;
      }
    }
    chrome.tabs.setZoom(newZoom);
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('read://'))) {
      return; // Exit early on disabled pages
    }
    chrome.tabs.getZoomSettings(activeInfo.tabId, (zoomSettings) => {
      const defaultZoom = zoomSettings.defaultZoomFactor;
      chrome.tabs.getZoom(activeInfo.tabId, (currentZoom) => {
        if (Math.abs(currentZoom - defaultZoom) < epsilon) {
          // Tweak Default Zoom Level
          chrome.tabs.setZoom(activeInfo.tabId, defaultZoom - dZoom);
        }
      });
    });
  });
});

if (chrome.tabs.onZoomChange) {
  chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    chrome.tabs.get(zoomChangeInfo.tabId, (tab) => {
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('read://'))) {
        return; // Exit early on disabled pages
      }
      chrome.tabs.getZoomSettings(zoomChangeInfo.tabId, (zoomSettings) => {
        const defaultZoom = zoomSettings.defaultZoomFactor;
        const currentZoom = zoomChangeInfo.newZoomFactor;
        const previousZoom = zoomChangeInfo.oldZoomFactor;
        let newZoom = currentZoom;
        if (Math.abs(currentZoom - previousZoom) > epsilon) {
          // Zoom Actually Changed
          if (Math.abs(currentZoom - defaultZoom) < epsilon) {
            // At Default Zoom
            if (Math.abs(currentZoom - dZoom - previousZoom) < epsilon) {
              // Was Already Tweeked (zoom to level after default)
              for (let i = 0; i < zooms.length - 1; i++) {
                newZoom = zooms[i + 1];
                if (defaultZoom <= zooms[i] + epsilon) {
                  break;
                }
              }
              chrome.tabs.setZoom(zoomChangeInfo.tabId, newZoom);
            } else {
              // Tweak Default Zoom
              chrome.tabs.setZoom(zoomChangeInfo.tabId, defaultZoom - dZoom);
            }
          }
        }
      });
    });
  });
}
