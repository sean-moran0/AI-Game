// Injects the shared, responsive Bootstrap navbar into every page and marks the
// active link. Loaded as a module before each page's own module so the nav
// exists before page scripts (e.g. Leaflet) measure their containers.
const links = [
    { href: "/index.html", label: "Chat", match: ["/", "/index.html"] },
    { href: "/generate.html", label: "Map Generator", match: ["/generate.html"] },
    { href: "/map.html", label: "Map Viewer", match: ["/map.html"] },
];
const currentPath = location.pathname === "/" ? "/" : location.pathname;
const $nav = $(`
  <nav class="navbar navbar-expand-md bg-body-tertiary border-bottom" id="app-nav">
    <div class="container-fluid">
      <a class="navbar-brand fw-semibold" href="/index.html">AI <span class="text-primary">Gen</span></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
              data-bs-target="#nav-links" aria-controls="nav-links"
              aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav-links">
        <div class="navbar-nav"></div>
      </div>
    </div>
  </nav>
`);
const $list = $nav.find(".navbar-nav");
for (const link of links) {
    const $a = $('<a class="nav-link"></a>').attr("href", link.href).text(link.label);
    if (link.match.includes(currentPath))
        $a.addClass("active");
    $list.append($a);
}
$("body").prepend($nav);
