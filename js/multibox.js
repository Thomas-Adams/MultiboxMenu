/**
 * multibox.js
 * Behaviour of the multibox menu: open/close, Esc, focus, loader and OSM maps.
 * Works on markup rendered by the server (Zope) or by js/template.js; load it after the markup.
 *
 * Markup it reads:
 *   <body class="loading" data-preload="img.jpg">   loader waits for this image (4 s fallback)
 *   <div class="box__map" data-map='{...}'>          center, zoom, scrollZoom, markers, tiles, attribution
 *   <script src="multibox.js" data-leaflet="…/">     optional: where leaflet.js/.css live
 */
{
    const LEAFLET_URL = document.currentScript?.dataset.leaflet || 'https://unpkg.com/leaflet@1.9.4/dist/';
    const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // ---------------------------------------------------------------- Maps

    const maps = [];

    const loadLeaflet = () => window.L ? Promise.resolve(window.L) : new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${LEAFLET_URL}leaflet.css`;
        const script = document.createElement('script');
        script.src = `${LEAFLET_URL}leaflet.js`;
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.head.append(link, script);
    });

    const mapFailed = (el) => {
        const status = el.querySelector('.box__map-status');
        if ( status ) status.textContent = 'The map could not be loaded.';
    };

    const initMaps = () => {
        const els = [...document.querySelectorAll('.box__map[data-map]')];
        if ( !els.length ) return;
        loadLeaflet().then(L => {
            els.forEach(el => {
                let box;
                try { box = JSON.parse(el.dataset.map); }
                catch { mapFailed(el); return; }
                el.textContent = '';
                const map = L.map(el, {
                    center: box.center,
                    zoom: box.zoom ?? 13,
                    scrollWheelZoom: !!box.scrollZoom
                });
                L.tileLayer(box.tiles || OSM_TILES, {
                    maxZoom: 19,
                    attribution: box.attribution || OSM_ATTRIBUTION
                }).addTo(map);
                (box.markers || []).forEach(m => {
                    const marker = L.marker(m.position).addTo(map);
                    // Popup content as an element so the text is never parsed as HTML.
                    if ( m.popup ) {
                        const popup = document.createElement('span');
                        popup.textContent = m.popup;
                        marker.bindPopup(popup);
                    }
                });
                maps.push(map);
            });
        }).catch(() => els.forEach(mapFailed));
    };

    // ---------------------------------------------------------------- Open / close

    const menu = document.querySelector('.menu');
    if ( menu ) {
        const openCtrl = menu.querySelector('.action--menu');
        const closeCtrl = menu.querySelector('.action--close');

        // .menu--closed is only set after the first close, so the close button's
        // exit animation doesn't play on page load.
        const toggle = (open) => {
            menu.classList.toggle('menu--open', open);
            menu.classList.toggle('menu--closed', !open);
            openCtrl.setAttribute('aria-expanded', open);
            (open ? closeCtrl : openCtrl).focus();
            if ( open ) maps.forEach(map => map.invalidateSize());
        };

        openCtrl.addEventListener('click', () => toggle(true));
        closeCtrl.addEventListener('click', () => toggle(false));
        document.addEventListener('keydown', (ev) => {
            if ( ev.key === 'Escape' && menu.classList.contains('menu--open') ) toggle(false);
        });
    }
    initMaps();

    // ---------------------------------------------------------------- Loader

    const done = () => document.body.classList.remove('loading');
    const preload = document.body.dataset.preload;
    if ( preload ) {
        const img = new Image();
        img.onload = img.onerror = done;
        img.src = preload;
        setTimeout(done, 4000);
    }
    else done();
}
