/**
 * site.config.js
 * Everything the template renders comes from this object (see TEMPLATE.md).
 * Plain script, not a module, so template.html also works when opened from disk (file://).
 */
window.SITE_CONFIG = {
    title: 'Carmeca | Multibox Template',
    lang: 'en',

    // Optional colour overrides; each key becomes --color-<key>.
    theme: {
        bg: '#252525',
        text: '#fff',
        accent: '#f20c40',
        muted: '#57535a',
        alt: '#494d54',
        title: '#e23434',
        tagline: '#e2e2e2'
    },

    // Optional timing overrides (seconds).
    motion: { open: 0.9, close: 0.6 },

    // 1. Frame: fixed corners above the page.
    frame: {
        title: 'Multibox Menu',
        nav: [
            { label: 'Tickets', href: '#tickets' },
            { label: 'FAQ', href: '#faq' }
        ],
        info: '12 — 24 May 2019 · Bannockburn · Stirling · UK',
        footer: [
            { label: 'Imprint', href: '#imprint' },
            { label: 'Privacy', href: '#privacy' }
        ]
    },

    // 2. Background image behind the hero.
    background: { image: 'img/1.jpg', position: '50% 0%' },
    hero: { title: 'Carmeca', tagline: "Europe's most immersive LARP experience" },

    // 3. Grid of the menu overlay (desktop ≥ 53em). Every area must be a rectangle.
    grid: {
        columns: '20% 30% 50%',
        rows: '65% 35%',
        areas: [
            'side   osm    main',
            'teaser static mapimg'
        ]
        // Optional, < 53em. Without it, boxes stack in one column in config order.
        // mobile: { columns: '1fr 1fr', rows: 'repeat(3, 40vh)', areas: ['main main', 'side osm', 'teaser teaser'] }
    },

    // 4. Boxes. Common options: area, type, direction (bt|tb|lr|rl|diag), background,
    //    labels, mobileHide, mobileOrder.
    boxes: [
        {
            area: 'main', type: 'nav', variant: 'main', direction: 'bt', background: '#15171b',
            labels: [
                { text: 'the important stuff', position: 'topleft', vertical: true },
                { text: 'made in bannockburn', position: 'bottomright', vertical: true }
            ],
            items: [
                { label: 'Story', href: '#story' },
                { label: 'Chronicles', href: '#chronicles' },
                { label: 'Tour', href: '#tour' },
                { label: 'Contact', href: '#contact' }
            ]
        },
        {
            area: 'osm', type: 'osm', direction: 'lr',
            center: [56.0935, -3.9206], zoom: 13, dark: true,
            markers: [{ position: [56.0935, -3.9206], popup: 'Bannockburn Heritage Centre' }]
        },
        {
            area: 'side', type: 'nav', variant: 'side', direction: 'bt', background: '#0f1013',
            items: [
                { label: 'The Gameplay', href: '#' },
                { label: 'About LARP', href: '#' },
                { label: 'The Rules', href: '#' },
                { label: 'History', href: '#' },
                { label: 'People', href: '#' },
                { label: 'Join', href: '#' }
            ]
        },
        {
            area: 'teaser', type: 'teaser', direction: 'rl', background: '#1d2027',
            eyebrow: 'Join us now',
            headline: 'Learn how to participate',
            text: 'Registration opens in January.\nPlaces are limited.',
            links: [
                { label: 'Registration', href: '#register' },
                { label: 'Rules & safety', href: '#rules' }
            ]
        },
        {
            area: 'static', type: 'static', direction: 'tb', mobileHide: true,
            image: 'img/1.jpg', overlay: { color: '#0f1013', opacity: 0.55 },
            headline: 'Hail to thee',
            text: 'our infantry, still brave, beyond the grave'
        },
        {
            area: 'mapimg', type: 'mapimage', direction: 'rl',
            image: 'img/2.jpg', overlay: { color: '#2c35b7', opacity: 0.6, blend: 'multiply' },
            link: { label: 'The location', href: '#location' }
        }
    ]
};
