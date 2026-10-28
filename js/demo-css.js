/**
 * demo-css.js
 * CSS-only variant: all motion lives in css/menu-css.css.
 * This script only switches the state classes on nav.menu.
 */
{
    const menu = document.querySelector('nav.menu');
    const openCtrl = menu.querySelector('.action--menu');
    const closeCtrl = menu.querySelector('.action--close');

    // .menu--closed is only set after the first close, so the close button's
    // exit animation doesn't play on page load.
    const toggle = (open) => {
        menu.classList.toggle('menu--open', open);
        menu.classList.toggle('menu--closed', !open);
        openCtrl.setAttribute('aria-expanded', open);
        (open ? closeCtrl : openCtrl).focus();
    };

    openCtrl.addEventListener('click', () => toggle(true));
    closeCtrl.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (ev) => {
        if ( ev.key === 'Escape' && menu.classList.contains('menu--open') ) {
            toggle(false);
        }
    });

    // Preload images.
    imagesLoaded(document.querySelector('.background'), {background: true}, () => document.body.classList.remove('loading'));
}
