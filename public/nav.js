// Injects the shared top navigation into every page and marks the active link.
// Included as the first element in <body> so the nav exists before page scripts
// (e.g. Leaflet) measure their containers.
(function () {
  const links = [
    { href: '/index.html', label: 'Chat', match: ['/', '/index.html'] },
    { href: '/generate.html', label: 'Map Generator', match: ['/generate.html'] },
    { href: '/map.html', label: 'Map Viewer', match: ['/map.html'] },
  ];

  const path = location.pathname === '/' ? '/' : location.pathname;

  const nav = document.createElement('nav');
  nav.id = 'app-nav';

  const brand = document.createElement('span');
  brand.className = 'brand';
  brand.innerHTML = 'AI <span class="accent">Gen</span>';
  nav.appendChild(brand);

  for (const l of links) {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    if (l.match.includes(path)) a.classList.add('active');
    nav.appendChild(a);
  }

  document.body.insertBefore(nav, document.body.firstChild);
})();
