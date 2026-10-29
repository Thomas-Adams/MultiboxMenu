/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    // Anime.js (js/anime.min.js).
    const {animate, stagger, utils} = anime;

    // Class Menu.
    class Menu {
        constructor(el) {
            this.DOM = {el: el};
            // Open and close ctls.
            this.DOM.openCtrl = this.DOM.el.querySelector('.action--menu');
            this.DOM.closeCtrl = this.DOM.el.querySelector('.action--close');
            this.DOM.openCtrl.addEventListener('click', () => this.open());
            this.DOM.closeCtrl.addEventListener('click', () => this.close());
            this.DOM.openCtrl.addEventListener('mouseenter', () => {
                allowTilt = false;
                tilt.reset()
            });
            this.DOM.openCtrl.addEventListener('mouseleave', () => {
                allowTilt = true;
            });

            // The menu items.
            this.DOM.items = Array.from(this.DOM.el.querySelectorAll('.menu__item'));
            // The total number of items.
            this.itemsTotal = this.DOM.items.length;

            // Custom elements that will be animated.
            this.DOM.mainLinks = this.DOM.el.querySelectorAll('.mainmenu > a.mainmenu__item');
            this.DOM.sidemenuLinks = this.DOM.el.querySelectorAll('.sidemenu span.sidemenu__item-inner');
            this.DOM.menulink = this.DOM.el.querySelector('.menu__item-link');
        }
        // Open the menu.
        open() {
            this.toggle('open');
        }
        // Close the menu.
        close() {
            this.toggle('close');
        }
        toggle(action) {
            if ( this.isAnimating ) return;
            // (dis)allow the main image tilt effect.
            allowTilt = action === 'open' ? false : true;
            this.isAnimating = true;
            // Toggling the open state class.
            this.DOM.el.classList[action === 'open' ? 'add' : 'remove']('menu--open');
            // After all is animated..
            const animationEnd = (pos) => {
                if ( pos === this.itemsTotal-1 ) {
                    this.isAnimating = false;
                }
            };
            // Going through each menu´s item.
            this.DOM.items.forEach((el, pos) => {
                // The inner wrapper.
                const innerEl = el.querySelector('.menu__item-inner');
                // config and inner config will have the starting transform values (when opening) and the end ones (when closing) for both the item and its inner element.
                const config = {};
                const configInner = {};
                // Direction defined in the HTML data-direction.
                // bt (bottom to top) || tb (top to bottom) || lr (left to right) || rl (right to left)
                const direction = el.dataset.direction;
                // Using 101% instead of 100% to avoid rendering problems.
                // In order to create the "reveal" effect, the item slides moves in one direction and its inner element in the opposite direction.
                if ( direction === 'bt' ) {
                    config.y = '101%';
                    configInner.y = '-101%';
                    configInner.x = '0%';
                }
                else if ( direction === 'tb' ) {
                    config.y = '-101%';
                    configInner.y = '101%';
                    configInner.x = '0%';
                }
                else if ( direction === 'lr' ) {
                    config.x = '-101%';
                    configInner.x = '101%';
                }
                else if ( direction === 'rl' ) {
                    config.x = '101%';
                    configInner.x = '-101%';
                }
                else {
                    config.x = '101%';
                    config.y = '101%';
                    configInner.x = '-101%';
                    configInner.y = '-101%';
                }
                
                if ( action === 'open' ) {
                    // Setting the initial values.
                    utils.set(el, config);
                    utils.set(innerEl, configInner);

                    // Animate.
                    animate([el,innerEl], {
                        duration: 900,
                        ease: 'outQuint',
                        x: '0%',
                        y: '0%',
                        onComplete: () => animationEnd(pos)
                    });
                }
                else {
                    animate(el, {
                        duration: 600,
                        ease: 'inOutQuart',
                        x: config.x || 0,
                        y: config.y || 0
                    });
                    animate(innerEl, {
                        duration: 600,
                        ease: 'inOutQuart',
                        x: configInner.x || 0,
                        y: configInner.y || 0,
                        onComplete: () => animationEnd(pos)
                    });
                }
            });

            // Show/Hide open and close ctrls.
            // [from, to] arrays replace GSAP's startAt.
            animate(this.DOM.closeCtrl, {
                duration: 600,
                ease: action === 'open' ? 'outQuint' : 'inOutQuart',
                opacity: action === 'open' ? 1 : 0,
                rotate: action === 'open' ? [0, 180] : 270
            });
            animate(this.DOM.openCtrl, {
                duration: action === 'open' ? 600 : 300,
                delay: action === 'open' ? 0 : 300,
                ease: action === 'open' ? 'outQuint' : 'outQuad',
                opacity: action === 'open' ? 0 : 1
            });

            // Main links animation (closing staggers from the last link).
            animate(this.DOM.mainLinks, {
                duration: action === 'open' ? 900 : 200,
                delay: stagger(100, {from: action === 'open' ? 'first' : 'last'}),
                ease: action === 'open' ? 'outQuint' : 'inOutQuart',
                y: action === 'open' ? ['50%', '0%'] : '50%',
                opacity: action === 'open' ? [0, 1] : 0
            });

            // Sidemenu links animation.
            animate(this.DOM.sidemenuLinks, {
                duration: action === 'open' ? 500 : 200,
                delay: stagger(50, {from: action === 'open' ? 'first' : 'last'}),
                ease: action === 'open' ? 'inOutQuint' : 'inOutQuart',
                y: action === 'open' ? ['100%', '0%'] : '100%'
            });

            // The "Learn how to participate" menu link.
            animate(this.DOM.menulink, {
                duration: action === 'open' ? 900 : 600,
                ease: action === 'open' ? 'outQuint' : 'inOutQuart',
                x: action === 'open' ? ['10%', '0%'] : '10%'
            });
        }
    }
	// Initialize the Menu.
    const menu = new Menu(document.querySelector('nav.menu'));

    // Preload images.
    imagesLoaded(document.querySelector('.background'), {background: true}, () => document.body.classList.remove('loading'));
    
    // extra stuff..
    
    // From http://www.quirksmode.org/js/events_properties.html#position
    // Get the mouse position.
	const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
    };

    // Main image  tilt effect.
    class TiltFx {
        constructor() {
            this.DOM = {main: document.querySelector('.background')};
            // Number of layers (how many repeated image elements)
            this.layersTotal = 4;
            this.layout();
            this.initEvents();
        }
        layout() {
            // Use the image set on .background (inline style or CSS) for every layer.
            const image = getComputedStyle(this.DOM.main).backgroundImage;
            this.DOM.main.innerHTML = '';
            for (let i = 0; i <= this.layersTotal-1; ++i) {
                const layer = document.createElement('div');
                layer.className = 'background__copy';
                layer.style.backgroundImage = image;
                this.DOM.main.appendChild(layer);
            }
            this.DOM.layers = Array.from(this.DOM.main.querySelectorAll('.background__copy'));
        }
        initEvents() {
            this.mousemoveFn = ev => requestAnimationFrame(() => this.tilt(ev));
            document.body.addEventListener('mousemove', this.mousemoveFn);
        }
        // Tilt the image wrap and texts when mouse moving the current slide.
        tilt(ev) {
            if ( !allowTilt ) return;
            const mousepos = getMousePos(ev);
            const bounds = this.DOM.main.getBoundingClientRect();
            // Mouse position relative to the main element (this.DOM.main).
            const relmousepos = { 
                x : mousepos.x - bounds.left, 
                y : mousepos.y - bounds.top
            };

            this.DOM.layers.forEach((layer, pos) => {
                // Move the element from -val to val pixels in both x and y axis.
                let val = (pos+1);
                let t = {x:[val,-val],y:[val,-val]},
                    r = {x:[-2,2],y:[-val,val]},
                    s = {v:[1.03,0.97]};

                const transforms = {
                    translation : {
                        x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                        y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                    },
                    rotation : {
                        x: (r.x[1]-r.x[0])/bounds.height*relmousepos.y + r.x[0],
                        y: (r.y[1]-r.y[0])/bounds.width*relmousepos.x + r.y[0]
                    },
                    scale : {
                        v: (s.v[1]-s.v[0])/bounds.height*relmousepos.y + s.v[0],
                    }
                };

                animate(layer, {
                    duration: 1500,
                    ease: 'outQuad',
                    x: transforms.translation.x,
                    y: transforms.translation.y,
                    rotateX: transforms.rotation.x,
                    rotateY: transforms.rotation.y,
                    scale: transforms.scale.v,
                });
            });
        }
        // Scale up all the layers.
        zoom() {
            animate( this.DOM.layers, {
                duration: 1500,
                delay: stagger(40),
                ease: 'outExpo',
                x: 0,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                scale: 1.1,
            });
        }
        reset() {
            animate( this.DOM.layers, {
                duration: 1500,
                delay: stagger(70),
                ease: 'outExpo',
                x: 0,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                scale: 1,
            });
        }
    }

    let allowTilt = true;
    const tilt = new TiltFx();

    // Hovering the github link zooms in the main image.
    const githubEl =  document.querySelector('.github');
    githubEl.addEventListener('mouseenter', () => {
        allowTilt = false;
        tilt.zoom()
    });
    githubEl.addEventListener('mouseleave', () => allowTilt = true);
}
