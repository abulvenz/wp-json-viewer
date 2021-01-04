import m from "mithril";
import tagl from "tagl-mithril";

// prettier-ignore
const { address, aside, footer, header, h1, h2, h3, h4, h5, h6, hgroup, main, nav, section, article, blockquote, dd, dir, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kdm, mark, q, rb, rp, rt, rtc, ruby, s, samp, small, span, strong, sub, sup, time, tt, u, wbr, area, audio, img, map, track, video, embed, iframe, noembed, object, param, picture, source, canvas, noscript, script, del, ins, caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, formfield, input, label, legend, meter, optgroup, option, output, progress, select, textarea, details, dialog, menu, menuitem, summary, content, element, slot, template } = tagl(m);

const model = {
    currentPage: {},
    search: {
        text: "",
        results: []
    },
    categories: []
};

const urlReno = "https://renemorozowich.com";
const urlAdwise = "http://adwise-web-seo-content.de";
const urlEismaenners = "https://eismaenners.de";
const urlFiener = "https://www.gartenservice-fiener.de";

let currentUrl = urlEismaenners;
const url = (frag) => `${currentUrl}${frag}`;

const updateCategories = () =>
    fetch(url("/wp-json/wp/v2/categories"))
    .then((value) => value.json())
    .then(function(e) {
        model.categories = e;
        m.redraw();
    });

const updatePageInfo = () =>
    fetch(url("/wp-json/"))
    .then((value) => value.json())
    .then(function(e) {
        model.currentPage = e;
        m.redraw();
    });

const updatePosts = () => fetch(url("/wp-json/wp/v2/posts"))
    .then((value) => value.json())
    .then(function(e) {
        model.posts = e;
        m.redraw();
    });

const updateAll = function(baseURL = currentUrl) {
    currentUrl = baseURL;
    updateCategories();
    updatePageInfo();
    updatePosts();
};

updateAll();

const search = (searchText) => (
    searchText.length > 0 ? fetch(
        url(`/wp-json/wp/v2/search?search=${searchText}`))
    .then((value) => value.json())
    .then(function(results) {
        model.search.results = results;
        m.redraw();
    }) : [
        model.search.results = []
    ]);

const { assign } = Object;

const use = (v, fn) => fn(v);
const debug = function(...s) {
    console.log(s);
    return true;
};

const when = (obj, props = "", fn = (e) => e) => (props.length === 0 ?
    fn(obj) :
    (obj === undefined ?
        undefined :
        use(props.split("."), (frags) => (frags.length > 0 ?
            when(obj[frags[0]], frags.slice(1, frags.length).join("."), fn) :
            fn(obj)))));

const icon = (vnode) => assign({
    view: ({ attrs: { name } }) => span["icon-" + name]()
});

const categoryById = (id) => model.categories.find(e => e.id === id);

const hateoas = vnode => assign({
    view: ({ attrs: { links } }) => ul(
        Object.keys(links).map((linkKey) => li(linkKey + ": " + JSON.stringify(links[linkKey])))
    )
});

const blogEntry = vnode => assign({
    oninit: vnode => vnode.state.visible = false,
    view: ({ attrs }) =>
        use(attrs.post,
            (post) => article(
                div.header(
                    h1(m.trust(post.title.rendered)),
                    h6(
                        post.categories.map(catid =>
                            use(categoryById(catid), (category) =>
                                (category ?
                                    category.name : "Loading")
                            )
                        ).join(" | ")
                    )
                ),
                m.trust(post.content.rendered),
                false ? div.footer(
                    button({
                        onclick: function(e) {
                            console.log(vnode.state.visible)
                            vnode.state.visible = !vnode.state.visible;
                            console.log(vnode.state.visible)
                        }
                    }),
                    (
                        vnode.state.visible ?
                        pre(JSON.stringify(post, null, 2)) :
                        null
                    ),
                    m(hateoas, { links: post._links })
                ) : null
            )
        )
});

m.mount(document.body, {
    view: (vnode) => [
        header.sticky([
            a.logo({ "href": "#" },
                "WP-JSON"
            ),
            // a.button({ "href": "#" },
            //     "Home"
            // ),
            when(model.currentPage,
                "authentication.application-passwords.endpoints.authorization",
                (link) => debug("link" + link) &&
                a({
                        href: link
                    },
                    "Login"
                )
            ),
            label({ for: "search" }, m(icon, { name: "search" })),
            input.$search.pullRight({ oninput: e => search(e.target.value) })
        ]),
        div.container(
            (model.search.results.length > 0 ?
                pre(JSON.stringify(model.search.results, null, 2)) :
                model.posts ?
                model.posts.map((post) =>
                    m(blogEntry, { post })
                ) :
                null
            )),
        //    pre(JSON.stringify(model.currentPage, null, 2)),
        footer.sticky(
            label({ for: "base-url" }, 'Base URL'),
            input.$baseUrl({ oninput: (e) => updateAll(e.target.value) })
        )
    ]
});