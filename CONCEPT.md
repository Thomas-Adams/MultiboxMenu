# Concept: Zope product `Products.Codrops`

Goal: serve the Multibox template (`TEMPLATE.md`) from Zope 6.3 (`../Zope`) as a ZMI-editable product, rendered with page templates.

## 1. Zope installation (`../Zope`)

- **The instance starts.** Zope 6.3 runs on Python 3.14.0, with Chameleon 4.6 and z3c.pt as the page template engine. A first `bin/zopeinstance run` created `var/filestorage/Data.fs`.
- **Form libraries:** zope.formlib 7.1, five.formlib 5.0, zope.app.form 7.0 and z3c.form 6.1 are installed. Other relevant packages are zope.viewlet, zope.contentprovider, plone.portlets and plone.memoize (these come in with five.customerize), plus Products.GenericSetup.
- **None of the form libraries are switched on.** Their ZCML is never loaded: the buildout has no `zcml =` line, and none of them register for auto-include. In the running instance, no z3c.form widgets and no five.customerize views were registered. Packages under `Products.*` load automatically, so our product can include what it needs in its own `configure.zcml`.
- **Problems in `buildout.cfg`:**
  - `develop=src` points to a directory that doesn't exist. It should be `src/Products.Codrops`.
  - `Products.ZCatalog` is listed twice.
  - The `[zopescripts]` part is defined but not in `parts`, so it is never built.
  - The admin login is `admin:admin`.
  - There is no test runner.
- **Package layout:** The installed Products use PEP 420 namespaces, so there is no `Products/__init__.py`. We do the same.

## 2. Do we need more libraries?

**No extra packages are needed.**

| Need | Choice |
|---|---|
| Edit forms in the ZMI | **five.formlib**: it is installed, works in Zope as-is, and doesn't depend on Plone. |
| z3c.form | Not recommended. Using it properly in Zope needs `plone.z3cform` and `plone.batching`, which come from Plone rather than the Zope Foundation and add more pieces than we need. |
| Templates | Products.PageTemplates (Chameleon) with `ViewPageTemplateFile`. |
| Static files | `browser:resourceDirectory` from zope.browserresource, which is installed. |
| Tests | Add a `[test]` part with `zc.recipe.testrunner`. `Testing.ZopeTestCase` and zope.testbrowser are already there. |
| Optional | `Products.LocalFS` is installed and handy for serving the demo folder during development. |

## 3. Components

**Content model:** a `Multibox Site` is an ordered folder, and each box is an object inside it. Folder order is box order, which replaces the `boxes` array. Images are `OFS.Image` objects inside the site, uploaded through the ZMI.

```
src/Products.Codrops/
  setup.py / pyproject.toml
  src/Products/Codrops/
    __init__.py          initialize(): registerClass for Site + box types (ZMI "Add" list)
    configure.zcml       <include package="five.formlib"/>, browser views, resources
    interfaces.py        ISite, IBox, IStaticBox, ITeaserBox, INavBox, IOsmBox, IMapImageBox (zope.schema)
    site.py              MultiboxSite: theme, motion, frame, hero, background, grid (+ mobile)
    boxes.py             one class per type; common base holds area/direction/background/labels/mobile*
    grid.py              port of checkAreas(): raises Invalid → shows as a form error, not a console warning
    browser/
      site.py            SiteView: theme/grid style strings, helpers
      boxes.py           BoxView base (stagger counter, label rendering) + one view per type
      forms.py           five.formlib add/edit forms (ZMI tabs)
      export.py          @@config.json, @@site.config.js, import
      templates/
        page.pt          html/head/body, icon sprite, slots
        frame.pt  hero.pt  menu.pt   (macros)
        labels.pt        shared macro
        box_static.pt  box_teaser.pt  box_nav.pt  box_osm.pt  box_mapimage.pt
    static/              template.css, multibox.js, leaflet/ (self-hosted)
```

- **Box-type dispatch:** each type registers a view called `box` for its own interface. In `menu.pt`, each box is rendered with `<div tal:replace="structure python: box.restrictedTraverse('@@box')()"/>`. Adding a new box type then takes an interface, a class, a template and one ZCML line, the same steps `TEMPLATE.md` describes for JS.
- **Macros or viewlets:** macros for the frame, hero and labels. zope.viewlet only pays off if other packages need to plug into the page, which isn't the case here.
- **Lists in forms:** nav items, footer links, markers and labels are lists of objects, and formlib handles those badly. Use `Lines` fields in a `Label | href` format, parsed by the view. The other option is zope.app.form's `ListSequenceWidget` with `ObjectWidget`, which works but is clumsy.

## 4. JavaScript integration

**Render all the HTML on the server and keep only the behaviour in JS.** This also takes care of the SEO/no-JS item in `TODOS.md`.

- **Grid and theme:** the templates write them as inline custom properties, `--cols`, `--areas` and `--m-*` on `.menu` and `--color-*` on `<html>`. The CSS stays unchanged.
- **Animation stagger (`--i` / `--n`):** the box view counts its own animated elements and writes the values inline, so JS no longer needs to set them.
- **Text:** TAL escapes all text by default, the same guarantee the JS gives with `textContent`. `\n` keeps working because the CSS already uses `white-space: pre-line`.
- **Split `template.js` in two:**
  - **`multibox.js`** handles behaviour only: open/close, Esc, focus, `aria-expanded`, the loader, lazy-loading Leaflet and `invalidateSize()`.
  - **`template.js`** keeps only the DOM building from `SITE_CONFIG` and then calls the shared init. That way the `file://` template and the Zope version share one behaviour script.
- **Data for JS:** each map box gets a `data-map='{"center":…,"markers":…}'` attribute, which TAL escapes safely. The background image URL for the loader goes in `data-preload` on `<body>`. No global config object.
- **JS generated on the fly:** `@@site.config.js` serves `window.SITE_CONFIG = {…}` (built with `json.dumps`, `Content-Type: application/javascript`). It isn't used to render the Zope page. It's for export: the client-side renderer and other static pages can use the data as they are now, and `@@config.json` plus an import form make it a round trip.
- **Resources:** files are served under `++resource++codrops/…` with long cache headers. Leaflet is self-hosted there, which also settles the SRI item in `TODOS.md`.

## 5. Order of work

1. Product skeleton and buildout fixes. Add a Site with a single JSON field, rendered on the server through the macros, to check the pipeline end to end.
2. Box classes, box views and five.formlib forms, with grid validation when a form is saved.
3. Split the JS into `multibox.js` and update `template.html` to use it.
4. Export/import, tests and Leaflet self-hosting.

### Status

- [x] Buildout: `develop = src/Products.Codrops`, duplicate egg removed, `extends` → `versions.cfg` (adds test pins), `[zopescripts]` (`bin/zopepy` with the instance eggs) and `[test]` (`bin/test`, zope.testrunner) added.
- [x] Step 1: `Multibox Site` with the config as one JSON field (five.formlib *Config* tab, validated on save), page rendered on the server (frame/hero/menu macros, one template per box type), `@@site.config.js`, `@@config.json`.
- [x] Step 3: `js/multibox.js` (behaviour) split from `js/template.js` (renderer); `template.html` loads both.
- [x] Step 2: the JSON field is replaced by schema fields on the site (*Settings* and *Grid* tabs) and one object per box (5 types, *Edit* tab each, addable only inside a site). Lists are one entry per line (`Label | URL`, `text | position | vertical`, `lat, lng | popup`). The Grid tab checks the areas against the boxes; a box form checks its area against the grid. `getConfig()` / `importConfig()` convert to and from the `SITE_CONFIG` structure (a new site imports `default_config.json`; a test checks the round trip).
- [x] Step 4: *Import/Export* tab (download `config.json` / `site.config.js`; import a file or pasted JSON, all or nothing), Leaflet 1.9.4 self-hosted in `static/leaflet` (npm tarball, integrity checked; unpkg in `template.html` now pinned with SRI), favicon.
- [ ] Open: `static/css|js|img|favicon.ico` are symlinks into this repo, so a clone of the product repo alone has no CSS/JS. Before deploying: copy them in (or package them) instead of linking.

Tests: `cd ../Zope && bin/test -s Products.Codrops` (35 tests; the functional layer uses Chameleon like the instance).

## Decisions

- [x] **Where the CSS/JS live:** `MultiboxMenu/` is the source; `static/css`, `static/js`, `static/img` in the product are symlinks to it.
- [x] **Git:** own repository in `../Zope/src/Products.Codrops` (branch `main`).
- [x] five.formlib (not z3c.form + plone.z3cform) and server-side rendering.
