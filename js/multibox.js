/**
 * multibox.js
 * Behaviour of the multibox menu: open/close, Esc, focus, loader, OSM maps and background tilt.
 * Works on markup rendered by the server (Zope) or by js/template.js; load it after the markup.
 *
 * Markup it reads:
 *   <body class="loading" data-preload="img.jpg">   loader waits for this image (4 s fallback)
 *   <div class="box__map" data-map='{...}'>          center, zoom, scrollZoom, markers, tiles, attribution
 *   <div class="hero" data-tilt="4">                 optional: background tilt with 4 layers (1–8)
 *   <script src="multibox.js" data-leaflet="…/">     optional: self-hosted leaflet.js/.css (default: unpkg with SRI)
 */
{
    const LEAFLET_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/';
    // SRI hashes of Leaflet 1.9.4, only checked for the CDN copy.
    const LEAFLET_SRI = {
        'leaflet.css': 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
        'leaflet.js': 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    };
    const LEAFLET_URL = document.currentScript?.dataset.leaflet || LEAFLET_CDN;
    const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // ---------------------------------------------------------------- Maps

    const maps = [];

    const pin = (el, file) => {
        if ( LEAFLET_URL !== LEAFLET_CDN ) return;
        el.integrity = LEAFLET_SRI[file];
        el.crossOrigin = '';
    };

    const load = (el) => new Promise((resolve, reject) => {
        el.onload = resolve;
        el.onerror = reject;
        document.head.append(el);
    });

    // Wait for the CSS as well as the JS: the map layout needs it, and without it
    // Leaflet guesses the marker image path wrongly (".../leafletmarker-icon.png").
    const loadLeaflet = () => window.L ? Promise.resolve(window.L) : (() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${LEAFLET_URL}leaflet.css`;
        pin(link, 'leaflet.css');
        const script = document.createElement('script');
        script.src = `${LEAFLET_URL}leaflet.js`;
        pin(script, 'leaflet.js');
        return Promise.all([load(link), load(script)]).then(() => {
            // Explicit, so the marker icons never depend on the path detection.
            window.L.Icon.Default.imagePath = `${LEAFLET_URL}images/`;
            return window.L;
        });
    })();

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

    // ---------------------------------------------------------------- Background tilt
    // Copies of the background image follow the mouse (motion in template.css).
    // Only with a fine pointer that can hover, and not with reduced motion.

    const tiltHero = document.querySelector('.hero[data-tilt]');
    const tiltBg = tiltHero && tiltHero.querySelector('.hero__bg');
    if ( tiltBg && matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches ) {
        const layers = Math.min(Math.max(parseInt(tiltHero.dataset.tilt, 10) || 4, 1), 8);
        const {backgroundImage, backgroundPosition} = getComputedStyle(tiltBg);
        for (let l = 1; l <= layers; ++l) {
            const layer = document.createElement('div');
            layer.className = 'hero__bg-layer';
            layer.style.backgroundImage = backgroundImage;
            layer.style.backgroundPosition = backgroundPosition;
            layer.style.setProperty('--l', l);
            tiltBg.append(layer);
        }
        tiltBg.classList.add('hero__bg--tilt');

        // One update per frame, with the latest mouse position (-1 … 1 across the viewport).
        let lastEv, frame;
        document.addEventListener('mousemove', (ev) => {
            lastEv = ev;
            if ( frame || menu?.classList.contains('menu--open') ) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                tiltBg.style.setProperty('--mx', (lastEv.clientX / innerWidth * 2 - 1).toFixed(3));
                tiltBg.style.setProperty('--my', (lastEv.clientY / innerHeight * 2 - 1).toFixed(3));
            });
        });

        const openCtrl = menu?.querySelector('.action--menu');
        openCtrl?.addEventListener('mouseenter', () => tiltBg.classList.add('hero__bg--rest'));
        openCtrl?.addEventListener('mouseleave', () => tiltBg.classList.remove('hero__bg--rest'));
    }

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
