/**
 * template.js
 * Renders frame, background/hero and the multibox menu from window.SITE_CONFIG.
 * All motion lives in css/template.css; this script only builds the DOM.
 * Behaviour (open/close, loader, maps) is in js/multibox.js, which is loaded after this script
 * and also runs on the server-rendered markup of the Zope product.
 * Text is always inserted as text (never as HTML), so config strings are safe.
 */
{
    const cfg = window.SITE_CONFIG;

    // Tiny DOM helper: h('a', {class: 'x', href: '#'}, 'text', childEl, [more]).
    // style takes an object of properties (custom properties allowed).
    const h = (tag, props = {}, ...children) => {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(props)) {
            if ( value == null || value === false ) continue;
            if ( key === 'class' ) el.className = value;
            else if ( key === 'style' ) {
                for (const [prop, val] of Object.entries(value)) {
                    if ( val != null ) el.style.setProperty(prop, val);
                }
            }
            else el.setAttribute(key, value);
        }
        el.append(...children.flat().filter(c => c != null && c !== false && c !== ''));
        return el;
    };

    const icon = (id, cls) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `icon ${cls}`);
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `#${id}`);
        svg.append(use);
        return svg;
    };

    const links = (items = [], cls) => items.map(item => h('a', {class: cls, href: item.href}, item.label));

    // ---------------------------------------------------------------- Frame + hero

    const renderFrame = (frame = {}) => h('div', {class: 'frame'},
        h('header', {class: 'frame__header'},
            frame.title && h('h1', {class: 'frame__title'}, frame.title),
            frame.nav && h('nav', {class: 'frame__nav', 'aria-label': 'Header'}, links(frame.nav, 'frame__link'))
        ),
        frame.info && h('p', {class: 'frame__info'}, frame.info),
        frame.footer && h('nav', {class: 'frame__footer', 'aria-label': 'Footer'}, links(frame.footer, 'frame__link'))
    );

    const renderHero = (background = {}, hero = {}) => {
        const bg = h('div', {class: 'hero__bg'});
        // Set directly (not via a custom property) so the URL resolves against the page.
        if ( background.image ) bg.style.backgroundImage = `url("${background.image}")`;
        if ( background.position ) bg.style.backgroundPosition = background.position;
        // Background tilt (multibox.js): true = 4 layers, or the number of layers.
        const tilt = background.tilt === true ? 4 : background.tilt;
        return h('div', {class: 'hero', 'data-tilt': tilt || null},
            bg,
            hero.title && h('h2', {class: 'hero__title'}, hero.title),
            hero.tagline && h('p', {class: 'hero__tagline'}, hero.tagline)
        );
    };

    // ---------------------------------------------------------------- Box types
    // Each renderer returns the children of .box__inner.
    // Classes .rise and .mask__inner get staggered automatically (--i / --n).

    const overlay = (o) => o && h('div', {class: 'box__overlay', style: {
        '--overlay-color': o.color,
        '--overlay-opacity': o.opacity,
        '--overlay-blend': o.blend
    }});

    const media = (image) => image && h('div', {class: 'box__media', style: {'background-image': `url("${image}")`}});

    const boxTypes = {
        // 4a. Static content: background image, headline and/or text.
        static: (box) => [
            media(box.image),
            overlay(box.overlay),
            h('div', {class: 'box__body'},
                box.headline && h('h3', {class: 'box__headline rise'}, box.headline),
                box.text && h('p', {class: 'box__text rise'}, box.text)
            )
        ],

        // 4b. Map image with a coloured layer above it, plus an optional link.
        mapimage: (box) => [
            media(box.image),
            overlay(box.overlay || {}),
            box.link && h('a', {class: 'box__hoverlink', href: box.link.href}, box.link.label)
        ],

        // 4c. Teaser: eyebrow, headline, subheadline, text and links.
        teaser: (box) => [
            box.eyebrow && h('p', {class: 'box__eyebrow rise'}, box.eyebrow),
            box.headline && h('h3', {class: 'box__headline rise'}, box.headline),
            box.subheadline && h('p', {class: 'box__subheadline rise'}, box.subheadline),
            box.text && h('p', {class: 'box__text rise'}, box.text),
            box.links && h('div', {class: 'box__links'},
                links(box.links, 'box__link rise'))
        ],

        // 4d. Navigation: 'main' (big numbered links) or 'side' (small, line mask).
        nav: (box) => {
            const variant = box.variant === 'side' ? 'side' : 'main';
            const items = (box.items || []).map(item => variant === 'side'
                ? h('a', {class: 'nav__item mask', href: item.href}, h('span', {class: 'mask__inner'}, item.label))
                : h('a', {class: 'nav__item rise', href: item.href}, item.label));
            return [h('nav', {class: `nav nav--${variant}`, 'aria-label': box.ariaLabel || 'Menu'}, items)];
        },

        // 4e. Real OpenStreetMap: multibox.js loads Leaflet and reads data-map.
        osm: (box) => {
            const {center, zoom, scrollZoom, markers, tiles, attribution} = box;
            return [h('div', {class: 'box__map', 'data-map': JSON.stringify({center, zoom, scrollZoom, markers, tiles, attribution})},
                h('p', {class: 'box__map-status'}, 'Loading map…'))];
        }
    };

    // ---------------------------------------------------------------- Grid

    const areasToCss = (areas) => areas.map(row => `"${row.trim().replace(/\s+/g, ' ')}"`).join(' ');

    // Warn about the mistakes that make grid-template-areas silently invalid.
    const checkAreas = (areas, boxes, label) => {
        const rows = areas.map(row => row.trim().split(/\s+/));
        if ( rows.some(r => r.length !== rows[0].length) ) {
            console.warn(`[template] ${label}: every row in grid.areas needs the same number of cells.`, areas);
            return;
        }
        const names = new Set(rows.flat().filter(n => !/^\.+$/.test(n)));
        names.forEach(name => {
            const cells = [];
            rows.forEach((r, y) => r.forEach((n, x) => n === name && cells.push([x, y])));
            const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
            const w = Math.max(...xs) - Math.min(...xs) + 1, hgt = Math.max(...ys) - Math.min(...ys) + 1;
            if ( w * hgt !== cells.length ) console.warn(`[template] ${label}: area "${name}" is not a rectangle.`);
        });
        boxes.forEach(b => {
            if ( b.area && !names.has(b.area) ) console.warn(`[template] ${label}: box area "${b.area}" is not in grid.areas.`);
        });
    };

    const gridStyle = (grid = {}) => {
        const style = {
            '--cols': grid.columns,
            '--rows': grid.rows,
            '--areas': grid.areas && areasToCss(grid.areas)
        };
        if ( grid.mobile ) {
            Object.assign(style, {
                '--m-cols': grid.mobile.columns,
                '--m-rows': grid.mobile.rows,
                '--m-areas': grid.mobile.areas && areasToCss(grid.mobile.areas)
            });
        }
        return style;
    };

    // ---------------------------------------------------------------- Boxes

    const renderLabel = (label) => {
        const left = /left$/.test(label.position || 'topleft');
        return h('p', {class: [
            'label',
            `label--${label.position || 'topleft'}`,
            label.vertical && (left ? 'label--vert-mirror' : 'label--vert')
        ].filter(Boolean).join(' ')}, label.text);
    };

    const renderBox = (box, grid) => {
        const type = boxTypes[box.type];
        if ( !type ) console.warn(`[template] unknown box type "${box.type}".`);
        const inner = h('div', {class: 'box__inner', style: {'--box-bg': box.background}},
            type ? type(box) : [],
            (box.labels || []).map(renderLabel)
        );
        // Stagger index for everything that animates inside this box.
        const staggered = inner.querySelectorAll('.rise, .mask__inner');
        staggered.forEach((el, i) => el.style.setProperty('--i', i));
        inner.style.setProperty('--n', staggered.length);

        return h('div', {
            class: ['box', `box--${box.type}`, box.dark && 'box--dark', box.mobileHide && 'box--mobile-hide']
                .filter(Boolean).join(' '),
            'data-direction': box.direction || 'bt',
            style: {
                '--area': box.area,
                '--m-area': grid.mobile && grid.mobile.areas ? box.area : null,
                '--m-order': box.mobileOrder
            }
        }, inner);
    };

    const renderMenu = (grid = {}, boxes = []) => h('div', {class: 'menu', id: 'menu', style: gridStyle(grid)},
        boxes.map(box => renderBox(box, grid)),
        h('button', {class: 'action action--menu', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': 'menu'},
            icon('icon-menu', 'icon--menu')),
        h('button', {class: 'action action--close', 'aria-label': 'Close menu'},
            icon('icon-close', 'icon--close'))
    );

    // ---------------------------------------------------------------- Build page

    if ( cfg.title ) document.title = cfg.title;
    if ( cfg.lang ) document.documentElement.lang = cfg.lang;
    Object.entries(cfg.theme || {}).forEach(([key, value]) => document.documentElement.style.setProperty(`--color-${key}`, value));
    // Fonts: a stylesheet with @font-face rules, and --font-title / --font-display / --font-body.
    const fonts = cfg.fonts || {};
    if ( fonts.stylesheet ) document.head.append(h('link', {rel: 'stylesheet', href: fonts.stylesheet}));
    ['title', 'display', 'body'].forEach(key => {
        if ( fonts[key] ) document.documentElement.style.setProperty(`--font-${key}`, fonts[key]);
    });
    if ( cfg.motion ) {
        if ( cfg.motion.open != null ) document.documentElement.style.setProperty('--dur-open', `${cfg.motion.open}s`);
        if ( cfg.motion.close != null ) document.documentElement.style.setProperty('--dur-close', `${cfg.motion.close}s`);
    }

    const grid = cfg.grid || {};
    const boxes = cfg.boxes || [];
    if ( grid.areas ) checkAreas(grid.areas, boxes, 'grid');
    if ( grid.mobile && grid.mobile.areas ) checkAreas(grid.mobile.areas, boxes.filter(b => !b.mobileHide), 'grid.mobile');

    const root = document.getElementById('site');
    root.append(renderFrame(cfg.frame), renderHero(cfg.background, cfg.hero), renderMenu(grid, boxes));

    // The loader (multibox.js) waits for the background image.
    if ( cfg.background && cfg.background.image ) document.body.dataset.preload = cfg.background.image;
}
