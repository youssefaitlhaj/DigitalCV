// Admin extensions, loaded after the vendored Sveltia bundle (no build step).
import { registerCropWidget } from "./crop-widget.js";

const CMS = window.CMS;
const PULLS_FALLBACK = "https://github.com/youssefaitlhaj/DigitalCV/pulls";

registerCropWidget(CMS);

let links = {};
try {
  const res = await fetch("/admin/links.json");
  if (res.ok) links = await res.json();
} catch {
  // Links are a convenience; the editor works without them.
}

if (links.dashboardUrl) {
  CMS.registerCustomPage({ id: "statistics", label: "Statistics", icon: "monitoring", url: links.dashboardUrl, newTab: true });
}
CMS.registerCustomPage({ id: "preview-publish", label: "Preview & Publish", icon: "rocket_launch", url: links.pullsUrl || PULLS_FALLBACK, newTab: true });
