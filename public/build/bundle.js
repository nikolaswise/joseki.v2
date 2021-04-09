
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/ThemePicker.svelte generated by Svelte v3.31.0 */

    const file = "src/components/ThemePicker.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (152:2) {#each themes as theme}
    function create_each_block(ctx) {
    	let a;
    	let t;
    	let a_class_value;
    	let a_data_theme_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("⬤\n    ");
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", a_class_value = "" + (null_to_empty(`menu-item js-switch-theme blank-marker theme-${/*theme*/ ctx[3].toLowerCase()}`) + " svelte-144zop3"));
    			attr_dev(a, "data-theme", a_data_theme_value = `theme-${/*theme*/ ctx[3].toLowerCase()}`);
    			add_location(a, file, 152, 4, 4188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*setTheme*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(152:2) {#each themes as theme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let svg;
    	let defs;
    	let filter;
    	let feGaussianBlur0;
    	let feColorMatrix0;
    	let feGaussianBlur1;
    	let feColorMatrix1;
    	let feOffset;
    	let feComposite0;
    	let feComposite1;
    	let t0;
    	let nav;
    	let input;
    	let t1;
    	let label;
    	let t3;
    	let each_value = /*themes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			filter = svg_element("filter");
    			feGaussianBlur0 = svg_element("feGaussianBlur");
    			feColorMatrix0 = svg_element("feColorMatrix");
    			feGaussianBlur1 = svg_element("feGaussianBlur");
    			feColorMatrix1 = svg_element("feColorMatrix");
    			feOffset = svg_element("feOffset");
    			feComposite0 = svg_element("feComposite");
    			feComposite1 = svg_element("feComposite");
    			t0 = space();
    			nav = element("nav");
    			input = element("input");
    			t1 = space();
    			label = element("label");
    			label.textContent = "◐";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(feGaussianBlur0, "in", "SourceGraphic");
    			attr_dev(feGaussianBlur0, "result", "blur");
    			attr_dev(feGaussianBlur0, "stdDeviation", "10");
    			add_location(feGaussianBlur0, file, 133, 6, 3445);
    			attr_dev(feColorMatrix0, "in", "blur");
    			attr_dev(feColorMatrix0, "mode", "matrix");
    			attr_dev(feColorMatrix0, "values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -9");
    			attr_dev(feColorMatrix0, "result", "goo");
    			add_location(feColorMatrix0, file, 134, 6, 3521);
    			attr_dev(feGaussianBlur1, "in", "goo");
    			attr_dev(feGaussianBlur1, "stdDeviation", "3");
    			attr_dev(feGaussianBlur1, "result", "shadow");
    			add_location(feGaussianBlur1, file, 135, 6, 3636);
    			attr_dev(feColorMatrix1, "in", "shadow");
    			attr_dev(feColorMatrix1, "mode", "matrix");
    			attr_dev(feColorMatrix1, "result", "shadow");
    			add_location(feColorMatrix1, file, 136, 6, 3703);
    			attr_dev(feOffset, "in", "shadow");
    			attr_dev(feOffset, "dx", "1");
    			attr_dev(feOffset, "dy", "1");
    			attr_dev(feOffset, "result", "shadow");
    			add_location(feOffset, file, 137, 6, 3769);
    			attr_dev(feComposite0, "in2", "shadow");
    			attr_dev(feComposite0, "in", "goo");
    			attr_dev(feComposite0, "result", "goo");
    			add_location(feComposite0, file, 138, 6, 3830);
    			attr_dev(feComposite1, "in2", "goo");
    			attr_dev(feComposite1, "in", "SourceGraphic");
    			attr_dev(feComposite1, "result", "mix");
    			add_location(feComposite1, file, 139, 6, 3887);
    			attr_dev(filter, "id", "shadowed-goo");
    			add_location(filter, file, 132, 4, 3412);
    			add_location(defs, file, 131, 2, 3401);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "height", "0");
    			attr_dev(svg, "width", "0");
    			add_location(svg, file, 130, 0, 3323);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "menu-open svelte-144zop3");
    			attr_dev(input, "name", "menu-open");
    			attr_dev(input, "id", "menu-open");
    			add_location(input, file, 146, 2, 4014);
    			attr_dev(label, "class", "menu-open-button svelte-144zop3");
    			attr_dev(label, "for", "menu-open");
    			add_location(label, file, 148, 2, 4092);
    			attr_dev(nav, "class", "theme-switcher menu svelte-144zop3");
    			add_location(nav, file, 144, 0, 3977);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, filter);
    			append_dev(filter, feGaussianBlur0);
    			append_dev(filter, feColorMatrix0);
    			append_dev(filter, feGaussianBlur1);
    			append_dev(filter, feColorMatrix1);
    			append_dev(filter, feOffset);
    			append_dev(filter, feComposite0);
    			append_dev(filter, feComposite1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, input);
    			append_dev(nav, t1);
    			append_dev(nav, label);
    			append_dev(nav, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*themes, setTheme*/ 3) {
    				each_value = /*themes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ThemePicker", slots, []);
    	const themes = ["Default", "Blue", "Orange", "Green", "IKB", "Classic", "Neutral", "Night "];
    	let themeClasses = themes.map(theme => `theme-${theme.toLowerCase()}`);

    	const setTheme = e => {
    		let theme = e.target.dataset.theme;
    		document.body.classList = "";
    		document.body.classList.add(theme);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemePicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ themes, themeClasses, setTheme });

    	$$self.$inject_state = $$props => {
    		if ("themeClasses" in $$props) themeClasses = $$props.themeClasses;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [themes, setTheme];
    }

    class ThemePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemePicker",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /**
     * Utility module to work with key-value stores.
     *
     * @module map
     */

    /**
     * Creates a new Map instance.
     *
     * @function
     * @return {Map<any, any>}
     *
     * @function
     */
    const create = () => new Map();

    /**
     * Copy a Map object into a fresh Map object.
     *
     * @function
     * @template X,Y
     * @param {Map<X,Y>} m
     * @return {Map<X,Y>}
     */
    const copy = m => {
      const r = create();
      m.forEach((v, k) => { r.set(k, v); });
      return r
    };

    /**
     * Get map property. Create T if property is undefined and set T on map.
     *
     * ```js
     * const listeners = map.setIfUndefined(events, 'eventName', set.create)
     * listeners.add(listener)
     * ```
     *
     * @function
     * @template T,K
     * @param {Map<K, T>} map
     * @param {K} key
     * @param {function():T} createT
     * @return {T}
     */
    const setIfUndefined = (map, key, createT) => {
      let set = map.get(key);
      if (set === undefined) {
        map.set(key, set = createT());
      }
      return set
    };

    /**
     * Creates an Array and populates it with the content of all key-value pairs using the `f(value, key)` function.
     *
     * @function
     * @template K
     * @template V
     * @template R
     * @param {Map<K,V>} m
     * @param {function(V,K):R} f
     * @return {Array<R>}
     */
    const map = (m, f) => {
      const res = [];
      for (const [key, value] of m) {
        res.push(f(value, key));
      }
      return res
    };

    /**
     * Tests whether any key-value pairs pass the test implemented by `f(value, key)`.
     *
     * @todo should rename to some - similarly to Array.some
     *
     * @function
     * @template K
     * @template V
     * @param {Map<K,V>} m
     * @param {function(V,K):boolean} f
     * @return {boolean}
     */
    const any = (m, f) => {
      for (const [key, value] of m) {
        if (f(value, key)) {
          return true
        }
      }
      return false
    };

    /**
     * Utility module to work with sets.
     *
     * @module set
     */

    const create$1 = () => new Set();

    /**
     * Utility module to work with Arrays.
     *
     * @module array
     */

    /**
     * Return the last element of an array. The element must exist
     *
     * @template L
     * @param {Array<L>} arr
     * @return {L}
     */
    const last = arr => arr[arr.length - 1];

    /**
     * Append elements from src to dest
     *
     * @template M
     * @param {Array<M>} dest
     * @param {Array<M>} src
     */
    const appendTo = (dest, src) => {
      for (let i = 0; i < src.length; i++) {
        dest.push(src[i]);
      }
    };

    /**
     * Transforms something array-like to an actual Array.
     *
     * @function
     * @template T
     * @param {ArrayLike<T>|Iterable<T>} arraylike
     * @return {T}
     */
    const from = Array.from;

    /**
     * Observable class prototype.
     *
     * @module observable
     */

    /**
     * Handles named events.
     *
     * @template N
     */
    class Observable {
      constructor () {
        /**
         * Some desc.
         * @type {Map<N, any>}
         */
        this._observers = create();
      }

      /**
       * @param {N} name
       * @param {function} f
       */
      on (name, f) {
        setIfUndefined(this._observers, name, create$1).add(f);
      }

      /**
       * @param {N} name
       * @param {function} f
       */
      once (name, f) {
        /**
         * @param  {...any} args
         */
        const _f = (...args) => {
          this.off(name, _f);
          f(...args);
        };
        this.on(name, _f);
      }

      /**
       * @param {N} name
       * @param {function} f
       */
      off (name, f) {
        const observers = this._observers.get(name);
        if (observers !== undefined) {
          observers.delete(f);
          if (observers.size === 0) {
            this._observers.delete(name);
          }
        }
      }

      /**
       * Emit a named event. All registered event listeners that listen to the
       * specified name will receive the event.
       *
       * @todo This should catch exceptions
       *
       * @param {N} name The event name.
       * @param {Array<any>} args The arguments that are applied to the event listener.
       */
      emit (name, args) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        return from((this._observers.get(name) || create()).values()).forEach(f => f(...args))
      }

      destroy () {
        this._observers = create();
      }
    }

    /**
     * Common Math expressions.
     *
     * @module math
     */

    const floor = Math.floor;
    const abs = Math.abs;
    const log10 = Math.log10;

    /**
     * @function
     * @param {number} a
     * @param {number} b
     * @return {number} The smaller element of a and b
     */
    const min = (a, b) => a < b ? a : b;

    /**
     * @function
     * @param {number} a
     * @param {number} b
     * @return {number} The bigger element of a and b
     */
    const max = (a, b) => a > b ? a : b;

    /**
     * @param {number} n
     * @return {boolean} Wether n is negative. This function also differentiates between -0 and +0
     */
    const isNegativeZero = n => n !== 0 ? n < 0 : 1 / n < 0;

    /**
     * Utility module to work with strings.
     *
     * @module string
     */

    const fromCharCode = String.fromCharCode;

    /**
     * @param {string} s
     * @return {string}
     */
    const toLowerCase = s => s.toLowerCase();

    const trimLeftRegex = /^\s*/g;

    /**
     * @param {string} s
     * @return {string}
     */
    const trimLeft = s => s.replace(trimLeftRegex, '');

    const fromCamelCaseRegex = /([A-Z])/g;

    /**
     * @param {string} s
     * @param {string} separator
     * @return {string}
     */
    const fromCamelCase = (s, separator) => trimLeft(s.replace(fromCamelCaseRegex, match => `${separator}${toLowerCase(match)}`));

    /**
     * @param {string} str
     * @return {Uint8Array}
     */
    const _encodeUtf8Polyfill = str => {
      const encodedString = unescape(encodeURIComponent(str));
      const len = encodedString.length;
      const buf = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buf[i] = /** @type {number} */ (encodedString.codePointAt(i));
      }
      return buf
    };

    /* istanbul ignore next */
    const utf8TextEncoder = /** @type {TextEncoder} */ (typeof TextEncoder !== 'undefined' ? new TextEncoder() : null);

    /**
     * @param {string} str
     * @return {Uint8Array}
     */
    const _encodeUtf8Native = str => utf8TextEncoder.encode(str);

    /**
     * @param {string} str
     * @return {Uint8Array}
     */
    /* istanbul ignore next */
    const encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;

    /* istanbul ignore next */
    let utf8TextDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

    /* istanbul ignore next */
    if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
      // Safari doesn't handle BOM correctly.
      // This fixes a bug in Safari 13.0.5 where it produces a BOM the first time it is called.
      // utf8TextDecoder.decode(new Uint8Array()).length === 1 on the first call and
      // utf8TextDecoder.decode(new Uint8Array()).length === 1 on the second call
      // Another issue is that from then on no BOM chars are recognized anymore
      /* istanbul ignore next */
      utf8TextDecoder = null;
    }

    /**
     * Often used conditions.
     *
     * @module conditions
     */

    /**
     * @template T
     * @param {T|null|undefined} v
     * @return {T|null}
     */
    /* istanbul ignore next */
    const undefinedToNull = v => v === undefined ? null : v;

    /* global localStorage */

    /**
     * Isomorphic variable storage.
     *
     * Uses LocalStorage in the browser and falls back to in-memory storage.
     *
     * @module storage
     */

    /* istanbul ignore next */
    class VarStoragePolyfill {
      constructor () {
        this.map = new Map();
      }

      /**
       * @param {string} key
       * @param {any} value
       */
      setItem (key, value) {
        this.map.set(key, value);
      }

      /**
       * @param {string} key
       */
      getItem (key) {
        return this.map.get(key)
      }
    }

    /* istanbul ignore next */
    /**
     * @type {any}
     */
    let _localStorage = new VarStoragePolyfill();

    try {
      // if the same-origin rule is violated, accessing localStorage might thrown an error
      /* istanbul ignore next */
      if (typeof localStorage !== 'undefined') {
        _localStorage = localStorage;
      }
    } catch (e) { }

    /* istanbul ignore next */
    /**
     * This is basically localStorage in browser, or a polyfill in nodejs
     */
    const varStorage = _localStorage;

    /**
     * Isomorphic module to work access the environment (query params, env variables).
     *
     * @module map
     */

    /* istanbul ignore next */
    // @ts-ignore
    const isNode = typeof process !== 'undefined' && process.release && /node|io\.js/.test(process.release.name);
    /* istanbul ignore next */
    const isBrowser = typeof window !== 'undefined' && !isNode;
    /* istanbul ignore next */
    const isMac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;

    /**
     * @type {Map<string,string>}
     */
    let params;

    /* istanbul ignore next */
    const computeParams = () => {
      if (params === undefined) {
        if (isNode) {
          params = create();
          const pargs = process.argv;
          let currParamName = null;
          /* istanbul ignore next */
          for (let i = 0; i < pargs.length; i++) {
            const parg = pargs[i];
            if (parg[0] === '-') {
              if (currParamName !== null) {
                params.set(currParamName, '');
              }
              currParamName = parg;
            } else {
              if (currParamName !== null) {
                params.set(currParamName, parg);
                currParamName = null;
              }
            }
          }
          if (currParamName !== null) {
            params.set(currParamName, '');
          }
        // in ReactNative for example this would not be true (unless connected to the Remote Debugger)
        } else if (typeof location === 'object') {
          params = create()
          // eslint-disable-next-line no-undef
          ;(location.search || '?').slice(1).split('&').forEach(kv => {
            if (kv.length !== 0) {
              const [key, value] = kv.split('=');
              params.set(`--${fromCamelCase(key, '-')}`, value);
              params.set(`-${fromCamelCase(key, '-')}`, value);
            }
          });
        } else {
          params = create();
        }
      }
      return params
    };

    /**
     * @param {string} name
     * @return {boolean}
     */
    /* istanbul ignore next */
    const hasParam = name => computeParams().has(name);
    // export const getArgs = name => computeParams() && args

    /**
     * @param {string} name
     * @return {string|null}
     */
    /* istanbul ignore next */
    const getVariable = name => isNode ? undefinedToNull(process.env[name.toUpperCase()]) : undefinedToNull(varStorage.getItem(name));

    /**
     * @param {string} name
     * @return {boolean}
     */
    /* istanbul ignore next */
    const hasConf = name => hasParam('--' + name) || getVariable(name) !== null;

    /* istanbul ignore next */
    const production = hasConf('production');

    /* eslint-env browser */

    /**
     * Binary data constants.
     *
     * @module binary
     */

    /**
     * n-th bit activated.
     *
     * @type {number}
     */
    const BIT1 = 1;
    const BIT2 = 2;
    const BIT3 = 4;
    const BIT4 = 8;
    const BIT6 = 32;
    const BIT7 = 64;
    const BIT8 = 128;
    const BITS5 = 31;
    const BITS6 = 63;
    const BITS7 = 127;
    /**
     * @type {number}
     */
    const BITS31 = 0x7FFFFFFF;

    /**
     * Efficient schema-less binary decoding with support for variable length encoding.
     *
     * Use [lib0/decoding] with [lib0/encoding]. Every encoding function has a corresponding decoding function.
     *
     * Encodes numbers in little-endian order (least to most significant byte order)
     * and is compatible with Golang's binary encoding (https://golang.org/pkg/encoding/binary/)
     * which is also used in Protocol Buffers.
     *
     * ```js
     * // encoding step
     * const encoder = new encoding.createEncoder()
     * encoding.writeVarUint(encoder, 256)
     * encoding.writeVarString(encoder, 'Hello world!')
     * const buf = encoding.toUint8Array(encoder)
     * ```
     *
     * ```js
     * // decoding step
     * const decoder = new decoding.createDecoder(buf)
     * decoding.readVarUint(decoder) // => 256
     * decoding.readVarString(decoder) // => 'Hello world!'
     * decoding.hasContent(decoder) // => false - all data is read
     * ```
     *
     * @module decoding
     */

    /**
     * A Decoder handles the decoding of an Uint8Array.
     */
    class Decoder {
      /**
       * @param {Uint8Array} uint8Array Binary data to decode
       */
      constructor (uint8Array) {
        /**
         * Decoding target.
         *
         * @type {Uint8Array}
         */
        this.arr = uint8Array;
        /**
         * Current decoding position.
         *
         * @type {number}
         */
        this.pos = 0;
      }
    }

    /**
     * @function
     * @param {Uint8Array} uint8Array
     * @return {Decoder}
     */
    const createDecoder = uint8Array => new Decoder(uint8Array);

    /**
     * @function
     * @param {Decoder} decoder
     * @return {boolean}
     */
    const hasContent = decoder => decoder.pos !== decoder.arr.length;

    /**
     * Create an Uint8Array view of the next `len` bytes and advance the position by `len`.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     *
     * @function
     * @param {Decoder} decoder The decoder instance
     * @param {number} len The length of bytes to read
     * @return {Uint8Array}
     */
    const readUint8Array = (decoder, len) => {
      const view = createUint8ArrayViewFromArrayBuffer(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
      decoder.pos += len;
      return view
    };

    /**
     * Read variable length Uint8Array.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     *
     * @function
     * @param {Decoder} decoder
     * @return {Uint8Array}
     */
    const readVarUint8Array = decoder => readUint8Array(decoder, readVarUint(decoder));

    /**
     * Read one byte as unsigned integer.
     * @function
     * @param {Decoder} decoder The decoder instance
     * @return {number} Unsigned 8-bit integer
     */
    const readUint8 = decoder => decoder.arr[decoder.pos++];

    /**
     * Read unsigned integer (32bit) with variable length.
     * 1/8th of the storage is used as encoding overhead.
     *  * numbers < 2^7 is stored in one bytlength
     *  * numbers < 2^14 is stored in two bylength
     *
     * @function
     * @param {Decoder} decoder
     * @return {number} An unsigned integer.length
     */
    const readVarUint = decoder => {
      let num = 0;
      let len = 0;
      while (true) {
        const r = decoder.arr[decoder.pos++];
        num = num | ((r & BITS7) << len);
        len += 7;
        if (r < BIT8) {
          return num >>> 0 // return unsigned number!
        }
        /* istanbul ignore if */
        if (len > 35) {
          throw new Error('Integer out of range!')
        }
      }
    };

    /**
     * Read signed integer (32bit) with variable length.
     * 1/8th of the storage is used as encoding overhead.
     *  * numbers < 2^7 is stored in one bytlength
     *  * numbers < 2^14 is stored in two bylength
     * @todo This should probably create the inverse ~num if unmber is negative - but this would be a breaking change.
     *
     * @function
     * @param {Decoder} decoder
     * @return {number} An unsigned integer.length
     */
    const readVarInt = decoder => {
      let r = decoder.arr[decoder.pos++];
      let num = r & BITS6;
      let len = 6;
      const sign = (r & BIT7) > 0 ? -1 : 1;
      if ((r & BIT8) === 0) {
        // don't continue reading
        return sign * num
      }
      while (true) {
        r = decoder.arr[decoder.pos++];
        num = num | ((r & BITS7) << len);
        len += 7;
        if (r < BIT8) {
          return sign * (num >>> 0)
        }
        /* istanbul ignore if */
        if (len > 41) {
          throw new Error('Integer out of range!')
        }
      }
    };

    /**
     * Read string of variable length
     * * varUint is used to store the length of the string
     *
     * Transforming utf8 to a string is pretty expensive. The code performs 10x better
     * when String.fromCodePoint is fed with all characters as arguments.
     * But most environments have a maximum number of arguments per functions.
     * For effiency reasons we apply a maximum of 10000 characters at once.
     *
     * @function
     * @param {Decoder} decoder
     * @return {String} The read String.
     */
    const readVarString = decoder => {
      let remainingLen = readVarUint(decoder);
      if (remainingLen === 0) {
        return ''
      } else {
        let encodedString = String.fromCodePoint(readUint8(decoder)); // remember to decrease remainingLen
        if (--remainingLen < 100) { // do not create a Uint8Array for small strings
          while (remainingLen--) {
            encodedString += String.fromCodePoint(readUint8(decoder));
          }
        } else {
          while (remainingLen > 0) {
            const nextLen = remainingLen < 10000 ? remainingLen : 10000;
            // this is dangerous, we create a fresh array view from the existing buffer
            const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
            decoder.pos += nextLen;
            // Starting with ES5.1 we can supply a generic array-like object as arguments
            encodedString += String.fromCodePoint.apply(null, /** @type {any} */ (bytes));
            remainingLen -= nextLen;
          }
        }
        return decodeURIComponent(escape(encodedString))
      }
    };

    /**
     * @param {Decoder} decoder
     * @param {number} len
     * @return {DataView}
     */
    const readFromDataView = (decoder, len) => {
      const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
      decoder.pos += len;
      return dv
    };

    /**
     * @param {Decoder} decoder
     */
    const readFloat32 = decoder => readFromDataView(decoder, 4).getFloat32(0);

    /**
     * @param {Decoder} decoder
     */
    const readFloat64 = decoder => readFromDataView(decoder, 8).getFloat64(0);

    /**
     * @param {Decoder} decoder
     */
    const readBigInt64 = decoder => /** @type {any} */ (readFromDataView(decoder, 8)).getBigInt64(0);

    /**
     * @type {Array<function(Decoder):any>}
     */
    const readAnyLookupTable = [
      decoder => undefined, // CASE 127: undefined
      decoder => null, // CASE 126: null
      readVarInt, // CASE 125: integer
      readFloat32, // CASE 124: float32
      readFloat64, // CASE 123: float64
      readBigInt64, // CASE 122: bigint
      decoder => false, // CASE 121: boolean (false)
      decoder => true, // CASE 120: boolean (true)
      readVarString, // CASE 119: string
      decoder => { // CASE 118: object<string,any>
        const len = readVarUint(decoder);
        /**
         * @type {Object<string,any>}
         */
        const obj = {};
        for (let i = 0; i < len; i++) {
          const key = readVarString(decoder);
          obj[key] = readAny(decoder);
        }
        return obj
      },
      decoder => { // CASE 117: array<any>
        const len = readVarUint(decoder);
        const arr = [];
        for (let i = 0; i < len; i++) {
          arr.push(readAny(decoder));
        }
        return arr
      },
      readVarUint8Array // CASE 116: Uint8Array
    ];

    /**
     * @param {Decoder} decoder
     */
    const readAny = decoder => readAnyLookupTable[127 - readUint8(decoder)](decoder);

    /**
     * T must not be null.
     *
     * @template T
     */
    class RleDecoder extends Decoder {
      /**
       * @param {Uint8Array} uint8Array
       * @param {function(Decoder):T} reader
       */
      constructor (uint8Array, reader) {
        super(uint8Array);
        /**
         * The reader
         */
        this.reader = reader;
        /**
         * Current state
         * @type {T|null}
         */
        this.s = null;
        this.count = 0;
      }

      read () {
        if (this.count === 0) {
          this.s = this.reader(this);
          if (hasContent(this)) {
            this.count = readVarUint(this) + 1; // see encoder implementation for the reason why this is incremented
          } else {
            this.count = -1; // read the current value forever
          }
        }
        this.count--;
        return /** @type {T} */ (this.s)
      }
    }

    class UintOptRleDecoder extends Decoder {
      /**
       * @param {Uint8Array} uint8Array
       */
      constructor (uint8Array) {
        super(uint8Array);
        /**
         * @type {number}
         */
        this.s = 0;
        this.count = 0;
      }

      read () {
        if (this.count === 0) {
          this.s = readVarInt(this);
          // if the sign is negative, we read the count too, otherwise count is 1
          const isNegative = isNegativeZero(this.s);
          this.count = 1;
          if (isNegative) {
            this.s = -this.s;
            this.count = readVarUint(this) + 2;
          }
        }
        this.count--;
        return /** @type {number} */ (this.s)
      }
    }

    class IntDiffOptRleDecoder extends Decoder {
      /**
       * @param {Uint8Array} uint8Array
       */
      constructor (uint8Array) {
        super(uint8Array);
        /**
         * @type {number}
         */
        this.s = 0;
        this.count = 0;
        this.diff = 0;
      }

      /**
       * @return {number}
       */
      read () {
        if (this.count === 0) {
          const diff = readVarInt(this);
          // if the first bit is set, we read more data
          const hasCount = diff & 1;
          this.diff = diff >> 1;
          this.count = 1;
          if (hasCount) {
            this.count = readVarUint(this) + 2;
          }
        }
        this.s += this.diff;
        this.count--;
        return this.s
      }
    }

    class StringDecoder {
      /**
       * @param {Uint8Array} uint8Array
       */
      constructor (uint8Array) {
        this.decoder = new UintOptRleDecoder(uint8Array);
        this.str = readVarString(this.decoder);
        /**
         * @type {number}
         */
        this.spos = 0;
      }

      /**
       * @return {string}
       */
      read () {
        const end = this.spos + this.decoder.read();
        const res = this.str.slice(this.spos, end);
        this.spos = end;
        return res
      }
    }

    /**
     * Utility functions to work with buffers (Uint8Array).
     *
     * @module buffer
     */

    /**
     * @param {number} len
     */
    const createUint8ArrayFromLen = len => new Uint8Array(len);

    /**
     * Create Uint8Array with initial content from buffer
     *
     * @param {ArrayBuffer} buffer
     * @param {number} byteOffset
     * @param {number} length
     */
    const createUint8ArrayViewFromArrayBuffer = (buffer, byteOffset, length) => new Uint8Array(buffer, byteOffset, length);

    /**
     * Create Uint8Array with initial content from buffer
     *
     * @param {ArrayBuffer} buffer
     */
    const createUint8ArrayFromArrayBuffer = buffer => new Uint8Array(buffer);

    /* istanbul ignore next */
    /**
     * @param {Uint8Array} bytes
     * @return {string}
     */
    const toBase64Browser = bytes => {
      let s = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        s += fromCharCode(bytes[i]);
      }
      // eslint-disable-next-line no-undef
      return btoa(s)
    };

    /**
     * @param {Uint8Array} bytes
     * @return {string}
     */
    const toBase64Node = bytes => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');

    /* istanbul ignore next */
    /**
     * @param {string} s
     * @return {Uint8Array}
     */
    const fromBase64Browser = s => {
      // eslint-disable-next-line no-undef
      const a = atob(s);
      const bytes = createUint8ArrayFromLen(a.length);
      for (let i = 0; i < a.length; i++) {
        bytes[i] = a.charCodeAt(i);
      }
      return bytes
    };

    /**
     * @param {string} s
     */
    const fromBase64Node = s => {
      const buf = Buffer.from(s, 'base64');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    };

    /* istanbul ignore next */
    const toBase64 = isBrowser ? toBase64Browser : toBase64Node;

    /* istanbul ignore next */
    const fromBase64 = isBrowser ? fromBase64Browser : fromBase64Node;

    /**
     * Copy the content of an Uint8Array view to a new ArrayBuffer.
     *
     * @param {Uint8Array} uint8Array
     * @return {Uint8Array}
     */
    const copyUint8Array = uint8Array => {
      const newBuf = createUint8ArrayFromLen(uint8Array.byteLength);
      newBuf.set(uint8Array);
      return newBuf
    };

    /**
     * Utility helpers for working with numbers.
     *
     * @module number
     */

    /**
     * @module number
     */

    /* istanbul ignore next */
    const isInteger = Number.isInteger || (num => typeof num === 'number' && isFinite(num) && floor(num) === num);

    /**
     * Efficient schema-less binary encoding with support for variable length encoding.
     *
     * Use [lib0/encoding] with [lib0/decoding]. Every encoding function has a corresponding decoding function.
     *
     * Encodes numbers in little-endian order (least to most significant byte order)
     * and is compatible with Golang's binary encoding (https://golang.org/pkg/encoding/binary/)
     * which is also used in Protocol Buffers.
     *
     * ```js
     * // encoding step
     * const encoder = new encoding.createEncoder()
     * encoding.writeVarUint(encoder, 256)
     * encoding.writeVarString(encoder, 'Hello world!')
     * const buf = encoding.toUint8Array(encoder)
     * ```
     *
     * ```js
     * // decoding step
     * const decoder = new decoding.createDecoder(buf)
     * decoding.readVarUint(decoder) // => 256
     * decoding.readVarString(decoder) // => 'Hello world!'
     * decoding.hasContent(decoder) // => false - all data is read
     * ```
     *
     * @module encoding
     */

    /**
     * A BinaryEncoder handles the encoding to an Uint8Array.
     */
    class Encoder {
      constructor () {
        this.cpos = 0;
        this.cbuf = new Uint8Array(100);
        /**
         * @type {Array<Uint8Array>}
         */
        this.bufs = [];
      }
    }

    /**
     * @function
     * @return {Encoder}
     */
    const createEncoder = () => new Encoder();

    /**
     * The current length of the encoded data.
     *
     * @function
     * @param {Encoder} encoder
     * @return {number}
     */
    const length = encoder => {
      let len = encoder.cpos;
      for (let i = 0; i < encoder.bufs.length; i++) {
        len += encoder.bufs[i].length;
      }
      return len
    };

    /**
     * Transform to Uint8Array.
     *
     * @function
     * @param {Encoder} encoder
     * @return {Uint8Array} The created ArrayBuffer.
     */
    const toUint8Array = encoder => {
      const uint8arr = new Uint8Array(length(encoder));
      let curPos = 0;
      for (let i = 0; i < encoder.bufs.length; i++) {
        const d = encoder.bufs[i];
        uint8arr.set(d, curPos);
        curPos += d.length;
      }
      uint8arr.set(createUint8ArrayViewFromArrayBuffer(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
      return uint8arr
    };

    /**
     * Verify that it is possible to write `len` bytes wtihout checking. If
     * necessary, a new Buffer with the required length is attached.
     *
     * @param {Encoder} encoder
     * @param {number} len
     */
    const verifyLen = (encoder, len) => {
      const bufferLen = encoder.cbuf.length;
      if (bufferLen - encoder.cpos < len) {
        encoder.bufs.push(createUint8ArrayViewFromArrayBuffer(encoder.cbuf.buffer, 0, encoder.cpos));
        encoder.cbuf = new Uint8Array(max(bufferLen, len) * 2);
        encoder.cpos = 0;
      }
    };

    /**
     * Write one byte to the encoder.
     *
     * @function
     * @param {Encoder} encoder
     * @param {number} num The byte that is to be encoded.
     */
    const write = (encoder, num) => {
      const bufferLen = encoder.cbuf.length;
      if (encoder.cpos === bufferLen) {
        encoder.bufs.push(encoder.cbuf);
        encoder.cbuf = new Uint8Array(bufferLen * 2);
        encoder.cpos = 0;
      }
      encoder.cbuf[encoder.cpos++] = num;
    };

    /**
     * Write one byte as an unsigned integer.
     *
     * @function
     * @param {Encoder} encoder
     * @param {number} num The number that is to be encoded.
     */
    const writeUint8 = write;

    /**
     * Write a variable length unsigned integer.
     *
     * Encodes integers in the range from [0, 4294967295] / [0, 0xffffffff]. (max 32 bit unsigned integer)
     *
     * @function
     * @param {Encoder} encoder
     * @param {number} num The number that is to be encoded.
     */
    const writeVarUint = (encoder, num) => {
      while (num > BITS7) {
        write(encoder, BIT8 | (BITS7 & num));
        num >>>= 7;
      }
      write(encoder, BITS7 & num);
    };

    /**
     * Write a variable length integer.
     *
     * Encodes integers in the range from [-2147483648, -2147483647].
     *
     * We don't use zig-zag encoding because we want to keep the option open
     * to use the same function for BigInt and 53bit integers (doubles).
     *
     * We use the 7th bit instead for signaling that this is a negative number.
     *
     * @function
     * @param {Encoder} encoder
     * @param {number} num The number that is to be encoded.
     */
    const writeVarInt = (encoder, num) => {
      const isNegative = isNegativeZero(num);
      if (isNegative) {
        num = -num;
      }
      //             |- whether to continue reading         |- whether is negative     |- number
      write(encoder, (num > BITS6 ? BIT8 : 0) | (isNegative ? BIT7 : 0) | (BITS6 & num));
      num >>>= 6;
      // We don't need to consider the case of num === 0 so we can use a different
      // pattern here than above.
      while (num > 0) {
        write(encoder, (num > BITS7 ? BIT8 : 0) | (BITS7 & num));
        num >>>= 7;
      }
    };

    /**
     * Write a variable length string.
     *
     * @function
     * @param {Encoder} encoder
     * @param {String} str The string that is to be encoded.
     */
    const writeVarString = (encoder, str) => {
      const encodedString = unescape(encodeURIComponent(str));
      const len = encodedString.length;
      writeVarUint(encoder, len);
      for (let i = 0; i < len; i++) {
        write(encoder, /** @type {number} */ (encodedString.codePointAt(i)));
      }
    };

    /**
     * Append fixed-length Uint8Array to the encoder.
     *
     * @function
     * @param {Encoder} encoder
     * @param {Uint8Array} uint8Array
     */
    const writeUint8Array = (encoder, uint8Array) => {
      const bufferLen = encoder.cbuf.length;
      const cpos = encoder.cpos;
      const leftCopyLen = min(bufferLen - cpos, uint8Array.length);
      const rightCopyLen = uint8Array.length - leftCopyLen;
      encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
      encoder.cpos += leftCopyLen;
      if (rightCopyLen > 0) {
        // Still something to write, write right half..
        // Append new buffer
        encoder.bufs.push(encoder.cbuf);
        // must have at least size of remaining buffer
        encoder.cbuf = new Uint8Array(max(bufferLen * 2, rightCopyLen));
        // copy array
        encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
        encoder.cpos = rightCopyLen;
      }
    };

    /**
     * Append an Uint8Array to Encoder.
     *
     * @function
     * @param {Encoder} encoder
     * @param {Uint8Array} uint8Array
     */
    const writeVarUint8Array = (encoder, uint8Array) => {
      writeVarUint(encoder, uint8Array.byteLength);
      writeUint8Array(encoder, uint8Array);
    };

    /**
     * Create an DataView of the next `len` bytes. Use it to write data after
     * calling this function.
     *
     * ```js
     * // write float32 using DataView
     * const dv = writeOnDataView(encoder, 4)
     * dv.setFloat32(0, 1.1)
     * // read float32 using DataView
     * const dv = readFromDataView(encoder, 4)
     * dv.getFloat32(0) // => 1.100000023841858 (leaving it to the reader to find out why this is the correct result)
     * ```
     *
     * @param {Encoder} encoder
     * @param {number} len
     * @return {DataView}
     */
    const writeOnDataView = (encoder, len) => {
      verifyLen(encoder, len);
      const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
      encoder.cpos += len;
      return dview
    };

    /**
     * @param {Encoder} encoder
     * @param {number} num
     */
    const writeFloat32 = (encoder, num) => writeOnDataView(encoder, 4).setFloat32(0, num);

    /**
     * @param {Encoder} encoder
     * @param {number} num
     */
    const writeFloat64 = (encoder, num) => writeOnDataView(encoder, 8).setFloat64(0, num);

    /**
     * @param {Encoder} encoder
     * @param {bigint} num
     */
    const writeBigInt64 = (encoder, num) => /** @type {any} */ (writeOnDataView(encoder, 8)).setBigInt64(0, num);

    const floatTestBed = new DataView(new ArrayBuffer(4));
    /**
     * Check if a number can be encoded as a 32 bit float.
     *
     * @param {number} num
     * @return {boolean}
     */
    const isFloat32 = num => {
      floatTestBed.setFloat32(0, num);
      return floatTestBed.getFloat32(0) === num
    };

    /**
     * Encode data with efficient binary format.
     *
     * Differences to JSON:
     * • Transforms data to a binary format (not to a string)
     * • Encodes undefined, NaN, and ArrayBuffer (these can't be represented in JSON)
     * • Numbers are efficiently encoded either as a variable length integer, as a
     *   32 bit float, as a 64 bit float, or as a 64 bit bigint.
     *
     * Encoding table:
     *
     * | Data Type           | Prefix   | Encoding Method    | Comment |
     * | ------------------- | -------- | ------------------ | ------- |
     * | undefined           | 127      |                    | Functions, symbol, and everything that cannot be identified is encoded as undefined |
     * | null                | 126      |                    | |
     * | integer             | 125      | writeVarInt        | Only encodes 32 bit signed integers |
     * | float32             | 124      | writeFloat32       | |
     * | float64             | 123      | writeFloat64       | |
     * | bigint              | 122      | writeBigInt64      | |
     * | boolean (false)     | 121      |                    | True and false are different data types so we save the following byte |
     * | boolean (true)      | 120      |                    | - 0b01111000 so the last bit determines whether true or false |
     * | string              | 119      | writeVarString     | |
     * | object<string,any>  | 118      | custom             | Writes {length} then {length} key-value pairs |
     * | array<any>          | 117      | custom             | Writes {length} then {length} json values |
     * | Uint8Array          | 116      | writeVarUint8Array | We use Uint8Array for any kind of binary data |
     *
     * Reasons for the decreasing prefix:
     * We need the first bit for extendability (later we may want to encode the
     * prefix with writeVarUint). The remaining 7 bits are divided as follows:
     * [0-30]   the beginning of the data range is used for custom purposes
     *          (defined by the function that uses this library)
     * [31-127] the end of the data range is used for data encoding by
     *          lib0/encoding.js
     *
     * @param {Encoder} encoder
     * @param {undefined|null|number|bigint|boolean|string|Object<string,any>|Array<any>|Uint8Array} data
     */
    const writeAny = (encoder, data) => {
      switch (typeof data) {
        case 'string':
          // TYPE 119: STRING
          write(encoder, 119);
          writeVarString(encoder, data);
          break
        case 'number':
          if (isInteger(data) && data <= BITS31) {
            // TYPE 125: INTEGER
            write(encoder, 125);
            writeVarInt(encoder, data);
          } else if (isFloat32(data)) {
            // TYPE 124: FLOAT32
            write(encoder, 124);
            writeFloat32(encoder, data);
          } else {
            // TYPE 123: FLOAT64
            write(encoder, 123);
            writeFloat64(encoder, data);
          }
          break
        case 'bigint':
          // TYPE 122: BigInt
          write(encoder, 122);
          writeBigInt64(encoder, data);
          break
        case 'object':
          if (data === null) {
            // TYPE 126: null
            write(encoder, 126);
          } else if (data instanceof Array) {
            // TYPE 117: Array
            write(encoder, 117);
            writeVarUint(encoder, data.length);
            for (let i = 0; i < data.length; i++) {
              writeAny(encoder, data[i]);
            }
          } else if (data instanceof Uint8Array) {
            // TYPE 116: ArrayBuffer
            write(encoder, 116);
            writeVarUint8Array(encoder, data);
          } else {
            // TYPE 118: Object
            write(encoder, 118);
            const keys = Object.keys(data);
            writeVarUint(encoder, keys.length);
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              writeVarString(encoder, key);
              writeAny(encoder, data[key]);
            }
          }
          break
        case 'boolean':
          // TYPE 120/121: boolean (true/false)
          write(encoder, data ? 120 : 121);
          break
        default:
          // TYPE 127: undefined
          write(encoder, 127);
      }
    };

    /**
     * Now come a few stateful encoder that have their own classes.
     */

    /**
     * Basic Run Length Encoder - a basic compression implementation.
     *
     * Encodes [1,1,1,7] to [1,3,7,1] (3 times 1, 1 time 7). This encoder might do more harm than good if there are a lot of values that are not repeated.
     *
     * It was originally used for image compression. Cool .. article http://csbruce.com/cbm/transactor/pdfs/trans_v7_i06.pdf
     *
     * @note T must not be null!
     *
     * @template T
     */
    class RleEncoder extends Encoder {
      /**
       * @param {function(Encoder, T):void} writer
       */
      constructor (writer) {
        super();
        /**
         * The writer
         */
        this.w = writer;
        /**
         * Current state
         * @type {T|null}
         */
        this.s = null;
        this.count = 0;
      }

      /**
       * @param {T} v
       */
      write (v) {
        if (this.s === v) {
          this.count++;
        } else {
          if (this.count > 0) {
            // flush counter, unless this is the first value (count = 0)
            writeVarUint(this, this.count - 1); // since count is always > 0, we can decrement by one. non-standard encoding ftw
          }
          this.count = 1;
          // write first value
          this.w(this, v);
          this.s = v;
        }
      }
    }

    /**
     * @param {UintOptRleEncoder} encoder
     */
    const flushUintOptRleEncoder = encoder => {
      if (encoder.count > 0) {
        // flush counter, unless this is the first value (count = 0)
        // case 1: just a single value. set sign to positive
        // case 2: write several values. set sign to negative to indicate that there is a length coming
        writeVarInt(encoder.encoder, encoder.count === 1 ? encoder.s : -encoder.s);
        if (encoder.count > 1) {
          writeVarUint(encoder.encoder, encoder.count - 2); // since count is always > 1, we can decrement by one. non-standard encoding ftw
        }
      }
    };

    /**
     * Optimized Rle encoder that does not suffer from the mentioned problem of the basic Rle encoder.
     *
     * Internally uses VarInt encoder to write unsigned integers. If the input occurs multiple times, we write
     * write it as a negative number. The UintOptRleDecoder then understands that it needs to read a count.
     *
     * Encodes [1,2,3,3,3] as [1,2,-3,3] (once 1, once 2, three times 3)
     */
    class UintOptRleEncoder {
      constructor () {
        this.encoder = new Encoder();
        /**
         * @type {number}
         */
        this.s = 0;
        this.count = 0;
      }

      /**
       * @param {number} v
       */
      write (v) {
        if (this.s === v) {
          this.count++;
        } else {
          flushUintOptRleEncoder(this);
          this.count = 1;
          this.s = v;
        }
      }

      toUint8Array () {
        flushUintOptRleEncoder(this);
        return toUint8Array(this.encoder)
      }
    }

    /**
     * @param {IntDiffOptRleEncoder} encoder
     */
    const flushIntDiffOptRleEncoder = encoder => {
      if (encoder.count > 0) {
        //          31 bit making up the diff | wether to write the counter
        const encodedDiff = encoder.diff << 1 | (encoder.count === 1 ? 0 : 1);
        // flush counter, unless this is the first value (count = 0)
        // case 1: just a single value. set first bit to positive
        // case 2: write several values. set first bit to negative to indicate that there is a length coming
        writeVarInt(encoder.encoder, encodedDiff);
        if (encoder.count > 1) {
          writeVarUint(encoder.encoder, encoder.count - 2); // since count is always > 1, we can decrement by one. non-standard encoding ftw
        }
      }
    };

    /**
     * A combination of the IntDiffEncoder and the UintOptRleEncoder.
     *
     * The count approach is similar to the UintDiffOptRleEncoder, but instead of using the negative bitflag, it encodes
     * in the LSB whether a count is to be read. Therefore this Encoder only supports 31 bit integers!
     *
     * Encodes [1, 2, 3, 2] as [3, 1, 6, -1] (more specifically [(1 << 1) | 1, (3 << 0) | 0, -1])
     *
     * Internally uses variable length encoding. Contrary to normal UintVar encoding, the first byte contains:
     * * 1 bit that denotes whether the next value is a count (LSB)
     * * 1 bit that denotes whether this value is negative (MSB - 1)
     * * 1 bit that denotes whether to continue reading the variable length integer (MSB)
     *
     * Therefore, only five bits remain to encode diff ranges.
     *
     * Use this Encoder only when appropriate. In most cases, this is probably a bad idea.
     */
    class IntDiffOptRleEncoder {
      constructor () {
        this.encoder = new Encoder();
        /**
         * @type {number}
         */
        this.s = 0;
        this.count = 0;
        this.diff = 0;
      }

      /**
       * @param {number} v
       */
      write (v) {
        if (this.diff === v - this.s) {
          this.s = v;
          this.count++;
        } else {
          flushIntDiffOptRleEncoder(this);
          this.count = 1;
          this.diff = v - this.s;
          this.s = v;
        }
      }

      toUint8Array () {
        flushIntDiffOptRleEncoder(this);
        return toUint8Array(this.encoder)
      }
    }

    /**
     * Optimized String Encoder.
     *
     * Encoding many small strings in a simple Encoder is not very efficient. The function call to decode a string takes some time and creates references that must be eventually deleted.
     * In practice, when decoding several million small strings, the GC will kick in more and more often to collect orphaned string objects (or maybe there is another reason?).
     *
     * This string encoder solves the above problem. All strings are concatenated and written as a single string using a single encoding call.
     *
     * The lengths are encoded using a UintOptRleEncoder.
     */
    class StringEncoder {
      constructor () {
        /**
         * @type {Array<string>}
         */
        this.sarr = [];
        this.s = '';
        this.lensE = new UintOptRleEncoder();
      }

      /**
       * @param {string} string
       */
      write (string) {
        this.s += string;
        if (this.s.length > 19) {
          this.sarr.push(this.s);
          this.s = '';
        }
        this.lensE.write(string.length);
      }

      toUint8Array () {
        const encoder = new Encoder();
        this.sarr.push(this.s);
        this.s = '';
        writeVarString(encoder, this.sarr.join(''));
        writeUint8Array(encoder, this.lensE.toUint8Array());
        return toUint8Array(encoder)
      }
    }

    /* eslint-env browser */
    const perf = typeof performance === 'undefined' ? null : performance;

    const isoCrypto = typeof crypto === 'undefined' ? null : crypto;

    /**
     * @type {function(number):ArrayBuffer}
     */
    const cryptoRandomBuffer = isoCrypto !== null
      ? len => {
        // browser
        const buf = new ArrayBuffer(len);
        const arr = new Uint8Array(buf);
        isoCrypto.getRandomValues(arr);
        return buf
      }
      : len => {
        // polyfill
        const buf = new ArrayBuffer(len);
        const arr = new Uint8Array(buf);
        for (let i = 0; i < len; i++) {
          arr[i] = Math.ceil((Math.random() * 0xFFFFFFFF) >>> 0);
        }
        return buf
      };

    var performance_1 = perf;
    var cryptoRandomBuffer_1 = cryptoRandomBuffer;

    var isoBrowser = {
    	performance: performance_1,
    	cryptoRandomBuffer: cryptoRandomBuffer_1
    };

    /**
     * Isomorphic library exports from isomorphic.js.
     *
     * @module isomorphic
     */
    const cryptoRandomBuffer$1 = /** @type {any} */ (isoBrowser.cryptoRandomBuffer);

    const rand = Math.random;

    /* istanbul ignore next */
    const uint32 = () => new Uint32Array(cryptoRandomBuffer$1(4))[0];

    // @ts-ignore
    const uuidv4Template = [1e7] + -1e3 + -4e3 + -8e3 + -1e11;
    const uuidv4 = () => uuidv4Template.replace(/[018]/g, /** @param {number} c */ c =>
      (c ^ uint32() & 15 >> c / 4).toString(16)
    );

    /**
     * Error helpers.
     *
     * @module error
     */

    /**
     * @param {string} s
     * @return {Error}
     */
    /* istanbul ignore next */
    const create$2 = s => new Error(s);

    /**
     * @throws {Error}
     * @return {never}
     */
    /* istanbul ignore next */
    const methodUnimplemented = () => {
      throw create$2('Method unimplemented')
    };

    /**
     * @throws {Error}
     * @return {never}
     */
    /* istanbul ignore next */
    const unexpectedCase = () => {
      throw create$2('Unexpected case')
    };

    /**
     * Utility functions for working with EcmaScript objects.
     *
     * @module object
     */

    /**
     * @param {Object<string,any>} obj
     */
    const keys = Object.keys;

    /**
     * @template R
     * @param {Object<string,any>} obj
     * @param {function(any,string):R} f
     * @return {Array<R>}
     */
    const map$1 = (obj, f) => {
      const results = [];
      for (const key in obj) {
        results.push(f(obj[key], key));
      }
      return results
    };

    /**
     * @param {Object<string,any>} obj
     * @return {number}
     */
    const length$1 = obj => keys(obj).length;

    /**
     * @param {Object<string,any>} obj
     * @param {function(any,string):boolean} f
     * @return {boolean}
     */
    const every = (obj, f) => {
      for (const key in obj) {
        if (!f(obj[key], key)) {
          return false
        }
      }
      return true
    };

    /**
     * Calls `Object.prototype.hasOwnProperty`.
     *
     * @param {any} obj
     * @param {string|symbol} key
     * @return {boolean}
     */
    const hasProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

    /**
     * @param {Object<string,any>} a
     * @param {Object<string,any>} b
     * @return {boolean}
     */
    const equalFlat = (a, b) => a === b || (length$1(a) === length$1(b) && every(a, (val, key) => (val !== undefined || hasProperty(b, key)) && b[key] === val));

    /**
     * Common functions and function call helpers.
     *
     * @module function
     */

    /**
     * Calls all functions in `fs` with args. Only throws after all functions were called.
     *
     * @param {Array<function>} fs
     * @param {Array<any>} args
     */
    const callAll = (fs, args, i = 0) => {
      try {
        for (; i < fs.length; i++) {
          fs[i](...args);
        }
      } finally {
        if (i < fs.length) {
          callAll(fs, args, i + 1);
        }
      }
    };

    const nop = () => {};

    /**
     * @template T
     *
     * @param {T} a
     * @param {T} b
     * @return {boolean}
     */
    const equalityStrict = (a, b) => a === b;

    /**
     * @param {any} a
     * @param {any} b
     * @return {boolean}
     */
    const equalityDeep = (a, b) => {
      if (a == null || b == null) {
        return equalityStrict(a, b)
      }
      if (a.constructor !== b.constructor) {
        return false
      }
      if (a === b) {
        return true
      }
      switch (a.constructor) {
        case ArrayBuffer:
          a = new Uint8Array(a);
          b = new Uint8Array(b);
        // eslint-disable-next-line no-fallthrough
        case Uint8Array: {
          if (a.byteLength !== b.byteLength) {
            return false
          }
          for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
              return false
            }
          }
          break
        }
        case Set: {
          if (a.size !== b.size) {
            return false
          }
          for (const value of a) {
            if (!b.has(value)) {
              return false
            }
          }
          break
        }
        case Map: {
          if (a.size !== b.size) {
            return false
          }
          for (const key of a.keys()) {
            if (!b.has(key) || !equalityDeep(a.get(key), b.get(key))) {
              return false
            }
          }
          break
        }
        case Object:
          if (length$1(a) !== length$1(b)) {
            return false
          }
          for (const key in a) {
            if (!hasProperty(a, key) || !equalityDeep(a[key], b[key])) {
              return false
            }
          }
          break
        case Array:
          if (a.length !== b.length) {
            return false
          }
          for (let i = 0; i < a.length; i++) {
            if (!equalityDeep(a[i], b[i])) {
              return false
            }
          }
          break
        default:
          return false
      }
      return true
    };

    /**
     * Utility module to work with EcmaScript Symbols.
     *
     * @module symbol
     */

    /**
     * Return fresh symbol.
     *
     * @return {Symbol}
     */
    const create$3 = Symbol;

    /**
     * Working with value pairs.
     *
     * @module pair
     */

    /**
     * @template L,R
     */
    class Pair {
      /**
       * @param {L} left
       * @param {R} right
       */
      constructor (left, right) {
        this.left = left;
        this.right = right;
      }
    }

    /**
     * @template L,R
     * @param {L} left
     * @param {R} right
     * @return {Pair<L,R>}
     */
    const create$4 = (left, right) => new Pair(left, right);

    /* eslint-env browser */

    /* istanbul ignore next */
    const domParser = /** @type {DOMParser} */ (typeof DOMParser !== 'undefined' ? new DOMParser() : null);

    /**
     * @param {Map<string,string>} m
     * @return {string}
     */
    /* istanbul ignore next */
    const mapToStyleString = m => map(m, (value, key) => `${key}:${value};`).join('');

    /**
     * Utility module to work with time.
     *
     * @module time
     */

    /**
     * Return current unix time.
     *
     * @return {number}
     */
    const getUnixTime = Date.now;

    /**
     * Isomorphic logging module with support for colors!
     *
     * @module logging
     */

    const BOLD = create$3();
    const UNBOLD = create$3();
    const BLUE = create$3();
    const GREY = create$3();
    const GREEN = create$3();
    const RED = create$3();
    const PURPLE = create$3();
    const ORANGE = create$3();
    const UNCOLOR = create$3();

    /**
     * @type {Object<Symbol,pair.Pair<string,string>>}
     */
    const _browserStyleMap = {
      [BOLD]: create$4('font-weight', 'bold'),
      [UNBOLD]: create$4('font-weight', 'normal'),
      [BLUE]: create$4('color', 'blue'),
      [GREEN]: create$4('color', 'green'),
      [GREY]: create$4('color', 'grey'),
      [RED]: create$4('color', 'red'),
      [PURPLE]: create$4('color', 'purple'),
      [ORANGE]: create$4('color', 'orange'), // not well supported in chrome when debugging node with inspector - TODO: deprecate
      [UNCOLOR]: create$4('color', 'black')
    };

    const _nodeStyleMap = {
      [BOLD]: '\u001b[1m',
      [UNBOLD]: '\u001b[2m',
      [BLUE]: '\x1b[34m',
      [GREEN]: '\x1b[32m',
      [GREY]: '\u001b[37m',
      [RED]: '\x1b[31m',
      [PURPLE]: '\x1b[35m',
      [ORANGE]: '\x1b[38;5;208m',
      [UNCOLOR]: '\x1b[0m'
    };

    /* istanbul ignore next */
    /**
     * @param {Array<string|Symbol|Object|number>} args
     * @return {Array<string|object|number>}
     */
    const computeBrowserLoggingArgs = args => {
      const strBuilder = [];
      const styles = [];
      const currentStyle = create();
      /**
       * @type {Array<string|Object|number>}
       */
      let logArgs = [];
      // try with formatting until we find something unsupported
      let i = 0;

      for (; i < args.length; i++) {
        const arg = args[i];
        // @ts-ignore
        const style = _browserStyleMap[arg];
        if (style !== undefined) {
          currentStyle.set(style.left, style.right);
        } else {
          if (arg.constructor === String || arg.constructor === Number) {
            const style = mapToStyleString(currentStyle);
            if (i > 0 || style.length > 0) {
              strBuilder.push('%c' + arg);
              styles.push(style);
            } else {
              strBuilder.push(arg);
            }
          } else {
            break
          }
        }
      }

      if (i > 0) {
        // create logArgs with what we have so far
        logArgs = styles;
        logArgs.unshift(strBuilder.join(''));
      }
      // append the rest
      for (; i < args.length; i++) {
        const arg = args[i];
        if (!(arg instanceof Symbol)) {
          logArgs.push(arg);
        }
      }
      return logArgs
    };

    /**
     * @param {Array<string|Symbol|Object|number>} args
     * @return {Array<string|object|number>}
     */
    const computeNodeLoggingArgs = args => {
      const strBuilder = [];
      const logArgs = [];

      // try with formatting until we find something unsupported
      let i = 0;

      for (; i < args.length; i++) {
        const arg = args[i];
        // @ts-ignore
        const style = _nodeStyleMap[arg];
        if (style !== undefined) {
          strBuilder.push(style);
        } else {
          if (arg.constructor === String || arg.constructor === Number) {
            strBuilder.push(arg);
          } else {
            break
          }
        }
      }
      if (i > 0) {
        // create logArgs with what we have so far
        strBuilder.push('\x1b[0m');
        logArgs.push(strBuilder.join(''));
      }
      // append the rest
      for (; i < args.length; i++) {
        const arg = args[i];
        /* istanbul ignore else */
        if (!(arg instanceof Symbol)) {
          logArgs.push(arg);
        }
      }
      return logArgs
    };

    /* istanbul ignore next */
    const computeLoggingArgs = isNode ? computeNodeLoggingArgs : computeBrowserLoggingArgs;

    /**
     * @param {Array<string|Symbol|Object|number>} args
     */
    const print = (...args) => {
      console.log(...computeLoggingArgs(args));
      /* istanbul ignore next */
      vconsoles.forEach(vc => vc.print(args));
    };

    const vconsoles = new Set();

    const loggingColors = [GREEN, PURPLE, ORANGE, BLUE];
    let nextColor = 0;
    let lastLoggingTime = getUnixTime();

    /**
     * @param {string} moduleName
     * @return {function(...any)}
     */
    const createModuleLogger = moduleName => {
      const color = loggingColors[nextColor];
      const debugRegexVar = getVariable('log');
      const doLogging = debugRegexVar !== null && (debugRegexVar === '*' || debugRegexVar === 'true' || new RegExp(debugRegexVar, 'gi').test(moduleName));
      nextColor = (nextColor + 1) % loggingColors.length;
      moduleName += ': ';

      return !doLogging ? nop : (...args) => {
        const timeNow = getUnixTime();
        const timeDiff = timeNow - lastLoggingTime;
        lastLoggingTime = timeNow;
        print(color, moduleName, UNCOLOR, ...args.map(arg => (typeof arg === 'string' || typeof arg === 'symbol') ? arg : JSON.stringify(arg)), color, ' +' + timeDiff + 'ms');
      }
    };

    /**
     * Utility module to create and manipulate Iterators.
     *
     * @module iterator
     */

    /**
     * @template T
     * @param {function():IteratorResult<T>} next
     * @return {IterableIterator<T>}
     */
    const createIterator = next => ({
      /**
       * @return {IterableIterator<T>}
       */
      [Symbol.iterator] () {
        return this
      },
      // @ts-ignore
      next
    });

    /**
     * @template T
     * @param {Iterator<T>} iterator
     * @param {function(T):boolean} filter
     */
    const iteratorFilter = (iterator, filter) => createIterator(() => {
      let res;
      do {
        res = iterator.next();
      } while (!res.done && !filter(res.value))
      return res
    });

    /**
     * @template T,M
     * @param {Iterator<T>} iterator
     * @param {function(T):M} fmap
     */
    const iteratorMap = (iterator, fmap) => createIterator(() => {
      const { done, value } = iterator.next();
      return { done, value: done ? undefined : fmap(value) }
    });

    /**
     * This is an abstract interface that all Connectors should implement to keep them interchangeable.
     *
     * @note This interface is experimental and it is not advised to actually inherit this class.
     *       It just serves as typing information.
     *
     * @extends {Observable<any>}
     */
    class AbstractConnector extends Observable {
      /**
       * @param {Doc} ydoc
       * @param {any} awareness
       */
      constructor (ydoc, awareness) {
        super();
        this.doc = ydoc;
        this.awareness = awareness;
      }
    }

    class DeleteItem {
      /**
       * @param {number} clock
       * @param {number} len
       */
      constructor (clock, len) {
        /**
         * @type {number}
         */
        this.clock = clock;
        /**
         * @type {number}
         */
        this.len = len;
      }
    }

    /**
     * We no longer maintain a DeleteStore. DeleteSet is a temporary object that is created when needed.
     * - When created in a transaction, it must only be accessed after sorting, and merging
     *   - This DeleteSet is send to other clients
     * - We do not create a DeleteSet when we send a sync message. The DeleteSet message is created directly from StructStore
     * - We read a DeleteSet as part of a sync/update message. In this case the DeleteSet is already sorted and merged.
     */
    class DeleteSet {
      constructor () {
        /**
         * @type {Map<number,Array<DeleteItem>>}
         */
        this.clients = new Map();
      }
    }

    /**
     * Iterate over all structs that the DeleteSet gc's.
     *
     * @param {Transaction} transaction
     * @param {DeleteSet} ds
     * @param {function(GC|Item):void} f
     *
     * @function
     */
    const iterateDeletedStructs = (transaction, ds, f) =>
      ds.clients.forEach((deletes, clientid) => {
        const structs = /** @type {Array<GC|Item>} */ (transaction.doc.store.clients.get(clientid));
        for (let i = 0; i < deletes.length; i++) {
          const del = deletes[i];
          iterateStructs(transaction, structs, del.clock, del.len, f);
        }
      });

    /**
     * @param {Array<DeleteItem>} dis
     * @param {number} clock
     * @return {number|null}
     *
     * @private
     * @function
     */
    const findIndexDS = (dis, clock) => {
      let left = 0;
      let right = dis.length - 1;
      while (left <= right) {
        const midindex = floor((left + right) / 2);
        const mid = dis[midindex];
        const midclock = mid.clock;
        if (midclock <= clock) {
          if (clock < midclock + mid.len) {
            return midindex
          }
          left = midindex + 1;
        } else {
          right = midindex - 1;
        }
      }
      return null
    };

    /**
     * @param {DeleteSet} ds
     * @param {ID} id
     * @return {boolean}
     *
     * @private
     * @function
     */
    const isDeleted = (ds, id) => {
      const dis = ds.clients.get(id.client);
      return dis !== undefined && findIndexDS(dis, id.clock) !== null
    };

    /**
     * @param {DeleteSet} ds
     *
     * @private
     * @function
     */
    const sortAndMergeDeleteSet = ds => {
      ds.clients.forEach(dels => {
        dels.sort((a, b) => a.clock - b.clock);
        // merge items without filtering or splicing the array
        // i is the current pointer
        // j refers to the current insert position for the pointed item
        // try to merge dels[i] into dels[j-1] or set dels[j]=dels[i]
        let i, j;
        for (i = 1, j = 1; i < dels.length; i++) {
          const left = dels[j - 1];
          const right = dels[i];
          if (left.clock + left.len === right.clock) {
            left.len += right.len;
          } else {
            if (j < i) {
              dels[j] = right;
            }
            j++;
          }
        }
        dels.length = j;
      });
    };

    /**
     * @param {Array<DeleteSet>} dss
     * @return {DeleteSet} A fresh DeleteSet
     */
    const mergeDeleteSets = dss => {
      const merged = new DeleteSet();
      for (let dssI = 0; dssI < dss.length; dssI++) {
        dss[dssI].clients.forEach((delsLeft, client) => {
          if (!merged.clients.has(client)) {
            // Write all missing keys from current ds and all following.
            // If merged already contains `client` current ds has already been added.
            /**
             * @type {Array<DeleteItem>}
             */
            const dels = delsLeft.slice();
            for (let i = dssI + 1; i < dss.length; i++) {
              appendTo(dels, dss[i].clients.get(client) || []);
            }
            merged.clients.set(client, dels);
          }
        });
      }
      sortAndMergeDeleteSet(merged);
      return merged
    };

    /**
     * @param {DeleteSet} ds
     * @param {number} client
     * @param {number} clock
     * @param {number} length
     *
     * @private
     * @function
     */
    const addToDeleteSet = (ds, client, clock, length) => {
      setIfUndefined(ds.clients, client, () => []).push(new DeleteItem(clock, length));
    };

    const createDeleteSet = () => new DeleteSet();

    /**
     * @param {StructStore} ss
     * @return {DeleteSet} Merged and sorted DeleteSet
     *
     * @private
     * @function
     */
    const createDeleteSetFromStructStore = ss => {
      const ds = createDeleteSet();
      ss.clients.forEach((structs, client) => {
        /**
         * @type {Array<DeleteItem>}
         */
        const dsitems = [];
        for (let i = 0; i < structs.length; i++) {
          const struct = structs[i];
          if (struct.deleted) {
            const clock = struct.id.clock;
            let len = struct.length;
            if (i + 1 < structs.length) {
              for (let next = structs[i + 1]; i + 1 < structs.length && next.id.clock === clock + len && next.deleted; next = structs[++i + 1]) {
                len += next.length;
              }
            }
            dsitems.push(new DeleteItem(clock, len));
          }
        }
        if (dsitems.length > 0) {
          ds.clients.set(client, dsitems);
        }
      });
      return ds
    };

    /**
     * @param {AbstractDSEncoder} encoder
     * @param {DeleteSet} ds
     *
     * @private
     * @function
     */
    const writeDeleteSet = (encoder, ds) => {
      writeVarUint(encoder.restEncoder, ds.clients.size);
      ds.clients.forEach((dsitems, client) => {
        encoder.resetDsCurVal();
        writeVarUint(encoder.restEncoder, client);
        const len = dsitems.length;
        writeVarUint(encoder.restEncoder, len);
        for (let i = 0; i < len; i++) {
          const item = dsitems[i];
          encoder.writeDsClock(item.clock);
          encoder.writeDsLen(item.len);
        }
      });
    };

    /**
     * @param {AbstractDSDecoder} decoder
     * @return {DeleteSet}
     *
     * @private
     * @function
     */
    const readDeleteSet = decoder => {
      const ds = new DeleteSet();
      const numClients = readVarUint(decoder.restDecoder);
      for (let i = 0; i < numClients; i++) {
        decoder.resetDsCurVal();
        const client = readVarUint(decoder.restDecoder);
        const numberOfDeletes = readVarUint(decoder.restDecoder);
        if (numberOfDeletes > 0) {
          const dsField = setIfUndefined(ds.clients, client, () => []);
          for (let i = 0; i < numberOfDeletes; i++) {
            dsField.push(new DeleteItem(decoder.readDsClock(), decoder.readDsLen()));
          }
        }
      }
      return ds
    };

    /**
     * @todo YDecoder also contains references to String and other Decoders. Would make sense to exchange YDecoder.toUint8Array for YDecoder.DsToUint8Array()..
     */

    /**
     * @param {AbstractDSDecoder} decoder
     * @param {Transaction} transaction
     * @param {StructStore} store
     *
     * @private
     * @function
     */
    const readAndApplyDeleteSet = (decoder, transaction, store) => {
      const unappliedDS = new DeleteSet();
      const numClients = readVarUint(decoder.restDecoder);
      for (let i = 0; i < numClients; i++) {
        decoder.resetDsCurVal();
        const client = readVarUint(decoder.restDecoder);
        const numberOfDeletes = readVarUint(decoder.restDecoder);
        const structs = store.clients.get(client) || [];
        const state = getState(store, client);
        for (let i = 0; i < numberOfDeletes; i++) {
          const clock = decoder.readDsClock();
          const clockEnd = clock + decoder.readDsLen();
          if (clock < state) {
            if (state < clockEnd) {
              addToDeleteSet(unappliedDS, client, state, clockEnd - state);
            }
            let index = findIndexSS(structs, clock);
            /**
             * We can ignore the case of GC and Delete structs, because we are going to skip them
             * @type {Item}
             */
            // @ts-ignore
            let struct = structs[index];
            // split the first item if necessary
            if (!struct.deleted && struct.id.clock < clock) {
              structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
              index++; // increase we now want to use the next struct
            }
            while (index < structs.length) {
              // @ts-ignore
              struct = structs[index++];
              if (struct.id.clock < clockEnd) {
                if (!struct.deleted) {
                  if (clockEnd < struct.id.clock + struct.length) {
                    structs.splice(index, 0, splitItem(transaction, struct, clockEnd - struct.id.clock));
                  }
                  struct.delete(transaction);
                }
              } else {
                break
              }
            }
          } else {
            addToDeleteSet(unappliedDS, client, clock, clockEnd - clock);
          }
        }
      }
      if (unappliedDS.clients.size > 0) {
        // TODO: no need for encoding+decoding ds anymore
        const unappliedDSEncoder = new DSEncoderV2();
        writeDeleteSet(unappliedDSEncoder, unappliedDS);
        store.pendingDeleteReaders.push(new DSDecoderV2(createDecoder((unappliedDSEncoder.toUint8Array()))));
      }
    };

    /**
     * @module Y
     */

    const generateNewClientId = uint32;

    /**
     * @typedef {Object} DocOpts
     * @property {boolean} [DocOpts.gc=true] Disable garbage collection (default: gc=true)
     * @property {function(Item):boolean} [DocOpts.gcFilter] Will be called before an Item is garbage collected. Return false to keep the Item.
     * @property {string} [DocOpts.guid] Define a globally unique identifier for this document
     * @property {any} [DocOpts.meta] Any kind of meta information you want to associate with this document. If this is a subdocument, remote peers will store the meta information as well.
     * @property {boolean} [DocOpts.autoLoad] If a subdocument, automatically load document. If this is a subdocument, remote peers will load the document as well automatically.
     */

    /**
     * A Yjs instance handles the state of shared data.
     * @extends Observable<string>
     */
    class Doc extends Observable {
      /**
       * @param {DocOpts} [opts] configuration
       */
      constructor ({ guid = uuidv4(), gc = true, gcFilter = () => true, meta = null, autoLoad = false } = {}) {
        super();
        this.gc = gc;
        this.gcFilter = gcFilter;
        this.clientID = generateNewClientId();
        this.guid = guid;
        /**
         * @type {Map<string, AbstractType<YEvent>>}
         */
        this.share = new Map();
        this.store = new StructStore();
        /**
         * @type {Transaction | null}
         */
        this._transaction = null;
        /**
         * @type {Array<Transaction>}
         */
        this._transactionCleanups = [];
        /**
         * @type {Set<Doc>}
         */
        this.subdocs = new Set();
        /**
         * If this document is a subdocument - a document integrated into another document - then _item is defined.
         * @type {Item?}
         */
        this._item = null;
        this.shouldLoad = autoLoad;
        this.autoLoad = autoLoad;
        this.meta = meta;
      }

      /**
       * Notify the parent document that you request to load data into this subdocument (if it is a subdocument).
       *
       * `load()` might be used in the future to request any provider to load the most current data.
       *
       * It is safe to call `load()` multiple times.
       */
      load () {
        const item = this._item;
        if (item !== null && !this.shouldLoad) {
          transact(/** @type {any} */ (item.parent).doc, transaction => {
            transaction.subdocsLoaded.add(this);
          }, null, true);
        }
        this.shouldLoad = true;
      }

      getSubdocs () {
        return this.subdocs
      }

      getSubdocGuids () {
        return new Set(Array.from(this.subdocs).map(doc => doc.guid))
      }

      /**
       * Changes that happen inside of a transaction are bundled. This means that
       * the observer fires _after_ the transaction is finished and that all changes
       * that happened inside of the transaction are sent as one message to the
       * other peers.
       *
       * @param {function(Transaction):void} f The function that should be executed as a transaction
       * @param {any} [origin] Origin of who started the transaction. Will be stored on transaction.origin
       *
       * @public
       */
      transact (f, origin = null) {
        transact(this, f, origin);
      }

      /**
       * Define a shared data type.
       *
       * Multiple calls of `y.get(name, TypeConstructor)` yield the same result
       * and do not overwrite each other. I.e.
       * `y.define(name, Y.Array) === y.define(name, Y.Array)`
       *
       * After this method is called, the type is also available on `y.share.get(name)`.
       *
       * *Best Practices:*
       * Define all types right after the Yjs instance is created and store them in a separate object.
       * Also use the typed methods `getText(name)`, `getArray(name)`, ..
       *
       * @example
       *   const y = new Y(..)
       *   const appState = {
       *     document: y.getText('document')
       *     comments: y.getArray('comments')
       *   }
       *
       * @param {string} name
       * @param {Function} TypeConstructor The constructor of the type definition. E.g. Y.Text, Y.Array, Y.Map, ...
       * @return {AbstractType<any>} The created type. Constructed with TypeConstructor
       *
       * @public
       */
      get (name, TypeConstructor = AbstractType) {
        const type = setIfUndefined(this.share, name, () => {
          // @ts-ignore
          const t = new TypeConstructor();
          t._integrate(this, null);
          return t
        });
        const Constr = type.constructor;
        if (TypeConstructor !== AbstractType && Constr !== TypeConstructor) {
          if (Constr === AbstractType) {
            // @ts-ignore
            const t = new TypeConstructor();
            t._map = type._map;
            type._map.forEach(/** @param {Item?} n */ n => {
              for (; n !== null; n = n.left) {
                // @ts-ignore
                n.parent = t;
              }
            });
            t._start = type._start;
            for (let n = t._start; n !== null; n = n.right) {
              n.parent = t;
            }
            t._length = type._length;
            this.share.set(name, t);
            t._integrate(this, null);
            return t
          } else {
            throw new Error(`Type with the name ${name} has already been defined with a different constructor`)
          }
        }
        return type
      }

      /**
       * @template T
       * @param {string} [name]
       * @return {YArray<T>}
       *
       * @public
       */
      getArray (name = '') {
        // @ts-ignore
        return this.get(name, YArray)
      }

      /**
       * @param {string} [name]
       * @return {YText}
       *
       * @public
       */
      getText (name = '') {
        // @ts-ignore
        return this.get(name, YText)
      }

      /**
       * @param {string} [name]
       * @return {YMap<any>}
       *
       * @public
       */
      getMap (name = '') {
        // @ts-ignore
        return this.get(name, YMap)
      }

      /**
       * @param {string} [name]
       * @return {YXmlFragment}
       *
       * @public
       */
      getXmlFragment (name = '') {
        // @ts-ignore
        return this.get(name, YXmlFragment)
      }

      /**
       * Converts the entire document into a js object, recursively traversing each yjs type
       *
       * @return {Object<string, any>}
       */
      toJSON () {
        /**
         * @type {Object<string, any>}
         */
        const doc = {};

        this.share.forEach((value, key) => {
          doc[key] = value.toJSON();
        });

        return doc
      }

      /**
       * Emit `destroy` event and unregister all event handlers.
       */
      destroy () {
        from(this.subdocs).forEach(subdoc => subdoc.destroy());
        const item = this._item;
        if (item !== null) {
          this._item = null;
          const content = /** @type {ContentDoc} */ (item.content);
          if (item.deleted) {
            // @ts-ignore
            content.doc = null;
          } else {
            content.doc = new Doc({ guid: this.guid, ...content.opts });
            content.doc._item = item;
          }
          transact(/** @type {any} */ (item).parent.doc, transaction => {
            if (!item.deleted) {
              transaction.subdocsAdded.add(content.doc);
            }
            transaction.subdocsRemoved.add(this);
          }, null, true);
        }
        this.emit('destroyed', [true]);
        this.emit('destroy', [this]);
        super.destroy();
      }

      /**
       * @param {string} eventName
       * @param {function(...any):any} f
       */
      on (eventName, f) {
        super.on(eventName, f);
      }

      /**
       * @param {string} eventName
       * @param {function} f
       */
      off (eventName, f) {
        super.off(eventName, f);
      }
    }

    class DSDecoderV1 {
      /**
       * @param {decoding.Decoder} decoder
       */
      constructor (decoder) {
        this.restDecoder = decoder;
      }

      resetDsCurVal () {
        // nop
      }

      /**
       * @return {number}
       */
      readDsClock () {
        return readVarUint(this.restDecoder)
      }

      /**
       * @return {number}
       */
      readDsLen () {
        return readVarUint(this.restDecoder)
      }
    }

    class UpdateDecoderV1 extends DSDecoderV1 {
      /**
       * @return {ID}
       */
      readLeftID () {
        return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder))
      }

      /**
       * @return {ID}
       */
      readRightID () {
        return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder))
      }

      /**
       * Read the next client id.
       * Use this in favor of readID whenever possible to reduce the number of objects created.
       */
      readClient () {
        return readVarUint(this.restDecoder)
      }

      /**
       * @return {number} info An unsigned 8-bit integer
       */
      readInfo () {
        return readUint8(this.restDecoder)
      }

      /**
       * @return {string}
       */
      readString () {
        return readVarString(this.restDecoder)
      }

      /**
       * @return {boolean} isKey
       */
      readParentInfo () {
        return readVarUint(this.restDecoder) === 1
      }

      /**
       * @return {number} info An unsigned 8-bit integer
       */
      readTypeRef () {
        return readVarUint(this.restDecoder)
      }

      /**
       * Write len of a struct - well suited for Opt RLE encoder.
       *
       * @return {number} len
       */
      readLen () {
        return readVarUint(this.restDecoder)
      }

      /**
       * @return {any}
       */
      readAny () {
        return readAny(this.restDecoder)
      }

      /**
       * @return {Uint8Array}
       */
      readBuf () {
        return copyUint8Array(readVarUint8Array(this.restDecoder))
      }

      /**
       * Legacy implementation uses JSON parse. We use any-decoding in v2.
       *
       * @return {any}
       */
      readJSON () {
        return JSON.parse(readVarString(this.restDecoder))
      }

      /**
       * @return {string}
       */
      readKey () {
        return readVarString(this.restDecoder)
      }
    }

    class DSDecoderV2 {
      /**
       * @param {decoding.Decoder} decoder
       */
      constructor (decoder) {
        this.dsCurrVal = 0;
        this.restDecoder = decoder;
      }

      resetDsCurVal () {
        this.dsCurrVal = 0;
      }

      readDsClock () {
        this.dsCurrVal += readVarUint(this.restDecoder);
        return this.dsCurrVal
      }

      readDsLen () {
        const diff = readVarUint(this.restDecoder) + 1;
        this.dsCurrVal += diff;
        return diff
      }
    }

    class UpdateDecoderV2 extends DSDecoderV2 {
      /**
       * @param {decoding.Decoder} decoder
       */
      constructor (decoder) {
        super(decoder);
        /**
         * List of cached keys. If the keys[id] does not exist, we read a new key
         * from stringEncoder and push it to keys.
         *
         * @type {Array<string>}
         */
        this.keys = [];
        readUint8(decoder); // read feature flag - currently unused
        this.keyClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
        this.clientDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
        this.leftClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
        this.rightClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
        this.infoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
        this.stringDecoder = new StringDecoder(readVarUint8Array(decoder));
        this.parentInfoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
        this.typeRefDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
        this.lenDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
      }

      /**
       * @return {ID}
       */
      readLeftID () {
        return new ID(this.clientDecoder.read(), this.leftClockDecoder.read())
      }

      /**
       * @return {ID}
       */
      readRightID () {
        return new ID(this.clientDecoder.read(), this.rightClockDecoder.read())
      }

      /**
       * Read the next client id.
       * Use this in favor of readID whenever possible to reduce the number of objects created.
       */
      readClient () {
        return this.clientDecoder.read()
      }

      /**
       * @return {number} info An unsigned 8-bit integer
       */
      readInfo () {
        return /** @type {number} */ (this.infoDecoder.read())
      }

      /**
       * @return {string}
       */
      readString () {
        return this.stringDecoder.read()
      }

      /**
       * @return {boolean}
       */
      readParentInfo () {
        return this.parentInfoDecoder.read() === 1
      }

      /**
       * @return {number} An unsigned 8-bit integer
       */
      readTypeRef () {
        return this.typeRefDecoder.read()
      }

      /**
       * Write len of a struct - well suited for Opt RLE encoder.
       *
       * @return {number}
       */
      readLen () {
        return this.lenDecoder.read()
      }

      /**
       * @return {any}
       */
      readAny () {
        return readAny(this.restDecoder)
      }

      /**
       * @return {Uint8Array}
       */
      readBuf () {
        return readVarUint8Array(this.restDecoder)
      }

      /**
       * This is mainly here for legacy purposes.
       *
       * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
       *
       * @return {any}
       */
      readJSON () {
        return readAny(this.restDecoder)
      }

      /**
       * @return {string}
       */
      readKey () {
        const keyClock = this.keyClockDecoder.read();
        if (keyClock < this.keys.length) {
          return this.keys[keyClock]
        } else {
          const key = this.stringDecoder.read();
          this.keys.push(key);
          return key
        }
      }
    }

    class DSEncoderV1 {
      constructor () {
        this.restEncoder = new Encoder();
      }

      toUint8Array () {
        return toUint8Array(this.restEncoder)
      }

      resetDsCurVal () {
        // nop
      }

      /**
       * @param {number} clock
       */
      writeDsClock (clock) {
        writeVarUint(this.restEncoder, clock);
      }

      /**
       * @param {number} len
       */
      writeDsLen (len) {
        writeVarUint(this.restEncoder, len);
      }
    }

    class UpdateEncoderV1 extends DSEncoderV1 {
      /**
       * @param {ID} id
       */
      writeLeftID (id) {
        writeVarUint(this.restEncoder, id.client);
        writeVarUint(this.restEncoder, id.clock);
      }

      /**
       * @param {ID} id
       */
      writeRightID (id) {
        writeVarUint(this.restEncoder, id.client);
        writeVarUint(this.restEncoder, id.clock);
      }

      /**
       * Use writeClient and writeClock instead of writeID if possible.
       * @param {number} client
       */
      writeClient (client) {
        writeVarUint(this.restEncoder, client);
      }

      /**
       * @param {number} info An unsigned 8-bit integer
       */
      writeInfo (info) {
        writeUint8(this.restEncoder, info);
      }

      /**
       * @param {string} s
       */
      writeString (s) {
        writeVarString(this.restEncoder, s);
      }

      /**
       * @param {boolean} isYKey
       */
      writeParentInfo (isYKey) {
        writeVarUint(this.restEncoder, isYKey ? 1 : 0);
      }

      /**
       * @param {number} info An unsigned 8-bit integer
       */
      writeTypeRef (info) {
        writeVarUint(this.restEncoder, info);
      }

      /**
       * Write len of a struct - well suited for Opt RLE encoder.
       *
       * @param {number} len
       */
      writeLen (len) {
        writeVarUint(this.restEncoder, len);
      }

      /**
       * @param {any} any
       */
      writeAny (any) {
        writeAny(this.restEncoder, any);
      }

      /**
       * @param {Uint8Array} buf
       */
      writeBuf (buf) {
        writeVarUint8Array(this.restEncoder, buf);
      }

      /**
       * @param {any} embed
       */
      writeJSON (embed) {
        writeVarString(this.restEncoder, JSON.stringify(embed));
      }

      /**
       * @param {string} key
       */
      writeKey (key) {
        writeVarString(this.restEncoder, key);
      }
    }

    class DSEncoderV2 {
      constructor () {
        this.restEncoder = new Encoder(); // encodes all the rest / non-optimized
        this.dsCurrVal = 0;
      }

      toUint8Array () {
        return toUint8Array(this.restEncoder)
      }

      resetDsCurVal () {
        this.dsCurrVal = 0;
      }

      /**
       * @param {number} clock
       */
      writeDsClock (clock) {
        const diff = clock - this.dsCurrVal;
        this.dsCurrVal = clock;
        writeVarUint(this.restEncoder, diff);
      }

      /**
       * @param {number} len
       */
      writeDsLen (len) {
        if (len === 0) {
          unexpectedCase();
        }
        writeVarUint(this.restEncoder, len - 1);
        this.dsCurrVal += len;
      }
    }

    class UpdateEncoderV2 extends DSEncoderV2 {
      constructor () {
        super();
        /**
         * @type {Map<string,number>}
         */
        this.keyMap = new Map();
        /**
         * Refers to the next uniqe key-identifier to me used.
         * See writeKey method for more information.
         *
         * @type {number}
         */
        this.keyClock = 0;
        this.keyClockEncoder = new IntDiffOptRleEncoder();
        this.clientEncoder = new UintOptRleEncoder();
        this.leftClockEncoder = new IntDiffOptRleEncoder();
        this.rightClockEncoder = new IntDiffOptRleEncoder();
        this.infoEncoder = new RleEncoder(writeUint8);
        this.stringEncoder = new StringEncoder();
        this.parentInfoEncoder = new RleEncoder(writeUint8);
        this.typeRefEncoder = new UintOptRleEncoder();
        this.lenEncoder = new UintOptRleEncoder();
      }

      toUint8Array () {
        const encoder = createEncoder();
        writeUint8(encoder, 0); // this is a feature flag that we might use in the future
        writeVarUint8Array(encoder, this.keyClockEncoder.toUint8Array());
        writeVarUint8Array(encoder, this.clientEncoder.toUint8Array());
        writeVarUint8Array(encoder, this.leftClockEncoder.toUint8Array());
        writeVarUint8Array(encoder, this.rightClockEncoder.toUint8Array());
        writeVarUint8Array(encoder, toUint8Array(this.infoEncoder));
        writeVarUint8Array(encoder, this.stringEncoder.toUint8Array());
        writeVarUint8Array(encoder, toUint8Array(this.parentInfoEncoder));
        writeVarUint8Array(encoder, this.typeRefEncoder.toUint8Array());
        writeVarUint8Array(encoder, this.lenEncoder.toUint8Array());
        // @note The rest encoder is appended! (note the missing var)
        writeUint8Array(encoder, toUint8Array(this.restEncoder));
        return toUint8Array(encoder)
      }

      /**
       * @param {ID} id
       */
      writeLeftID (id) {
        this.clientEncoder.write(id.client);
        this.leftClockEncoder.write(id.clock);
      }

      /**
       * @param {ID} id
       */
      writeRightID (id) {
        this.clientEncoder.write(id.client);
        this.rightClockEncoder.write(id.clock);
      }

      /**
       * @param {number} client
       */
      writeClient (client) {
        this.clientEncoder.write(client);
      }

      /**
       * @param {number} info An unsigned 8-bit integer
       */
      writeInfo (info) {
        this.infoEncoder.write(info);
      }

      /**
       * @param {string} s
       */
      writeString (s) {
        this.stringEncoder.write(s);
      }

      /**
       * @param {boolean} isYKey
       */
      writeParentInfo (isYKey) {
        this.parentInfoEncoder.write(isYKey ? 1 : 0);
      }

      /**
       * @param {number} info An unsigned 8-bit integer
       */
      writeTypeRef (info) {
        this.typeRefEncoder.write(info);
      }

      /**
       * Write len of a struct - well suited for Opt RLE encoder.
       *
       * @param {number} len
       */
      writeLen (len) {
        this.lenEncoder.write(len);
      }

      /**
       * @param {any} any
       */
      writeAny (any) {
        writeAny(this.restEncoder, any);
      }

      /**
       * @param {Uint8Array} buf
       */
      writeBuf (buf) {
        writeVarUint8Array(this.restEncoder, buf);
      }

      /**
       * This is mainly here for legacy purposes.
       *
       * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
       *
       * @param {any} embed
       */
      writeJSON (embed) {
        writeAny(this.restEncoder, embed);
      }

      /**
       * Property keys are often reused. For example, in y-prosemirror the key `bold` might
       * occur very often. For a 3d application, the key `position` might occur very often.
       *
       * We cache these keys in a Map and refer to them via a unique number.
       *
       * @param {string} key
       */
      writeKey (key) {
        const clock = this.keyMap.get(key);
        if (clock === undefined) {
          this.keyClockEncoder.write(this.keyClock++);
          this.stringEncoder.write(key);
        } else {
          this.keyClockEncoder.write(this.keyClock++);
        }
      }
    }

    let DefaultDSEncoder = DSEncoderV1;
    let DefaultDSDecoder = DSDecoderV1;
    let DefaultUpdateEncoder = UpdateEncoderV1;
    let DefaultUpdateDecoder = UpdateDecoderV1;

    /**
     * @param {AbstractUpdateEncoder} encoder
     * @param {Array<GC|Item>} structs All structs by `client`
     * @param {number} client
     * @param {number} clock write structs starting with `ID(client,clock)`
     *
     * @function
     */
    const writeStructs = (encoder, structs, client, clock) => {
      // write first id
      const startNewStructs = findIndexSS(structs, clock);
      // write # encoded structs
      writeVarUint(encoder.restEncoder, structs.length - startNewStructs);
      encoder.writeClient(client);
      writeVarUint(encoder.restEncoder, clock);
      const firstStruct = structs[startNewStructs];
      // write first struct with an offset
      firstStruct.write(encoder, clock - firstStruct.id.clock);
      for (let i = startNewStructs + 1; i < structs.length; i++) {
        structs[i].write(encoder, 0);
      }
    };

    /**
     * @param {AbstractUpdateEncoder} encoder
     * @param {StructStore} store
     * @param {Map<number,number>} _sm
     *
     * @private
     * @function
     */
    const writeClientsStructs = (encoder, store, _sm) => {
      // we filter all valid _sm entries into sm
      const sm = new Map();
      _sm.forEach((clock, client) => {
        // only write if new structs are available
        if (getState(store, client) > clock) {
          sm.set(client, clock);
        }
      });
      getStateVector(store).forEach((clock, client) => {
        if (!_sm.has(client)) {
          sm.set(client, 0);
        }
      });
      // write # states that were updated
      writeVarUint(encoder.restEncoder, sm.size);
      // Write items with higher client ids first
      // This heavily improves the conflict algorithm.
      Array.from(sm.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
        // @ts-ignore
        writeStructs(encoder, store.clients.get(client), client, clock);
      });
    };

    /**
     * @param {AbstractUpdateDecoder} decoder The decoder object to read data from.
     * @param {Map<number,Array<GC|Item>>} clientRefs
     * @param {Doc} doc
     * @return {Map<number,Array<GC|Item>>}
     *
     * @private
     * @function
     */
    const readClientsStructRefs = (decoder, clientRefs, doc) => {
      const numOfStateUpdates = readVarUint(decoder.restDecoder);
      for (let i = 0; i < numOfStateUpdates; i++) {
        const numberOfStructs = readVarUint(decoder.restDecoder);
        /**
         * @type {Array<GC|Item>}
         */
        const refs = new Array(numberOfStructs);
        const client = decoder.readClient();
        let clock = readVarUint(decoder.restDecoder);
        // const start = performance.now()
        clientRefs.set(client, refs);
        for (let i = 0; i < numberOfStructs; i++) {
          const info = decoder.readInfo();
          if ((BITS5 & info) !== 0) {
            /**
             * The optimized implementation doesn't use any variables because inlining variables is faster.
             * Below a non-optimized version is shown that implements the basic algorithm with
             * a few comments
             */
            const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
            // If parent = null and neither left nor right are defined, then we know that `parent` is child of `y`
            // and we read the next string as parentYKey.
            // It indicates how we store/retrieve parent from `y.share`
            // @type {string|null}
            const struct = new Item(
              createID(client, clock),
              null, // leftd
              (info & BIT8) === BIT8 ? decoder.readLeftID() : null, // origin
              null, // right
              (info & BIT7) === BIT7 ? decoder.readRightID() : null, // right origin
              cantCopyParentInfo ? (decoder.readParentInfo() ? doc.get(decoder.readString()) : decoder.readLeftID()) : null, // parent
              cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null, // parentSub
              readItemContent(decoder, info) // item content
            );
            /* A non-optimized implementation of the above algorithm:

            // The item that was originally to the left of this item.
            const origin = (info & binary.BIT8) === binary.BIT8 ? decoder.readLeftID() : null
            // The item that was originally to the right of this item.
            const rightOrigin = (info & binary.BIT7) === binary.BIT7 ? decoder.readRightID() : null
            const cantCopyParentInfo = (info & (binary.BIT7 | binary.BIT8)) === 0
            const hasParentYKey = cantCopyParentInfo ? decoder.readParentInfo() : false
            // If parent = null and neither left nor right are defined, then we know that `parent` is child of `y`
            // and we read the next string as parentYKey.
            // It indicates how we store/retrieve parent from `y.share`
            // @type {string|null}
            const parentYKey = cantCopyParentInfo && hasParentYKey ? decoder.readString() : null

            const struct = new Item(
              createID(client, clock),
              null, // leftd
              origin, // origin
              null, // right
              rightOrigin, // right origin
              cantCopyParentInfo && !hasParentYKey ? decoder.readLeftID() : (parentYKey !== null ? doc.get(parentYKey) : null), // parent
              cantCopyParentInfo && (info & binary.BIT6) === binary.BIT6 ? decoder.readString() : null, // parentSub
              readItemContent(decoder, info) // item content
            )
            */
            refs[i] = struct;
            clock += struct.length;
          } else {
            const len = decoder.readLen();
            refs[i] = new GC(createID(client, clock), len);
            clock += len;
          }
        }
        // console.log('time to read: ', performance.now() - start) // @todo remove
      }
      return clientRefs
    };

    /**
     * Resume computing structs generated by struct readers.
     *
     * While there is something to do, we integrate structs in this order
     * 1. top element on stack, if stack is not empty
     * 2. next element from current struct reader (if empty, use next struct reader)
     *
     * If struct causally depends on another struct (ref.missing), we put next reader of
     * `ref.id.client` on top of stack.
     *
     * At some point we find a struct that has no causal dependencies,
     * then we start emptying the stack.
     *
     * It is not possible to have circles: i.e. struct1 (from client1) depends on struct2 (from client2)
     * depends on struct3 (from client1). Therefore the max stack size is eqaul to `structReaders.length`.
     *
     * This method is implemented in a way so that we can resume computation if this update
     * causally depends on another update.
     *
     * @param {Transaction} transaction
     * @param {StructStore} store
     *
     * @private
     * @function
     */
    const resumeStructIntegration = (transaction, store) => {
      const stack = store.pendingStack; // @todo don't forget to append stackhead at the end
      const clientsStructRefs = store.pendingClientsStructRefs;
      // sort them so that we take the higher id first, in case of conflicts the lower id will probably not conflict with the id from the higher user.
      const clientsStructRefsIds = Array.from(clientsStructRefs.keys()).sort((a, b) => a - b);
      if (clientsStructRefsIds.length === 0) {
        return
      }
      const getNextStructTarget = () => {
        let nextStructsTarget = /** @type {{i:number,refs:Array<GC|Item>}} */ (clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]));
        while (nextStructsTarget.refs.length === nextStructsTarget.i) {
          clientsStructRefsIds.pop();
          if (clientsStructRefsIds.length > 0) {
            nextStructsTarget = /** @type {{i:number,refs:Array<GC|Item>}} */ (clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]));
          } else {
            store.pendingClientsStructRefs.clear();
            return null
          }
        }
        return nextStructsTarget
      };
      let curStructsTarget = getNextStructTarget();
      if (curStructsTarget === null && stack.length === 0) {
        return
      }
      /**
       * @type {GC|Item}
       */
      let stackHead = stack.length > 0
        ? /** @type {GC|Item} */ (stack.pop())
        : /** @type {any} */ (curStructsTarget).refs[/** @type {any} */ (curStructsTarget).i++];
      // caching the state because it is used very often
      const state = new Map();
      // iterate over all struct readers until we are done
      while (true) {
        const localClock = setIfUndefined(state, stackHead.id.client, () => getState(store, stackHead.id.client));
        const offset = stackHead.id.clock < localClock ? localClock - stackHead.id.clock : 0;
        if (stackHead.id.clock + offset !== localClock) {
          // A previous message from this client is missing
          // check if there is a pending structRef with a smaller clock and switch them
          /**
           * @type {{ refs: Array<GC|Item>, i: number }}
           */
          const structRefs = clientsStructRefs.get(stackHead.id.client) || { refs: [], i: 0 };
          if (structRefs.refs.length !== structRefs.i) {
            const r = structRefs.refs[structRefs.i];
            if (r.id.clock < stackHead.id.clock) {
              // put ref with smaller clock on stack instead and continue
              structRefs.refs[structRefs.i] = stackHead;
              stackHead = r;
              // sort the set because this approach might bring the list out of order
              structRefs.refs = structRefs.refs.slice(structRefs.i).sort((r1, r2) => r1.id.clock - r2.id.clock);
              structRefs.i = 0;
              continue
            }
          }
          // wait until missing struct is available
          stack.push(stackHead);
          return
        }
        const missing = stackHead.getMissing(transaction, store);
        if (missing === null) {
          if (offset === 0 || offset < stackHead.length) {
            stackHead.integrate(transaction, offset);
            state.set(stackHead.id.client, stackHead.id.clock + stackHead.length);
          }
          // iterate to next stackHead
          if (stack.length > 0) {
            stackHead = /** @type {GC|Item} */ (stack.pop());
          } else if (curStructsTarget !== null && curStructsTarget.i < curStructsTarget.refs.length) {
            stackHead = /** @type {GC|Item} */ (curStructsTarget.refs[curStructsTarget.i++]);
          } else {
            curStructsTarget = getNextStructTarget();
            if (curStructsTarget === null) {
              // we are done!
              break
            } else {
              stackHead = /** @type {GC|Item} */ (curStructsTarget.refs[curStructsTarget.i++]);
            }
          }
        } else {
          // get the struct reader that has the missing struct
          /**
           * @type {{ refs: Array<GC|Item>, i: number }}
           */
          const structRefs = clientsStructRefs.get(missing) || { refs: [], i: 0 };
          if (structRefs.refs.length === structRefs.i) {
            // This update message causally depends on another update message.
            stack.push(stackHead);
            return
          }
          stack.push(stackHead);
          stackHead = structRefs.refs[structRefs.i++];
        }
      }
      store.pendingClientsStructRefs.clear();
    };

    /**
     * @param {Transaction} transaction
     * @param {StructStore} store
     *
     * @private
     * @function
     */
    const tryResumePendingDeleteReaders = (transaction, store) => {
      const pendingReaders = store.pendingDeleteReaders;
      store.pendingDeleteReaders = [];
      for (let i = 0; i < pendingReaders.length; i++) {
        readAndApplyDeleteSet(pendingReaders[i], transaction, store);
      }
    };

    /**
     * @param {AbstractUpdateEncoder} encoder
     * @param {Transaction} transaction
     *
     * @private
     * @function
     */
    const writeStructsFromTransaction = (encoder, transaction) => writeClientsStructs(encoder, transaction.doc.store, transaction.beforeState);

    /**
     * @param {StructStore} store
     * @param {Map<number, Array<GC|Item>>} clientsStructsRefs
     *
     * @private
     * @function
     */
    const mergeReadStructsIntoPendingReads = (store, clientsStructsRefs) => {
      const pendingClientsStructRefs = store.pendingClientsStructRefs;
      clientsStructsRefs.forEach((structRefs, client) => {
        const pendingStructRefs = pendingClientsStructRefs.get(client);
        if (pendingStructRefs === undefined) {
          pendingClientsStructRefs.set(client, { refs: structRefs, i: 0 });
        } else {
          // merge into existing structRefs
          const merged = pendingStructRefs.i > 0 ? pendingStructRefs.refs.slice(pendingStructRefs.i) : pendingStructRefs.refs;
          for (let i = 0; i < structRefs.length; i++) {
            merged.push(structRefs[i]);
          }
          pendingStructRefs.i = 0;
          pendingStructRefs.refs = merged.sort((r1, r2) => r1.id.clock - r2.id.clock);
        }
      });
    };

    /**
     * @param {Map<number,{refs:Array<GC|Item>,i:number}>} pendingClientsStructRefs
     */
    const cleanupPendingStructs = pendingClientsStructRefs => {
      // cleanup pendingClientsStructs if not fully finished
      pendingClientsStructRefs.forEach((refs, client) => {
        if (refs.i === refs.refs.length) {
          pendingClientsStructRefs.delete(client);
        } else {
          refs.refs.splice(0, refs.i);
          refs.i = 0;
        }
      });
    };

    /**
     * Read the next Item in a Decoder and fill this Item with the read data.
     *
     * This is called when data is received from a remote peer.
     *
     * @param {AbstractUpdateDecoder} decoder The decoder object to read data from.
     * @param {Transaction} transaction
     * @param {StructStore} store
     *
     * @private
     * @function
     */
    const readStructs = (decoder, transaction, store) => {
      const clientsStructRefs = new Map();
      // let start = performance.now()
      readClientsStructRefs(decoder, clientsStructRefs, transaction.doc);
      // console.log('time to read structs: ', performance.now() - start) // @todo remove
      // start = performance.now()
      mergeReadStructsIntoPendingReads(store, clientsStructRefs);
      // console.log('time to merge: ', performance.now() - start) // @todo remove
      // start = performance.now()
      resumeStructIntegration(transaction, store);
      // console.log('time to integrate: ', performance.now() - start) // @todo remove
      // start = performance.now()
      cleanupPendingStructs(store.pendingClientsStructRefs);
      // console.log('time to cleanup: ', performance.now() - start) // @todo remove
      // start = performance.now()
      tryResumePendingDeleteReaders(transaction, store);
      // console.log('time to resume delete readers: ', performance.now() - start) // @todo remove
      // start = performance.now()
    };

    /**
     * Read and apply a document update.
     *
     * This function has the same effect as `applyUpdate` but accepts an decoder.
     *
     * @param {decoding.Decoder} decoder
     * @param {Doc} ydoc
     * @param {any} [transactionOrigin] This will be stored on `transaction.origin` and `.on('update', (update, origin))`
     * @param {AbstractUpdateDecoder} [structDecoder]
     *
     * @function
     */
    const readUpdateV2 = (decoder, ydoc, transactionOrigin, structDecoder = new UpdateDecoderV2(decoder)) =>
      transact(ydoc, transaction => {
        readStructs(structDecoder, transaction, ydoc.store);
        readAndApplyDeleteSet(structDecoder, transaction, ydoc.store);
      }, transactionOrigin, false);

    /**
     * Read and apply a document update.
     *
     * This function has the same effect as `applyUpdate` but accepts an decoder.
     *
     * @param {decoding.Decoder} decoder
     * @param {Doc} ydoc
     * @param {any} [transactionOrigin] This will be stored on `transaction.origin` and `.on('update', (update, origin))`
     *
     * @function
     */
    const readUpdate = (decoder, ydoc, transactionOrigin) => readUpdateV2(decoder, ydoc, transactionOrigin, new DefaultUpdateDecoder(decoder));

    /**
     * Apply a document update created by, for example, `y.on('update', update => ..)` or `update = encodeStateAsUpdate()`.
     *
     * This function has the same effect as `readUpdate` but accepts an Uint8Array instead of a Decoder.
     *
     * @param {Doc} ydoc
     * @param {Uint8Array} update
     * @param {any} [transactionOrigin] This will be stored on `transaction.origin` and `.on('update', (update, origin))`
     * @param {typeof UpdateDecoderV1 | typeof UpdateDecoderV2} [YDecoder]
     *
     * @function
     */
    const applyUpdateV2 = (ydoc, update, transactionOrigin, YDecoder = UpdateDecoderV2) => {
      const decoder = createDecoder(update);
      readUpdateV2(decoder, ydoc, transactionOrigin, new YDecoder(decoder));
    };

    /**
     * Apply a document update created by, for example, `y.on('update', update => ..)` or `update = encodeStateAsUpdate()`.
     *
     * This function has the same effect as `readUpdate` but accepts an Uint8Array instead of a Decoder.
     *
     * @param {Doc} ydoc
     * @param {Uint8Array} update
     * @param {any} [transactionOrigin] This will be stored on `transaction.origin` and `.on('update', (update, origin))`
     *
     * @function
     */
    const applyUpdate = (ydoc, update, transactionOrigin) => applyUpdateV2(ydoc, update, transactionOrigin, DefaultUpdateDecoder);

    /**
     * Write all the document as a single update message. If you specify the state of the remote client (`targetStateVector`) it will
     * only write the operations that are missing.
     *
     * @param {AbstractUpdateEncoder} encoder
     * @param {Doc} doc
     * @param {Map<number,number>} [targetStateVector] The state of the target that receives the update. Leave empty to write all known structs
     *
     * @function
     */
    const writeStateAsUpdate = (encoder, doc, targetStateVector = new Map()) => {
      writeClientsStructs(encoder, doc.store, targetStateVector);
      writeDeleteSet(encoder, createDeleteSetFromStructStore(doc.store));
    };

    /**
     * Write all the document as a single update message that can be applied on the remote document. If you specify the state of the remote client (`targetState`) it will
     * only write the operations that are missing.
     *
     * Use `writeStateAsUpdate` instead if you are working with lib0/encoding.js#Encoder
     *
     * @param {Doc} doc
     * @param {Uint8Array} [encodedTargetStateVector] The state of the target that receives the update. Leave empty to write all known structs
     * @param {AbstractUpdateEncoder} [encoder]
     * @return {Uint8Array}
     *
     * @function
     */
    const encodeStateAsUpdateV2 = (doc, encodedTargetStateVector, encoder = new UpdateEncoderV2()) => {
      const targetStateVector = encodedTargetStateVector == null ? new Map() : decodeStateVector(encodedTargetStateVector);
      writeStateAsUpdate(encoder, doc, targetStateVector);
      return encoder.toUint8Array()
    };

    /**
     * Write all the document as a single update message that can be applied on the remote document. If you specify the state of the remote client (`targetState`) it will
     * only write the operations that are missing.
     *
     * Use `writeStateAsUpdate` instead if you are working with lib0/encoding.js#Encoder
     *
     * @param {Doc} doc
     * @param {Uint8Array} [encodedTargetStateVector] The state of the target that receives the update. Leave empty to write all known structs
     * @return {Uint8Array}
     *
     * @function
     */
    const encodeStateAsUpdate = (doc, encodedTargetStateVector) => encodeStateAsUpdateV2(doc, encodedTargetStateVector, new DefaultUpdateEncoder());

    /**
     * Read state vector from Decoder and return as Map
     *
     * @param {AbstractDSDecoder} decoder
     * @return {Map<number,number>} Maps `client` to the number next expected `clock` from that client.
     *
     * @function
     */
    const readStateVector = decoder => {
      const ss = new Map();
      const ssLength = readVarUint(decoder.restDecoder);
      for (let i = 0; i < ssLength; i++) {
        const client = readVarUint(decoder.restDecoder);
        const clock = readVarUint(decoder.restDecoder);
        ss.set(client, clock);
      }
      return ss
    };

    /**
     * Read decodedState and return State as Map.
     *
     * @param {Uint8Array} decodedState
     * @return {Map<number,number>} Maps `client` to the number next expected `clock` from that client.
     *
     * @function
     */
    const decodeStateVectorV2 = decodedState => readStateVector(new DSDecoderV2(createDecoder(decodedState)));

    /**
     * Read decodedState and return State as Map.
     *
     * @param {Uint8Array} decodedState
     * @return {Map<number,number>} Maps `client` to the number next expected `clock` from that client.
     *
     * @function
     */
    const decodeStateVector = decodedState => readStateVector(new DefaultDSDecoder(createDecoder(decodedState)));

    /**
     * @param {AbstractDSEncoder} encoder
     * @param {Map<number,number>} sv
     * @function
     */
    const writeStateVector = (encoder, sv) => {
      writeVarUint(encoder.restEncoder, sv.size);
      sv.forEach((clock, client) => {
        writeVarUint(encoder.restEncoder, client); // @todo use a special client decoder that is based on mapping
        writeVarUint(encoder.restEncoder, clock);
      });
      return encoder
    };

    /**
     * @param {AbstractDSEncoder} encoder
     * @param {Doc} doc
     *
     * @function
     */
    const writeDocumentStateVector = (encoder, doc) => writeStateVector(encoder, getStateVector(doc.store));

    /**
     * Encode State as Uint8Array.
     *
     * @param {Doc} doc
     * @param {AbstractDSEncoder} [encoder]
     * @return {Uint8Array}
     *
     * @function
     */
    const encodeStateVectorV2 = (doc, encoder = new DSEncoderV2()) => {
      writeDocumentStateVector(encoder, doc);
      return encoder.toUint8Array()
    };

    /**
     * Encode State as Uint8Array.
     *
     * @param {Doc} doc
     * @return {Uint8Array}
     *
     * @function
     */
    const encodeStateVector = doc => encodeStateVectorV2(doc, new DefaultDSEncoder());

    /**
     * General event handler implementation.
     *
     * @template ARG0, ARG1
     *
     * @private
     */
    class EventHandler {
      constructor () {
        /**
         * @type {Array<function(ARG0, ARG1):void>}
         */
        this.l = [];
      }
    }

    /**
     * @template ARG0,ARG1
     * @returns {EventHandler<ARG0,ARG1>}
     *
     * @private
     * @function
     */
    const createEventHandler = () => new EventHandler();

    /**
     * Adds an event listener that is called when
     * {@link EventHandler#callEventListeners} is called.
     *
     * @template ARG0,ARG1
     * @param {EventHandler<ARG0,ARG1>} eventHandler
     * @param {function(ARG0,ARG1):void} f The event handler.
     *
     * @private
     * @function
     */
    const addEventHandlerListener = (eventHandler, f) =>
      eventHandler.l.push(f);

    /**
     * Removes an event listener.
     *
     * @template ARG0,ARG1
     * @param {EventHandler<ARG0,ARG1>} eventHandler
     * @param {function(ARG0,ARG1):void} f The event handler that was added with
     *                     {@link EventHandler#addEventListener}
     *
     * @private
     * @function
     */
    const removeEventHandlerListener = (eventHandler, f) => {
      const l = eventHandler.l;
      const len = l.length;
      eventHandler.l = l.filter(g => f !== g);
      if (len === eventHandler.l.length) {
        console.error('[yjs] Tried to remove event handler that doesn\'t exist.');
      }
    };

    /**
     * Call all event listeners that were added via
     * {@link EventHandler#addEventListener}.
     *
     * @template ARG0,ARG1
     * @param {EventHandler<ARG0,ARG1>} eventHandler
     * @param {ARG0} arg0
     * @param {ARG1} arg1
     *
     * @private
     * @function
     */
    const callEventHandlerListeners = (eventHandler, arg0, arg1) =>
      callAll(eventHandler.l, [arg0, arg1]);

    class ID {
      /**
       * @param {number} client client id
       * @param {number} clock unique per client id, continuous number
       */
      constructor (client, clock) {
        /**
         * Client id
         * @type {number}
         */
        this.client = client;
        /**
         * unique per client id, continuous number
         * @type {number}
         */
        this.clock = clock;
      }
    }

    /**
     * @param {ID | null} a
     * @param {ID | null} b
     * @return {boolean}
     *
     * @function
     */
    const compareIDs = (a, b) => a === b || (a !== null && b !== null && a.client === b.client && a.clock === b.clock);

    /**
     * @param {number} client
     * @param {number} clock
     *
     * @private
     * @function
     */
    const createID = (client, clock) => new ID(client, clock);

    /**
     * @param {encoding.Encoder} encoder
     * @param {ID} id
     *
     * @private
     * @function
     */
    const writeID = (encoder, id) => {
      writeVarUint(encoder, id.client);
      writeVarUint(encoder, id.clock);
    };

    /**
     * Read ID.
     * * If first varUint read is 0xFFFFFF a RootID is returned.
     * * Otherwise an ID is returned
     *
     * @param {decoding.Decoder} decoder
     * @return {ID}
     *
     * @private
     * @function
     */
    const readID = decoder =>
      createID(readVarUint(decoder), readVarUint(decoder));

    /**
     * The top types are mapped from y.share.get(keyname) => type.
     * `type` does not store any information about the `keyname`.
     * This function finds the correct `keyname` for `type` and throws otherwise.
     *
     * @param {AbstractType<any>} type
     * @return {string}
     *
     * @private
     * @function
     */
    const findRootTypeKey = type => {
      // @ts-ignore _y must be defined, otherwise unexpected case
      for (const [key, value] of type.doc.share.entries()) {
        if (value === type) {
          return key
        }
      }
      throw unexpectedCase()
    };

    /**
     * Check if `parent` is a parent of `child`.
     *
     * @param {AbstractType<any>} parent
     * @param {Item|null} child
     * @return {Boolean} Whether `parent` is a parent of `child`.
     *
     * @private
     * @function
     */
    const isParentOf = (parent, child) => {
      while (child !== null) {
        if (child.parent === parent) {
          return true
        }
        child = /** @type {AbstractType<any>} */ (child.parent)._item;
      }
      return false
    };

    /**
     * Convenient helper to log type information.
     *
     * Do not use in productive systems as the output can be immense!
     *
     * @param {AbstractType<any>} type
     */
    const logType = type => {
      const res = [];
      let n = type._start;
      while (n) {
        res.push(n);
        n = n.right;
      }
      console.log('Children: ', res);
      console.log('Children content: ', res.filter(m => !m.deleted).map(m => m.content));
    };

    class PermanentUserData {
      /**
       * @param {Doc} doc
       * @param {YMap<any>} [storeType]
       */
      constructor (doc, storeType = doc.getMap('users')) {
        /**
         * @type {Map<string,DeleteSet>}
         */
        const dss = new Map();
        this.yusers = storeType;
        this.doc = doc;
        /**
         * Maps from clientid to userDescription
         *
         * @type {Map<number,string>}
         */
        this.clients = new Map();
        this.dss = dss;
        /**
         * @param {YMap<any>} user
         * @param {string} userDescription
         */
        const initUser = (user, userDescription) => {
          /**
           * @type {YArray<Uint8Array>}
           */
          const ds = user.get('ds');
          const ids = user.get('ids');
          const addClientId = /** @param {number} clientid */ clientid => this.clients.set(clientid, userDescription);
          ds.observe(/** @param {YArrayEvent<any>} event */ event => {
            event.changes.added.forEach(item => {
              item.content.getContent().forEach(encodedDs => {
                if (encodedDs instanceof Uint8Array) {
                  this.dss.set(userDescription, mergeDeleteSets([this.dss.get(userDescription) || createDeleteSet(), readDeleteSet(new DSDecoderV1(createDecoder(encodedDs)))]));
                }
              });
            });
          });
          this.dss.set(userDescription, mergeDeleteSets(ds.map(encodedDs => readDeleteSet(new DSDecoderV1(createDecoder(encodedDs))))));
          ids.observe(/** @param {YArrayEvent<any>} event */ event =>
            event.changes.added.forEach(item => item.content.getContent().forEach(addClientId))
          );
          ids.forEach(addClientId);
        };
        // observe users
        storeType.observe(event => {
          event.keysChanged.forEach(userDescription =>
            initUser(storeType.get(userDescription), userDescription)
          );
        });
        // add intial data
        storeType.forEach(initUser);
      }

      /**
       * @param {Doc} doc
       * @param {number} clientid
       * @param {string} userDescription
       * @param {Object} [conf]
       * @param {function(Transaction, DeleteSet):boolean} [conf.filter]
       */
      setUserMapping (doc, clientid, userDescription, { filter = () => true } = {}) {
        const users = this.yusers;
        let user = users.get(userDescription);
        if (!user) {
          user = new YMap();
          user.set('ids', new YArray());
          user.set('ds', new YArray());
          users.set(userDescription, user);
        }
        user.get('ids').push([clientid]);
        users.observe(event => {
          setTimeout(() => {
            const userOverwrite = users.get(userDescription);
            if (userOverwrite !== user) {
              // user was overwritten, port all data over to the next user object
              // @todo Experiment with Y.Sets here
              user = userOverwrite;
              // @todo iterate over old type
              this.clients.forEach((_userDescription, clientid) => {
                if (userDescription === _userDescription) {
                  user.get('ids').push([clientid]);
                }
              });
              const encoder = new DSEncoderV1();
              const ds = this.dss.get(userDescription);
              if (ds) {
                writeDeleteSet(encoder, ds);
                user.get('ds').push([encoder.toUint8Array()]);
              }
            }
          }, 0);
        });
        doc.on('afterTransaction', /** @param {Transaction} transaction */ transaction => {
          setTimeout(() => {
            const yds = user.get('ds');
            const ds = transaction.deleteSet;
            if (transaction.local && ds.clients.size > 0 && filter(transaction, ds)) {
              const encoder = new DSEncoderV1();
              writeDeleteSet(encoder, ds);
              yds.push([encoder.toUint8Array()]);
            }
          });
        });
      }

      /**
       * @param {number} clientid
       * @return {any}
       */
      getUserByClientId (clientid) {
        return this.clients.get(clientid) || null
      }

      /**
       * @param {ID} id
       * @return {string | null}
       */
      getUserByDeletedId (id) {
        for (const [userDescription, ds] of this.dss.entries()) {
          if (isDeleted(ds, id)) {
            return userDescription
          }
        }
        return null
      }
    }

    /**
     * A relative position is based on the Yjs model and is not affected by document changes.
     * E.g. If you place a relative position before a certain character, it will always point to this character.
     * If you place a relative position at the end of a type, it will always point to the end of the type.
     *
     * A numeric position is often unsuited for user selections, because it does not change when content is inserted
     * before or after.
     *
     * ```Insert(0, 'x')('a|bc') = 'xa|bc'``` Where | is the relative position.
     *
     * One of the properties must be defined.
     *
     * @example
     *   // Current cursor position is at position 10
     *   const relativePosition = createRelativePositionFromIndex(yText, 10)
     *   // modify yText
     *   yText.insert(0, 'abc')
     *   yText.delete(3, 10)
     *   // Compute the cursor position
     *   const absolutePosition = createAbsolutePositionFromRelativePosition(y, relativePosition)
     *   absolutePosition.type === yText // => true
     *   console.log('cursor location is ' + absolutePosition.index) // => cursor location is 3
     *
     */
    class RelativePosition {
      /**
       * @param {ID|null} type
       * @param {string|null} tname
       * @param {ID|null} item
       */
      constructor (type, tname, item) {
        /**
         * @type {ID|null}
         */
        this.type = type;
        /**
         * @type {string|null}
         */
        this.tname = tname;
        /**
         * @type {ID | null}
         */
        this.item = item;
      }
    }

    /**
     * @param {any} json
     * @return {RelativePosition}
     *
     * @function
     */
    const createRelativePositionFromJSON = json => new RelativePosition(json.type == null ? null : createID(json.type.client, json.type.clock), json.tname || null, json.item == null ? null : createID(json.item.client, json.item.clock));

    class AbsolutePosition {
      /**
       * @param {AbstractType<any>} type
       * @param {number} index
       */
      constructor (type, index) {
        /**
         * @type {AbstractType<any>}
         */
        this.type = type;
        /**
         * @type {number}
         */
        this.index = index;
      }
    }

    /**
     * @param {AbstractType<any>} type
     * @param {number} index
     *
     * @function
     */
    const createAbsolutePosition = (type, index) => new AbsolutePosition(type, index);

    /**
     * @param {AbstractType<any>} type
     * @param {ID|null} item
     *
     * @function
     */
    const createRelativePosition = (type, item) => {
      let typeid = null;
      let tname = null;
      if (type._item === null) {
        tname = findRootTypeKey(type);
      } else {
        typeid = createID(type._item.id.client, type._item.id.clock);
      }
      return new RelativePosition(typeid, tname, item)
    };

    /**
     * Create a relativePosition based on a absolute position.
     *
     * @param {AbstractType<any>} type The base type (e.g. YText or YArray).
     * @param {number} index The absolute position.
     * @return {RelativePosition}
     *
     * @function
     */
    const createRelativePositionFromTypeIndex = (type, index) => {
      let t = type._start;
      while (t !== null) {
        if (!t.deleted && t.countable) {
          if (t.length > index) {
            // case 1: found position somewhere in the linked list
            return createRelativePosition(type, createID(t.id.client, t.id.clock + index))
          }
          index -= t.length;
        }
        t = t.right;
      }
      return createRelativePosition(type, null)
    };

    /**
     * @param {encoding.Encoder} encoder
     * @param {RelativePosition} rpos
     *
     * @function
     */
    const writeRelativePosition = (encoder, rpos) => {
      const { type, tname, item } = rpos;
      if (item !== null) {
        writeVarUint(encoder, 0);
        writeID(encoder, item);
      } else if (tname !== null) {
        // case 2: found position at the end of the list and type is stored in y.share
        writeUint8(encoder, 1);
        writeVarString(encoder, tname);
      } else if (type !== null) {
        // case 3: found position at the end of the list and type is attached to an item
        writeUint8(encoder, 2);
        writeID(encoder, type);
      } else {
        throw unexpectedCase()
      }
      return encoder
    };

    /**
     * @param {decoding.Decoder} decoder
     * @return {RelativePosition|null}
     *
     * @function
     */
    const readRelativePosition = decoder => {
      let type = null;
      let tname = null;
      let itemID = null;
      switch (readVarUint(decoder)) {
        case 0:
          // case 1: found position somewhere in the linked list
          itemID = readID(decoder);
          break
        case 1:
          // case 2: found position at the end of the list and type is stored in y.share
          tname = readVarString(decoder);
          break
        case 2: {
          // case 3: found position at the end of the list and type is attached to an item
          type = readID(decoder);
        }
      }
      return new RelativePosition(type, tname, itemID)
    };

    /**
     * @param {RelativePosition} rpos
     * @param {Doc} doc
     * @return {AbsolutePosition|null}
     *
     * @function
     */
    const createAbsolutePositionFromRelativePosition = (rpos, doc) => {
      const store = doc.store;
      const rightID = rpos.item;
      const typeID = rpos.type;
      const tname = rpos.tname;
      let type = null;
      let index = 0;
      if (rightID !== null) {
        if (getState(store, rightID.client) <= rightID.clock) {
          return null
        }
        const res = followRedone(store, rightID);
        const right = res.item;
        if (!(right instanceof Item)) {
          return null
        }
        type = /** @type {AbstractType<any>} */ (right.parent);
        if (type._item === null || !type._item.deleted) {
          index = right.deleted || !right.countable ? 0 : res.diff;
          let n = right.left;
          while (n !== null) {
            if (!n.deleted && n.countable) {
              index += n.length;
            }
            n = n.left;
          }
        }
      } else {
        if (tname !== null) {
          type = doc.get(tname);
        } else if (typeID !== null) {
          if (getState(store, typeID.client) <= typeID.clock) {
            // type does not exist yet
            return null
          }
          const { item } = followRedone(store, typeID);
          if (item instanceof Item && item.content instanceof ContentType) {
            type = item.content.type;
          } else {
            // struct is garbage collected
            return null
          }
        } else {
          throw unexpectedCase()
        }
        index = type._length;
      }
      return createAbsolutePosition(type, index)
    };

    /**
     * @param {RelativePosition|null} a
     * @param {RelativePosition|null} b
     * @return {boolean}
     *
     * @function
     */
    const compareRelativePositions = (a, b) => a === b || (
      a !== null && b !== null && a.tname === b.tname && compareIDs(a.item, b.item) && compareIDs(a.type, b.type)
    );

    class Snapshot {
      /**
       * @param {DeleteSet} ds
       * @param {Map<number,number>} sv state map
       */
      constructor (ds, sv) {
        /**
         * @type {DeleteSet}
         */
        this.ds = ds;
        /**
         * State Map
         * @type {Map<number,number>}
         */
        this.sv = sv;
      }
    }

    /**
     * @param {Snapshot} snap1
     * @param {Snapshot} snap2
     * @return {boolean}
     */
    const equalSnapshots = (snap1, snap2) => {
      const ds1 = snap1.ds.clients;
      const ds2 = snap2.ds.clients;
      const sv1 = snap1.sv;
      const sv2 = snap2.sv;
      if (sv1.size !== sv2.size || ds1.size !== ds2.size) {
        return false
      }
      for (const [key, value] of sv1.entries()) {
        if (sv2.get(key) !== value) {
          return false
        }
      }
      for (const [client, dsitems1] of ds1.entries()) {
        const dsitems2 = ds2.get(client) || [];
        if (dsitems1.length !== dsitems2.length) {
          return false
        }
        for (let i = 0; i < dsitems1.length; i++) {
          const dsitem1 = dsitems1[i];
          const dsitem2 = dsitems2[i];
          if (dsitem1.clock !== dsitem2.clock || dsitem1.len !== dsitem2.len) {
            return false
          }
        }
      }
      return true
    };

    /**
     * @param {Snapshot} snapshot
     * @param {AbstractDSEncoder} [encoder]
     * @return {Uint8Array}
     */
    const encodeSnapshotV2 = (snapshot, encoder = new DSEncoderV2()) => {
      writeDeleteSet(encoder, snapshot.ds);
      writeStateVector(encoder, snapshot.sv);
      return encoder.toUint8Array()
    };

    /**
     * @param {Snapshot} snapshot
     * @return {Uint8Array}
     */
    const encodeSnapshot = snapshot => encodeSnapshotV2(snapshot, new DefaultDSEncoder());

    /**
     * @param {Uint8Array} buf
     * @param {AbstractDSDecoder} [decoder]
     * @return {Snapshot}
     */
    const decodeSnapshotV2 = (buf, decoder = new DSDecoderV2(createDecoder(buf))) => {
      return new Snapshot(readDeleteSet(decoder), readStateVector(decoder))
    };

    /**
     * @param {Uint8Array} buf
     * @return {Snapshot}
     */
    const decodeSnapshot = buf => decodeSnapshotV2(buf, new DSDecoderV1(createDecoder(buf)));

    /**
     * @param {DeleteSet} ds
     * @param {Map<number,number>} sm
     * @return {Snapshot}
     */
    const createSnapshot = (ds, sm) => new Snapshot(ds, sm);

    const emptySnapshot = createSnapshot(createDeleteSet(), new Map());

    /**
     * @param {Doc} doc
     * @return {Snapshot}
     */
    const snapshot = doc => createSnapshot(createDeleteSetFromStructStore(doc.store), getStateVector(doc.store));

    /**
     * @param {Item} item
     * @param {Snapshot|undefined} snapshot
     *
     * @protected
     * @function
     */
    const isVisible = (item, snapshot) => snapshot === undefined ? !item.deleted : (
      snapshot.sv.has(item.id.client) && (snapshot.sv.get(item.id.client) || 0) > item.id.clock && !isDeleted(snapshot.ds, item.id)
    );

    /**
     * @param {Transaction} transaction
     * @param {Snapshot} snapshot
     */
    const splitSnapshotAffectedStructs = (transaction, snapshot) => {
      const meta = setIfUndefined(transaction.meta, splitSnapshotAffectedStructs, create$1);
      const store = transaction.doc.store;
      // check if we already split for this snapshot
      if (!meta.has(snapshot)) {
        snapshot.sv.forEach((clock, client) => {
          if (clock < getState(store, client)) {
            getItemCleanStart(transaction, createID(client, clock));
          }
        });
        iterateDeletedStructs(transaction, snapshot.ds, item => {});
        meta.add(snapshot);
      }
    };

    /**
     * @param {Doc} originDoc
     * @param {Snapshot} snapshot
     * @param {Doc} [newDoc] Optionally, you may define the Yjs document that receives the data from originDoc
     * @return {Doc}
     */
    const createDocFromSnapshot = (originDoc, snapshot, newDoc = new Doc()) => {
      if (originDoc.gc) {
        // we should not try to restore a GC-ed document, because some of the restored items might have their content deleted
        throw new Error('originDoc must not be garbage collected')
      }
      const { sv, ds } = snapshot;

      const encoder = new UpdateEncoderV2();
      originDoc.transact(transaction => {
        let size = 0;
        sv.forEach(clock => {
          if (clock > 0) {
            size++;
          }
        });
        writeVarUint(encoder.restEncoder, size);
        // splitting the structs before writing them to the encoder
        for (const [client, clock] of sv) {
          if (clock === 0) {
            continue
          }
          if (clock < getState(originDoc.store, client)) {
            getItemCleanStart(transaction, createID(client, clock));
          }
          const structs = originDoc.store.clients.get(client) || [];
          const lastStructIndex = findIndexSS(structs, clock - 1);
          // write # encoded structs
          writeVarUint(encoder.restEncoder, lastStructIndex + 1);
          encoder.writeClient(client);
          // first clock written is 0
          writeVarUint(encoder.restEncoder, 0);
          for (let i = 0; i <= lastStructIndex; i++) {
            structs[i].write(encoder, 0);
          }
        }
        writeDeleteSet(encoder, ds);
      });

      applyUpdateV2(newDoc, encoder.toUint8Array(), 'snapshot');
      return newDoc
    };

    class StructStore {
      constructor () {
        /**
         * @type {Map<number,Array<GC|Item>>}
         */
        this.clients = new Map();
        /**
         * Store incompleted struct reads here
         * `i` denotes to the next read operation
         * We could shift the array of refs instead, but shift is incredible
         * slow in Chrome for arrays with more than 100k elements
         * @see tryResumePendingStructRefs
         * @type {Map<number,{i:number,refs:Array<GC|Item>}>}
         */
        this.pendingClientsStructRefs = new Map();
        /**
         * Stack of pending structs waiting for struct dependencies
         * Maximum length of stack is structReaders.size
         * @type {Array<GC|Item>}
         */
        this.pendingStack = [];
        /**
         * @type {Array<DSDecoderV2>}
         */
        this.pendingDeleteReaders = [];
      }
    }

    /**
     * Return the states as a Map<client,clock>.
     * Note that clock refers to the next expected clock id.
     *
     * @param {StructStore} store
     * @return {Map<number,number>}
     *
     * @public
     * @function
     */
    const getStateVector = store => {
      const sm = new Map();
      store.clients.forEach((structs, client) => {
        const struct = structs[structs.length - 1];
        sm.set(client, struct.id.clock + struct.length);
      });
      return sm
    };

    /**
     * @param {StructStore} store
     * @param {number} client
     * @return {number}
     *
     * @public
     * @function
     */
    const getState = (store, client) => {
      const structs = store.clients.get(client);
      if (structs === undefined) {
        return 0
      }
      const lastStruct = structs[structs.length - 1];
      return lastStruct.id.clock + lastStruct.length
    };

    /**
     * @param {StructStore} store
     * @param {GC|Item} struct
     *
     * @private
     * @function
     */
    const addStruct = (store, struct) => {
      let structs = store.clients.get(struct.id.client);
      if (structs === undefined) {
        structs = [];
        store.clients.set(struct.id.client, structs);
      } else {
        const lastStruct = structs[structs.length - 1];
        if (lastStruct.id.clock + lastStruct.length !== struct.id.clock) {
          throw unexpectedCase()
        }
      }
      structs.push(struct);
    };

    /**
     * Perform a binary search on a sorted array
     * @param {Array<Item|GC>} structs
     * @param {number} clock
     * @return {number}
     *
     * @private
     * @function
     */
    const findIndexSS = (structs, clock) => {
      let left = 0;
      let right = structs.length - 1;
      let mid = structs[right];
      let midclock = mid.id.clock;
      if (midclock === clock) {
        return right
      }
      // @todo does it even make sense to pivot the search?
      // If a good split misses, it might actually increase the time to find the correct item.
      // Currently, the only advantage is that search with pivoting might find the item on the first try.
      let midindex = floor((clock / (midclock + mid.length - 1)) * right); // pivoting the search
      while (left <= right) {
        mid = structs[midindex];
        midclock = mid.id.clock;
        if (midclock <= clock) {
          if (clock < midclock + mid.length) {
            return midindex
          }
          left = midindex + 1;
        } else {
          right = midindex - 1;
        }
        midindex = floor((left + right) / 2);
      }
      // Always check state before looking for a struct in StructStore
      // Therefore the case of not finding a struct is unexpected
      throw unexpectedCase()
    };

    /**
     * Expects that id is actually in store. This function throws or is an infinite loop otherwise.
     *
     * @param {StructStore} store
     * @param {ID} id
     * @return {GC|Item}
     *
     * @private
     * @function
     */
    const find = (store, id) => {
      /**
       * @type {Array<GC|Item>}
       */
      // @ts-ignore
      const structs = store.clients.get(id.client);
      return structs[findIndexSS(structs, id.clock)]
    };

    /**
     * Expects that id is actually in store. This function throws or is an infinite loop otherwise.
     * @private
     * @function
     */
    const getItem = /** @type {function(StructStore,ID):Item} */ (find);

    /**
     * @param {Transaction} transaction
     * @param {Array<Item|GC>} structs
     * @param {number} clock
     */
    const findIndexCleanStart = (transaction, structs, clock) => {
      const index = findIndexSS(structs, clock);
      const struct = structs[index];
      if (struct.id.clock < clock && struct instanceof Item) {
        structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
        return index + 1
      }
      return index
    };

    /**
     * Expects that id is actually in store. This function throws or is an infinite loop otherwise.
     *
     * @param {Transaction} transaction
     * @param {ID} id
     * @return {Item}
     *
     * @private
     * @function
     */
    const getItemCleanStart = (transaction, id) => {
      const structs = /** @type {Array<Item>} */ (transaction.doc.store.clients.get(id.client));
      return structs[findIndexCleanStart(transaction, structs, id.clock)]
    };

    /**
     * Expects that id is actually in store. This function throws or is an infinite loop otherwise.
     *
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @param {ID} id
     * @return {Item}
     *
     * @private
     * @function
     */
    const getItemCleanEnd = (transaction, store, id) => {
      /**
       * @type {Array<Item>}
       */
      // @ts-ignore
      const structs = store.clients.get(id.client);
      const index = findIndexSS(structs, id.clock);
      const struct = structs[index];
      if (id.clock !== struct.id.clock + struct.length - 1 && struct.constructor !== GC) {
        structs.splice(index + 1, 0, splitItem(transaction, struct, id.clock - struct.id.clock + 1));
      }
      return struct
    };

    /**
     * Replace `item` with `newitem` in store
     * @param {StructStore} store
     * @param {GC|Item} struct
     * @param {GC|Item} newStruct
     *
     * @private
     * @function
     */
    const replaceStruct = (store, struct, newStruct) => {
      const structs = /** @type {Array<GC|Item>} */ (store.clients.get(struct.id.client));
      structs[findIndexSS(structs, struct.id.clock)] = newStruct;
    };

    /**
     * Iterate over a range of structs
     *
     * @param {Transaction} transaction
     * @param {Array<Item|GC>} structs
     * @param {number} clockStart Inclusive start
     * @param {number} len
     * @param {function(GC|Item):void} f
     *
     * @function
     */
    const iterateStructs = (transaction, structs, clockStart, len, f) => {
      if (len === 0) {
        return
      }
      const clockEnd = clockStart + len;
      let index = findIndexCleanStart(transaction, structs, clockStart);
      let struct;
      do {
        struct = structs[index++];
        if (clockEnd < struct.id.clock + struct.length) {
          findIndexCleanStart(transaction, structs, clockEnd);
        }
        f(struct);
      } while (index < structs.length && structs[index].id.clock < clockEnd)
    };

    /**
     * A transaction is created for every change on the Yjs model. It is possible
     * to bundle changes on the Yjs model in a single transaction to
     * minimize the number on messages sent and the number of observer calls.
     * If possible the user of this library should bundle as many changes as
     * possible. Here is an example to illustrate the advantages of bundling:
     *
     * @example
     * const map = y.define('map', YMap)
     * // Log content when change is triggered
     * map.observe(() => {
     *   console.log('change triggered')
     * })
     * // Each change on the map type triggers a log message:
     * map.set('a', 0) // => "change triggered"
     * map.set('b', 0) // => "change triggered"
     * // When put in a transaction, it will trigger the log after the transaction:
     * y.transact(() => {
     *   map.set('a', 1)
     *   map.set('b', 1)
     * }) // => "change triggered"
     *
     * @public
     */
    class Transaction {
      /**
       * @param {Doc} doc
       * @param {any} origin
       * @param {boolean} local
       */
      constructor (doc, origin, local) {
        /**
         * The Yjs instance.
         * @type {Doc}
         */
        this.doc = doc;
        /**
         * Describes the set of deleted items by ids
         * @type {DeleteSet}
         */
        this.deleteSet = new DeleteSet();
        /**
         * Holds the state before the transaction started.
         * @type {Map<Number,Number>}
         */
        this.beforeState = getStateVector(doc.store);
        /**
         * Holds the state after the transaction.
         * @type {Map<Number,Number>}
         */
        this.afterState = new Map();
        /**
         * All types that were directly modified (property added or child
         * inserted/deleted). New types are not included in this Set.
         * Maps from type to parentSubs (`item.parentSub = null` for YArray)
         * @type {Map<AbstractType<YEvent>,Set<String|null>>}
         */
        this.changed = new Map();
        /**
         * Stores the events for the types that observe also child elements.
         * It is mainly used by `observeDeep`.
         * @type {Map<AbstractType<YEvent>,Array<YEvent>>}
         */
        this.changedParentTypes = new Map();
        /**
         * @type {Array<AbstractStruct>}
         */
        this._mergeStructs = [];
        /**
         * @type {any}
         */
        this.origin = origin;
        /**
         * Stores meta information on the transaction
         * @type {Map<any,any>}
         */
        this.meta = new Map();
        /**
         * Whether this change originates from this doc.
         * @type {boolean}
         */
        this.local = local;
        /**
         * @type {Set<Doc>}
         */
        this.subdocsAdded = new Set();
        /**
         * @type {Set<Doc>}
         */
        this.subdocsRemoved = new Set();
        /**
         * @type {Set<Doc>}
         */
        this.subdocsLoaded = new Set();
      }
    }

    /**
     * @param {AbstractUpdateEncoder} encoder
     * @param {Transaction} transaction
     * @return {boolean} Whether data was written.
     */
    const writeUpdateMessageFromTransaction = (encoder, transaction) => {
      if (transaction.deleteSet.clients.size === 0 && !any(transaction.afterState, (clock, client) => transaction.beforeState.get(client) !== clock)) {
        return false
      }
      sortAndMergeDeleteSet(transaction.deleteSet);
      writeStructsFromTransaction(encoder, transaction);
      writeDeleteSet(encoder, transaction.deleteSet);
      return true
    };

    /**
     * If `type.parent` was added in current transaction, `type` technically
     * did not change, it was just added and we should not fire events for `type`.
     *
     * @param {Transaction} transaction
     * @param {AbstractType<YEvent>} type
     * @param {string|null} parentSub
     */
    const addChangedTypeToTransaction = (transaction, type, parentSub) => {
      const item = type._item;
      if (item === null || (item.id.clock < (transaction.beforeState.get(item.id.client) || 0) && !item.deleted)) {
        setIfUndefined(transaction.changed, type, create$1).add(parentSub);
      }
    };

    /**
     * @param {Array<AbstractStruct>} structs
     * @param {number} pos
     */
    const tryToMergeWithLeft = (structs, pos) => {
      const left = structs[pos - 1];
      const right = structs[pos];
      if (left.deleted === right.deleted && left.constructor === right.constructor) {
        if (left.mergeWith(right)) {
          structs.splice(pos, 1);
          if (right instanceof Item && right.parentSub !== null && /** @type {AbstractType<any>} */ (right.parent)._map.get(right.parentSub) === right) {
            /** @type {AbstractType<any>} */ (right.parent)._map.set(right.parentSub, /** @type {Item} */ (left));
          }
        }
      }
    };

    /**
     * @param {DeleteSet} ds
     * @param {StructStore} store
     * @param {function(Item):boolean} gcFilter
     */
    const tryGcDeleteSet = (ds, store, gcFilter) => {
      for (const [client, deleteItems] of ds.clients.entries()) {
        const structs = /** @type {Array<GC|Item>} */ (store.clients.get(client));
        for (let di = deleteItems.length - 1; di >= 0; di--) {
          const deleteItem = deleteItems[di];
          const endDeleteItemClock = deleteItem.clock + deleteItem.len;
          for (
            let si = findIndexSS(structs, deleteItem.clock), struct = structs[si];
            si < structs.length && struct.id.clock < endDeleteItemClock;
            struct = structs[++si]
          ) {
            const struct = structs[si];
            if (deleteItem.clock + deleteItem.len <= struct.id.clock) {
              break
            }
            if (struct instanceof Item && struct.deleted && !struct.keep && gcFilter(struct)) {
              struct.gc(store, false);
            }
          }
        }
      }
    };

    /**
     * @param {DeleteSet} ds
     * @param {StructStore} store
     */
    const tryMergeDeleteSet = (ds, store) => {
      // try to merge deleted / gc'd items
      // merge from right to left for better efficiecy and so we don't miss any merge targets
      ds.clients.forEach((deleteItems, client) => {
        const structs = /** @type {Array<GC|Item>} */ (store.clients.get(client));
        for (let di = deleteItems.length - 1; di >= 0; di--) {
          const deleteItem = deleteItems[di];
          // start with merging the item next to the last deleted item
          const mostRightIndexToCheck = min(structs.length - 1, 1 + findIndexSS(structs, deleteItem.clock + deleteItem.len - 1));
          for (
            let si = mostRightIndexToCheck, struct = structs[si];
            si > 0 && struct.id.clock >= deleteItem.clock;
            struct = structs[--si]
          ) {
            tryToMergeWithLeft(structs, si);
          }
        }
      });
    };

    /**
     * @param {DeleteSet} ds
     * @param {StructStore} store
     * @param {function(Item):boolean} gcFilter
     */
    const tryGc = (ds, store, gcFilter) => {
      tryGcDeleteSet(ds, store, gcFilter);
      tryMergeDeleteSet(ds, store);
    };

    /**
     * @param {Array<Transaction>} transactionCleanups
     * @param {number} i
     */
    const cleanupTransactions = (transactionCleanups, i) => {
      if (i < transactionCleanups.length) {
        const transaction = transactionCleanups[i];
        const doc = transaction.doc;
        const store = doc.store;
        const ds = transaction.deleteSet;
        const mergeStructs = transaction._mergeStructs;
        try {
          sortAndMergeDeleteSet(ds);
          transaction.afterState = getStateVector(transaction.doc.store);
          doc._transaction = null;
          doc.emit('beforeObserverCalls', [transaction, doc]);
          /**
           * An array of event callbacks.
           *
           * Each callback is called even if the other ones throw errors.
           *
           * @type {Array<function():void>}
           */
          const fs = [];
          // observe events on changed types
          transaction.changed.forEach((subs, itemtype) =>
            fs.push(() => {
              if (itemtype._item === null || !itemtype._item.deleted) {
                itemtype._callObserver(transaction, subs);
              }
            })
          );
          fs.push(() => {
            // deep observe events
            transaction.changedParentTypes.forEach((events, type) =>
              fs.push(() => {
                // We need to think about the possibility that the user transforms the
                // Y.Doc in the event.
                if (type._item === null || !type._item.deleted) {
                  events = events
                    .filter(event =>
                      event.target._item === null || !event.target._item.deleted
                    );
                  events
                    .forEach(event => {
                      event.currentTarget = type;
                    });
                  // sort events by path length so that top-level events are fired first.
                  events
                    .sort((event1, event2) => event1.path.length - event2.path.length);
                  // We don't need to check for events.length
                  // because we know it has at least one element
                  callEventHandlerListeners(type._dEH, events, transaction);
                }
              })
            );
            fs.push(() => doc.emit('afterTransaction', [transaction, doc]));
          });
          callAll(fs, []);
        } finally {
          // Replace deleted items with ItemDeleted / GC.
          // This is where content is actually remove from the Yjs Doc.
          if (doc.gc) {
            tryGcDeleteSet(ds, store, doc.gcFilter);
          }
          tryMergeDeleteSet(ds, store);

          // on all affected store.clients props, try to merge
          transaction.afterState.forEach((clock, client) => {
            const beforeClock = transaction.beforeState.get(client) || 0;
            if (beforeClock !== clock) {
              const structs = /** @type {Array<GC|Item>} */ (store.clients.get(client));
              // we iterate from right to left so we can safely remove entries
              const firstChangePos = max(findIndexSS(structs, beforeClock), 1);
              for (let i = structs.length - 1; i >= firstChangePos; i--) {
                tryToMergeWithLeft(structs, i);
              }
            }
          });
          // try to merge mergeStructs
          // @todo: it makes more sense to transform mergeStructs to a DS, sort it, and merge from right to left
          //        but at the moment DS does not handle duplicates
          for (let i = 0; i < mergeStructs.length; i++) {
            const { client, clock } = mergeStructs[i].id;
            const structs = /** @type {Array<GC|Item>} */ (store.clients.get(client));
            const replacedStructPos = findIndexSS(structs, clock);
            if (replacedStructPos + 1 < structs.length) {
              tryToMergeWithLeft(structs, replacedStructPos + 1);
            }
            if (replacedStructPos > 0) {
              tryToMergeWithLeft(structs, replacedStructPos);
            }
          }
          if (!transaction.local && transaction.afterState.get(doc.clientID) !== transaction.beforeState.get(doc.clientID)) {
            doc.clientID = generateNewClientId();
            print(ORANGE, BOLD, '[yjs] ', UNBOLD, RED, 'Changed the client-id because another client seems to be using it.');
          }
          // @todo Merge all the transactions into one and provide send the data as a single update message
          doc.emit('afterTransactionCleanup', [transaction, doc]);
          if (doc._observers.has('update')) {
            const encoder = new DefaultUpdateEncoder();
            const hasContent = writeUpdateMessageFromTransaction(encoder, transaction);
            if (hasContent) {
              doc.emit('update', [encoder.toUint8Array(), transaction.origin, doc]);
            }
          }
          if (doc._observers.has('updateV2')) {
            const encoder = new UpdateEncoderV2();
            const hasContent = writeUpdateMessageFromTransaction(encoder, transaction);
            if (hasContent) {
              doc.emit('updateV2', [encoder.toUint8Array(), transaction.origin, doc]);
            }
          }
          transaction.subdocsAdded.forEach(subdoc => doc.subdocs.add(subdoc));
          transaction.subdocsRemoved.forEach(subdoc => doc.subdocs.delete(subdoc));

          doc.emit('subdocs', [{ loaded: transaction.subdocsLoaded, added: transaction.subdocsAdded, removed: transaction.subdocsRemoved }]);
          transaction.subdocsRemoved.forEach(subdoc => subdoc.destroy());

          if (transactionCleanups.length <= i + 1) {
            doc._transactionCleanups = [];
            doc.emit('afterAllTransactions', [doc, transactionCleanups]);
          } else {
            cleanupTransactions(transactionCleanups, i + 1);
          }
        }
      }
    };

    /**
     * Implements the functionality of `y.transact(()=>{..})`
     *
     * @param {Doc} doc
     * @param {function(Transaction):void} f
     * @param {any} [origin=true]
     *
     * @function
     */
    const transact = (doc, f, origin = null, local = true) => {
      const transactionCleanups = doc._transactionCleanups;
      let initialCall = false;
      if (doc._transaction === null) {
        initialCall = true;
        doc._transaction = new Transaction(doc, origin, local);
        transactionCleanups.push(doc._transaction);
        if (transactionCleanups.length === 1) {
          doc.emit('beforeAllTransactions', [doc]);
        }
        doc.emit('beforeTransaction', [doc._transaction, doc]);
      }
      try {
        f(doc._transaction);
      } finally {
        if (initialCall && transactionCleanups[0] === doc._transaction) {
          // The first transaction ended, now process observer calls.
          // Observer call may create new transactions for which we need to call the observers and do cleanup.
          // We don't want to nest these calls, so we execute these calls one after
          // another.
          // Also we need to ensure that all cleanups are called, even if the
          // observes throw errors.
          // This file is full of hacky try {} finally {} blocks to ensure that an
          // event can throw errors and also that the cleanup is called.
          cleanupTransactions(transactionCleanups, 0);
        }
      }
    };

    class StackItem {
      /**
       * @param {DeleteSet} ds
       * @param {Map<number,number>} beforeState
       * @param {Map<number,number>} afterState
       */
      constructor (ds, beforeState, afterState) {
        this.ds = ds;
        this.beforeState = beforeState;
        this.afterState = afterState;
        /**
         * Use this to save and restore metadata like selection range
         */
        this.meta = new Map();
      }
    }

    /**
     * @param {UndoManager} undoManager
     * @param {Array<StackItem>} stack
     * @param {string} eventType
     * @return {StackItem?}
     */
    const popStackItem = (undoManager, stack, eventType) => {
      /**
       * Whether a change happened
       * @type {StackItem?}
       */
      let result = null;
      const doc = undoManager.doc;
      const scope = undoManager.scope;
      transact(doc, transaction => {
        while (stack.length > 0 && result === null) {
          const store = doc.store;
          const stackItem = /** @type {StackItem} */ (stack.pop());
          /**
           * @type {Set<Item>}
           */
          const itemsToRedo = new Set();
          /**
           * @type {Array<Item>}
           */
          const itemsToDelete = [];
          let performedChange = false;
          stackItem.afterState.forEach((endClock, client) => {
            const startClock = stackItem.beforeState.get(client) || 0;
            const len = endClock - startClock;
            // @todo iterateStructs should not need the structs parameter
            const structs = /** @type {Array<GC|Item>} */ (store.clients.get(client));
            if (startClock !== endClock) {
              // make sure structs don't overlap with the range of created operations [stackItem.start, stackItem.start + stackItem.end)
              // this must be executed before deleted structs are iterated.
              getItemCleanStart(transaction, createID(client, startClock));
              if (endClock < getState(doc.store, client)) {
                getItemCleanStart(transaction, createID(client, endClock));
              }
              iterateStructs(transaction, structs, startClock, len, struct => {
                if (struct instanceof Item) {
                  if (struct.redone !== null) {
                    let { item, diff } = followRedone(store, struct.id);
                    if (diff > 0) {
                      item = getItemCleanStart(transaction, createID(item.id.client, item.id.clock + diff));
                    }
                    if (item.length > len) {
                      getItemCleanStart(transaction, createID(item.id.client, endClock));
                    }
                    struct = item;
                  }
                  if (!struct.deleted && scope.some(type => isParentOf(type, /** @type {Item} */ (struct)))) {
                    itemsToDelete.push(struct);
                  }
                }
              });
            }
          });
          iterateDeletedStructs(transaction, stackItem.ds, struct => {
            const id = struct.id;
            const clock = id.clock;
            const client = id.client;
            const startClock = stackItem.beforeState.get(client) || 0;
            const endClock = stackItem.afterState.get(client) || 0;
            if (
              struct instanceof Item &&
              scope.some(type => isParentOf(type, struct)) &&
              // Never redo structs in [stackItem.start, stackItem.start + stackItem.end) because they were created and deleted in the same capture interval.
              !(clock >= startClock && clock < endClock)
            ) {
              itemsToRedo.add(struct);
            }
          });
          itemsToRedo.forEach(struct => {
            performedChange = redoItem(transaction, struct, itemsToRedo) !== null || performedChange;
          });
          // We want to delete in reverse order so that children are deleted before
          // parents, so we have more information available when items are filtered.
          for (let i = itemsToDelete.length - 1; i >= 0; i--) {
            const item = itemsToDelete[i];
            if (undoManager.deleteFilter(item)) {
              item.delete(transaction);
              performedChange = true;
            }
          }
          result = stackItem;
        }
        transaction.changed.forEach((subProps, type) => {
          // destroy search marker if necessary
          if (subProps.has(null) && type._searchMarker) {
            type._searchMarker.length = 0;
          }
        });
      }, undoManager);
      if (result != null) {
        undoManager.emit('stack-item-popped', [{ stackItem: result, type: eventType }, undoManager]);
      }
      return result
    };

    /**
     * @typedef {Object} UndoManagerOptions
     * @property {number} [UndoManagerOptions.captureTimeout=500]
     * @property {function(Item):boolean} [UndoManagerOptions.deleteFilter=()=>true] Sometimes
     * it is necessary to filter whan an Undo/Redo operation can delete. If this
     * filter returns false, the type/item won't be deleted even it is in the
     * undo/redo scope.
     * @property {Set<any>} [UndoManagerOptions.trackedOrigins=new Set([null])]
     */

    /**
     * Fires 'stack-item-added' event when a stack item was added to either the undo- or
     * the redo-stack. You may store additional stack information via the
     * metadata property on `event.stackItem.meta` (it is a `Map` of metadata properties).
     * Fires 'stack-item-popped' event when a stack item was popped from either the
     * undo- or the redo-stack. You may restore the saved stack information from `event.stackItem.meta`.
     *
     * @extends {Observable<'stack-item-added'|'stack-item-popped'>}
     */
    class UndoManager extends Observable {
      /**
       * @param {AbstractType<any>|Array<AbstractType<any>>} typeScope Accepts either a single type, or an array of types
       * @param {UndoManagerOptions} options
       */
      constructor (typeScope, { captureTimeout = 500, deleteFilter = () => true, trackedOrigins = new Set([null]) } = {}) {
        super();
        this.scope = typeScope instanceof Array ? typeScope : [typeScope];
        this.deleteFilter = deleteFilter;
        trackedOrigins.add(this);
        this.trackedOrigins = trackedOrigins;
        /**
         * @type {Array<StackItem>}
         */
        this.undoStack = [];
        /**
         * @type {Array<StackItem>}
         */
        this.redoStack = [];
        /**
         * Whether the client is currently undoing (calling UndoManager.undo)
         *
         * @type {boolean}
         */
        this.undoing = false;
        this.redoing = false;
        this.doc = /** @type {Doc} */ (this.scope[0].doc);
        this.lastChange = 0;
        this.doc.on('afterTransaction', /** @param {Transaction} transaction */ transaction => {
          // Only track certain transactions
          if (!this.scope.some(type => transaction.changedParentTypes.has(type)) || (!this.trackedOrigins.has(transaction.origin) && (!transaction.origin || !this.trackedOrigins.has(transaction.origin.constructor)))) {
            return
          }
          const undoing = this.undoing;
          const redoing = this.redoing;
          const stack = undoing ? this.redoStack : this.undoStack;
          if (undoing) {
            this.stopCapturing(); // next undo should not be appended to last stack item
          } else if (!redoing) {
            // neither undoing nor redoing: delete redoStack
            this.redoStack = [];
          }
          const beforeState = transaction.beforeState;
          const afterState = transaction.afterState;
          const now = getUnixTime();
          if (now - this.lastChange < captureTimeout && stack.length > 0 && !undoing && !redoing) {
            // append change to last stack op
            const lastOp = stack[stack.length - 1];
            lastOp.ds = mergeDeleteSets([lastOp.ds, transaction.deleteSet]);
            lastOp.afterState = afterState;
          } else {
            // create a new stack op
            stack.push(new StackItem(transaction.deleteSet, beforeState, afterState));
          }
          if (!undoing && !redoing) {
            this.lastChange = now;
          }
          // make sure that deleted structs are not gc'd
          iterateDeletedStructs(transaction, transaction.deleteSet, /** @param {Item|GC} item */ item => {
            if (item instanceof Item && this.scope.some(type => isParentOf(type, item))) {
              keepItem(item, true);
            }
          });
          this.emit('stack-item-added', [{ stackItem: stack[stack.length - 1], origin: transaction.origin, type: undoing ? 'redo' : 'undo' }, this]);
        });
      }

      clear () {
        this.doc.transact(transaction => {
          /**
           * @param {StackItem} stackItem
           */
          const clearItem = stackItem => {
            iterateDeletedStructs(transaction, stackItem.ds, item => {
              if (item instanceof Item && this.scope.some(type => isParentOf(type, item))) {
                keepItem(item, false);
              }
            });
          };
          this.undoStack.forEach(clearItem);
          this.redoStack.forEach(clearItem);
        });
        this.undoStack = [];
        this.redoStack = [];
      }

      /**
       * UndoManager merges Undo-StackItem if they are created within time-gap
       * smaller than `options.captureTimeout`. Call `um.stopCapturing()` so that the next
       * StackItem won't be merged.
       *
       *
       * @example
       *     // without stopCapturing
       *     ytext.insert(0, 'a')
       *     ytext.insert(1, 'b')
       *     um.undo()
       *     ytext.toString() // => '' (note that 'ab' was removed)
       *     // with stopCapturing
       *     ytext.insert(0, 'a')
       *     um.stopCapturing()
       *     ytext.insert(0, 'b')
       *     um.undo()
       *     ytext.toString() // => 'a' (note that only 'b' was removed)
       *
       */
      stopCapturing () {
        this.lastChange = 0;
      }

      /**
       * Undo last changes on type.
       *
       * @return {StackItem?} Returns StackItem if a change was applied
       */
      undo () {
        this.undoing = true;
        let res;
        try {
          res = popStackItem(this, this.undoStack, 'undo');
        } finally {
          this.undoing = false;
        }
        return res
      }

      /**
       * Redo last undo operation.
       *
       * @return {StackItem?} Returns StackItem if a change was applied
       */
      redo () {
        this.redoing = true;
        let res;
        try {
          res = popStackItem(this, this.redoStack, 'redo');
        } finally {
          this.redoing = false;
        }
        return res
      }
    }

    /**
     * YEvent describes the changes on a YType.
     */
    class YEvent {
      /**
       * @param {AbstractType<any>} target The changed type.
       * @param {Transaction} transaction
       */
      constructor (target, transaction) {
        /**
         * The type on which this event was created on.
         * @type {AbstractType<any>}
         */
        this.target = target;
        /**
         * The current target on which the observe callback is called.
         * @type {AbstractType<any>}
         */
        this.currentTarget = target;
        /**
         * The transaction that triggered this event.
         * @type {Transaction}
         */
        this.transaction = transaction;
        /**
         * @type {Object|null}
         */
        this._changes = null;
      }

      /**
       * Computes the path from `y` to the changed type.
       *
       * @todo v14 should standardize on path: Array<{parent, index}> because that is easier to work with.
       *
       * The following property holds:
       * @example
       *   let type = y
       *   event.path.forEach(dir => {
       *     type = type.get(dir)
       *   })
       *   type === event.target // => true
       */
      get path () {
        // @ts-ignore _item is defined because target is integrated
        return getPathTo(this.currentTarget, this.target)
      }

      /**
       * Check if a struct is deleted by this event.
       *
       * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
       *
       * @param {AbstractStruct} struct
       * @return {boolean}
       */
      deletes (struct) {
        return isDeleted(this.transaction.deleteSet, struct.id)
      }

      /**
       * Check if a struct is added by this event.
       *
       * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
       *
       * @param {AbstractStruct} struct
       * @return {boolean}
       */
      adds (struct) {
        return struct.id.clock >= (this.transaction.beforeState.get(struct.id.client) || 0)
      }

      /**
       * @return {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert:Array<any>}|{delete:number}|{retain:number}>}}
       */
      get changes () {
        let changes = this._changes;
        if (changes === null) {
          const target = this.target;
          const added = create$1();
          const deleted = create$1();
          /**
           * @type {Array<{insert:Array<any>}|{delete:number}|{retain:number}>}
           */
          const delta = [];
          /**
           * @type {Map<string,{ action: 'add' | 'update' | 'delete', oldValue: any}>}
           */
          const keys = new Map();
          changes = {
            added, deleted, delta, keys
          };
          const changed = /** @type Set<string|null> */ (this.transaction.changed.get(target));
          if (changed.has(null)) {
            /**
             * @type {any}
             */
            let lastOp = null;
            const packOp = () => {
              if (lastOp) {
                delta.push(lastOp);
              }
            };
            for (let item = target._start; item !== null; item = item.right) {
              if (item.deleted) {
                if (this.deletes(item) && !this.adds(item)) {
                  if (lastOp === null || lastOp.delete === undefined) {
                    packOp();
                    lastOp = { delete: 0 };
                  }
                  lastOp.delete += item.length;
                  deleted.add(item);
                } // else nop
              } else {
                if (this.adds(item)) {
                  if (lastOp === null || lastOp.insert === undefined) {
                    packOp();
                    lastOp = { insert: [] };
                  }
                  lastOp.insert = lastOp.insert.concat(item.content.getContent());
                  added.add(item);
                } else {
                  if (lastOp === null || lastOp.retain === undefined) {
                    packOp();
                    lastOp = { retain: 0 };
                  }
                  lastOp.retain += item.length;
                }
              }
            }
            if (lastOp !== null && lastOp.retain === undefined) {
              packOp();
            }
          }
          changed.forEach(key => {
            if (key !== null) {
              const item = /** @type {Item} */ (target._map.get(key));
              /**
               * @type {'delete' | 'add' | 'update'}
               */
              let action;
              let oldValue;
              if (this.adds(item)) {
                let prev = item.left;
                while (prev !== null && this.adds(prev)) {
                  prev = prev.left;
                }
                if (this.deletes(item)) {
                  if (prev !== null && this.deletes(prev)) {
                    action = 'delete';
                    oldValue = last(prev.content.getContent());
                  } else {
                    return
                  }
                } else {
                  if (prev !== null && this.deletes(prev)) {
                    action = 'update';
                    oldValue = last(prev.content.getContent());
                  } else {
                    action = 'add';
                    oldValue = undefined;
                  }
                }
              } else {
                if (this.deletes(item)) {
                  action = 'delete';
                  oldValue = last(/** @type {Item} */ item.content.getContent());
                } else {
                  return // nop
                }
              }
              keys.set(key, { action, oldValue });
            }
          });
          this._changes = changes;
        }
        return /** @type {any} */ (changes)
      }
    }

    /**
     * Compute the path from this type to the specified target.
     *
     * @example
     *   // `child` should be accessible via `type.get(path[0]).get(path[1])..`
     *   const path = type.getPathTo(child)
     *   // assuming `type instanceof YArray`
     *   console.log(path) // might look like => [2, 'key1']
     *   child === type.get(path[0]).get(path[1])
     *
     * @param {AbstractType<any>} parent
     * @param {AbstractType<any>} child target
     * @return {Array<string|number>} Path to the target
     *
     * @private
     * @function
     */
    const getPathTo = (parent, child) => {
      const path = [];
      while (child._item !== null && child !== parent) {
        if (child._item.parentSub !== null) {
          // parent is map-ish
          path.unshift(child._item.parentSub);
        } else {
          // parent is array-ish
          let i = 0;
          let c = /** @type {AbstractType<any>} */ (child._item.parent)._start;
          while (c !== child._item && c !== null) {
            if (!c.deleted) {
              i++;
            }
            c = c.right;
          }
          path.unshift(i);
        }
        child = /** @type {AbstractType<any>} */ (child._item.parent);
      }
      return path
    };

    const maxSearchMarker = 80;

    /**
     * A unique timestamp that identifies each marker.
     *
     * Time is relative,.. this is more like an ever-increasing clock.
     *
     * @type {number}
     */
    let globalSearchMarkerTimestamp = 0;

    class ArraySearchMarker {
      /**
       * @param {Item} p
       * @param {number} index
       */
      constructor (p, index) {
        p.marker = true;
        this.p = p;
        this.index = index;
        this.timestamp = globalSearchMarkerTimestamp++;
      }
    }

    /**
     * @param {ArraySearchMarker} marker
     */
    const refreshMarkerTimestamp = marker => { marker.timestamp = globalSearchMarkerTimestamp++; };

    /**
     * This is rather complex so this function is the only thing that should overwrite a marker
     *
     * @param {ArraySearchMarker} marker
     * @param {Item} p
     * @param {number} index
     */
    const overwriteMarker = (marker, p, index) => {
      marker.p.marker = false;
      marker.p = p;
      p.marker = true;
      marker.index = index;
      marker.timestamp = globalSearchMarkerTimestamp++;
    };

    /**
     * @param {Array<ArraySearchMarker>} searchMarker
     * @param {Item} p
     * @param {number} index
     */
    const markPosition = (searchMarker, p, index) => {
      if (searchMarker.length >= maxSearchMarker) {
        // override oldest marker (we don't want to create more objects)
        const marker = searchMarker.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
        overwriteMarker(marker, p, index);
        return marker
      } else {
        // create new marker
        const pm = new ArraySearchMarker(p, index);
        searchMarker.push(pm);
        return pm
      }
    };

    /**
     * Search marker help us to find positions in the associative array faster.
     *
     * They speed up the process of finding a position without much bookkeeping.
     *
     * A maximum of `maxSearchMarker` objects are created.
     *
     * This function always returns a refreshed marker (updated timestamp)
     *
     * @param {AbstractType<any>} yarray
     * @param {number} index
     */
    const findMarker = (yarray, index) => {
      if (yarray._start === null || index === 0 || yarray._searchMarker === null) {
        return null
      }
      const marker = yarray._searchMarker.length === 0 ? null : yarray._searchMarker.reduce((a, b) => abs(index - a.index) < abs(index - b.index) ? a : b);
      let p = yarray._start;
      let pindex = 0;
      if (marker !== null) {
        p = marker.p;
        pindex = marker.index;
        refreshMarkerTimestamp(marker); // we used it, we might need to use it again
      }
      // iterate to right if possible
      while (p.right !== null && pindex < index) {
        if (!p.deleted && p.countable) {
          if (index < pindex + p.length) {
            break
          }
          pindex += p.length;
        }
        p = p.right;
      }
      // iterate to left if necessary (might be that pindex > index)
      while (p.left !== null && pindex > index) {
        p = p.left;
        if (!p.deleted && p.countable) {
          pindex -= p.length;
        }
      }
      // we want to make sure that p can't be merged with left, because that would screw up everything
      // in that cas just return what we have (it is most likely the best marker anyway)
      // iterate to left until p can't be merged with left
      while (p.left !== null && p.left.id.client === p.id.client && p.left.id.clock + p.left.length === p.id.clock) {
        p = p.left;
        if (!p.deleted && p.countable) {
          pindex -= p.length;
        }
      }

      // @todo remove!
      // assure position
      // {
      //   let start = yarray._start
      //   let pos = 0
      //   while (start !== p) {
      //     if (!start.deleted && start.countable) {
      //       pos += start.length
      //     }
      //     start = /** @type {Item} */ (start.right)
      //   }
      //   if (pos !== pindex) {
      //     debugger
      //     throw new Error('Gotcha position fail!')
      //   }
      // }
      // if (marker) {
      //   if (window.lengthes == null) {
      //     window.lengthes = []
      //     window.getLengthes = () => window.lengthes.sort((a, b) => a - b)
      //   }
      //   window.lengthes.push(marker.index - pindex)
      //   console.log('distance', marker.index - pindex, 'len', p && p.parent.length)
      // }
      if (marker !== null && abs(marker.index - pindex) < /** @type {YText|YArray<any>} */ (p.parent).length / maxSearchMarker) {
        // adjust existing marker
        overwriteMarker(marker, p, pindex);
        return marker
      } else {
        // create new marker
        return markPosition(yarray._searchMarker, p, pindex)
      }
    };

    /**
     * Update markers when a change happened.
     *
     * This should be called before doing a deletion!
     *
     * @param {Array<ArraySearchMarker>} searchMarker
     * @param {number} index
     * @param {number} len If insertion, len is positive. If deletion, len is negative.
     */
    const updateMarkerChanges = (searchMarker, index, len) => {
      for (let i = searchMarker.length - 1; i >= 0; i--) {
        const m = searchMarker[i];
        if (len > 0) {
          /**
           * @type {Item|null}
           */
          let p = m.p;
          p.marker = false;
          // Ideally we just want to do a simple position comparison, but this will only work if
          // search markers don't point to deleted items for formats.
          // Iterate marker to prev undeleted countable position so we know what to do when updating a position
          while (p && (p.deleted || !p.countable)) {
            p = p.left;
            if (p && !p.deleted && p.countable) {
              // adjust position. the loop should break now
              m.index -= p.length;
            }
          }
          if (p === null || p.marker === true) {
            // remove search marker if updated position is null or if position is already marked
            searchMarker.splice(i, 1);
            continue
          }
          m.p = p;
          p.marker = true;
        }
        if (index < m.index || (len > 0 && index === m.index)) { // a simple index <= m.index check would actually suffice
          m.index = max(index, m.index + len);
        }
      }
    };

    /**
     * Accumulate all (list) children of a type and return them as an Array.
     *
     * @param {AbstractType<any>} t
     * @return {Array<Item>}
     */
    const getTypeChildren = t => {
      let s = t._start;
      const arr = [];
      while (s) {
        arr.push(s);
        s = s.right;
      }
      return arr
    };

    /**
     * Call event listeners with an event. This will also add an event to all
     * parents (for `.observeDeep` handlers).
     *
     * @template EventType
     * @param {AbstractType<EventType>} type
     * @param {Transaction} transaction
     * @param {EventType} event
     */
    const callTypeObservers = (type, transaction, event) => {
      const changedType = type;
      const changedParentTypes = transaction.changedParentTypes;
      while (true) {
        // @ts-ignore
        setIfUndefined(changedParentTypes, type, () => []).push(event);
        if (type._item === null) {
          break
        }
        type = /** @type {AbstractType<any>} */ (type._item.parent);
      }
      callEventHandlerListeners(changedType._eH, event, transaction);
    };

    /**
     * @template EventType
     * Abstract Yjs Type class
     */
    class AbstractType {
      constructor () {
        /**
         * @type {Item|null}
         */
        this._item = null;
        /**
         * @type {Map<string,Item>}
         */
        this._map = new Map();
        /**
         * @type {Item|null}
         */
        this._start = null;
        /**
         * @type {Doc|null}
         */
        this.doc = null;
        this._length = 0;
        /**
         * Event handlers
         * @type {EventHandler<EventType,Transaction>}
         */
        this._eH = createEventHandler();
        /**
         * Deep event handlers
         * @type {EventHandler<Array<YEvent>,Transaction>}
         */
        this._dEH = createEventHandler();
        /**
         * @type {null | Array<ArraySearchMarker>}
         */
        this._searchMarker = null;
      }

      /**
       * @return {AbstractType<any>|null}
       */
      get parent () {
        return this._item ? /** @type {AbstractType<any>} */ (this._item.parent) : null
      }

      /**
       * Integrate this type into the Yjs instance.
       *
       * * Save this struct in the os
       * * This type is sent to other client
       * * Observer functions are fired
       *
       * @param {Doc} y The Yjs instance
       * @param {Item|null} item
       */
      _integrate (y, item) {
        this.doc = y;
        this._item = item;
      }

      /**
       * @return {AbstractType<EventType>}
       */
      _copy () {
        throw methodUnimplemented()
      }

      /**
       * @return {AbstractType<EventType>}
       */
      clone () {
        throw methodUnimplemented()
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       */
      _write (encoder) { }

      /**
       * The first non-deleted item
       */
      get _first () {
        let n = this._start;
        while (n !== null && n.deleted) {
          n = n.right;
        }
        return n
      }

      /**
       * Creates YEvent and calls all type observers.
       * Must be implemented by each type.
       *
       * @param {Transaction} transaction
       * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
       */
      _callObserver (transaction, parentSubs) {
        if (!transaction.local && this._searchMarker) {
          this._searchMarker.length = 0;
        }
      }

      /**
       * Observe all events that are created on this type.
       *
       * @param {function(EventType, Transaction):void} f Observer function
       */
      observe (f) {
        addEventHandlerListener(this._eH, f);
      }

      /**
       * Observe all events that are created by this type and its children.
       *
       * @param {function(Array<YEvent>,Transaction):void} f Observer function
       */
      observeDeep (f) {
        addEventHandlerListener(this._dEH, f);
      }

      /**
       * Unregister an observer function.
       *
       * @param {function(EventType,Transaction):void} f Observer function
       */
      unobserve (f) {
        removeEventHandlerListener(this._eH, f);
      }

      /**
       * Unregister an observer function.
       *
       * @param {function(Array<YEvent>,Transaction):void} f Observer function
       */
      unobserveDeep (f) {
        removeEventHandlerListener(this._dEH, f);
      }

      /**
       * @abstract
       * @return {any}
       */
      toJSON () {}
    }

    /**
     * @param {AbstractType<any>} type
     * @param {number} start
     * @param {number} end
     * @return {Array<any>}
     *
     * @private
     * @function
     */
    const typeListSlice = (type, start, end) => {
      if (start < 0) {
        start = type._length + start;
      }
      if (end < 0) {
        end = type._length + end;
      }
      let len = end - start;
      const cs = [];
      let n = type._start;
      while (n !== null && len > 0) {
        if (n.countable && !n.deleted) {
          const c = n.content.getContent();
          if (c.length <= start) {
            start -= c.length;
          } else {
            for (let i = start; i < c.length && len > 0; i++) {
              cs.push(c[i]);
              len--;
            }
            start = 0;
          }
        }
        n = n.right;
      }
      return cs
    };

    /**
     * @param {AbstractType<any>} type
     * @return {Array<any>}
     *
     * @private
     * @function
     */
    const typeListToArray = type => {
      const cs = [];
      let n = type._start;
      while (n !== null) {
        if (n.countable && !n.deleted) {
          const c = n.content.getContent();
          for (let i = 0; i < c.length; i++) {
            cs.push(c[i]);
          }
        }
        n = n.right;
      }
      return cs
    };

    /**
     * @param {AbstractType<any>} type
     * @param {Snapshot} snapshot
     * @return {Array<any>}
     *
     * @private
     * @function
     */
    const typeListToArraySnapshot = (type, snapshot) => {
      const cs = [];
      let n = type._start;
      while (n !== null) {
        if (n.countable && isVisible(n, snapshot)) {
          const c = n.content.getContent();
          for (let i = 0; i < c.length; i++) {
            cs.push(c[i]);
          }
        }
        n = n.right;
      }
      return cs
    };

    /**
     * Executes a provided function on once on overy element of this YArray.
     *
     * @param {AbstractType<any>} type
     * @param {function(any,number,any):void} f A function to execute on every element of this YArray.
     *
     * @private
     * @function
     */
    const typeListForEach = (type, f) => {
      let index = 0;
      let n = type._start;
      while (n !== null) {
        if (n.countable && !n.deleted) {
          const c = n.content.getContent();
          for (let i = 0; i < c.length; i++) {
            f(c[i], index++, type);
          }
        }
        n = n.right;
      }
    };

    /**
     * @template C,R
     * @param {AbstractType<any>} type
     * @param {function(C,number,AbstractType<any>):R} f
     * @return {Array<R>}
     *
     * @private
     * @function
     */
    const typeListMap = (type, f) => {
      /**
       * @type {Array<any>}
       */
      const result = [];
      typeListForEach(type, (c, i) => {
        result.push(f(c, i, type));
      });
      return result
    };

    /**
     * @param {AbstractType<any>} type
     * @return {IterableIterator<any>}
     *
     * @private
     * @function
     */
    const typeListCreateIterator = type => {
      let n = type._start;
      /**
       * @type {Array<any>|null}
       */
      let currentContent = null;
      let currentContentIndex = 0;
      return {
        [Symbol.iterator] () {
          return this
        },
        next: () => {
          // find some content
          if (currentContent === null) {
            while (n !== null && n.deleted) {
              n = n.right;
            }
            // check if we reached the end, no need to check currentContent, because it does not exist
            if (n === null) {
              return {
                done: true,
                value: undefined
              }
            }
            // we found n, so we can set currentContent
            currentContent = n.content.getContent();
            currentContentIndex = 0;
            n = n.right; // we used the content of n, now iterate to next
          }
          const value = currentContent[currentContentIndex++];
          // check if we need to empty currentContent
          if (currentContent.length <= currentContentIndex) {
            currentContent = null;
          }
          return {
            done: false,
            value
          }
        }
      }
    };

    /**
     * @param {AbstractType<any>} type
     * @param {number} index
     * @return {any}
     *
     * @private
     * @function
     */
    const typeListGet = (type, index) => {
      const marker = findMarker(type, index);
      let n = type._start;
      if (marker !== null) {
        n = marker.p;
        index -= marker.index;
      }
      for (; n !== null; n = n.right) {
        if (!n.deleted && n.countable) {
          if (index < n.length) {
            return n.content.getContent()[index]
          }
          index -= n.length;
        }
      }
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {Item?} referenceItem
     * @param {Array<Object<string,any>|Array<any>|boolean|number|string|Uint8Array>} content
     *
     * @private
     * @function
     */
    const typeListInsertGenericsAfter = (transaction, parent, referenceItem, content) => {
      let left = referenceItem;
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      const store = doc.store;
      const right = referenceItem === null ? parent._start : referenceItem.right;
      /**
       * @type {Array<Object|Array<any>|number>}
       */
      let jsonContent = [];
      const packJsonContent = () => {
        if (jsonContent.length > 0) {
          left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentAny(jsonContent));
          left.integrate(transaction, 0);
          jsonContent = [];
        }
      };
      content.forEach(c => {
        switch (c.constructor) {
          case Number:
          case Object:
          case Boolean:
          case Array:
          case String:
            jsonContent.push(c);
            break
          default:
            packJsonContent();
            switch (c.constructor) {
              case Uint8Array:
              case ArrayBuffer:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentBinary(new Uint8Array(/** @type {Uint8Array} */ (c))));
                left.integrate(transaction, 0);
                break
              case Doc:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentDoc(/** @type {Doc} */ (c)));
                left.integrate(transaction, 0);
                break
              default:
                if (c instanceof AbstractType) {
                  left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentType(c));
                  left.integrate(transaction, 0);
                } else {
                  throw new Error('Unexpected content type in insert operation')
                }
            }
        }
      });
      packJsonContent();
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {number} index
     * @param {Array<Object<string,any>|Array<any>|number|string|Uint8Array>} content
     *
     * @private
     * @function
     */
    const typeListInsertGenerics = (transaction, parent, index, content) => {
      if (index === 0) {
        if (parent._searchMarker) {
          updateMarkerChanges(parent._searchMarker, index, content.length);
        }
        return typeListInsertGenericsAfter(transaction, parent, null, content)
      }
      const startIndex = index;
      const marker = findMarker(parent, index);
      let n = parent._start;
      if (marker !== null) {
        n = marker.p;
        index -= marker.index;
        // we need to iterate one to the left so that the algorithm works
        if (index === 0) {
          // @todo refactor this as it actually doesn't consider formats
          n = n.prev; // important! get the left undeleted item so that we can actually decrease index
          index += (n && n.countable && !n.deleted) ? n.length : 0;
        }
      }
      for (; n !== null; n = n.right) {
        if (!n.deleted && n.countable) {
          if (index <= n.length) {
            if (index < n.length) {
              // insert in-between
              getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
            }
            break
          }
          index -= n.length;
        }
      }
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, startIndex, content.length);
      }
      return typeListInsertGenericsAfter(transaction, parent, n, content)
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {number} index
     * @param {number} length
     *
     * @private
     * @function
     */
    const typeListDelete = (transaction, parent, index, length) => {
      if (length === 0) { return }
      const startIndex = index;
      const startLength = length;
      const marker = findMarker(parent, index);
      let n = parent._start;
      if (marker !== null) {
        n = marker.p;
        index -= marker.index;
      }
      // compute the first item to be deleted
      for (; n !== null && index > 0; n = n.right) {
        if (!n.deleted && n.countable) {
          if (index < n.length) {
            getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
          }
          index -= n.length;
        }
      }
      // delete all items until done
      while (length > 0 && n !== null) {
        if (!n.deleted) {
          if (length < n.length) {
            getItemCleanStart(transaction, createID(n.id.client, n.id.clock + length));
          }
          n.delete(transaction);
          length -= n.length;
        }
        n = n.right;
      }
      if (length > 0) {
        throw create$2('array length exceeded')
      }
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, startIndex, -startLength + length /* in case we remove the above exception */);
      }
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {string} key
     *
     * @private
     * @function
     */
    const typeMapDelete = (transaction, parent, key) => {
      const c = parent._map.get(key);
      if (c !== undefined) {
        c.delete(transaction);
      }
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {string} key
     * @param {Object|number|Array<any>|string|Uint8Array|AbstractType<any>} value
     *
     * @private
     * @function
     */
    const typeMapSet = (transaction, parent, key, value) => {
      const left = parent._map.get(key) || null;
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      let content;
      if (value == null) {
        content = new ContentAny([value]);
      } else {
        switch (value.constructor) {
          case Number:
          case Object:
          case Boolean:
          case Array:
          case String:
            content = new ContentAny([value]);
            break
          case Uint8Array:
            content = new ContentBinary(/** @type {Uint8Array} */ (value));
            break
          case Doc:
            content = new ContentDoc(/** @type {Doc} */ (value));
            break
          default:
            if (value instanceof AbstractType) {
              content = new ContentType(value);
            } else {
              throw new Error('Unexpected content type')
            }
        }
      }
      new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, null, null, parent, key, content).integrate(transaction, 0);
    };

    /**
     * @param {AbstractType<any>} parent
     * @param {string} key
     * @return {Object<string,any>|number|Array<any>|string|Uint8Array|AbstractType<any>|undefined}
     *
     * @private
     * @function
     */
    const typeMapGet = (parent, key) => {
      const val = parent._map.get(key);
      return val !== undefined && !val.deleted ? val.content.getContent()[val.length - 1] : undefined
    };

    /**
     * @param {AbstractType<any>} parent
     * @return {Object<string,Object<string,any>|number|Array<any>|string|Uint8Array|AbstractType<any>|undefined>}
     *
     * @private
     * @function
     */
    const typeMapGetAll = (parent) => {
      /**
       * @type {Object<string,any>}
       */
      const res = {};
      parent._map.forEach((value, key) => {
        if (!value.deleted) {
          res[key] = value.content.getContent()[value.length - 1];
        }
      });
      return res
    };

    /**
     * @param {AbstractType<any>} parent
     * @param {string} key
     * @return {boolean}
     *
     * @private
     * @function
     */
    const typeMapHas = (parent, key) => {
      const val = parent._map.get(key);
      return val !== undefined && !val.deleted
    };

    /**
     * @param {AbstractType<any>} parent
     * @param {string} key
     * @param {Snapshot} snapshot
     * @return {Object<string,any>|number|Array<any>|string|Uint8Array|AbstractType<any>|undefined}
     *
     * @private
     * @function
     */
    const typeMapGetSnapshot = (parent, key, snapshot) => {
      let v = parent._map.get(key) || null;
      while (v !== null && (!snapshot.sv.has(v.id.client) || v.id.clock >= (snapshot.sv.get(v.id.client) || 0))) {
        v = v.left;
      }
      return v !== null && isVisible(v, snapshot) ? v.content.getContent()[v.length - 1] : undefined
    };

    /**
     * @param {Map<string,Item>} map
     * @return {IterableIterator<Array<any>>}
     *
     * @private
     * @function
     */
    const createMapIterator = map => iteratorFilter(map.entries(), /** @param {any} entry */ entry => !entry[1].deleted);

    /**
     * @module YArray
     */

    /**
     * Event that describes the changes on a YArray
     * @template T
     */
    class YArrayEvent extends YEvent {
      /**
       * @param {YArray<T>} yarray The changed type
       * @param {Transaction} transaction The transaction object
       */
      constructor (yarray, transaction) {
        super(yarray, transaction);
        this._transaction = transaction;
      }
    }

    /**
     * A shared Array implementation.
     * @template T
     * @extends AbstractType<YArrayEvent<T>>
     * @implements {Iterable<T>}
     */
    class YArray extends AbstractType {
      constructor () {
        super();
        /**
         * @type {Array<any>?}
         * @private
         */
        this._prelimContent = [];
        /**
         * @type {Array<ArraySearchMarker>}
         */
        this._searchMarker = [];
      }

      /**
       * Construct a new YArray containing the specified items.
       * @template T
       * @param {Array<T>} items
       * @return {YArray<T>}
       */
      static from (items) {
        const a = new YArray();
        a.push(items);
        return a
      }

      /**
       * Integrate this type into the Yjs instance.
       *
       * * Save this struct in the os
       * * This type is sent to other client
       * * Observer functions are fired
       *
       * @param {Doc} y The Yjs instance
       * @param {Item} item
       */
      _integrate (y, item) {
        super._integrate(y, item);
        this.insert(0, /** @type {Array<any>} */ (this._prelimContent));
        this._prelimContent = null;
      }

      _copy () {
        return new YArray()
      }

      /**
       * @return {YArray<T>}
       */
      clone () {
        const arr = new YArray();
        arr.insert(0, this.toArray().map(el =>
          el instanceof AbstractType ? el.clone() : el
        ));
        return arr
      }

      get length () {
        return this._prelimContent === null ? this._length : this._prelimContent.length
      }

      /**
       * Creates YArrayEvent and calls observers.
       *
       * @param {Transaction} transaction
       * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
       */
      _callObserver (transaction, parentSubs) {
        super._callObserver(transaction, parentSubs);
        callTypeObservers(this, transaction, new YArrayEvent(this, transaction));
      }

      /**
       * Inserts new content at an index.
       *
       * Important: This function expects an array of content. Not just a content
       * object. The reason for this "weirdness" is that inserting several elements
       * is very efficient when it is done as a single operation.
       *
       * @example
       *  // Insert character 'a' at position 0
       *  yarray.insert(0, ['a'])
       *  // Insert numbers 1, 2 at position 1
       *  yarray.insert(1, [1, 2])
       *
       * @param {number} index The index to insert content at.
       * @param {Array<T>} content The array of content
       */
      insert (index, content) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeListInsertGenerics(transaction, this, index, content);
          });
        } else {
          /** @type {Array<any>} */ (this._prelimContent).splice(index, 0, ...content);
        }
      }

      /**
       * Appends content to this YArray.
       *
       * @param {Array<T>} content Array of content to append.
       */
      push (content) {
        this.insert(this.length, content);
      }

      /**
       * Preppends content to this YArray.
       *
       * @param {Array<T>} content Array of content to preppend.
       */
      unshift (content) {
        this.insert(0, content);
      }

      /**
       * Deletes elements starting from an index.
       *
       * @param {number} index Index at which to start deleting elements
       * @param {number} length The number of elements to remove. Defaults to 1.
       */
      delete (index, length = 1) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeListDelete(transaction, this, index, length);
          });
        } else {
          /** @type {Array<any>} */ (this._prelimContent).splice(index, length);
        }
      }

      /**
       * Returns the i-th element from a YArray.
       *
       * @param {number} index The index of the element to return from the YArray
       * @return {T}
       */
      get (index) {
        return typeListGet(this, index)
      }

      /**
       * Transforms this YArray to a JavaScript Array.
       *
       * @return {Array<T>}
       */
      toArray () {
        return typeListToArray(this)
      }

      /**
       * Transforms this YArray to a JavaScript Array.
       *
       * @param {number} [start]
       * @param {number} [end]
       * @return {Array<T>}
       */
      slice (start = 0, end = this.length) {
        return typeListSlice(this, start, end)
      }

      /**
       * Transforms this Shared Type to a JSON object.
       *
       * @return {Array<any>}
       */
      toJSON () {
        return this.map(c => c instanceof AbstractType ? c.toJSON() : c)
      }

      /**
       * Returns an Array with the result of calling a provided function on every
       * element of this YArray.
       *
       * @template T,M
       * @param {function(T,number,YArray<T>):M} f Function that produces an element of the new Array
       * @return {Array<M>} A new array with each element being the result of the
       *                 callback function
       */
      map (f) {
        return typeListMap(this, /** @type {any} */ (f))
      }

      /**
       * Executes a provided function on once on overy element of this YArray.
       *
       * @param {function(T,number,YArray<T>):void} f A function to execute on every element of this YArray.
       */
      forEach (f) {
        typeListForEach(this, f);
      }

      /**
       * @return {IterableIterator<T>}
       */
      [Symbol.iterator] () {
        return typeListCreateIterator(this)
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       */
      _write (encoder) {
        encoder.writeTypeRef(YArrayRefID);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     *
     * @private
     * @function
     */
    const readYArray = decoder => new YArray();

    /**
     * @template T
     * Event that describes the changes on a YMap.
     */
    class YMapEvent extends YEvent {
      /**
       * @param {YMap<T>} ymap The YArray that changed.
       * @param {Transaction} transaction
       * @param {Set<any>} subs The keys that changed.
       */
      constructor (ymap, transaction, subs) {
        super(ymap, transaction);
        this.keysChanged = subs;
      }
    }

    /**
     * @template T number|string|Object|Array|Uint8Array
     * A shared Map implementation.
     *
     * @extends AbstractType<YMapEvent<T>>
     * @implements {Iterable<T>}
     */
    class YMap extends AbstractType {
      /**
       *
       * @param {Iterable<readonly [string, any]>=} entries - an optional iterable to initialize the YMap
       */
      constructor (entries) {
        super();
        /**
         * @type {Map<string,any>?}
         * @private
         */
        this._prelimContent = null;

        if (entries === undefined) {
          this._prelimContent = new Map();
        } else {
          this._prelimContent = new Map(entries);
        }
      }

      /**
       * Integrate this type into the Yjs instance.
       *
       * * Save this struct in the os
       * * This type is sent to other client
       * * Observer functions are fired
       *
       * @param {Doc} y The Yjs instance
       * @param {Item} item
       */
      _integrate (y, item) {
        super._integrate(y, item)
        ;/** @type {Map<string, any>} */ (this._prelimContent).forEach((value, key) => {
          this.set(key, value);
        });
        this._prelimContent = null;
      }

      _copy () {
        return new YMap()
      }

      /**
       * @return {YMap<T>}
       */
      clone () {
        const map = new YMap();
        this.forEach((value, key) => {
          map.set(key, value instanceof AbstractType ? value.clone() : value);
        });
        return map
      }

      /**
       * Creates YMapEvent and calls observers.
       *
       * @param {Transaction} transaction
       * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
       */
      _callObserver (transaction, parentSubs) {
        callTypeObservers(this, transaction, new YMapEvent(this, transaction, parentSubs));
      }

      /**
       * Transforms this Shared Type to a JSON object.
       *
       * @return {Object<string,T>}
       */
      toJSON () {
        /**
         * @type {Object<string,T>}
         */
        const map = {};
        this._map.forEach((item, key) => {
          if (!item.deleted) {
            const v = item.content.getContent()[item.length - 1];
            map[key] = v instanceof AbstractType ? v.toJSON() : v;
          }
        });
        return map
      }

      /**
       * Returns the size of the YMap (count of key/value pairs)
       *
       * @return {number}
       */
      get size () {
        return [...createMapIterator(this._map)].length
      }

      /**
       * Returns the keys for each element in the YMap Type.
       *
       * @return {IterableIterator<string>}
       */
      keys () {
        return iteratorMap(createMapIterator(this._map), /** @param {any} v */ v => v[0])
      }

      /**
       * Returns the values for each element in the YMap Type.
       *
       * @return {IterableIterator<any>}
       */
      values () {
        return iteratorMap(createMapIterator(this._map), /** @param {any} v */ v => v[1].content.getContent()[v[1].length - 1])
      }

      /**
       * Returns an Iterator of [key, value] pairs
       *
       * @return {IterableIterator<any>}
       */
      entries () {
        return iteratorMap(createMapIterator(this._map), /** @param {any} v */ v => [v[0], v[1].content.getContent()[v[1].length - 1]])
      }

      /**
       * Executes a provided function on once on every key-value pair.
       *
       * @param {function(T,string,YMap<T>):void} f A function to execute on every element of this YArray.
       */
      forEach (f) {
        /**
         * @type {Object<string,T>}
         */
        const map = {};
        this._map.forEach((item, key) => {
          if (!item.deleted) {
            f(item.content.getContent()[item.length - 1], key, this);
          }
        });
        return map
      }

      /**
       * @return {IterableIterator<T>}
       */
      [Symbol.iterator] () {
        return this.entries()
      }

      /**
       * Remove a specified element from this YMap.
       *
       * @param {string} key The key of the element to remove.
       */
      delete (key) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapDelete(transaction, this, key);
          });
        } else {
          /** @type {Map<string, any>} */ (this._prelimContent).delete(key);
        }
      }

      /**
       * Adds or updates an element with a specified key and value.
       *
       * @param {string} key The key of the element to add to this YMap
       * @param {T} value The value of the element to add
       */
      set (key, value) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapSet(transaction, this, key, value);
          });
        } else {
          /** @type {Map<string, any>} */ (this._prelimContent).set(key, value);
        }
        return value
      }

      /**
       * Returns a specified element from this YMap.
       *
       * @param {string} key
       * @return {T|undefined}
       */
      get (key) {
        return /** @type {any} */ (typeMapGet(this, key))
      }

      /**
       * Returns a boolean indicating whether the specified key exists or not.
       *
       * @param {string} key The key to test.
       * @return {boolean}
       */
      has (key) {
        return typeMapHas(this, key)
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       */
      _write (encoder) {
        encoder.writeTypeRef(YMapRefID);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     *
     * @private
     * @function
     */
    const readYMap = decoder => new YMap();

    /**
     * @param {any} a
     * @param {any} b
     * @return {boolean}
     */
    const equalAttrs = (a, b) => a === b || (typeof a === 'object' && typeof b === 'object' && a && b && equalFlat(a, b));

    class ItemTextListPosition {
      /**
       * @param {Item|null} left
       * @param {Item|null} right
       * @param {number} index
       * @param {Map<string,any>} currentAttributes
       */
      constructor (left, right, index, currentAttributes) {
        this.left = left;
        this.right = right;
        this.index = index;
        this.currentAttributes = currentAttributes;
      }

      /**
       * Only call this if you know that this.right is defined
       */
      forward () {
        if (this.right === null) {
          unexpectedCase();
        }
        switch (this.right.content.constructor) {
          case ContentEmbed:
          case ContentString:
            if (!this.right.deleted) {
              this.index += this.right.length;
            }
            break
          case ContentFormat:
            if (!this.right.deleted) {
              updateCurrentAttributes(this.currentAttributes, /** @type {ContentFormat} */ (this.right.content));
            }
            break
        }
        this.left = this.right;
        this.right = this.right.right;
      }
    }

    /**
     * @param {Transaction} transaction
     * @param {ItemTextListPosition} pos
     * @param {number} count steps to move forward
     * @return {ItemTextListPosition}
     *
     * @private
     * @function
     */
    const findNextPosition = (transaction, pos, count) => {
      while (pos.right !== null && count > 0) {
        switch (pos.right.content.constructor) {
          case ContentEmbed:
          case ContentString:
            if (!pos.right.deleted) {
              if (count < pos.right.length) {
                // split right
                getItemCleanStart(transaction, createID(pos.right.id.client, pos.right.id.clock + count));
              }
              pos.index += pos.right.length;
              count -= pos.right.length;
            }
            break
          case ContentFormat:
            if (!pos.right.deleted) {
              updateCurrentAttributes(pos.currentAttributes, /** @type {ContentFormat} */ (pos.right.content));
            }
            break
        }
        pos.left = pos.right;
        pos.right = pos.right.right;
        // pos.forward() - we don't forward because that would halve the performance because we already do the checks above
      }
      return pos
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {number} index
     * @return {ItemTextListPosition}
     *
     * @private
     * @function
     */
    const findPosition = (transaction, parent, index) => {
      const currentAttributes = new Map();
      const marker = findMarker(parent, index);
      if (marker) {
        const pos = new ItemTextListPosition(marker.p.left, marker.p, marker.index, currentAttributes);
        return findNextPosition(transaction, pos, index - marker.index)
      } else {
        const pos = new ItemTextListPosition(null, parent._start, 0, currentAttributes);
        return findNextPosition(transaction, pos, index)
      }
    };

    /**
     * Negate applied formats
     *
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {ItemTextListPosition} currPos
     * @param {Map<string,any>} negatedAttributes
     *
     * @private
     * @function
     */
    const insertNegatedAttributes = (transaction, parent, currPos, negatedAttributes) => {
      // check if we really need to remove attributes
      while (
        currPos.right !== null && (
          currPos.right.deleted === true || (
            currPos.right.content.constructor === ContentFormat &&
            equalAttrs(negatedAttributes.get(/** @type {ContentFormat} */ (currPos.right.content).key), /** @type {ContentFormat} */ (currPos.right.content).value)
          )
        )
      ) {
        if (!currPos.right.deleted) {
          negatedAttributes.delete(/** @type {ContentFormat} */ (currPos.right.content).key);
        }
        currPos.forward();
      }
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      let left = currPos.left;
      const right = currPos.right;
      negatedAttributes.forEach((val, key) => {
        left = new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
        left.integrate(transaction, 0);
      });
    };

    /**
     * @param {Map<string,any>} currentAttributes
     * @param {ContentFormat} format
     *
     * @private
     * @function
     */
    const updateCurrentAttributes = (currentAttributes, format) => {
      const { key, value } = format;
      if (value === null) {
        currentAttributes.delete(key);
      } else {
        currentAttributes.set(key, value);
      }
    };

    /**
     * @param {ItemTextListPosition} currPos
     * @param {Object<string,any>} attributes
     *
     * @private
     * @function
     */
    const minimizeAttributeChanges = (currPos, attributes) => {
      // go right while attributes[right.key] === right.value (or right is deleted)
      while (true) {
        if (currPos.right === null) {
          break
        } else if (currPos.right.deleted || (currPos.right.content.constructor === ContentFormat && equalAttrs(attributes[(/** @type {ContentFormat} */ (currPos.right.content)).key] || null, /** @type {ContentFormat} */ (currPos.right.content).value))) ; else {
          break
        }
        currPos.forward();
      }
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {ItemTextListPosition} currPos
     * @param {Object<string,any>} attributes
     * @return {Map<string,any>}
     *
     * @private
     * @function
     **/
    const insertAttributes = (transaction, parent, currPos, attributes) => {
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      const negatedAttributes = new Map();
      // insert format-start items
      for (const key in attributes) {
        const val = attributes[key];
        const currentVal = currPos.currentAttributes.get(key) || null;
        if (!equalAttrs(currentVal, val)) {
          // save negated attribute (set null if currentVal undefined)
          negatedAttributes.set(key, currentVal);
          const { left, right } = currPos;
          currPos.right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
          currPos.right.integrate(transaction, 0);
          currPos.forward();
        }
      }
      return negatedAttributes
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {ItemTextListPosition} currPos
     * @param {string|object} text
     * @param {Object<string,any>} attributes
     *
     * @private
     * @function
     **/
    const insertText = (transaction, parent, currPos, text, attributes) => {
      currPos.currentAttributes.forEach((val, key) => {
        if (attributes[key] === undefined) {
          attributes[key] = null;
        }
      });
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      minimizeAttributeChanges(currPos, attributes);
      const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
      // insert content
      const content = text.constructor === String ? new ContentString(/** @type {string} */ (text)) : new ContentEmbed(text);
      let { left, right, index } = currPos;
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, currPos.index, content.getLength());
      }
      right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, content);
      right.integrate(transaction, 0);
      currPos.right = right;
      currPos.index = index;
      currPos.forward();
      insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
    };

    /**
     * @param {Transaction} transaction
     * @param {AbstractType<any>} parent
     * @param {ItemTextListPosition} currPos
     * @param {number} length
     * @param {Object<string,any>} attributes
     *
     * @private
     * @function
     */
    const formatText = (transaction, parent, currPos, length, attributes) => {
      const doc = transaction.doc;
      const ownClientId = doc.clientID;
      minimizeAttributeChanges(currPos, attributes);
      const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
      // iterate until first non-format or null is found
      // delete all formats with attributes[format.key] != null
      while (length > 0 && currPos.right !== null) {
        if (!currPos.right.deleted) {
          switch (currPos.right.content.constructor) {
            case ContentFormat: {
              const { key, value } = /** @type {ContentFormat} */ (currPos.right.content);
              const attr = attributes[key];
              if (attr !== undefined) {
                if (equalAttrs(attr, value)) {
                  negatedAttributes.delete(key);
                } else {
                  negatedAttributes.set(key, value);
                }
                currPos.right.delete(transaction);
              }
              break
            }
            case ContentEmbed:
            case ContentString:
              if (length < currPos.right.length) {
                getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length));
              }
              length -= currPos.right.length;
              break
          }
        }
        currPos.forward();
      }
      // Quill just assumes that the editor starts with a newline and that it always
      // ends with a newline. We only insert that newline when a new newline is
      // inserted - i.e when length is bigger than type.length
      if (length > 0) {
        let newlines = '';
        for (; length > 0; length--) {
          newlines += '\n';
        }
        currPos.right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), currPos.left, currPos.left && currPos.left.lastId, currPos.right, currPos.right && currPos.right.id, parent, null, new ContentString(newlines));
        currPos.right.integrate(transaction, 0);
        currPos.forward();
      }
      insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
    };

    /**
     * Call this function after string content has been deleted in order to
     * clean up formatting Items.
     *
     * @param {Transaction} transaction
     * @param {Item} start
     * @param {Item|null} end exclusive end, automatically iterates to the next Content Item
     * @param {Map<string,any>} startAttributes
     * @param {Map<string,any>} endAttributes This attribute is modified!
     * @return {number} The amount of formatting Items deleted.
     *
     * @function
     */
    const cleanupFormattingGap = (transaction, start, end, startAttributes, endAttributes) => {
      while (end && end.content.constructor !== ContentString && end.content.constructor !== ContentEmbed) {
        if (!end.deleted && end.content.constructor === ContentFormat) {
          updateCurrentAttributes(endAttributes, /** @type {ContentFormat} */ (end.content));
        }
        end = end.right;
      }
      let cleanups = 0;
      while (start !== end) {
        if (!start.deleted) {
          const content = start.content;
          switch (content.constructor) {
            case ContentFormat: {
              const { key, value } = /** @type {ContentFormat} */ (content);
              if ((endAttributes.get(key) || null) !== value || (startAttributes.get(key) || null) === value) {
                // Either this format is overwritten or it is not necessary because the attribute already existed.
                start.delete(transaction);
                cleanups++;
              }
              break
            }
          }
        }
        start = /** @type {Item} */ (start.right);
      }
      return cleanups
    };

    /**
     * @param {Transaction} transaction
     * @param {Item | null} item
     */
    const cleanupContextlessFormattingGap = (transaction, item) => {
      // iterate until item.right is null or content
      while (item && item.right && (item.right.deleted || (item.right.content.constructor !== ContentString && item.right.content.constructor !== ContentEmbed))) {
        item = item.right;
      }
      const attrs = new Set();
      // iterate back until a content item is found
      while (item && (item.deleted || (item.content.constructor !== ContentString && item.content.constructor !== ContentEmbed))) {
        if (!item.deleted && item.content.constructor === ContentFormat) {
          const key = /** @type {ContentFormat} */ (item.content).key;
          if (attrs.has(key)) {
            item.delete(transaction);
          } else {
            attrs.add(key);
          }
        }
        item = item.left;
      }
    };

    /**
     * This function is experimental and subject to change / be removed.
     *
     * Ideally, we don't need this function at all. Formatting attributes should be cleaned up
     * automatically after each change. This function iterates twice over the complete YText type
     * and removes unnecessary formatting attributes. This is also helpful for testing.
     *
     * This function won't be exported anymore as soon as there is confidence that the YText type works as intended.
     *
     * @param {YText} type
     * @return {number} How many formatting attributes have been cleaned up.
     */
    const cleanupYTextFormatting = type => {
      let res = 0;
      transact(/** @type {Doc} */ (type.doc), transaction => {
        let start = /** @type {Item} */ (type._start);
        let end = type._start;
        let startAttributes = create();
        const currentAttributes = copy(startAttributes);
        while (end) {
          if (end.deleted === false) {
            switch (end.content.constructor) {
              case ContentFormat:
                updateCurrentAttributes(currentAttributes, /** @type {ContentFormat} */ (end.content));
                break
              case ContentEmbed:
              case ContentString:
                res += cleanupFormattingGap(transaction, start, end, startAttributes, currentAttributes);
                startAttributes = copy(currentAttributes);
                start = end;
                break
            }
          }
          end = end.right;
        }
      });
      return res
    };

    /**
     * @param {Transaction} transaction
     * @param {ItemTextListPosition} currPos
     * @param {number} length
     * @return {ItemTextListPosition}
     *
     * @private
     * @function
     */
    const deleteText = (transaction, currPos, length) => {
      const startLength = length;
      const startAttrs = copy(currPos.currentAttributes);
      const start = currPos.right;
      while (length > 0 && currPos.right !== null) {
        if (currPos.right.deleted === false) {
          switch (currPos.right.content.constructor) {
            case ContentEmbed:
            case ContentString:
              if (length < currPos.right.length) {
                getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length));
              }
              length -= currPos.right.length;
              currPos.right.delete(transaction);
              break
          }
        }
        currPos.forward();
      }
      if (start) {
        cleanupFormattingGap(transaction, start, currPos.right, startAttrs, copy(currPos.currentAttributes));
      }
      const parent = /** @type {AbstractType<any>} */ (/** @type {Item} */ (currPos.left || currPos.right).parent);
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, currPos.index, -startLength + length);
      }
      return currPos
    };

    /**
     * The Quill Delta format represents changes on a text document with
     * formatting information. For mor information visit {@link https://quilljs.com/docs/delta/|Quill Delta}
     *
     * @example
     *   {
     *     ops: [
     *       { insert: 'Gandalf', attributes: { bold: true } },
     *       { insert: ' the ' },
     *       { insert: 'Grey', attributes: { color: '#cccccc' } }
     *     ]
     *   }
     *
     */

    /**
      * Attributes that can be assigned to a selection of text.
      *
      * @example
      *   {
      *     bold: true,
      *     font-size: '40px'
      *   }
      *
      * @typedef {Object} TextAttributes
      */

    /**
     * @typedef {Object} DeltaItem
     * @property {number|undefined} DeltaItem.delete
     * @property {number|undefined} DeltaItem.retain
     * @property {string|undefined} DeltaItem.insert
     * @property {Object<string,any>} DeltaItem.attributes
     */

    /**
     * Event that describes the changes on a YText type.
     */
    class YTextEvent extends YEvent {
      /**
       * @param {YText} ytext
       * @param {Transaction} transaction
       * @param {Set<any>} subs The keys that changed
       */
      constructor (ytext, transaction, subs) {
        super(ytext, transaction);
        /**
         * @type {Array<DeltaItem>|null}
         */
        this._delta = null;
        /**
         * Whether the children changed.
         * @type {Boolean}
         * @private
         */
        this.childListChanged = false;
        /**
         * Set of all changed attributes.
         * @type {Set<string>}
         */
        this.keysChanged = new Set();
        subs.forEach((sub) => {
          if (sub === null) {
            this.childListChanged = true;
          } else {
            this.keysChanged.add(sub);
          }
        });
      }

      /**
       * Compute the changes in the delta format.
       * A {@link https://quilljs.com/docs/delta/|Quill Delta}) that represents the changes on the document.
       *
       * @type {Array<DeltaItem>}
       *
       * @public
       */
      get delta () {
        if (this._delta === null) {
          const y = /** @type {Doc} */ (this.target.doc);
          this._delta = [];
          transact(y, transaction => {
            const delta = /** @type {Array<DeltaItem>} */ (this._delta);
            const currentAttributes = new Map(); // saves all current attributes for insert
            const oldAttributes = new Map();
            let item = this.target._start;
            /**
             * @type {string?}
             */
            let action = null;
            /**
             * @type {Object<string,any>}
             */
            const attributes = {}; // counts added or removed new attributes for retain
            /**
             * @type {string|object}
             */
            let insert = '';
            let retain = 0;
            let deleteLen = 0;
            const addOp = () => {
              if (action !== null) {
                /**
                 * @type {any}
                 */
                let op;
                switch (action) {
                  case 'delete':
                    op = { delete: deleteLen };
                    deleteLen = 0;
                    break
                  case 'insert':
                    op = { insert };
                    if (currentAttributes.size > 0) {
                      op.attributes = {};
                      currentAttributes.forEach((value, key) => {
                        if (value !== null) {
                          op.attributes[key] = value;
                        }
                      });
                    }
                    insert = '';
                    break
                  case 'retain':
                    op = { retain };
                    if (Object.keys(attributes).length > 0) {
                      op.attributes = {};
                      for (const key in attributes) {
                        op.attributes[key] = attributes[key];
                      }
                    }
                    retain = 0;
                    break
                }
                delta.push(op);
                action = null;
              }
            };
            while (item !== null) {
              switch (item.content.constructor) {
                case ContentEmbed:
                  if (this.adds(item)) {
                    if (!this.deletes(item)) {
                      addOp();
                      action = 'insert';
                      insert = /** @type {ContentEmbed} */ (item.content).embed;
                      addOp();
                    }
                  } else if (this.deletes(item)) {
                    if (action !== 'delete') {
                      addOp();
                      action = 'delete';
                    }
                    deleteLen += 1;
                  } else if (!item.deleted) {
                    if (action !== 'retain') {
                      addOp();
                      action = 'retain';
                    }
                    retain += 1;
                  }
                  break
                case ContentString:
                  if (this.adds(item)) {
                    if (!this.deletes(item)) {
                      if (action !== 'insert') {
                        addOp();
                        action = 'insert';
                      }
                      insert += /** @type {ContentString} */ (item.content).str;
                    }
                  } else if (this.deletes(item)) {
                    if (action !== 'delete') {
                      addOp();
                      action = 'delete';
                    }
                    deleteLen += item.length;
                  } else if (!item.deleted) {
                    if (action !== 'retain') {
                      addOp();
                      action = 'retain';
                    }
                    retain += item.length;
                  }
                  break
                case ContentFormat: {
                  const { key, value } = /** @type {ContentFormat} */ (item.content);
                  if (this.adds(item)) {
                    if (!this.deletes(item)) {
                      const curVal = currentAttributes.get(key) || null;
                      if (!equalAttrs(curVal, value)) {
                        if (action === 'retain') {
                          addOp();
                        }
                        if (equalAttrs(value, (oldAttributes.get(key) || null))) {
                          delete attributes[key];
                        } else {
                          attributes[key] = value;
                        }
                      } else {
                        item.delete(transaction);
                      }
                    }
                  } else if (this.deletes(item)) {
                    oldAttributes.set(key, value);
                    const curVal = currentAttributes.get(key) || null;
                    if (!equalAttrs(curVal, value)) {
                      if (action === 'retain') {
                        addOp();
                      }
                      attributes[key] = curVal;
                    }
                  } else if (!item.deleted) {
                    oldAttributes.set(key, value);
                    const attr = attributes[key];
                    if (attr !== undefined) {
                      if (!equalAttrs(attr, value)) {
                        if (action === 'retain') {
                          addOp();
                        }
                        if (value === null) {
                          attributes[key] = value;
                        } else {
                          delete attributes[key];
                        }
                      } else {
                        item.delete(transaction);
                      }
                    }
                  }
                  if (!item.deleted) {
                    if (action === 'insert') {
                      addOp();
                    }
                    updateCurrentAttributes(currentAttributes, /** @type {ContentFormat} */ (item.content));
                  }
                  break
                }
              }
              item = item.right;
            }
            addOp();
            while (delta.length > 0) {
              const lastOp = delta[delta.length - 1];
              if (lastOp.retain !== undefined && lastOp.attributes === undefined) {
                // retain delta's if they don't assign attributes
                delta.pop();
              } else {
                break
              }
            }
          });
        }
        return this._delta
      }
    }

    /**
     * Type that represents text with formatting information.
     *
     * This type replaces y-richtext as this implementation is able to handle
     * block formats (format information on a paragraph), embeds (complex elements
     * like pictures and videos), and text formats (**bold**, *italic*).
     *
     * @extends AbstractType<YTextEvent>
     */
    class YText extends AbstractType {
      /**
       * @param {String} [string] The initial value of the YText.
       */
      constructor (string) {
        super();
        /**
         * Array of pending operations on this type
         * @type {Array<function():void>?}
         */
        this._pending = string !== undefined ? [() => this.insert(0, string)] : [];
        /**
         * @type {Array<ArraySearchMarker>}
         */
        this._searchMarker = [];
      }

      /**
       * Number of characters of this text type.
       *
       * @type {number}
       */
      get length () {
        return this._length
      }

      /**
       * @param {Doc} y
       * @param {Item} item
       */
      _integrate (y, item) {
        super._integrate(y, item);
        try {
          /** @type {Array<function>} */ (this._pending).forEach(f => f());
        } catch (e) {
          console.error(e);
        }
        this._pending = null;
      }

      _copy () {
        return new YText()
      }

      /**
       * @return {YText}
       */
      clone () {
        const text = new YText();
        text.applyDelta(this.toDelta());
        return text
      }

      /**
       * Creates YTextEvent and calls observers.
       *
       * @param {Transaction} transaction
       * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
       */
      _callObserver (transaction, parentSubs) {
        super._callObserver(transaction, parentSubs);
        const event = new YTextEvent(this, transaction, parentSubs);
        const doc = transaction.doc;
        // If a remote change happened, we try to cleanup potential formatting duplicates.
        if (!transaction.local) {
          // check if another formatting item was inserted
          let foundFormattingItem = false;
          for (const [client, afterClock] of transaction.afterState.entries()) {
            const clock = transaction.beforeState.get(client) || 0;
            if (afterClock === clock) {
              continue
            }
            iterateStructs(transaction, /** @type {Array<Item|GC>} */ (doc.store.clients.get(client)), clock, afterClock, item => {
              if (!item.deleted && /** @type {Item} */ (item).content.constructor === ContentFormat) {
                foundFormattingItem = true;
              }
            });
            if (foundFormattingItem) {
              break
            }
          }
          if (!foundFormattingItem) {
            iterateDeletedStructs(transaction, transaction.deleteSet, item => {
              if (item instanceof GC || foundFormattingItem) {
                return
              }
              if (item.parent === this && item.content.constructor === ContentFormat) {
                foundFormattingItem = true;
              }
            });
          }
          transact(doc, (t) => {
            if (foundFormattingItem) {
              // If a formatting item was inserted, we simply clean the whole type.
              // We need to compute currentAttributes for the current position anyway.
              cleanupYTextFormatting(this);
            } else {
              // If no formatting attribute was inserted, we can make due with contextless
              // formatting cleanups.
              // Contextless: it is not necessary to compute currentAttributes for the affected position.
              iterateDeletedStructs(t, t.deleteSet, item => {
                if (item instanceof GC) {
                  return
                }
                if (item.parent === this) {
                  cleanupContextlessFormattingGap(t, item);
                }
              });
            }
          });
        }
        callTypeObservers(this, transaction, event);
      }

      /**
       * Returns the unformatted string representation of this YText type.
       *
       * @public
       */
      toString () {
        let str = '';
        /**
         * @type {Item|null}
         */
        let n = this._start;
        while (n !== null) {
          if (!n.deleted && n.countable && n.content.constructor === ContentString) {
            str += /** @type {ContentString} */ (n.content).str;
          }
          n = n.right;
        }
        return str
      }

      /**
       * Returns the unformatted string representation of this YText type.
       *
       * @return {string}
       * @public
       */
      toJSON () {
        return this.toString()
      }

      /**
       * Apply a {@link Delta} on this shared YText type.
       *
       * @param {any} delta The changes to apply on this element.
       * @param {object}  [opts]
       * @param {boolean} [opts.sanitize] Sanitize input delta. Removes ending newlines if set to true.
       *
       *
       * @public
       */
      applyDelta (delta, { sanitize = true } = {}) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            const currPos = new ItemTextListPosition(null, this._start, 0, new Map());
            for (let i = 0; i < delta.length; i++) {
              const op = delta[i];
              if (op.insert !== undefined) {
                // Quill assumes that the content starts with an empty paragraph.
                // Yjs/Y.Text assumes that it starts empty. We always hide that
                // there is a newline at the end of the content.
                // If we omit this step, clients will see a different number of
                // paragraphs, but nothing bad will happen.
                const ins = (!sanitize && typeof op.insert === 'string' && i === delta.length - 1 && currPos.right === null && op.insert.slice(-1) === '\n') ? op.insert.slice(0, -1) : op.insert;
                if (typeof ins !== 'string' || ins.length > 0) {
                  insertText(transaction, this, currPos, ins, op.attributes || {});
                }
              } else if (op.retain !== undefined) {
                formatText(transaction, this, currPos, op.retain, op.attributes || {});
              } else if (op.delete !== undefined) {
                deleteText(transaction, currPos, op.delete);
              }
            }
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.applyDelta(delta));
        }
      }

      /**
       * Returns the Delta representation of this YText type.
       *
       * @param {Snapshot} [snapshot]
       * @param {Snapshot} [prevSnapshot]
       * @param {function('removed' | 'added', ID):any} [computeYChange]
       * @return {any} The Delta representation of this type.
       *
       * @public
       */
      toDelta (snapshot, prevSnapshot, computeYChange) {
        /**
         * @type{Array<any>}
         */
        const ops = [];
        const currentAttributes = new Map();
        const doc = /** @type {Doc} */ (this.doc);
        let str = '';
        let n = this._start;
        function packStr () {
          if (str.length > 0) {
            // pack str with attributes to ops
            /**
             * @type {Object<string,any>}
             */
            const attributes = {};
            let addAttributes = false;
            currentAttributes.forEach((value, key) => {
              addAttributes = true;
              attributes[key] = value;
            });
            /**
             * @type {Object<string,any>}
             */
            const op = { insert: str };
            if (addAttributes) {
              op.attributes = attributes;
            }
            ops.push(op);
            str = '';
          }
        }
        // snapshots are merged again after the transaction, so we need to keep the
        // transalive until we are done
        transact(doc, transaction => {
          if (snapshot) {
            splitSnapshotAffectedStructs(transaction, snapshot);
          }
          if (prevSnapshot) {
            splitSnapshotAffectedStructs(transaction, prevSnapshot);
          }
          while (n !== null) {
            if (isVisible(n, snapshot) || (prevSnapshot !== undefined && isVisible(n, prevSnapshot))) {
              switch (n.content.constructor) {
                case ContentString: {
                  const cur = currentAttributes.get('ychange');
                  if (snapshot !== undefined && !isVisible(n, snapshot)) {
                    if (cur === undefined || cur.user !== n.id.client || cur.state !== 'removed') {
                      packStr();
                      currentAttributes.set('ychange', computeYChange ? computeYChange('removed', n.id) : { type: 'removed' });
                    }
                  } else if (prevSnapshot !== undefined && !isVisible(n, prevSnapshot)) {
                    if (cur === undefined || cur.user !== n.id.client || cur.state !== 'added') {
                      packStr();
                      currentAttributes.set('ychange', computeYChange ? computeYChange('added', n.id) : { type: 'added' });
                    }
                  } else if (cur !== undefined) {
                    packStr();
                    currentAttributes.delete('ychange');
                  }
                  str += /** @type {ContentString} */ (n.content).str;
                  break
                }
                case ContentEmbed: {
                  packStr();
                  /**
                   * @type {Object<string,any>}
                   */
                  const op = {
                    insert: /** @type {ContentEmbed} */ (n.content).embed
                  };
                  if (currentAttributes.size > 0) {
                    const attrs = /** @type {Object<string,any>} */ ({});
                    op.attributes = attrs;
                    currentAttributes.forEach((value, key) => {
                      attrs[key] = value;
                    });
                  }
                  ops.push(op);
                  break
                }
                case ContentFormat:
                  if (isVisible(n, snapshot)) {
                    packStr();
                    updateCurrentAttributes(currentAttributes, /** @type {ContentFormat} */ (n.content));
                  }
                  break
              }
            }
            n = n.right;
          }
          packStr();
        }, splitSnapshotAffectedStructs);
        return ops
      }

      /**
       * Insert text at a given index.
       *
       * @param {number} index The index at which to start inserting.
       * @param {String} text The text to insert at the specified position.
       * @param {TextAttributes} [attributes] Optionally define some formatting
       *                                    information to apply on the inserted
       *                                    Text.
       * @public
       */
      insert (index, text, attributes) {
        if (text.length <= 0) {
          return
        }
        const y = this.doc;
        if (y !== null) {
          transact(y, transaction => {
            const pos = findPosition(transaction, this, index);
            if (!attributes) {
              attributes = {};
              // @ts-ignore
              pos.currentAttributes.forEach((v, k) => { attributes[k] = v; });
            }
            insertText(transaction, this, pos, text, attributes);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.insert(index, text, attributes));
        }
      }

      /**
       * Inserts an embed at a index.
       *
       * @param {number} index The index to insert the embed at.
       * @param {Object} embed The Object that represents the embed.
       * @param {TextAttributes} attributes Attribute information to apply on the
       *                                    embed
       *
       * @public
       */
      insertEmbed (index, embed, attributes = {}) {
        if (embed.constructor !== Object) {
          throw new Error('Embed must be an Object')
        }
        const y = this.doc;
        if (y !== null) {
          transact(y, transaction => {
            const pos = findPosition(transaction, this, index);
            insertText(transaction, this, pos, embed, attributes);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.insertEmbed(index, embed, attributes));
        }
      }

      /**
       * Deletes text starting from an index.
       *
       * @param {number} index Index at which to start deleting.
       * @param {number} length The number of characters to remove. Defaults to 1.
       *
       * @public
       */
      delete (index, length) {
        if (length === 0) {
          return
        }
        const y = this.doc;
        if (y !== null) {
          transact(y, transaction => {
            deleteText(transaction, findPosition(transaction, this, index), length);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.delete(index, length));
        }
      }

      /**
       * Assigns properties to a range of text.
       *
       * @param {number} index The position where to start formatting.
       * @param {number} length The amount of characters to assign properties to.
       * @param {TextAttributes} attributes Attribute information to apply on the
       *                                    text.
       *
       * @public
       */
      format (index, length, attributes) {
        if (length === 0) {
          return
        }
        const y = this.doc;
        if (y !== null) {
          transact(y, transaction => {
            const pos = findPosition(transaction, this, index);
            if (pos.right === null) {
              return
            }
            formatText(transaction, this, pos, length, attributes);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.format(index, length, attributes));
        }
      }

      /**
       * Removes an attribute.
       *
       * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
       *
       * @param {String} attributeName The attribute name that is to be removed.
       *
       * @public
       */
      removeAttribute (attributeName) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapDelete(transaction, this, attributeName);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.removeAttribute(attributeName));
        }
      }

      /**
       * Sets or updates an attribute.
       *
       * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
       *
       * @param {String} attributeName The attribute name that is to be set.
       * @param {any} attributeValue The attribute value that is to be set.
       *
       * @public
       */
      setAttribute (attributeName, attributeValue) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapSet(transaction, this, attributeName, attributeValue);
          });
        } else {
          /** @type {Array<function>} */ (this._pending).push(() => this.setAttribute(attributeName, attributeValue));
        }
      }

      /**
       * Returns an attribute value that belongs to the attribute name.
       *
       * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
       *
       * @param {String} attributeName The attribute name that identifies the
       *                               queried value.
       * @return {any} The queried attribute value.
       *
       * @public
       */
      getAttribute (attributeName) {
        return /** @type {any} */ (typeMapGet(this, attributeName))
      }

      /**
       * Returns all attribute name/value pairs in a JSON Object.
       *
       * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
       *
       * @param {Snapshot} [snapshot]
       * @return {Object<string, any>} A JSON Object that describes the attributes.
       *
       * @public
       */
      getAttributes (snapshot) {
        return typeMapGetAll(this)
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       */
      _write (encoder) {
        encoder.writeTypeRef(YTextRefID);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {YText}
     *
     * @private
     * @function
     */
    const readYText = decoder => new YText();

    /**
     * @module YXml
     */

    /**
     * Define the elements to which a set of CSS queries apply.
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors|CSS_Selectors}
     *
     * @example
     *   query = '.classSelector'
     *   query = 'nodeSelector'
     *   query = '#idSelector'
     *
     * @typedef {string} CSS_Selector
     */

    /**
     * Dom filter function.
     *
     * @callback domFilter
     * @param {string} nodeName The nodeName of the element
     * @param {Map} attributes The map of attributes.
     * @return {boolean} Whether to include the Dom node in the YXmlElement.
     */

    /**
     * Represents a subset of the nodes of a YXmlElement / YXmlFragment and a
     * position within them.
     *
     * Can be created with {@link YXmlFragment#createTreeWalker}
     *
     * @public
     * @implements {Iterable<YXmlElement|YXmlText|YXmlElement|YXmlHook>}
     */
    class YXmlTreeWalker {
      /**
       * @param {YXmlFragment | YXmlElement} root
       * @param {function(AbstractType<any>):boolean} [f]
       */
      constructor (root, f = () => true) {
        this._filter = f;
        this._root = root;
        /**
         * @type {Item}
         */
        this._currentNode = /** @type {Item} */ (root._start);
        this._firstCall = true;
      }

      [Symbol.iterator] () {
        return this
      }

      /**
       * Get the next node.
       *
       * @return {IteratorResult<YXmlElement|YXmlText|YXmlHook>} The next node.
       *
       * @public
       */
      next () {
        /**
         * @type {Item|null}
         */
        let n = this._currentNode;
        let type = /** @type {any} */ (n.content).type;
        if (n !== null && (!this._firstCall || n.deleted || !this._filter(type))) { // if first call, we check if we can use the first item
          do {
            type = /** @type {any} */ (n.content).type;
            if (!n.deleted && (type.constructor === YXmlElement || type.constructor === YXmlFragment) && type._start !== null) {
              // walk down in the tree
              n = type._start;
            } else {
              // walk right or up in the tree
              while (n !== null) {
                if (n.right !== null) {
                  n = n.right;
                  break
                } else if (n.parent === this._root) {
                  n = null;
                } else {
                  n = /** @type {AbstractType<any>} */ (n.parent)._item;
                }
              }
            }
          } while (n !== null && (n.deleted || !this._filter(/** @type {ContentType} */ (n.content).type)))
        }
        this._firstCall = false;
        if (n === null) {
          // @ts-ignore
          return { value: undefined, done: true }
        }
        this._currentNode = n;
        return { value: /** @type {any} */ (n.content).type, done: false }
      }
    }

    /**
     * Represents a list of {@link YXmlElement}.and {@link YXmlText} types.
     * A YxmlFragment is similar to a {@link YXmlElement}, but it does not have a
     * nodeName and it does not have attributes. Though it can be bound to a DOM
     * element - in this case the attributes and the nodeName are not shared.
     *
     * @public
     * @extends AbstractType<YXmlEvent>
     */
    class YXmlFragment extends AbstractType {
      constructor () {
        super();
        /**
         * @type {Array<any>|null}
         */
        this._prelimContent = [];
      }

      /**
       * @type {YXmlElement|YXmlText|null}
       */
      get firstChild () {
        const first = this._first;
        return first ? first.content.getContent()[0] : null
      }

      /**
       * Integrate this type into the Yjs instance.
       *
       * * Save this struct in the os
       * * This type is sent to other client
       * * Observer functions are fired
       *
       * @param {Doc} y The Yjs instance
       * @param {Item} item
       */
      _integrate (y, item) {
        super._integrate(y, item);
        this.insert(0, /** @type {Array<any>} */ (this._prelimContent));
        this._prelimContent = null;
      }

      _copy () {
        return new YXmlFragment()
      }

      /**
       * @return {YXmlFragment}
       */
      clone () {
        const el = new YXmlFragment();
        // @ts-ignore
        el.insert(0, el.toArray().map(item => item instanceof AbstractType ? item.clone() : item));
        return el
      }

      get length () {
        return this._prelimContent === null ? this._length : this._prelimContent.length
      }

      /**
       * Create a subtree of childNodes.
       *
       * @example
       * const walker = elem.createTreeWalker(dom => dom.nodeName === 'div')
       * for (let node in walker) {
       *   // `node` is a div node
       *   nop(node)
       * }
       *
       * @param {function(AbstractType<any>):boolean} filter Function that is called on each child element and
       *                          returns a Boolean indicating whether the child
       *                          is to be included in the subtree.
       * @return {YXmlTreeWalker} A subtree and a position within it.
       *
       * @public
       */
      createTreeWalker (filter) {
        return new YXmlTreeWalker(this, filter)
      }

      /**
       * Returns the first YXmlElement that matches the query.
       * Similar to DOM's {@link querySelector}.
       *
       * Query support:
       *   - tagname
       * TODO:
       *   - id
       *   - attribute
       *
       * @param {CSS_Selector} query The query on the children.
       * @return {YXmlElement|YXmlText|YXmlHook|null} The first element that matches the query or null.
       *
       * @public
       */
      querySelector (query) {
        query = query.toUpperCase();
        // @ts-ignore
        const iterator = new YXmlTreeWalker(this, element => element.nodeName && element.nodeName.toUpperCase() === query);
        const next = iterator.next();
        if (next.done) {
          return null
        } else {
          return next.value
        }
      }

      /**
       * Returns all YXmlElements that match the query.
       * Similar to Dom's {@link querySelectorAll}.
       *
       * @todo Does not yet support all queries. Currently only query by tagName.
       *
       * @param {CSS_Selector} query The query on the children
       * @return {Array<YXmlElement|YXmlText|YXmlHook|null>} The elements that match this query.
       *
       * @public
       */
      querySelectorAll (query) {
        query = query.toUpperCase();
        // @ts-ignore
        return Array.from(new YXmlTreeWalker(this, element => element.nodeName && element.nodeName.toUpperCase() === query))
      }

      /**
       * Creates YXmlEvent and calls observers.
       *
       * @param {Transaction} transaction
       * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
       */
      _callObserver (transaction, parentSubs) {
        callTypeObservers(this, transaction, new YXmlEvent(this, parentSubs, transaction));
      }

      /**
       * Get the string representation of all the children of this YXmlFragment.
       *
       * @return {string} The string representation of all children.
       */
      toString () {
        return typeListMap(this, xml => xml.toString()).join('')
      }

      /**
       * @return {string}
       */
      toJSON () {
        return this.toString()
      }

      /**
       * Creates a Dom Element that mirrors this YXmlElement.
       *
       * @param {Document} [_document=document] The document object (you must define
       *                                        this when calling this method in
       *                                        nodejs)
       * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
       *                                             are presented in the DOM
       * @param {any} [binding] You should not set this property. This is
       *                               used if DomBinding wants to create a
       *                               association to the created DOM type.
       * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
       *
       * @public
       */
      toDOM (_document = document, hooks = {}, binding) {
        const fragment = _document.createDocumentFragment();
        if (binding !== undefined) {
          binding._createAssociation(fragment, this);
        }
        typeListForEach(this, xmlType => {
          fragment.insertBefore(xmlType.toDOM(_document, hooks, binding), null);
        });
        return fragment
      }

      /**
       * Inserts new content at an index.
       *
       * @example
       *  // Insert character 'a' at position 0
       *  xml.insert(0, [new Y.XmlText('text')])
       *
       * @param {number} index The index to insert content at
       * @param {Array<YXmlElement|YXmlText>} content The array of content
       */
      insert (index, content) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeListInsertGenerics(transaction, this, index, content);
          });
        } else {
          // @ts-ignore _prelimContent is defined because this is not yet integrated
          this._prelimContent.splice(index, 0, ...content);
        }
      }

      /**
       * Inserts new content at an index.
       *
       * @example
       *  // Insert character 'a' at position 0
       *  xml.insert(0, [new Y.XmlText('text')])
       *
       * @param {null|Item|YXmlElement|YXmlText} ref The index to insert content at
       * @param {Array<YXmlElement|YXmlText>} content The array of content
       */
      insertAfter (ref, content) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            const refItem = (ref && ref instanceof AbstractType) ? ref._item : ref;
            typeListInsertGenericsAfter(transaction, this, refItem, content);
          });
        } else {
          const pc = /** @type {Array<any>} */ (this._prelimContent);
          const index = ref === null ? 0 : pc.findIndex(el => el === ref) + 1;
          if (index === 0 && ref !== null) {
            throw create$2('Reference item not found')
          }
          pc.splice(index, 0, ...content);
        }
      }

      /**
       * Deletes elements starting from an index.
       *
       * @param {number} index Index at which to start deleting elements
       * @param {number} [length=1] The number of elements to remove. Defaults to 1.
       */
      delete (index, length = 1) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeListDelete(transaction, this, index, length);
          });
        } else {
          // @ts-ignore _prelimContent is defined because this is not yet integrated
          this._prelimContent.splice(index, length);
        }
      }

      /**
       * Transforms this YArray to a JavaScript Array.
       *
       * @return {Array<YXmlElement|YXmlText|YXmlHook>}
       */
      toArray () {
        return typeListToArray(this)
      }

      /**
       * Appends content to this YArray.
       *
       * @param {Array<YXmlElement|YXmlText>} content Array of content to append.
       */
      push (content) {
        this.insert(this.length, content);
      }

      /**
       * Preppends content to this YArray.
       *
       * @param {Array<YXmlElement|YXmlText>} content Array of content to preppend.
       */
      unshift (content) {
        this.insert(0, content);
      }

      /**
       * Returns the i-th element from a YArray.
       *
       * @param {number} index The index of the element to return from the YArray
       * @return {YXmlElement|YXmlText}
       */
      get (index) {
        return typeListGet(this, index)
      }

      /**
       * Transforms this YArray to a JavaScript Array.
       *
       * @param {number} [start]
       * @param {number} [end]
       * @return {Array<YXmlElement|YXmlText>}
       */
      slice (start = 0, end = this.length) {
        return typeListSlice(this, start, end)
      }

      /**
       * Transform the properties of this type to binary and write it to an
       * BinaryEncoder.
       *
       * This is called when this Item is sent to a remote peer.
       *
       * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
       */
      _write (encoder) {
        encoder.writeTypeRef(YXmlFragmentRefID);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {YXmlFragment}
     *
     * @private
     * @function
     */
    const readYXmlFragment = decoder => new YXmlFragment();

    /**
     * An YXmlElement imitates the behavior of a
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}.
     *
     * * An YXmlElement has attributes (key value pairs)
     * * An YXmlElement has childElements that must inherit from YXmlElement
     */
    class YXmlElement extends YXmlFragment {
      constructor (nodeName = 'UNDEFINED') {
        super();
        this.nodeName = nodeName;
        /**
         * @type {Map<string, any>|null}
         */
        this._prelimAttrs = new Map();
      }

      /**
       * @type {YXmlElement|YXmlText|null}
       */
      get nextSibling () {
        const n = this._item ? this._item.next : null;
        return n ? /** @type {YXmlElement|YXmlText} */ (/** @type {ContentType} */ (n.content).type) : null
      }

      /**
       * @type {YXmlElement|YXmlText|null}
       */
      get prevSibling () {
        const n = this._item ? this._item.prev : null;
        return n ? /** @type {YXmlElement|YXmlText} */ (/** @type {ContentType} */ (n.content).type) : null
      }

      /**
       * Integrate this type into the Yjs instance.
       *
       * * Save this struct in the os
       * * This type is sent to other client
       * * Observer functions are fired
       *
       * @param {Doc} y The Yjs instance
       * @param {Item} item
       */
      _integrate (y, item) {
        super._integrate(y, item)
        ;(/** @type {Map<string, any>} */ (this._prelimAttrs)).forEach((value, key) => {
          this.setAttribute(key, value);
        });
        this._prelimAttrs = null;
      }

      /**
       * Creates an Item with the same effect as this Item (without position effect)
       *
       * @return {YXmlElement}
       */
      _copy () {
        return new YXmlElement(this.nodeName)
      }

      /**
       * @return {YXmlElement}
       */
      clone () {
        const el = new YXmlElement(this.nodeName);
        const attrs = this.getAttributes();
        for (const key in attrs) {
          el.setAttribute(key, attrs[key]);
        }
        // @ts-ignore
        el.insert(0, el.toArray().map(item => item instanceof AbstractType ? item.clone() : item));
        return el
      }

      /**
       * Returns the XML serialization of this YXmlElement.
       * The attributes are ordered by attribute-name, so you can easily use this
       * method to compare YXmlElements
       *
       * @return {string} The string representation of this type.
       *
       * @public
       */
      toString () {
        const attrs = this.getAttributes();
        const stringBuilder = [];
        const keys = [];
        for (const key in attrs) {
          keys.push(key);
        }
        keys.sort();
        const keysLen = keys.length;
        for (let i = 0; i < keysLen; i++) {
          const key = keys[i];
          stringBuilder.push(key + '="' + attrs[key] + '"');
        }
        const nodeName = this.nodeName.toLocaleLowerCase();
        const attrsString = stringBuilder.length > 0 ? ' ' + stringBuilder.join(' ') : '';
        return `<${nodeName}${attrsString}>${super.toString()}</${nodeName}>`
      }

      /**
       * Removes an attribute from this YXmlElement.
       *
       * @param {String} attributeName The attribute name that is to be removed.
       *
       * @public
       */
      removeAttribute (attributeName) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapDelete(transaction, this, attributeName);
          });
        } else {
          /** @type {Map<string,any>} */ (this._prelimAttrs).delete(attributeName);
        }
      }

      /**
       * Sets or updates an attribute.
       *
       * @param {String} attributeName The attribute name that is to be set.
       * @param {String} attributeValue The attribute value that is to be set.
       *
       * @public
       */
      setAttribute (attributeName, attributeValue) {
        if (this.doc !== null) {
          transact(this.doc, transaction => {
            typeMapSet(transaction, this, attributeName, attributeValue);
          });
        } else {
          /** @type {Map<string, any>} */ (this._prelimAttrs).set(attributeName, attributeValue);
        }
      }

      /**
       * Returns an attribute value that belongs to the attribute name.
       *
       * @param {String} attributeName The attribute name that identifies the
       *                               queried value.
       * @return {String} The queried attribute value.
       *
       * @public
       */
      getAttribute (attributeName) {
        return /** @type {any} */ (typeMapGet(this, attributeName))
      }

      /**
       * Returns all attribute name/value pairs in a JSON Object.
       *
       * @param {Snapshot} [snapshot]
       * @return {Object<string, any>} A JSON Object that describes the attributes.
       *
       * @public
       */
      getAttributes (snapshot) {
        return typeMapGetAll(this)
      }

      /**
       * Creates a Dom Element that mirrors this YXmlElement.
       *
       * @param {Document} [_document=document] The document object (you must define
       *                                        this when calling this method in
       *                                        nodejs)
       * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
       *                                             are presented in the DOM
       * @param {any} [binding] You should not set this property. This is
       *                               used if DomBinding wants to create a
       *                               association to the created DOM type.
       * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
       *
       * @public
       */
      toDOM (_document = document, hooks = {}, binding) {
        const dom = _document.createElement(this.nodeName);
        const attrs = this.getAttributes();
        for (const key in attrs) {
          dom.setAttribute(key, attrs[key]);
        }
        typeListForEach(this, yxml => {
          dom.appendChild(yxml.toDOM(_document, hooks, binding));
        });
        if (binding !== undefined) {
          binding._createAssociation(dom, this);
        }
        return dom
      }

      /**
       * Transform the properties of this type to binary and write it to an
       * BinaryEncoder.
       *
       * This is called when this Item is sent to a remote peer.
       *
       * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
       */
      _write (encoder) {
        encoder.writeTypeRef(YXmlElementRefID);
        encoder.writeKey(this.nodeName);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {YXmlElement}
     *
     * @function
     */
    const readYXmlElement = decoder => new YXmlElement(decoder.readKey());

    /**
     * An Event that describes changes on a YXml Element or Yxml Fragment
     */
    class YXmlEvent extends YEvent {
      /**
       * @param {YXmlElement|YXmlText|YXmlFragment} target The target on which the event is created.
       * @param {Set<string|null>} subs The set of changed attributes. `null` is included if the
       *                   child list changed.
       * @param {Transaction} transaction The transaction instance with wich the
       *                                  change was created.
       */
      constructor (target, subs, transaction) {
        super(target, transaction);
        /**
         * Whether the children changed.
         * @type {Boolean}
         * @private
         */
        this.childListChanged = false;
        /**
         * Set of all changed attributes.
         * @type {Set<string>}
         */
        this.attributesChanged = new Set();
        subs.forEach((sub) => {
          if (sub === null) {
            this.childListChanged = true;
          } else {
            this.attributesChanged.add(sub);
          }
        });
      }
    }

    /**
     * You can manage binding to a custom type with YXmlHook.
     *
     * @extends {YMap<any>}
     */
    class YXmlHook extends YMap {
      /**
       * @param {string} hookName nodeName of the Dom Node.
       */
      constructor (hookName) {
        super();
        /**
         * @type {string}
         */
        this.hookName = hookName;
      }

      /**
       * Creates an Item with the same effect as this Item (without position effect)
       */
      _copy () {
        return new YXmlHook(this.hookName)
      }

      /**
       * @return {YXmlHook}
       */
      clone () {
        const el = new YXmlHook(this.hookName);
        this.forEach((value, key) => {
          el.set(key, value);
        });
        return el
      }

      /**
       * Creates a Dom Element that mirrors this YXmlElement.
       *
       * @param {Document} [_document=document] The document object (you must define
       *                                        this when calling this method in
       *                                        nodejs)
       * @param {Object.<string, any>} [hooks] Optional property to customize how hooks
       *                                             are presented in the DOM
       * @param {any} [binding] You should not set this property. This is
       *                               used if DomBinding wants to create a
       *                               association to the created DOM type
       * @return {Element} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
       *
       * @public
       */
      toDOM (_document = document, hooks = {}, binding) {
        const hook = hooks[this.hookName];
        let dom;
        if (hook !== undefined) {
          dom = hook.createDom(this);
        } else {
          dom = document.createElement(this.hookName);
        }
        dom.setAttribute('data-yjs-hook', this.hookName);
        if (binding !== undefined) {
          binding._createAssociation(dom, this);
        }
        return dom
      }

      /**
       * Transform the properties of this type to binary and write it to an
       * BinaryEncoder.
       *
       * This is called when this Item is sent to a remote peer.
       *
       * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
       */
      _write (encoder) {
        encoder.writeTypeRef(YXmlHookRefID);
        encoder.writeKey(this.hookName);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {YXmlHook}
     *
     * @private
     * @function
     */
    const readYXmlHook = decoder =>
      new YXmlHook(decoder.readKey());

    /**
     * Represents text in a Dom Element. In the future this type will also handle
     * simple formatting information like bold and italic.
     */
    class YXmlText extends YText {
      /**
       * @type {YXmlElement|YXmlText|null}
       */
      get nextSibling () {
        const n = this._item ? this._item.next : null;
        return n ? /** @type {YXmlElement|YXmlText} */ (/** @type {ContentType} */ (n.content).type) : null
      }

      /**
       * @type {YXmlElement|YXmlText|null}
       */
      get prevSibling () {
        const n = this._item ? this._item.prev : null;
        return n ? /** @type {YXmlElement|YXmlText} */ (/** @type {ContentType} */ (n.content).type) : null
      }

      _copy () {
        return new YXmlText()
      }

      /**
       * @return {YXmlText}
       */
      clone () {
        const text = new YXmlText();
        text.applyDelta(this.toDelta());
        return text
      }

      /**
       * Creates a Dom Element that mirrors this YXmlText.
       *
       * @param {Document} [_document=document] The document object (you must define
       *                                        this when calling this method in
       *                                        nodejs)
       * @param {Object<string, any>} [hooks] Optional property to customize how hooks
       *                                             are presented in the DOM
       * @param {any} [binding] You should not set this property. This is
       *                               used if DomBinding wants to create a
       *                               association to the created DOM type.
       * @return {Text} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
       *
       * @public
       */
      toDOM (_document = document, hooks, binding) {
        const dom = _document.createTextNode(this.toString());
        if (binding !== undefined) {
          binding._createAssociation(dom, this);
        }
        return dom
      }

      toString () {
        // @ts-ignore
        return this.toDelta().map(delta => {
          const nestedNodes = [];
          for (const nodeName in delta.attributes) {
            const attrs = [];
            for (const key in delta.attributes[nodeName]) {
              attrs.push({ key, value: delta.attributes[nodeName][key] });
            }
            // sort attributes to get a unique order
            attrs.sort((a, b) => a.key < b.key ? -1 : 1);
            nestedNodes.push({ nodeName, attrs });
          }
          // sort node order to get a unique order
          nestedNodes.sort((a, b) => a.nodeName < b.nodeName ? -1 : 1);
          // now convert to dom string
          let str = '';
          for (let i = 0; i < nestedNodes.length; i++) {
            const node = nestedNodes[i];
            str += `<${node.nodeName}`;
            for (let j = 0; j < node.attrs.length; j++) {
              const attr = node.attrs[j];
              str += ` ${attr.key}="${attr.value}"`;
            }
            str += '>';
          }
          str += delta.insert;
          for (let i = nestedNodes.length - 1; i >= 0; i--) {
            str += `</${nestedNodes[i].nodeName}>`;
          }
          return str
        }).join('')
      }

      /**
       * @return {string}
       */
      toJSON () {
        return this.toString()
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       */
      _write (encoder) {
        encoder.writeTypeRef(YXmlTextRefID);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {YXmlText}
     *
     * @private
     * @function
     */
    const readYXmlText = decoder => new YXmlText();

    class AbstractStruct {
      /**
       * @param {ID} id
       * @param {number} length
       */
      constructor (id, length) {
        this.id = id;
        this.length = length;
      }

      /**
       * @type {boolean}
       */
      get deleted () {
        throw methodUnimplemented()
      }

      /**
       * Merge this struct with the item to the right.
       * This method is already assuming that `this.id.clock + this.length === this.id.clock`.
       * Also this method does *not* remove right from StructStore!
       * @param {AbstractStruct} right
       * @return {boolean} wether this merged with right
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
       * @param {number} offset
       * @param {number} encodingRef
       */
      write (encoder, offset, encodingRef) {
        throw methodUnimplemented()
      }

      /**
       * @param {Transaction} transaction
       * @param {number} offset
       */
      integrate (transaction, offset) {
        throw methodUnimplemented()
      }
    }

    const structGCRefNumber = 0;

    /**
     * @private
     */
    class GC extends AbstractStruct {
      get deleted () {
        return true
      }

      delete () {}

      /**
       * @param {GC} right
       * @return {boolean}
       */
      mergeWith (right) {
        this.length += right.length;
        return true
      }

      /**
       * @param {Transaction} transaction
       * @param {number} offset
       */
      integrate (transaction, offset) {
        if (offset > 0) {
          this.id.clock += offset;
          this.length -= offset;
        }
        addStruct(transaction.doc.store, this);
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeInfo(structGCRefNumber);
        encoder.writeLen(this.length - offset);
      }

      /**
       * @param {Transaction} transaction
       * @param {StructStore} store
       * @return {null | number}
       */
      getMissing (transaction, store) {
        return null
      }
    }

    class ContentBinary {
      /**
       * @param {Uint8Array} content
       */
      constructor (content) {
        this.content = content;
      }

      /**
       * @return {number}
       */
      getLength () {
        return 1
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return [this.content]
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentBinary}
       */
      copy () {
        return new ContentBinary(this.content)
      }

      /**
       * @param {number} offset
       * @return {ContentBinary}
       */
      splice (offset) {
        throw methodUnimplemented()
      }

      /**
       * @param {ContentBinary} right
       * @return {boolean}
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {}
      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeBuf(this.content);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 3
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentBinary}
     */
    const readContentBinary = decoder => new ContentBinary(decoder.readBuf());

    class ContentDeleted {
      /**
       * @param {number} len
       */
      constructor (len) {
        this.len = len;
      }

      /**
       * @return {number}
       */
      getLength () {
        return this.len
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return []
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return false
      }

      /**
       * @return {ContentDeleted}
       */
      copy () {
        return new ContentDeleted(this.len)
      }

      /**
       * @param {number} offset
       * @return {ContentDeleted}
       */
      splice (offset) {
        const right = new ContentDeleted(this.len - offset);
        this.len = offset;
        return right
      }

      /**
       * @param {ContentDeleted} right
       * @return {boolean}
       */
      mergeWith (right) {
        this.len += right.len;
        return true
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {
        addToDeleteSet(transaction.deleteSet, item.id.client, item.id.clock, this.len);
        item.markDeleted();
      }

      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeLen(this.len - offset);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 1
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentDeleted}
     */
    const readContentDeleted = decoder => new ContentDeleted(decoder.readLen());

    /**
     * @private
     */
    class ContentDoc {
      /**
       * @param {Doc} doc
       */
      constructor (doc) {
        if (doc._item) {
          console.error('This document was already integrated as a sub-document. You should create a second instance instead with the same guid.');
        }
        /**
         * @type {Doc}
         */
        this.doc = doc;
        /**
         * @type {any}
         */
        const opts = {};
        this.opts = opts;
        if (!doc.gc) {
          opts.gc = false;
        }
        if (doc.autoLoad) {
          opts.autoLoad = true;
        }
        if (doc.meta !== null) {
          opts.meta = doc.meta;
        }
      }

      /**
       * @return {number}
       */
      getLength () {
        return 1
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return [this.doc]
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentDoc}
       */
      copy () {
        return new ContentDoc(this.doc)
      }

      /**
       * @param {number} offset
       * @return {ContentDoc}
       */
      splice (offset) {
        throw methodUnimplemented()
      }

      /**
       * @param {ContentDoc} right
       * @return {boolean}
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {
        // this needs to be reflected in doc.destroy as well
        this.doc._item = item;
        transaction.subdocsAdded.add(this.doc);
        if (this.doc.shouldLoad) {
          transaction.subdocsLoaded.add(this.doc);
        }
      }

      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {
        if (transaction.subdocsAdded.has(this.doc)) {
          transaction.subdocsAdded.delete(this.doc);
        } else {
          transaction.subdocsRemoved.add(this.doc);
        }
      }

      /**
       * @param {StructStore} store
       */
      gc (store) { }

      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeString(this.doc.guid);
        encoder.writeAny(this.opts);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 9
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentDoc}
     */
    const readContentDoc = decoder => new ContentDoc(new Doc({ guid: decoder.readString(), ...decoder.readAny() }));

    /**
     * @private
     */
    class ContentEmbed {
      /**
       * @param {Object} embed
       */
      constructor (embed) {
        this.embed = embed;
      }

      /**
       * @return {number}
       */
      getLength () {
        return 1
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return [this.embed]
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentEmbed}
       */
      copy () {
        return new ContentEmbed(this.embed)
      }

      /**
       * @param {number} offset
       * @return {ContentEmbed}
       */
      splice (offset) {
        throw methodUnimplemented()
      }

      /**
       * @param {ContentEmbed} right
       * @return {boolean}
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {}
      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeJSON(this.embed);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 5
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentEmbed}
     */
    const readContentEmbed = decoder => new ContentEmbed(decoder.readJSON());

    /**
     * @private
     */
    class ContentFormat {
      /**
       * @param {string} key
       * @param {Object} value
       */
      constructor (key, value) {
        this.key = key;
        this.value = value;
      }

      /**
       * @return {number}
       */
      getLength () {
        return 1
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return []
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return false
      }

      /**
       * @return {ContentFormat}
       */
      copy () {
        return new ContentFormat(this.key, this.value)
      }

      /**
       * @param {number} offset
       * @return {ContentFormat}
       */
      splice (offset) {
        throw methodUnimplemented()
      }

      /**
       * @param {ContentFormat} right
       * @return {boolean}
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {
        // @todo searchmarker are currently unsupported for rich text documents
        /** @type {AbstractType<any>} */ (item.parent)._searchMarker = null;
      }

      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeKey(this.key);
        encoder.writeJSON(this.value);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 6
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentFormat}
     */
    const readContentFormat = decoder => new ContentFormat(decoder.readString(), decoder.readJSON());

    /**
     * @private
     */
    class ContentJSON {
      /**
       * @param {Array<any>} arr
       */
      constructor (arr) {
        /**
         * @type {Array<any>}
         */
        this.arr = arr;
      }

      /**
       * @return {number}
       */
      getLength () {
        return this.arr.length
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return this.arr
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentJSON}
       */
      copy () {
        return new ContentJSON(this.arr)
      }

      /**
       * @param {number} offset
       * @return {ContentJSON}
       */
      splice (offset) {
        const right = new ContentJSON(this.arr.slice(offset));
        this.arr = this.arr.slice(0, offset);
        return right
      }

      /**
       * @param {ContentJSON} right
       * @return {boolean}
       */
      mergeWith (right) {
        this.arr = this.arr.concat(right.arr);
        return true
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {}
      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        const len = this.arr.length;
        encoder.writeLen(len - offset);
        for (let i = offset; i < len; i++) {
          const c = this.arr[i];
          encoder.writeString(c === undefined ? 'undefined' : JSON.stringify(c));
        }
      }

      /**
       * @return {number}
       */
      getRef () {
        return 2
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentJSON}
     */
    const readContentJSON = decoder => {
      const len = decoder.readLen();
      const cs = [];
      for (let i = 0; i < len; i++) {
        const c = decoder.readString();
        if (c === 'undefined') {
          cs.push(undefined);
        } else {
          cs.push(JSON.parse(c));
        }
      }
      return new ContentJSON(cs)
    };

    class ContentAny {
      /**
       * @param {Array<any>} arr
       */
      constructor (arr) {
        /**
         * @type {Array<any>}
         */
        this.arr = arr;
      }

      /**
       * @return {number}
       */
      getLength () {
        return this.arr.length
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return this.arr
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentAny}
       */
      copy () {
        return new ContentAny(this.arr)
      }

      /**
       * @param {number} offset
       * @return {ContentAny}
       */
      splice (offset) {
        const right = new ContentAny(this.arr.slice(offset));
        this.arr = this.arr.slice(0, offset);
        return right
      }

      /**
       * @param {ContentAny} right
       * @return {boolean}
       */
      mergeWith (right) {
        this.arr = this.arr.concat(right.arr);
        return true
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {}
      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        const len = this.arr.length;
        encoder.writeLen(len - offset);
        for (let i = offset; i < len; i++) {
          const c = this.arr[i];
          encoder.writeAny(c);
        }
      }

      /**
       * @return {number}
       */
      getRef () {
        return 8
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentAny}
     */
    const readContentAny = decoder => {
      const len = decoder.readLen();
      const cs = [];
      for (let i = 0; i < len; i++) {
        cs.push(decoder.readAny());
      }
      return new ContentAny(cs)
    };

    /**
     * @private
     */
    class ContentString {
      /**
       * @param {string} str
       */
      constructor (str) {
        /**
         * @type {string}
         */
        this.str = str;
      }

      /**
       * @return {number}
       */
      getLength () {
        return this.str.length
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return this.str.split('')
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentString}
       */
      copy () {
        return new ContentString(this.str)
      }

      /**
       * @param {number} offset
       * @return {ContentString}
       */
      splice (offset) {
        const right = new ContentString(this.str.slice(offset));
        this.str = this.str.slice(0, offset);

        // Prevent encoding invalid documents because of splitting of surrogate pairs: https://github.com/yjs/yjs/issues/248
        const firstCharCode = this.str.charCodeAt(offset - 1);
        if (firstCharCode >= 0xD800 && firstCharCode <= 0xDBFF) {
          // Last character of the left split is the start of a surrogate utf16/ucs2 pair.
          // We don't support splitting of surrogate pairs because this may lead to invalid documents.
          // Replace the invalid character with a unicode replacement character (� / U+FFFD)
          this.str = this.str.slice(0, offset - 1) + '�';
          // replace right as well
          right.str = '�' + right.str.slice(1);
        }
        return right
      }

      /**
       * @param {ContentString} right
       * @return {boolean}
       */
      mergeWith (right) {
        this.str += right.str;
        return true
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {}
      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {}
      /**
       * @param {StructStore} store
       */
      gc (store) {}
      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        encoder.writeString(offset === 0 ? this.str : this.str.slice(offset));
      }

      /**
       * @return {number}
       */
      getRef () {
        return 4
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentString}
     */
    const readContentString = decoder => new ContentString(decoder.readString());

    /**
     * @type {Array<function(AbstractUpdateDecoder):AbstractType<any>>}
     * @private
     */
    const typeRefs = [
      readYArray,
      readYMap,
      readYText,
      readYXmlElement,
      readYXmlFragment,
      readYXmlHook,
      readYXmlText
    ];

    const YArrayRefID = 0;
    const YMapRefID = 1;
    const YTextRefID = 2;
    const YXmlElementRefID = 3;
    const YXmlFragmentRefID = 4;
    const YXmlHookRefID = 5;
    const YXmlTextRefID = 6;

    /**
     * @private
     */
    class ContentType {
      /**
       * @param {AbstractType<YEvent>} type
       */
      constructor (type) {
        /**
         * @type {AbstractType<any>}
         */
        this.type = type;
      }

      /**
       * @return {number}
       */
      getLength () {
        return 1
      }

      /**
       * @return {Array<any>}
       */
      getContent () {
        return [this.type]
      }

      /**
       * @return {boolean}
       */
      isCountable () {
        return true
      }

      /**
       * @return {ContentType}
       */
      copy () {
        return new ContentType(this.type._copy())
      }

      /**
       * @param {number} offset
       * @return {ContentType}
       */
      splice (offset) {
        throw methodUnimplemented()
      }

      /**
       * @param {ContentType} right
       * @return {boolean}
       */
      mergeWith (right) {
        return false
      }

      /**
       * @param {Transaction} transaction
       * @param {Item} item
       */
      integrate (transaction, item) {
        this.type._integrate(transaction.doc, item);
      }

      /**
       * @param {Transaction} transaction
       */
      delete (transaction) {
        let item = this.type._start;
        while (item !== null) {
          if (!item.deleted) {
            item.delete(transaction);
          } else {
            // Whis will be gc'd later and we want to merge it if possible
            // We try to merge all deleted items after each transaction,
            // but we have no knowledge about that this needs to be merged
            // since it is not in transaction.ds. Hence we add it to transaction._mergeStructs
            transaction._mergeStructs.push(item);
          }
          item = item.right;
        }
        this.type._map.forEach(item => {
          if (!item.deleted) {
            item.delete(transaction);
          } else {
            // same as above
            transaction._mergeStructs.push(item);
          }
        });
        transaction.changed.delete(this.type);
      }

      /**
       * @param {StructStore} store
       */
      gc (store) {
        let item = this.type._start;
        while (item !== null) {
          item.gc(store, true);
          item = item.right;
        }
        this.type._start = null;
        this.type._map.forEach(/** @param {Item | null} item */ (item) => {
          while (item !== null) {
            item.gc(store, true);
            item = item.left;
          }
        });
        this.type._map = new Map();
      }

      /**
       * @param {AbstractUpdateEncoder} encoder
       * @param {number} offset
       */
      write (encoder, offset) {
        this.type._write(encoder);
      }

      /**
       * @return {number}
       */
      getRef () {
        return 7
      }
    }

    /**
     * @private
     *
     * @param {AbstractUpdateDecoder} decoder
     * @return {ContentType}
     */
    const readContentType = decoder => new ContentType(typeRefs[decoder.readTypeRef()](decoder));

    /**
     * @todo This should return several items
     *
     * @param {StructStore} store
     * @param {ID} id
     * @return {{item:Item, diff:number}}
     */
    const followRedone = (store, id) => {
      /**
       * @type {ID|null}
       */
      let nextID = id;
      let diff = 0;
      let item;
      do {
        if (diff > 0) {
          nextID = createID(nextID.client, nextID.clock + diff);
        }
        item = getItem(store, nextID);
        diff = nextID.clock - item.id.clock;
        nextID = item.redone;
      } while (nextID !== null && item instanceof Item)
      return {
        item, diff
      }
    };

    /**
     * Make sure that neither item nor any of its parents is ever deleted.
     *
     * This property does not persist when storing it into a database or when
     * sending it to other peers
     *
     * @param {Item|null} item
     * @param {boolean} keep
     */
    const keepItem = (item, keep) => {
      while (item !== null && item.keep !== keep) {
        item.keep = keep;
        item = /** @type {AbstractType<any>} */ (item.parent)._item;
      }
    };

    /**
     * Split leftItem into two items
     * @param {Transaction} transaction
     * @param {Item} leftItem
     * @param {number} diff
     * @return {Item}
     *
     * @function
     * @private
     */
    const splitItem = (transaction, leftItem, diff) => {
      // create rightItem
      const { client, clock } = leftItem.id;
      const rightItem = new Item(
        createID(client, clock + diff),
        leftItem,
        createID(client, clock + diff - 1),
        leftItem.right,
        leftItem.rightOrigin,
        leftItem.parent,
        leftItem.parentSub,
        leftItem.content.splice(diff)
      );
      if (leftItem.deleted) {
        rightItem.markDeleted();
      }
      if (leftItem.keep) {
        rightItem.keep = true;
      }
      if (leftItem.redone !== null) {
        rightItem.redone = createID(leftItem.redone.client, leftItem.redone.clock + diff);
      }
      // update left (do not set leftItem.rightOrigin as it will lead to problems when syncing)
      leftItem.right = rightItem;
      // update right
      if (rightItem.right !== null) {
        rightItem.right.left = rightItem;
      }
      // right is more specific.
      transaction._mergeStructs.push(rightItem);
      // update parent._map
      if (rightItem.parentSub !== null && rightItem.right === null) {
        /** @type {AbstractType<any>} */ (rightItem.parent)._map.set(rightItem.parentSub, rightItem);
      }
      leftItem.length = diff;
      return rightItem
    };

    /**
     * Redoes the effect of this operation.
     *
     * @param {Transaction} transaction The Yjs instance.
     * @param {Item} item
     * @param {Set<Item>} redoitems
     *
     * @return {Item|null}
     *
     * @private
     */
    const redoItem = (transaction, item, redoitems) => {
      const doc = transaction.doc;
      const store = doc.store;
      const ownClientID = doc.clientID;
      const redone = item.redone;
      if (redone !== null) {
        return getItemCleanStart(transaction, redone)
      }
      let parentItem = /** @type {AbstractType<any>} */ (item.parent)._item;
      /**
       * @type {Item|null}
       */
      let left;
      /**
       * @type {Item|null}
       */
      let right;
      if (item.parentSub === null) {
        // Is an array item. Insert at the old position
        left = item.left;
        right = item;
      } else {
        // Is a map item. Insert as current value
        left = item;
        while (left.right !== null) {
          left = left.right;
          if (left.id.client !== ownClientID) {
            // It is not possible to redo this item because it conflicts with a
            // change from another client
            return null
          }
        }
        if (left.right !== null) {
          left = /** @type {Item} */ (/** @type {AbstractType<any>} */ (item.parent)._map.get(item.parentSub));
        }
        right = null;
      }
      // make sure that parent is redone
      if (parentItem !== null && parentItem.deleted === true && parentItem.redone === null) {
        // try to undo parent if it will be undone anyway
        if (!redoitems.has(parentItem) || redoItem(transaction, parentItem, redoitems) === null) {
          return null
        }
      }
      if (parentItem !== null && parentItem.redone !== null) {
        while (parentItem.redone !== null) {
          parentItem = getItemCleanStart(transaction, parentItem.redone);
        }
        // find next cloned_redo items
        while (left !== null) {
          /**
           * @type {Item|null}
           */
          let leftTrace = left;
          // trace redone until parent matches
          while (leftTrace !== null && /** @type {AbstractType<any>} */ (leftTrace.parent)._item !== parentItem) {
            leftTrace = leftTrace.redone === null ? null : getItemCleanStart(transaction, leftTrace.redone);
          }
          if (leftTrace !== null && /** @type {AbstractType<any>} */ (leftTrace.parent)._item === parentItem) {
            left = leftTrace;
            break
          }
          left = left.left;
        }
        while (right !== null) {
          /**
           * @type {Item|null}
           */
          let rightTrace = right;
          // trace redone until parent matches
          while (rightTrace !== null && /** @type {AbstractType<any>} */ (rightTrace.parent)._item !== parentItem) {
            rightTrace = rightTrace.redone === null ? null : getItemCleanStart(transaction, rightTrace.redone);
          }
          if (rightTrace !== null && /** @type {AbstractType<any>} */ (rightTrace.parent)._item === parentItem) {
            right = rightTrace;
            break
          }
          right = right.right;
        }
      }
      const nextClock = getState(store, ownClientID);
      const nextId = createID(ownClientID, nextClock);
      const redoneItem = new Item(
        nextId,
        left, left && left.lastId,
        right, right && right.id,
        parentItem === null ? item.parent : /** @type {ContentType} */ (parentItem.content).type,
        item.parentSub,
        item.content.copy()
      );
      item.redone = nextId;
      keepItem(redoneItem, true);
      redoneItem.integrate(transaction, 0);
      return redoneItem
    };

    /**
     * Abstract class that represents any content.
     */
    class Item extends AbstractStruct {
      /**
       * @param {ID} id
       * @param {Item | null} left
       * @param {ID | null} origin
       * @param {Item | null} right
       * @param {ID | null} rightOrigin
       * @param {AbstractType<any>|ID|null} parent Is a type if integrated, is null if it is possible to copy parent from left or right, is ID before integration to search for it.
       * @param {string | null} parentSub
       * @param {AbstractContent} content
       */
      constructor (id, left, origin, right, rightOrigin, parent, parentSub, content) {
        super(id, content.getLength());
        /**
         * The item that was originally to the left of this item.
         * @type {ID | null}
         */
        this.origin = origin;
        /**
         * The item that is currently to the left of this item.
         * @type {Item | null}
         */
        this.left = left;
        /**
         * The item that is currently to the right of this item.
         * @type {Item | null}
         */
        this.right = right;
        /**
         * The item that was originally to the right of this item.
         * @type {ID | null}
         */
        this.rightOrigin = rightOrigin;
        /**
         * @type {AbstractType<any>|ID|null}
         */
        this.parent = parent;
        /**
         * If the parent refers to this item with some kind of key (e.g. YMap, the
         * key is specified here. The key is then used to refer to the list in which
         * to insert this item. If `parentSub = null` type._start is the list in
         * which to insert to. Otherwise it is `parent._map`.
         * @type {String | null}
         */
        this.parentSub = parentSub;
        /**
         * If this type's effect is reundone this type refers to the type that undid
         * this operation.
         * @type {ID | null}
         */
        this.redone = null;
        /**
         * @type {AbstractContent}
         */
        this.content = content;
        /**
         * bit1: keep
         * bit2: countable
         * bit3: deleted
         * bit4: mark - mark node as fast-search-marker
         * @type {number} byte
         */
        this.info = this.content.isCountable() ? BIT2 : 0;
      }

      /**
       * This is used to mark the item as an indexed fast-search marker
       *
       * @type {boolean}
       */
      set marker (isMarked) {
        if (((this.info & BIT4) > 0) !== isMarked) {
          this.info ^= BIT4;
        }
      }

      get marker () {
        return (this.info & BIT4) > 0
      }

      /**
       * If true, do not garbage collect this Item.
       */
      get keep () {
        return (this.info & BIT1) > 0
      }

      set keep (doKeep) {
        if (this.keep !== doKeep) {
          this.info ^= BIT1;
        }
      }

      get countable () {
        return (this.info & BIT2) > 0
      }

      /**
       * Whether this item was deleted or not.
       * @type {Boolean}
       */
      get deleted () {
        return (this.info & BIT3) > 0
      }

      set deleted (doDelete) {
        if (this.deleted !== doDelete) {
          this.info ^= BIT3;
        }
      }

      markDeleted () {
        this.info |= BIT3;
      }

      /**
       * Return the creator clientID of the missing op or define missing items and return null.
       *
       * @param {Transaction} transaction
       * @param {StructStore} store
       * @return {null | number}
       */
      getMissing (transaction, store) {
        if (this.origin && this.origin.client !== this.id.client && this.origin.clock >= getState(store, this.origin.client)) {
          return this.origin.client
        }
        if (this.rightOrigin && this.rightOrigin.client !== this.id.client && this.rightOrigin.clock >= getState(store, this.rightOrigin.client)) {
          return this.rightOrigin.client
        }
        if (this.parent && this.parent.constructor === ID && this.id.client !== this.parent.client && this.parent.clock >= getState(store, this.parent.client)) {
          return this.parent.client
        }

        // We have all missing ids, now find the items

        if (this.origin) {
          this.left = getItemCleanEnd(transaction, store, this.origin);
          this.origin = this.left.lastId;
        }
        if (this.rightOrigin) {
          this.right = getItemCleanStart(transaction, this.rightOrigin);
          this.rightOrigin = this.right.id;
        }
        if ((this.left && this.left.constructor === GC) || (this.right && this.right.constructor === GC)) {
          this.parent = null;
        }
        // only set parent if this shouldn't be garbage collected
        if (!this.parent) {
          if (this.left && this.left.constructor === Item) {
            this.parent = this.left.parent;
            this.parentSub = this.left.parentSub;
          }
          if (this.right && this.right.constructor === Item) {
            this.parent = this.right.parent;
            this.parentSub = this.right.parentSub;
          }
        } else if (this.parent.constructor === ID) {
          const parentItem = getItem(store, this.parent);
          if (parentItem.constructor === GC) {
            this.parent = null;
          } else {
            this.parent = /** @type {ContentType} */ (parentItem.content).type;
          }
        }
        return null
      }

      /**
       * @param {Transaction} transaction
       * @param {number} offset
       */
      integrate (transaction, offset) {
        if (offset > 0) {
          this.id.clock += offset;
          this.left = getItemCleanEnd(transaction, transaction.doc.store, createID(this.id.client, this.id.clock - 1));
          this.origin = this.left.lastId;
          this.content = this.content.splice(offset);
          this.length -= offset;
        }

        if (this.parent) {
          if ((!this.left && (!this.right || this.right.left !== null)) || (this.left && this.left.right !== this.right)) {
            /**
             * @type {Item|null}
             */
            let left = this.left;

            /**
             * @type {Item|null}
             */
            let o;
            // set o to the first conflicting item
            if (left !== null) {
              o = left.right;
            } else if (this.parentSub !== null) {
              o = /** @type {AbstractType<any>} */ (this.parent)._map.get(this.parentSub) || null;
              while (o !== null && o.left !== null) {
                o = o.left;
              }
            } else {
              o = /** @type {AbstractType<any>} */ (this.parent)._start;
            }
            // TODO: use something like DeleteSet here (a tree implementation would be best)
            // @todo use global set definitions
            /**
             * @type {Set<Item>}
             */
            const conflictingItems = new Set();
            /**
             * @type {Set<Item>}
             */
            const itemsBeforeOrigin = new Set();
            // Let c in conflictingItems, b in itemsBeforeOrigin
            // ***{origin}bbbb{this}{c,b}{c,b}{o}***
            // Note that conflictingItems is a subset of itemsBeforeOrigin
            while (o !== null && o !== this.right) {
              itemsBeforeOrigin.add(o);
              conflictingItems.add(o);
              if (compareIDs(this.origin, o.origin)) {
                // case 1
                if (o.id.client < this.id.client) {
                  left = o;
                  conflictingItems.clear();
                } else if (compareIDs(this.rightOrigin, o.rightOrigin)) {
                  // this and o are conflicting and point to the same integration points. The id decides which item comes first.
                  // Since this is to the left of o, we can break here
                  break
                } // else, o might be integrated before an item that this conflicts with. If so, we will find it in the next iterations
              } else if (o.origin !== null && itemsBeforeOrigin.has(getItem(transaction.doc.store, o.origin))) { // use getItem instead of getItemCleanEnd because we don't want / need to split items.
                // case 2
                if (!conflictingItems.has(getItem(transaction.doc.store, o.origin))) {
                  left = o;
                  conflictingItems.clear();
                }
              } else {
                break
              }
              o = o.right;
            }
            this.left = left;
          }
          // reconnect left/right + update parent map/start if necessary
          if (this.left !== null) {
            const right = this.left.right;
            this.right = right;
            this.left.right = this;
          } else {
            let r;
            if (this.parentSub !== null) {
              r = /** @type {AbstractType<any>} */ (this.parent)._map.get(this.parentSub) || null;
              while (r !== null && r.left !== null) {
                r = r.left;
              }
            } else {
              r = /** @type {AbstractType<any>} */ (this.parent)._start
              ;/** @type {AbstractType<any>} */ (this.parent)._start = this;
            }
            this.right = r;
          }
          if (this.right !== null) {
            this.right.left = this;
          } else if (this.parentSub !== null) {
            // set as current parent value if right === null and this is parentSub
            /** @type {AbstractType<any>} */ (this.parent)._map.set(this.parentSub, this);
            if (this.left !== null) {
              // this is the current attribute value of parent. delete right
              this.left.delete(transaction);
            }
          }
          // adjust length of parent
          if (this.parentSub === null && this.countable && !this.deleted) {
            /** @type {AbstractType<any>} */ (this.parent)._length += this.length;
          }
          addStruct(transaction.doc.store, this);
          this.content.integrate(transaction, this);
          // add parent to transaction.changed
          addChangedTypeToTransaction(transaction, /** @type {AbstractType<any>} */ (this.parent), this.parentSub);
          if ((/** @type {AbstractType<any>} */ (this.parent)._item !== null && /** @type {AbstractType<any>} */ (this.parent)._item.deleted) || (this.parentSub !== null && this.right !== null)) {
            // delete if parent is deleted or if this is not the current attribute value of parent
            this.delete(transaction);
          }
        } else {
          // parent is not defined. Integrate GC struct instead
          new GC(this.id, this.length).integrate(transaction, 0);
        }
      }

      /**
       * Returns the next non-deleted item
       */
      get next () {
        let n = this.right;
        while (n !== null && n.deleted) {
          n = n.right;
        }
        return n
      }

      /**
       * Returns the previous non-deleted item
       */
      get prev () {
        let n = this.left;
        while (n !== null && n.deleted) {
          n = n.left;
        }
        return n
      }

      /**
       * Computes the last content address of this Item.
       */
      get lastId () {
        // allocating ids is pretty costly because of the amount of ids created, so we try to reuse whenever possible
        return this.length === 1 ? this.id : createID(this.id.client, this.id.clock + this.length - 1)
      }

      /**
       * Try to merge two items
       *
       * @param {Item} right
       * @return {boolean}
       */
      mergeWith (right) {
        if (
          compareIDs(right.origin, this.lastId) &&
          this.right === right &&
          compareIDs(this.rightOrigin, right.rightOrigin) &&
          this.id.client === right.id.client &&
          this.id.clock + this.length === right.id.clock &&
          this.deleted === right.deleted &&
          this.redone === null &&
          right.redone === null &&
          this.content.constructor === right.content.constructor &&
          this.content.mergeWith(right.content)
        ) {
          if (right.keep) {
            this.keep = true;
          }
          this.right = right.right;
          if (this.right !== null) {
            this.right.left = this;
          }
          this.length += right.length;
          return true
        }
        return false
      }

      /**
       * Mark this Item as deleted.
       *
       * @param {Transaction} transaction
       */
      delete (transaction) {
        if (!this.deleted) {
          const parent = /** @type {AbstractType<any>} */ (this.parent);
          // adjust the length of parent
          if (this.countable && this.parentSub === null) {
            parent._length -= this.length;
          }
          this.markDeleted();
          addToDeleteSet(transaction.deleteSet, this.id.client, this.id.clock, this.length);
          addChangedTypeToTransaction(transaction, parent, this.parentSub);
          this.content.delete(transaction);
        }
      }

      /**
       * @param {StructStore} store
       * @param {boolean} parentGCd
       */
      gc (store, parentGCd) {
        if (!this.deleted) {
          throw unexpectedCase()
        }
        this.content.gc(store);
        if (parentGCd) {
          replaceStruct(store, this, new GC(this.id, this.length));
        } else {
          this.content = new ContentDeleted(this.length);
        }
      }

      /**
       * Transform the properties of this type to binary and write it to an
       * BinaryEncoder.
       *
       * This is called when this Item is sent to a remote peer.
       *
       * @param {AbstractUpdateEncoder} encoder The encoder to write data to.
       * @param {number} offset
       */
      write (encoder, offset) {
        const origin = offset > 0 ? createID(this.id.client, this.id.clock + offset - 1) : this.origin;
        const rightOrigin = this.rightOrigin;
        const parentSub = this.parentSub;
        const info = (this.content.getRef() & BITS5) |
          (origin === null ? 0 : BIT8) | // origin is defined
          (rightOrigin === null ? 0 : BIT7) | // right origin is defined
          (parentSub === null ? 0 : BIT6); // parentSub is non-null
        encoder.writeInfo(info);
        if (origin !== null) {
          encoder.writeLeftID(origin);
        }
        if (rightOrigin !== null) {
          encoder.writeRightID(rightOrigin);
        }
        if (origin === null && rightOrigin === null) {
          const parent = /** @type {AbstractType<any>} */ (this.parent);
          const parentItem = parent._item;
          if (parentItem === null) {
            // parent type on y._map
            // find the correct key
            const ykey = findRootTypeKey(parent);
            encoder.writeParentInfo(true); // write parentYKey
            encoder.writeString(ykey);
          } else {
            encoder.writeParentInfo(false); // write parent id
            encoder.writeLeftID(parentItem.id);
          }
          if (parentSub !== null) {
            encoder.writeString(parentSub);
          }
        }
        this.content.write(encoder, offset);
      }
    }

    /**
     * @param {AbstractUpdateDecoder} decoder
     * @param {number} info
     */
    const readItemContent = (decoder, info) => contentRefs[info & BITS5](decoder);

    /**
     * A lookup map for reading Item content.
     *
     * @type {Array<function(AbstractUpdateDecoder):AbstractContent>}
     */
    const contentRefs = [
      () => { throw unexpectedCase() }, // GC is not ItemContent
      readContentDeleted, // 1
      readContentJSON, // 2
      readContentBinary, // 3
      readContentString, // 4
      readContentEmbed, // 5
      readContentFormat, // 6
      readContentType, // 7
      readContentAny, // 8
      readContentDoc // 9
    ];

    var Y = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AbstractConnector: AbstractConnector,
        AbstractStruct: AbstractStruct,
        AbstractType: AbstractType,
        Array: YArray,
        ContentAny: ContentAny,
        ContentBinary: ContentBinary,
        ContentDeleted: ContentDeleted,
        ContentEmbed: ContentEmbed,
        ContentFormat: ContentFormat,
        ContentJSON: ContentJSON,
        ContentString: ContentString,
        ContentType: ContentType,
        Doc: Doc,
        GC: GC,
        ID: ID,
        Item: Item,
        Map: YMap,
        PermanentUserData: PermanentUserData,
        RelativePosition: RelativePosition,
        Snapshot: Snapshot,
        Text: YText,
        Transaction: Transaction,
        UndoManager: UndoManager,
        XmlElement: YXmlElement,
        XmlFragment: YXmlFragment,
        XmlHook: YXmlHook,
        XmlText: YXmlText,
        YArrayEvent: YArrayEvent,
        YEvent: YEvent,
        YMapEvent: YMapEvent,
        YTextEvent: YTextEvent,
        YXmlEvent: YXmlEvent,
        applyUpdate: applyUpdate,
        applyUpdateV2: applyUpdateV2,
        compareIDs: compareIDs,
        compareRelativePositions: compareRelativePositions,
        createAbsolutePositionFromRelativePosition: createAbsolutePositionFromRelativePosition,
        createDeleteSet: createDeleteSet,
        createDeleteSetFromStructStore: createDeleteSetFromStructStore,
        createDocFromSnapshot: createDocFromSnapshot,
        createID: createID,
        createRelativePositionFromJSON: createRelativePositionFromJSON,
        createRelativePositionFromTypeIndex: createRelativePositionFromTypeIndex,
        createSnapshot: createSnapshot,
        decodeSnapshot: decodeSnapshot,
        decodeSnapshotV2: decodeSnapshotV2,
        decodeStateVector: decodeStateVector,
        decodeStateVectorV2: decodeStateVectorV2,
        emptySnapshot: emptySnapshot,
        encodeSnapshot: encodeSnapshot,
        encodeSnapshotV2: encodeSnapshotV2,
        encodeStateAsUpdate: encodeStateAsUpdate,
        encodeStateAsUpdateV2: encodeStateAsUpdateV2,
        encodeStateVector: encodeStateVector,
        encodeStateVectorV2: encodeStateVectorV2,
        equalSnapshots: equalSnapshots,
        findRootTypeKey: findRootTypeKey,
        getItem: getItem,
        getState: getState,
        getTypeChildren: getTypeChildren,
        isDeleted: isDeleted,
        isParentOf: isParentOf,
        iterateDeletedStructs: iterateDeletedStructs,
        logType: logType,
        readRelativePosition: readRelativePosition,
        readUpdate: readUpdate,
        readUpdateV2: readUpdateV2,
        snapshot: snapshot,
        transact: transact,
        tryGc: tryGc,
        typeListToArraySnapshot: typeListToArraySnapshot,
        typeMapGetSnapshot: typeMapGetSnapshot,
        writeRelativePosition: writeRelativePosition
    });

    /* eslint-env browser */

    /**
     * @typedef {Object} Channel
     * @property {Set<Function>} Channel.subs
     * @property {any} Channel.bc
     */

    /**
     * @type {Map<string, Channel>}
     */
    const channels = new Map();

    class LocalStoragePolyfill {
      /**
       * @param {string} room
       */
      constructor (room) {
        this.room = room;
        /**
         * @type {null|function({data:ArrayBuffer}):void}
         */
        this.onmessage = null;
        addEventListener('storage', e => e.key === room && this.onmessage !== null && this.onmessage({ data: fromBase64(e.newValue || '') }));
      }

      /**
       * @param {ArrayBuffer} buf
       */
      postMessage (buf) {
        varStorage.setItem(this.room, toBase64(createUint8ArrayFromArrayBuffer(buf)));
      }
    }

    // Use BroadcastChannel or Polyfill
    const BC = typeof BroadcastChannel === 'undefined' ? LocalStoragePolyfill : BroadcastChannel;

    /**
     * @param {string} room
     * @return {Channel}
     */
    const getChannel = room =>
      setIfUndefined(channels, room, () => {
        const subs = new Set();
        const bc = new BC(room);
        /**
         * @param {{data:ArrayBuffer}} e
         */
        bc.onmessage = e => subs.forEach(sub => sub(e.data));
        return {
          bc, subs
        }
      });

    /**
     * Subscribe to global `publish` events.
     *
     * @function
     * @param {string} room
     * @param {function(any):any} f
     */
    const subscribe$1 = (room, f) => getChannel(room).subs.add(f);

    /**
     * Unsubscribe from `publish` global events.
     *
     * @function
     * @param {string} room
     * @param {function(any):any} f
     */
    const unsubscribe = (room, f) => getChannel(room).subs.delete(f);

    /**
     * Publish data to all subscribers (including subscribers on this tab)
     *
     * @function
     * @param {string} room
     * @param {any} data
     */
    const publish = (room, data) => {
      const c = getChannel(room);
      c.bc.postMessage(data);
      c.subs.forEach(sub => sub(data));
    };

    /**
     * @module sync-protocol
     */

    /**
     * @typedef {Map<number, number>} StateMap
     */

    /**
     * Core Yjs defines three message types:
     * • YjsSyncStep1: Includes the State Set of the sending client. When received, the client should reply with YjsSyncStep2.
     * • YjsSyncStep2: Includes all missing structs and the complete delete set. When received, the the client is assured that
     *   it received all information from the remote client.
     *
     * In a peer-to-peer network, you may want to introduce a SyncDone message type. Both parties should initiate the connection
     * with SyncStep1. When a client received SyncStep2, it should reply with SyncDone. When the local client received both
     * SyncStep2 and SyncDone, it is assured that it is synced to the remote client.
     *
     * In a client-server model, you want to handle this differently: The client should initiate the connection with SyncStep1.
     * When the server receives SyncStep1, it should reply with SyncStep2 immediately followed by SyncStep1. The client replies
     * with SyncStep2 when it receives SyncStep1. Optionally the server may send a SyncDone after it received SyncStep2, so the
     * client knows that the sync is finished.  There are two reasons for this more elaborated sync model: 1. This protocol can
     * easily be implemented on top of http and websockets. 2. The server shoul only reply to requests, and not initiate them.
     * Therefore it is necesarry that the client initiates the sync.
     *
     * Construction of a message:
     * [messageType : varUint, message definition..]
     *
     * Note: A message does not include information about the room name. This must to be handled by the upper layer protocol!
     *
     * stringify[messageType] stringifies a message definition (messageType is already read from the bufffer)
     */

    const messageYjsSyncStep1 = 0;
    const messageYjsSyncStep2 = 1;
    const messageYjsUpdate = 2;

    /**
     * Create a sync step 1 message based on the state of the current shared document.
     *
     * @param {encoding.Encoder} encoder
     * @param {Y.Doc} doc
     */
    const writeSyncStep1 = (encoder, doc) => {
      writeVarUint(encoder, messageYjsSyncStep1);
      const sv = encodeStateVector(doc);
      writeVarUint8Array(encoder, sv);
    };

    /**
     * @param {encoding.Encoder} encoder
     * @param {Y.Doc} doc
     * @param {Uint8Array} [encodedStateVector]
     */
    const writeSyncStep2 = (encoder, doc, encodedStateVector) => {
      writeVarUint(encoder, messageYjsSyncStep2);
      writeVarUint8Array(encoder, encodeStateAsUpdate(doc, encodedStateVector));
    };

    /**
     * Read SyncStep1 message and reply with SyncStep2.
     *
     * @param {decoding.Decoder} decoder The reply to the received message
     * @param {encoding.Encoder} encoder The received message
     * @param {Y.Doc} doc
     */
    const readSyncStep1 = (decoder, encoder, doc) =>
      writeSyncStep2(encoder, doc, readVarUint8Array(decoder));

    /**
     * Read and apply Structs and then DeleteStore to a y instance.
     *
     * @param {decoding.Decoder} decoder
     * @param {Y.Doc} doc
     * @param {any} transactionOrigin
     */
    const readSyncStep2 = (decoder, doc, transactionOrigin) => {
      applyUpdate(doc, readVarUint8Array(decoder), transactionOrigin);
    };

    /**
     * @param {encoding.Encoder} encoder
     * @param {Uint8Array} update
     */
    const writeUpdate = (encoder, update) => {
      writeVarUint(encoder, messageYjsUpdate);
      writeVarUint8Array(encoder, update);
    };

    /**
     * Read and apply Structs and then DeleteStore to a y instance.
     *
     * @param {decoding.Decoder} decoder
     * @param {Y.Doc} doc
     * @param {any} transactionOrigin
     */
    const readUpdate$1 = readSyncStep2;

    /**
     * @param {decoding.Decoder} decoder A message received from another client
     * @param {encoding.Encoder} encoder The reply message. Will not be sent if empty.
     * @param {Y.Doc} doc
     * @param {any} transactionOrigin
     */
    const readSyncMessage = (decoder, encoder, doc, transactionOrigin) => {
      const messageType = readVarUint(decoder);
      switch (messageType) {
        case messageYjsSyncStep1:
          readSyncStep1(decoder, encoder, doc);
          break
        case messageYjsSyncStep2:
          readSyncStep2(decoder, doc, transactionOrigin);
          break
        case messageYjsUpdate:
          readUpdate$1(decoder, doc, transactionOrigin);
          break
        default:
          throw new Error('Unknown message type')
      }
      return messageType
    };

    const messagePermissionDenied = 0;

    /**
     * @callback PermissionDeniedHandler
     * @param {any} y
     * @param {string} reason
     */

    /**
     *
     * @param {decoding.Decoder} decoder
     * @param {Y.Doc} y
     * @param {PermissionDeniedHandler} permissionDeniedHandler
     */
    const readAuthMessage = (decoder, y, permissionDeniedHandler) => {
      switch (readVarUint(decoder)) {
        case messagePermissionDenied: permissionDeniedHandler(y, readVarString(decoder));
      }
    };

    /**
     * @module awareness-protocol
     */

    const outdatedTimeout = 30000;

    /**
     * @typedef {Object} MetaClientState
     * @property {number} MetaClientState.clock
     * @property {number} MetaClientState.lastUpdated unix timestamp
     */

    /**
     * The Awareness class implements a simple shared state protocol that can be used for non-persistent data like awareness information
     * (cursor, username, status, ..). Each client can update its own local state and listen to state changes of
     * remote clients. Every client may set a state of a remote peer to `null` to mark the client as offline.
     *
     * Each client is identified by a unique client id (something we borrow from `doc.clientID`). A client can override
     * its own state by propagating a message with an increasing timestamp (`clock`). If such a message is received, it is
     * applied if the known state of that client is older than the new state (`clock < newClock`). If a client thinks that
     * a remote client is offline, it may propagate a message with
     * `{ clock: currentClientClock, state: null, client: remoteClient }`. If such a
     * message is received, and the known clock of that client equals the received clock, it will override the state with `null`.
     *
     * Before a client disconnects, it should propagate a `null` state with an updated clock.
     *
     * Awareness states must be updated every 30 seconds. Otherwise the Awareness instance will delete the client state.
     *
     * @extends {Observable<string>}
     */
    class Awareness extends Observable {
      /**
       * @param {Y.Doc} doc
       */
      constructor (doc) {
        super();
        this.doc = doc;
        /**
         * Maps from client id to client state
         * @type {Map<number, Object<string, any>>}
         */
        this.states = new Map();
        /**
         * @type {Map<number, MetaClientState>}
         */
        this.meta = new Map();
        this._checkInterval = setInterval(() => {
          const now = getUnixTime();
          if (this.getLocalState() !== null && (outdatedTimeout / 2 <= now - /** @type {{lastUpdated:number}} */ (this.meta.get(doc.clientID)).lastUpdated)) {
            // renew local clock
            this.setLocalState(this.getLocalState());
          }
          /**
           * @type {Array<number>}
           */
          const remove = [];
          this.meta.forEach((meta, clientid) => {
            if (clientid !== doc.clientID && outdatedTimeout <= now - meta.lastUpdated && this.states.has(clientid)) {
              remove.push(clientid);
            }
          });
          if (remove.length > 0) {
            removeAwarenessStates(this, remove, 'timeout');
          }
        }, floor(outdatedTimeout / 10));
        doc.on('destroy', () => {
          this.destroy();
        });
        this.setLocalState({});
      }
      destroy () {
        super.destroy();
        clearInterval(this._checkInterval);
      }
      /**
       * @return {Object<string,any>|null}
       */
      getLocalState () {
        return this.states.get(this.doc.clientID) || null
      }
      /**
       * @param {Object<string,any>|null} state
       */
      setLocalState (state) {
        const clientID = this.doc.clientID;
        const currLocalMeta = this.meta.get(clientID);
        const clock = currLocalMeta === undefined ? 0 : currLocalMeta.clock + 1;
        const prevState = this.states.get(clientID);
        if (state === null) {
          this.states.delete(clientID);
        } else {
          this.states.set(clientID, state);
        }
        this.meta.set(clientID, {
          clock,
          lastUpdated: getUnixTime()
        });
        const added = [];
        const updated = [];
        const filteredUpdated = [];
        const removed = [];
        if (state === null) {
          removed.push(clientID);
        } else if (prevState == null) {
          if (state != null) {
            added.push(clientID);
          }
        } else {
          updated.push(clientID);
          if (!equalityDeep(prevState, state)) {
            filteredUpdated.push(clientID);
          }
        }
        if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
          this.emit('change', [{ added, updated: filteredUpdated, removed }, 'local']);
        }
        this.emit('update', [{ added, updated, removed }, 'local']);
      }
      /**
       * @param {string} field
       * @param {any} value
       */
      setLocalStateField (field, value) {
        const state = this.getLocalState();
        if (state !== null) {
          state[field] = value;
          this.setLocalState(state);
        }
      }
      /**
       * @return {Map<number,Object<string,any>>}
       */
      getStates () {
        return this.states
      }
    }

    /**
     * Mark (remote) clients as inactive and remove them from the list of active peers.
     * This change will be propagated to remote clients.
     *
     * @param {Awareness} awareness
     * @param {Array<number>} clients
     * @param {any} origin
     */
    const removeAwarenessStates = (awareness, clients, origin) => {
      const removed = [];
      for (let i = 0; i < clients.length; i++) {
        const clientID = clients[i];
        if (awareness.states.has(clientID)) {
          awareness.states.delete(clientID);
          if (clientID === awareness.doc.clientID) {
            const curMeta = /** @type {MetaClientState} */ (awareness.meta.get(clientID));
            awareness.meta.set(clientID, {
              clock: curMeta.clock + 1,
              lastUpdated: getUnixTime()
            });
          }
          removed.push(clientID);
        }
      }
      if (removed.length > 0) {
        awareness.emit('change', [{ added: [], updated: [], removed }, origin]);
        awareness.emit('update', [{ added: [], updated: [], removed }, origin]);
      }
    };

    /**
     * @param {Awareness} awareness
     * @param {Array<number>} clients
     * @return {Uint8Array}
     */
    const encodeAwarenessUpdate = (awareness, clients, states = awareness.states) => {
      const len = clients.length;
      const encoder = createEncoder();
      writeVarUint(encoder, len);
      for (let i = 0; i < len; i++) {
        const clientID = clients[i];
        const state = states.get(clientID) || null;
        const clock = /** @type {MetaClientState} */ (awareness.meta.get(clientID)).clock;
        writeVarUint(encoder, clientID);
        writeVarUint(encoder, clock);
        writeVarString(encoder, JSON.stringify(state));
      }
      return toUint8Array(encoder)
    };

    /**
     * @param {Awareness} awareness
     * @param {Uint8Array} update
     * @param {any} origin This will be added to the emitted change event
     */
    const applyAwarenessUpdate = (awareness, update, origin) => {
      const decoder = createDecoder(update);
      const timestamp = getUnixTime();
      const added = [];
      const updated = [];
      const filteredUpdated = [];
      const removed = [];
      const len = readVarUint(decoder);
      for (let i = 0; i < len; i++) {
        const clientID = readVarUint(decoder);
        let clock = readVarUint(decoder);
        const state = JSON.parse(readVarString(decoder));
        const clientMeta = awareness.meta.get(clientID);
        const prevState = awareness.states.get(clientID);
        const currClock = clientMeta === undefined ? 0 : clientMeta.clock;
        if (currClock < clock || (currClock === clock && state === null && awareness.states.has(clientID))) {
          if (state === null) {
            // never let a remote client remove this local state
            if (clientID === awareness.doc.clientID && awareness.getLocalState() != null) {
              // remote client removed the local state. Do not remote state. Broadcast a message indicating
              // that this client still exists by increasing the clock
              clock++;
            } else {
              awareness.states.delete(clientID);
            }
          } else {
            awareness.states.set(clientID, state);
          }
          awareness.meta.set(clientID, {
            clock,
            lastUpdated: timestamp
          });
          if (clientMeta === undefined && state !== null) {
            added.push(clientID);
          } else if (clientMeta !== undefined && state === null) {
            removed.push(clientID);
          } else if (state !== null) {
            if (!equalityDeep(state, prevState)) {
              filteredUpdated.push(clientID);
            }
            updated.push(clientID);
          }
        }
      }
      if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
        awareness.emit('change', [{
          added, updated: filteredUpdated, removed
        }, origin]);
      }
      if (added.length > 0 || updated.length > 0 || removed.length > 0) {
        awareness.emit('update', [{
          added, updated, removed
        }, origin]);
      }
    };

    /**
     * Mutual exclude for JavaScript.
     *
     * @module mutex
     */

    /**
     * @callback mutex
     * @param {function():void} cb Only executed when this mutex is not in the current stack
     * @param {function():void} [elseCb] Executed when this mutex is in the current stack
     */

    /**
     * Creates a mutual exclude function with the following property:
     *
     * ```js
     * const mutex = createMutex()
     * mutex(() => {
     *   // This function is immediately executed
     *   mutex(() => {
     *     // This function is not executed, as the mutex is already active.
     *   })
     * })
     * ```
     *
     * @return {mutex} A mutual exclude function
     * @public
     */
    const createMutex = () => {
      let token = true;
      return (f, g) => {
        if (token) {
          token = false;
          try {
            f();
          } finally {
            token = true;
          }
        } else if (g !== undefined) {
          g();
        }
      }
    };

    /**
     * Utility module to work with urls.
     *
     * @module url
     */

    /**
     * @param {Object<string,string>} params
     * @return {string}
     */
    const encodeQueryParams = params =>
      map$1(params, (val, key) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');

    /*
    Unlike stated in the LICENSE file, it is not necessary to include the copyright notice and permission notice when you copy code from this file.
    */

    const messageSync = 0;
    const messageQueryAwareness = 3;
    const messageAwareness = 1;
    const messageAuth = 2;

    const reconnectTimeoutBase = 1200;
    const maxReconnectTimeout = 2500;
    // @todo - this should depend on awareness.outdatedTime
    const messageReconnectTimeout = 30000;

    /**
     * @param {WebsocketProvider} provider
     * @param {string} reason
     */
    const permissionDeniedHandler = (provider, reason) => console.warn(`Permission denied to access ${provider.url}.\n${reason}`);

    /**
     * @param {WebsocketProvider} provider
     * @param {Uint8Array} buf
     * @param {boolean} emitSynced
     * @return {encoding.Encoder}
     */
    const readMessage = (provider, buf, emitSynced) => {
      const decoder = createDecoder(buf);
      const encoder = createEncoder();
      const messageType = readVarUint(decoder);
      switch (messageType) {
        case messageSync: {
          writeVarUint(encoder, messageSync);
          const syncMessageType = readSyncMessage(decoder, encoder, provider.doc, provider);
          if (emitSynced && syncMessageType === messageYjsSyncStep2 && !provider.synced) {
            provider.synced = true;
          }
          break
        }
        case messageQueryAwareness:
          writeVarUint(encoder, messageAwareness);
          writeVarUint8Array(encoder, encodeAwarenessUpdate(provider.awareness, Array.from(provider.awareness.getStates().keys())));
          break
        case messageAwareness:
          applyAwarenessUpdate(provider.awareness, readVarUint8Array(decoder), provider);
          break
        case messageAuth:
          readAuthMessage(decoder, provider.doc, permissionDeniedHandler);
          break
        default:
          console.error('Unable to compute message');
          return encoder
      }
      return encoder
    };

    /**
     * @param {WebsocketProvider} provider
     */
    const setupWS = provider => {
      if (provider.shouldConnect && provider.ws === null) {
        const websocket = new provider._WS(provider.url);
        websocket.binaryType = 'arraybuffer';
        provider.ws = websocket;
        provider.wsconnecting = true;
        provider.wsconnected = false;
        provider.synced = false;

        websocket.onmessage = event => {
          provider.wsLastMessageReceived = getUnixTime();
          const encoder = readMessage(provider, new Uint8Array(event.data), true);
          if (length(encoder) > 1) {
            websocket.send(toUint8Array(encoder));
          }
        };
        websocket.onclose = () => {
          provider.ws = null;
          provider.wsconnecting = false;
          if (provider.wsconnected) {
            provider.wsconnected = false;
            provider.synced = false;
            // update awareness (all users except local left)
            removeAwarenessStates(provider.awareness, Array.from(provider.awareness.getStates().keys()).filter(client => client !== provider.doc.clientID), provider);
            provider.emit('status', [{
              status: 'disconnected'
            }]);
          } else {
            provider.wsUnsuccessfulReconnects++;
          }
          // Start with no reconnect timeout and increase timeout by
          // log10(wsUnsuccessfulReconnects).
          // The idea is to increase reconnect timeout slowly and have no reconnect
          // timeout at the beginning (log(1) = 0)
          setTimeout(setupWS, min(log10(provider.wsUnsuccessfulReconnects + 1) * reconnectTimeoutBase, maxReconnectTimeout), provider);
        };
        websocket.onopen = () => {
          provider.wsLastMessageReceived = getUnixTime();
          provider.wsconnecting = false;
          provider.wsconnected = true;
          provider.wsUnsuccessfulReconnects = 0;
          provider.emit('status', [{
            status: 'connected'
          }]);
          // always send sync step 1 when connected
          const encoder = createEncoder();
          writeVarUint(encoder, messageSync);
          writeSyncStep1(encoder, provider.doc);
          websocket.send(toUint8Array(encoder));
          // broadcast local awareness state
          if (provider.awareness.getLocalState() !== null) {
            const encoderAwarenessState = createEncoder();
            writeVarUint(encoderAwarenessState, messageAwareness);
            writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(provider.awareness, [provider.doc.clientID]));
            websocket.send(toUint8Array(encoderAwarenessState));
          }
        };

        provider.emit('status', [{
          status: 'connecting'
        }]);
      }
    };

    /**
     * @param {WebsocketProvider} provider
     * @param {ArrayBuffer} buf
     */
    const broadcastMessage = (provider, buf) => {
      if (provider.wsconnected) {
        // @ts-ignore We know that wsconnected = true
        provider.ws.send(buf);
      }
      if (provider.bcconnected) {
        provider.mux(() => {
          publish(provider.bcChannel, buf);
        });
      }
    };

    /**
     * Websocket Provider for Yjs. Creates a websocket connection to sync the shared document.
     * The document name is attached to the provided url. I.e. the following example
     * creates a websocket connection to http://localhost:1234/my-document-name
     *
     * @example
     *   import * as Y from 'yjs'
     *   import { WebsocketProvider } from 'y-websocket'
     *   const doc = new Y.Doc()
     *   const provider = new WebsocketProvider('http://localhost:1234', 'my-document-name', doc)
     *
     * @extends {Observable<string>}
     */
    class WebsocketProvider extends Observable {
      /**
       * @param {string} serverUrl
       * @param {string} roomname
       * @param {Y.Doc} doc
       * @param {object} [opts]
       * @param {boolean} [opts.connect]
       * @param {awarenessProtocol.Awareness} [opts.awareness]
       * @param {Object<string,string>} [opts.params]
       * @param {typeof WebSocket} [opts.WebSocketPolyfill] Optionall provide a WebSocket polyfill
       * @param {number} [opts.resyncInterval] Request server state every `resyncInterval` milliseconds
       */
      constructor (serverUrl, roomname, doc, { connect = true, awareness = new Awareness(doc), params = {}, WebSocketPolyfill = WebSocket, resyncInterval = -1 } = {}) {
        super();
        // ensure that url is always ends with /
        while (serverUrl[serverUrl.length - 1] === '/') {
          serverUrl = serverUrl.slice(0, serverUrl.length - 1);
        }
        const encodedParams = encodeQueryParams(params);
        this.bcChannel = serverUrl + '/' + roomname;
        this.url = serverUrl + '/' + roomname + (encodedParams.length === 0 ? '' : '?' + encodedParams);
        this.roomname = roomname;
        this.doc = doc;
        this._WS = WebSocketPolyfill;
        this.awareness = awareness;
        this.wsconnected = false;
        this.wsconnecting = false;
        this.bcconnected = false;
        this.wsUnsuccessfulReconnects = 0;
        this.mux = createMutex();
        /**
         * @type {boolean}
         */
        this._synced = false;
        /**
         * @type {WebSocket?}
         */
        this.ws = null;
        this.wsLastMessageReceived = 0;
        /**
         * Whether to connect to other peers or not
         * @type {boolean}
         */
        this.shouldConnect = connect;

        /**
         * @type {NodeJS.Timeout | number}
         */
        this._resyncInterval = 0;
        if (resyncInterval > 0) {
          this._resyncInterval = setInterval(() => {
            if (this.ws) {
              // resend sync step 1
              const encoder = createEncoder();
              writeVarUint(encoder, messageSync);
              writeSyncStep1(encoder, doc);
              this.ws.send(toUint8Array(encoder));
            }
          }, resyncInterval);
        }

        /**
         * @param {ArrayBuffer} data
         */
        this._bcSubscriber = data => {
          this.mux(() => {
            const encoder = readMessage(this, new Uint8Array(data), false);
            if (length(encoder) > 1) {
              publish(this.bcChannel, toUint8Array(encoder));
            }
          });
        };
        /**
         * Listens to Yjs updates and sends them to remote peers (ws and broadcastchannel)
         * @param {Uint8Array} update
         * @param {any} origin
         */
        this._updateHandler = (update, origin) => {
          if (origin !== this || origin === null) {
            const encoder = createEncoder();
            writeVarUint(encoder, messageSync);
            writeUpdate(encoder, update);
            broadcastMessage(this, toUint8Array(encoder));
          }
        };
        this.doc.on('update', this._updateHandler);
        /**
         * @param {any} changed
         * @param {any} origin
         */
        this._awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
          const changedClients = added.concat(updated).concat(removed);
          const encoder = createEncoder();
          writeVarUint(encoder, messageAwareness);
          writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, changedClients));
          broadcastMessage(this, toUint8Array(encoder));
        };
        window.addEventListener('beforeunload', () => {
          removeAwarenessStates(this.awareness, [doc.clientID], 'window unload');
        });
        awareness.on('update', this._awarenessUpdateHandler);
        this._checkInterval = setInterval(() => {
          if (this.wsconnected && messageReconnectTimeout < getUnixTime() - this.wsLastMessageReceived) {
            // no message received in a long time - not even your own awareness
            // updates (which are updated every 15 seconds)
            /** @type {WebSocket} */ (this.ws).close();
          }
        }, messageReconnectTimeout / 10);
        if (connect) {
          this.connect();
        }
      }

      /**
       * @type {boolean}
       */
      get synced () {
        return this._synced
      }

      set synced (state) {
        if (this._synced !== state) {
          this._synced = state;
          this.emit('sync', [state]);
        }
      }

      destroy () {
        if (this._resyncInterval !== 0) {
          clearInterval(/** @type {NodeJS.Timeout} */ (this._resyncInterval));
        }
        clearInterval(this._checkInterval);
        this.disconnect();
        this.awareness.off('update', this._awarenessUpdateHandler);
        this.doc.off('update', this._updateHandler);
        super.destroy();
      }

      connectBc () {
        if (!this.bcconnected) {
          subscribe$1(this.bcChannel, this._bcSubscriber);
          this.bcconnected = true;
        }
        // send sync step1 to bc
        this.mux(() => {
          // write sync step 1
          const encoderSync = createEncoder();
          writeVarUint(encoderSync, messageSync);
          writeSyncStep1(encoderSync, this.doc);
          publish(this.bcChannel, toUint8Array(encoderSync));
          // broadcast local state
          const encoderState = createEncoder();
          writeVarUint(encoderState, messageSync);
          writeSyncStep2(encoderState, this.doc);
          publish(this.bcChannel, toUint8Array(encoderState));
          // write queryAwareness
          const encoderAwarenessQuery = createEncoder();
          writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
          publish(this.bcChannel, toUint8Array(encoderAwarenessQuery));
          // broadcast local awareness state
          const encoderAwarenessState = createEncoder();
          writeVarUint(encoderAwarenessState, messageAwareness);
          writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
          publish(this.bcChannel, toUint8Array(encoderAwarenessState));
        });
      }

      disconnectBc () {
        // broadcast message with local awareness state set to null (indicating disconnect)
        const encoder = createEncoder();
        writeVarUint(encoder, messageAwareness);
        writeVarUint8Array(encoder, encodeAwarenessUpdate(this.awareness, [this.doc.clientID], new Map()));
        broadcastMessage(this, toUint8Array(encoder));
        if (this.bcconnected) {
          unsubscribe(this.bcChannel, this._bcSubscriber);
          this.bcconnected = false;
        }
      }

      disconnect () {
        this.shouldConnect = false;
        this.disconnectBc();
        if (this.ws !== null) {
          this.ws.close();
        }
      }

      connect () {
        this.shouldConnect = true;
        if (!this.wsconnected && this.ws === null) {
          setupWS(this);
          this.connectBc();
        }
      }
    }

    /* eslint-env browser */

    const reconnectTimeoutBase$1 = 1200;
    const maxReconnectTimeout$1 = 2500;
    // @todo - this should depend on awareness.outdatedTime
    const messageReconnectTimeout$1 = 30000;

    /**
     * @param {WebsocketClient} wsclient
     */
    const setupWS$1 = (wsclient) => {
      if (wsclient.shouldConnect && wsclient.ws === null) {
        const websocket = new WebSocket(wsclient.url);
        const binaryType = wsclient.binaryType;
        /**
         * @type {any}
         */
        let pingTimeout = null;
        if (binaryType) {
          websocket.binaryType = binaryType;
        }
        wsclient.ws = websocket;
        wsclient.connecting = true;
        wsclient.connected = false;
        websocket.onmessage = event => {
          wsclient.lastMessageReceived = getUnixTime();
          const data = event.data;
          const message = typeof data === 'string' ? JSON.parse(data) : data;
          if (message && message.type === 'pong') {
            clearTimeout(pingTimeout);
            pingTimeout = setTimeout(sendPing, messageReconnectTimeout$1 / 2);
          }
          wsclient.emit('message', [message, wsclient]);
        };
        /**
         * @param {any} error
         */
        const onclose = error => {
          if (wsclient.ws !== null) {
            wsclient.ws = null;
            wsclient.connecting = false;
            if (wsclient.connected) {
              wsclient.connected = false;
              wsclient.emit('disconnect', [{ type: 'disconnect', error }, wsclient]);
            } else {
              wsclient.unsuccessfulReconnects++;
            }
            // Start with no reconnect timeout and increase timeout by
            // log10(wsUnsuccessfulReconnects).
            // The idea is to increase reconnect timeout slowly and have no reconnect
            // timeout at the beginning (log(1) = 0)
            setTimeout(setupWS$1, min(log10(wsclient.unsuccessfulReconnects + 1) * reconnectTimeoutBase$1, maxReconnectTimeout$1), wsclient);
          }
          clearTimeout(pingTimeout);
        };
        const sendPing = () => {
          if (wsclient.ws === websocket) {
            wsclient.send({
              type: 'ping'
            });
          }
        };
        websocket.onclose = () => onclose(null);
        websocket.onerror = error => onclose(error);
        websocket.onopen = () => {
          wsclient.lastMessageReceived = getUnixTime();
          wsclient.connecting = false;
          wsclient.connected = true;
          wsclient.unsuccessfulReconnects = 0;
          wsclient.emit('connect', [{ type: 'connect' }, wsclient]);
          // set ping
          pingTimeout = setTimeout(sendPing, messageReconnectTimeout$1 / 2);
        };
      }
    };

    /**
     * @extends Observable<string>
     */
    class WebsocketClient extends Observable {
      /**
       * @param {string} url
       * @param {object} [opts]
       * @param {'arraybuffer' | 'blob' | null} [opts.binaryType] Set `ws.binaryType`
       */
      constructor (url, { binaryType } = {}) {
        super();
        this.url = url;
        /**
         * @type {WebSocket?}
         */
        this.ws = null;
        this.binaryType = binaryType || null;
        this.connected = false;
        this.connecting = false;
        this.unsuccessfulReconnects = 0;
        this.lastMessageReceived = 0;
        /**
         * Whether to connect to other peers or not
         * @type {boolean}
         */
        this.shouldConnect = true;
        this._checkInterval = setInterval(() => {
          if (this.connected && messageReconnectTimeout$1 < getUnixTime() - this.lastMessageReceived) {
            // no message received in a long time - not even your own awareness
            // updates (which are updated every 15 seconds)
            /** @type {WebSocket} */ (this.ws).close();
          }
        }, messageReconnectTimeout$1 / 2);
        setupWS$1(this);
      }

      /**
       * @param {any} message
       */
      send (message) {
        if (this.ws) {
          this.ws.send(JSON.stringify(message));
        }
      }

      destroy () {
        clearInterval(this._checkInterval);
        this.disconnect();
        super.destroy();
      }

      disconnect () {
        this.shouldConnect = false;
        if (this.ws !== null) {
          this.ws.close();
        }
      }

      connect () {
        this.shouldConnect = true;
        if (!this.connected && this.ws === null) {
          setupWS$1(this);
        }
      }
    }

    /**
     * Utility helpers to work with promises.
     *
     * @module promise
     */

    /**
     * @param {Error} [reason]
     * @return {Promise<never>}
     */
    const reject = reason => Promise.reject(reason);

    /**
     * @template T
     * @param {T|void} res
     * @return {Promise<T|void>}
     */
    const resolve = res => Promise.resolve(res);

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var simplepeer_min = createCommonjsModule(function (module, exports) {
    (function(e){module.exports=e();})(function(){var t=Math.floor,n=Math.abs,r=Math.pow;return function(){function d(s,e,n){function t(o,i){if(!e[o]){if(!s[o]){var l="function"==typeof commonjsRequire&&commonjsRequire;if(!i&&l)return l(o,!0);if(r)return r(o,!0);var c=new Error("Cannot find module '"+o+"'");throw c.code="MODULE_NOT_FOUND",c}var a=e[o]={exports:{}};s[o][0].call(a.exports,function(e){var r=s[o][1][e];return t(r||e)},a,a.exports,d,s,e,n);}return e[o].exports}for(var r="function"==typeof commonjsRequire&&commonjsRequire,a=0;a<n.length;a++)t(n[a]);return t}return d}()({1:[function(e,t,n){function r(e){var t=e.length;if(0<t%4)throw new Error("Invalid string. Length must be a multiple of 4");var n=e.indexOf("=");-1===n&&(n=t);var r=n===t?0:4-n%4;return [n,r]}function a(e,t,n){return 3*(t+n)/4-n}function o(e){var t,n,o=r(e),d=o[0],s=o[1],l=new p(a(e,d,s)),c=0,f=0<s?d-4:d;for(n=0;n<f;n+=4)t=u[e.charCodeAt(n)]<<18|u[e.charCodeAt(n+1)]<<12|u[e.charCodeAt(n+2)]<<6|u[e.charCodeAt(n+3)],l[c++]=255&t>>16,l[c++]=255&t>>8,l[c++]=255&t;return 2===s&&(t=u[e.charCodeAt(n)]<<2|u[e.charCodeAt(n+1)]>>4,l[c++]=255&t),1===s&&(t=u[e.charCodeAt(n)]<<10|u[e.charCodeAt(n+1)]<<4|u[e.charCodeAt(n+2)]>>2,l[c++]=255&t>>8,l[c++]=255&t),l}function d(e){return c[63&e>>18]+c[63&e>>12]+c[63&e>>6]+c[63&e]}function s(e,t,n){for(var r,a=[],o=t;o<n;o+=3)r=(16711680&e[o]<<16)+(65280&e[o+1]<<8)+(255&e[o+2]),a.push(d(r));return a.join("")}function l(e){for(var t,n=e.length,r=n%3,a=[],o=16383,d=0,l=n-r;d<l;d+=o)a.push(s(e,d,d+o>l?l:d+o));return 1===r?(t=e[n-1],a.push(c[t>>2]+c[63&t<<4]+"==")):2===r&&(t=(e[n-2]<<8)+e[n-1],a.push(c[t>>10]+c[63&t>>4]+c[63&t<<2]+"=")),a.join("")}n.byteLength=function(e){var t=r(e),n=t[0],a=t[1];return 3*(n+a)/4-a},n.toByteArray=o,n.fromByteArray=l;for(var c=[],u=[],p="undefined"==typeof Uint8Array?Array:Uint8Array,f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",g=0,h=f.length;g<h;++g)c[g]=f[g],u[f.charCodeAt(g)]=g;u[45]=62,u[95]=63;},{}],2:[function(){},{}],3:[function(e,t,n){(function(){(function(){var z=String.fromCharCode,K=Math.min;function t(e){if(2147483647<e)throw new RangeError("The value \""+e+"\" is invalid for option \"size\"");var t=new Uint8Array(e);return t.__proto__=o.prototype,t}function o(e,t,n){if("number"==typeof e){if("string"==typeof t)throw new TypeError("The \"string\" argument must be of type string. Received type number");return l(e)}return i(e,t,n)}function i(e,t,n){if("string"==typeof e)return c(e,t);if(ArrayBuffer.isView(e))return u(e);if(null==e)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e);if(G(e,ArrayBuffer)||e&&G(e.buffer,ArrayBuffer))return p(e,t,n);if("number"==typeof e)throw new TypeError("The \"value\" argument must not be of type number. Received type number");var r=e.valueOf&&e.valueOf();if(null!=r&&r!==e)return o.from(r,t,n);var a=f(e);if(a)return a;if("undefined"!=typeof Symbol&&null!=Symbol.toPrimitive&&"function"==typeof e[Symbol.toPrimitive])return o.from(e[Symbol.toPrimitive]("string"),t,n);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e)}function d(e){if("number"!=typeof e)throw new TypeError("\"size\" argument must be of type number");else if(0>e)throw new RangeError("The value \""+e+"\" is invalid for option \"size\"")}function s(e,n,r){return d(e),0>=e?t(e):void 0===n?t(e):"string"==typeof r?t(e).fill(n,r):t(e).fill(n)}function l(e){return d(e),t(0>e?0:0|g(e))}function c(e,n){if(("string"!=typeof n||""===n)&&(n="utf8"),!o.isEncoding(n))throw new TypeError("Unknown encoding: "+n);var r=0|h(e,n),a=t(r),i=a.write(e,n);return i!==r&&(a=a.slice(0,i)),a}function u(e){for(var n=0>e.length?0:0|g(e.length),r=t(n),a=0;a<n;a+=1)r[a]=255&e[a];return r}function p(e,t,n){if(0>t||e.byteLength<t)throw new RangeError("\"offset\" is outside of buffer bounds");if(e.byteLength<t+(n||0))throw new RangeError("\"length\" is outside of buffer bounds");var r;return r=void 0===t&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,t):new Uint8Array(e,t,n),r.__proto__=o.prototype,r}function f(e){if(o.isBuffer(e)){var n=0|g(e.length),r=t(n);return 0===r.length?r:(e.copy(r,0,0,n),r)}return void 0===e.length?"Buffer"===e.type&&Array.isArray(e.data)?u(e.data):void 0:"number"!=typeof e.length||Y(e.length)?t(0):u(e)}function g(e){if(e>=2147483647)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+2147483647 .toString(16)+" bytes");return 0|e}function h(e,t){if(o.isBuffer(e))return e.length;if(ArrayBuffer.isView(e)||G(e,ArrayBuffer))return e.byteLength;if("string"!=typeof e)throw new TypeError("The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type "+typeof e);var n=e.length,r=2<arguments.length&&!0===arguments[2];if(!r&&0===n)return 0;for(var a=!1;;)switch(t){case"ascii":case"latin1":case"binary":return n;case"utf8":case"utf-8":return j(e).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*n;case"hex":return n>>>1;case"base64":return H(e).length;default:if(a)return r?-1:j(e).length;t=(""+t).toLowerCase(),a=!0;}}function _(e,t,n){var r=!1;if((void 0===t||0>t)&&(t=0),t>this.length)return "";if((void 0===n||n>this.length)&&(n=this.length),0>=n)return "";if(n>>>=0,t>>>=0,n<=t)return "";for(e||(e="utf8");;)switch(e){case"hex":return N(this,t,n);case"utf8":case"utf-8":return v(this,t,n);case"ascii":return A(this,t,n);case"latin1":case"binary":return x(this,t,n);case"base64":return T(this,t,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return I(this,t,n);default:if(r)throw new TypeError("Unknown encoding: "+e);e=(e+"").toLowerCase(),r=!0;}}function m(e,t,n){var r=e[t];e[t]=e[n],e[n]=r;}function b(e,t,n,r,a){if(0===e.length)return -1;if("string"==typeof n?(r=n,n=0):2147483647<n?n=2147483647:-2147483648>n&&(n=-2147483648),n=+n,Y(n)&&(n=a?0:e.length-1),0>n&&(n=e.length+n),n>=e.length){if(a)return -1;n=e.length-1;}else if(0>n)if(a)n=0;else return -1;if("string"==typeof t&&(t=o.from(t,r)),o.isBuffer(t))return 0===t.length?-1:y(e,t,n,r,a);if("number"==typeof t)return t&=255,"function"==typeof Uint8Array.prototype.indexOf?a?Uint8Array.prototype.indexOf.call(e,t,n):Uint8Array.prototype.lastIndexOf.call(e,t,n):y(e,[t],n,r,a);throw new TypeError("val must be string, number or Buffer")}function y(e,t,n,r,a){function o(e,t){return 1===d?e[t]:e.readUInt16BE(t*d)}var d=1,s=e.length,l=t.length;if(void 0!==r&&(r=(r+"").toLowerCase(),"ucs2"===r||"ucs-2"===r||"utf16le"===r||"utf-16le"===r)){if(2>e.length||2>t.length)return -1;d=2,s/=2,l/=2,n/=2;}var c;if(a){var u=-1;for(c=n;c<s;c++)if(o(e,c)!==o(t,-1===u?0:c-u))-1!==u&&(c-=c-u),u=-1;else if(-1===u&&(u=c),c-u+1===l)return u*d}else for(n+l>s&&(n=s-l),c=n;0<=c;c--){for(var p=!0,f=0;f<l;f++)if(o(e,c+f)!==o(t,f)){p=!1;break}if(p)return c}return -1}function C(e,t,n,r){n=+n||0;var a=e.length-n;r?(r=+r,r>a&&(r=a)):r=a;var o=t.length;r>o/2&&(r=o/2);for(var d,s=0;s<r;++s){if(d=parseInt(t.substr(2*s,2),16),Y(d))return s;e[n+s]=d;}return s}function w(e,t,n,r){return V(j(t,e.length-n),e,n,r)}function R(e,t,n,r){return V(q(t),e,n,r)}function E(e,t,n,r){return R(e,t,n,r)}function S(e,t,n,r){return V(H(t),e,n,r)}function k(e,t,n,r){return V(W(t,e.length-n),e,n,r)}function T(e,t,n){return 0===t&&n===e.length?X.fromByteArray(e):X.fromByteArray(e.slice(t,n))}function v(e,t,n){n=K(e.length,n);for(var r=[],a=t;a<n;){var o=e[a],d=null,s=239<o?4:223<o?3:191<o?2:1;if(a+s<=n){var l,c,u,p;1===s?128>o&&(d=o):2===s?(l=e[a+1],128==(192&l)&&(p=(31&o)<<6|63&l,127<p&&(d=p))):3===s?(l=e[a+1],c=e[a+2],128==(192&l)&&128==(192&c)&&(p=(15&o)<<12|(63&l)<<6|63&c,2047<p&&(55296>p||57343<p)&&(d=p))):4===s?(l=e[a+1],c=e[a+2],u=e[a+3],128==(192&l)&&128==(192&c)&&128==(192&u)&&(p=(15&o)<<18|(63&l)<<12|(63&c)<<6|63&u,65535<p&&1114112>p&&(d=p))):void 0;}null===d?(d=65533,s=1):65535<d&&(d-=65536,r.push(55296|1023&d>>>10),d=56320|1023&d),r.push(d),a+=s;}return L(r)}function L(e){var t=e.length;if(t<=4096)return z.apply(String,e);for(var n="",r=0;r<t;)n+=z.apply(String,e.slice(r,r+=4096));return n}function A(e,t,n){var r="";n=K(e.length,n);for(var a=t;a<n;++a)r+=z(127&e[a]);return r}function x(e,t,n){var r="";n=K(e.length,n);for(var a=t;a<n;++a)r+=z(e[a]);return r}function N(e,t,n){var r=e.length;(!t||0>t)&&(t=0),(!n||0>n||n>r)&&(n=r);for(var a="",o=t;o<n;++o)a+=U(e[o]);return a}function I(e,t,n){for(var r=e.slice(t,n),a="",o=0;o<r.length;o+=2)a+=z(r[o]+256*r[o+1]);return a}function P(e,t,n){if(0!=e%1||0>e)throw new RangeError("offset is not uint");if(e+t>n)throw new RangeError("Trying to access beyond buffer length")}function M(e,t,n,r,a,i){if(!o.isBuffer(e))throw new TypeError("\"buffer\" argument must be a Buffer instance");if(t>a||t<i)throw new RangeError("\"value\" argument is out of bounds");if(n+r>e.length)throw new RangeError("Index out of range")}function D(e,t,n,r){if(n+r>e.length)throw new RangeError("Index out of range");if(0>n)throw new RangeError("Index out of range")}function F(e,t,n,r,a){return t=+t,n>>>=0,a||D(e,t,n,4),$.write(e,t,n,r,23,4),n+4}function O(e,t,n,r,a){return t=+t,n>>>=0,a||D(e,t,n,8),$.write(e,t,n,r,52,8),n+8}function B(e){if(e=e.split("=")[0],e=e.trim().replace(J,""),2>e.length)return "";for(;0!=e.length%4;)e+="=";return e}function U(e){return 16>e?"0"+e.toString(16):e.toString(16)}function j(e,t){t=t||1/0;for(var n,r=e.length,a=null,o=[],d=0;d<r;++d){if(n=e.charCodeAt(d),55295<n&&57344>n){if(!a){if(56319<n){-1<(t-=3)&&o.push(239,191,189);continue}else if(d+1===r){-1<(t-=3)&&o.push(239,191,189);continue}a=n;continue}if(56320>n){-1<(t-=3)&&o.push(239,191,189),a=n;continue}n=(a-55296<<10|n-56320)+65536;}else a&&-1<(t-=3)&&o.push(239,191,189);if(a=null,128>n){if(0>(t-=1))break;o.push(n);}else if(2048>n){if(0>(t-=2))break;o.push(192|n>>6,128|63&n);}else if(65536>n){if(0>(t-=3))break;o.push(224|n>>12,128|63&n>>6,128|63&n);}else if(1114112>n){if(0>(t-=4))break;o.push(240|n>>18,128|63&n>>12,128|63&n>>6,128|63&n);}else throw new Error("Invalid code point")}return o}function q(e){for(var t=[],n=0;n<e.length;++n)t.push(255&e.charCodeAt(n));return t}function W(e,t){for(var n,r,a,o=[],d=0;d<e.length&&!(0>(t-=2));++d)n=e.charCodeAt(d),r=n>>8,a=n%256,o.push(a),o.push(r);return o}function H(e){return X.toByteArray(B(e))}function V(e,t,n,r){for(var a=0;a<r&&!(a+n>=t.length||a>=e.length);++a)t[a+n]=e[a];return a}function G(e,t){return e instanceof t||null!=e&&null!=e.constructor&&null!=e.constructor.name&&e.constructor.name===t.name}function Y(e){return e!==e}var X=e("base64-js"),$=e("ieee754");n.Buffer=o,n.SlowBuffer=function(e){return +e!=e&&(e=0),o.alloc(+e)},n.INSPECT_MAX_BYTES=50;n.kMaxLength=2147483647,o.TYPED_ARRAY_SUPPORT=function(){try{var e=new Uint8Array(1);return e.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===e.foo()}catch(t){return !1}}(),o.TYPED_ARRAY_SUPPORT||"undefined"==typeof console||"function"!=typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),Object.defineProperty(o.prototype,"parent",{enumerable:!0,get:function(){return o.isBuffer(this)?this.buffer:void 0}}),Object.defineProperty(o.prototype,"offset",{enumerable:!0,get:function(){return o.isBuffer(this)?this.byteOffset:void 0}}),"undefined"!=typeof Symbol&&null!=Symbol.species&&o[Symbol.species]===o&&Object.defineProperty(o,Symbol.species,{value:null,configurable:!0,enumerable:!1,writable:!1}),o.poolSize=8192,o.from=function(e,t,n){return i(e,t,n)},o.prototype.__proto__=Uint8Array.prototype,o.__proto__=Uint8Array,o.alloc=function(e,t,n){return s(e,t,n)},o.allocUnsafe=function(e){return l(e)},o.allocUnsafeSlow=function(e){return l(e)},o.isBuffer=function(e){return null!=e&&!0===e._isBuffer&&e!==o.prototype},o.compare=function(e,t){if(G(e,Uint8Array)&&(e=o.from(e,e.offset,e.byteLength)),G(t,Uint8Array)&&(t=o.from(t,t.offset,t.byteLength)),!o.isBuffer(e)||!o.isBuffer(t))throw new TypeError("The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array");if(e===t)return 0;for(var n=e.length,r=t.length,d=0,s=K(n,r);d<s;++d)if(e[d]!==t[d]){n=e[d],r=t[d];break}return n<r?-1:r<n?1:0},o.isEncoding=function(e){switch((e+"").toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return !0;default:return !1;}},o.concat=function(e,t){if(!Array.isArray(e))throw new TypeError("\"list\" argument must be an Array of Buffers");if(0===e.length)return o.alloc(0);var n;if(t===void 0)for(t=0,n=0;n<e.length;++n)t+=e[n].length;var r=o.allocUnsafe(t),a=0;for(n=0;n<e.length;++n){var d=e[n];if(G(d,Uint8Array)&&(d=o.from(d)),!o.isBuffer(d))throw new TypeError("\"list\" argument must be an Array of Buffers");d.copy(r,a),a+=d.length;}return r},o.byteLength=h,o.prototype._isBuffer=!0,o.prototype.swap16=function(){var e=this.length;if(0!=e%2)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var t=0;t<e;t+=2)m(this,t,t+1);return this},o.prototype.swap32=function(){var e=this.length;if(0!=e%4)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var t=0;t<e;t+=4)m(this,t,t+3),m(this,t+1,t+2);return this},o.prototype.swap64=function(){var e=this.length;if(0!=e%8)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var t=0;t<e;t+=8)m(this,t,t+7),m(this,t+1,t+6),m(this,t+2,t+5),m(this,t+3,t+4);return this},o.prototype.toString=function(){var e=this.length;return 0===e?"":0===arguments.length?v(this,0,e):_.apply(this,arguments)},o.prototype.toLocaleString=o.prototype.toString,o.prototype.equals=function(e){if(!o.isBuffer(e))throw new TypeError("Argument must be a Buffer");return this===e||0===o.compare(this,e)},o.prototype.inspect=function(){var e="",t=n.INSPECT_MAX_BYTES;return e=this.toString("hex",0,t).replace(/(.{2})/g,"$1 ").trim(),this.length>t&&(e+=" ... "),"<Buffer "+e+">"},o.prototype.compare=function(e,t,n,r,a){if(G(e,Uint8Array)&&(e=o.from(e,e.offset,e.byteLength)),!o.isBuffer(e))throw new TypeError("The \"target\" argument must be one of type Buffer or Uint8Array. Received type "+typeof e);if(void 0===t&&(t=0),void 0===n&&(n=e?e.length:0),void 0===r&&(r=0),void 0===a&&(a=this.length),0>t||n>e.length||0>r||a>this.length)throw new RangeError("out of range index");if(r>=a&&t>=n)return 0;if(r>=a)return -1;if(t>=n)return 1;if(t>>>=0,n>>>=0,r>>>=0,a>>>=0,this===e)return 0;for(var d=a-r,s=n-t,l=K(d,s),c=this.slice(r,a),u=e.slice(t,n),p=0;p<l;++p)if(c[p]!==u[p]){d=c[p],s=u[p];break}return d<s?-1:s<d?1:0},o.prototype.includes=function(e,t,n){return -1!==this.indexOf(e,t,n)},o.prototype.indexOf=function(e,t,n){return b(this,e,t,n,!0)},o.prototype.lastIndexOf=function(e,t,n){return b(this,e,t,n,!1)},o.prototype.write=function(e,t,n,r){if(void 0===t)r="utf8",n=this.length,t=0;else if(void 0===n&&"string"==typeof t)r=t,n=this.length,t=0;else if(isFinite(t))t>>>=0,isFinite(n)?(n>>>=0,void 0===r&&(r="utf8")):(r=n,n=void 0);else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");var a=this.length-t;if((void 0===n||n>a)&&(n=a),0<e.length&&(0>n||0>t)||t>this.length)throw new RangeError("Attempt to write outside buffer bounds");r||(r="utf8");for(var o=!1;;)switch(r){case"hex":return C(this,e,t,n);case"utf8":case"utf-8":return w(this,e,t,n);case"ascii":return R(this,e,t,n);case"latin1":case"binary":return E(this,e,t,n);case"base64":return S(this,e,t,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return k(this,e,t,n);default:if(o)throw new TypeError("Unknown encoding: "+r);r=(""+r).toLowerCase(),o=!0;}},o.prototype.toJSON=function(){return {type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};o.prototype.slice=function(e,t){var n=this.length;e=~~e,t=void 0===t?n:~~t,0>e?(e+=n,0>e&&(e=0)):e>n&&(e=n),0>t?(t+=n,0>t&&(t=0)):t>n&&(t=n),t<e&&(t=e);var r=this.subarray(e,t);return r.__proto__=o.prototype,r},o.prototype.readUIntLE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var r=this[e],a=1,o=0;++o<t&&(a*=256);)r+=this[e+o]*a;return r},o.prototype.readUIntBE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var r=this[e+--t],a=1;0<t&&(a*=256);)r+=this[e+--t]*a;return r},o.prototype.readUInt8=function(e,t){return e>>>=0,t||P(e,1,this.length),this[e]},o.prototype.readUInt16LE=function(e,t){return e>>>=0,t||P(e,2,this.length),this[e]|this[e+1]<<8},o.prototype.readUInt16BE=function(e,t){return e>>>=0,t||P(e,2,this.length),this[e]<<8|this[e+1]},o.prototype.readUInt32LE=function(e,t){return e>>>=0,t||P(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+16777216*this[e+3]},o.prototype.readUInt32BE=function(e,t){return e>>>=0,t||P(e,4,this.length),16777216*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3])},o.prototype.readIntLE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var a=this[e],o=1,d=0;++d<t&&(o*=256);)a+=this[e+d]*o;return o*=128,a>=o&&(a-=r(2,8*t)),a},o.prototype.readIntBE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var a=t,o=1,d=this[e+--a];0<a&&(o*=256);)d+=this[e+--a]*o;return o*=128,d>=o&&(d-=r(2,8*t)),d},o.prototype.readInt8=function(e,t){return e>>>=0,t||P(e,1,this.length),128&this[e]?-1*(255-this[e]+1):this[e]},o.prototype.readInt16LE=function(e,t){e>>>=0,t||P(e,2,this.length);var n=this[e]|this[e+1]<<8;return 32768&n?4294901760|n:n},o.prototype.readInt16BE=function(e,t){e>>>=0,t||P(e,2,this.length);var n=this[e+1]|this[e]<<8;return 32768&n?4294901760|n:n},o.prototype.readInt32LE=function(e,t){return e>>>=0,t||P(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},o.prototype.readInt32BE=function(e,t){return e>>>=0,t||P(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},o.prototype.readFloatLE=function(e,t){return e>>>=0,t||P(e,4,this.length),$.read(this,e,!0,23,4)},o.prototype.readFloatBE=function(e,t){return e>>>=0,t||P(e,4,this.length),$.read(this,e,!1,23,4)},o.prototype.readDoubleLE=function(e,t){return e>>>=0,t||P(e,8,this.length),$.read(this,e,!0,52,8)},o.prototype.readDoubleBE=function(e,t){return e>>>=0,t||P(e,8,this.length),$.read(this,e,!1,52,8)},o.prototype.writeUIntLE=function(e,t,n,a){if(e=+e,t>>>=0,n>>>=0,!a){var o=r(2,8*n)-1;M(this,e,t,n,o,0);}var d=1,s=0;for(this[t]=255&e;++s<n&&(d*=256);)this[t+s]=255&e/d;return t+n},o.prototype.writeUIntBE=function(e,t,n,a){if(e=+e,t>>>=0,n>>>=0,!a){var o=r(2,8*n)-1;M(this,e,t,n,o,0);}var d=n-1,s=1;for(this[t+d]=255&e;0<=--d&&(s*=256);)this[t+d]=255&e/s;return t+n},o.prototype.writeUInt8=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,1,255,0),this[t]=255&e,t+1},o.prototype.writeUInt16LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,65535,0),this[t]=255&e,this[t+1]=e>>>8,t+2},o.prototype.writeUInt16BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,65535,0),this[t]=e>>>8,this[t+1]=255&e,t+2},o.prototype.writeUInt32LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,4294967295,0),this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=255&e,t+4},o.prototype.writeUInt32BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,4294967295,0),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},o.prototype.writeIntLE=function(e,t,n,a){if(e=+e,t>>>=0,!a){var o=r(2,8*n-1);M(this,e,t,n,o-1,-o);}var d=0,s=1,l=0;for(this[t]=255&e;++d<n&&(s*=256);)0>e&&0===l&&0!==this[t+d-1]&&(l=1),this[t+d]=255&(e/s>>0)-l;return t+n},o.prototype.writeIntBE=function(e,t,n,a){if(e=+e,t>>>=0,!a){var o=r(2,8*n-1);M(this,e,t,n,o-1,-o);}var d=n-1,s=1,l=0;for(this[t+d]=255&e;0<=--d&&(s*=256);)0>e&&0===l&&0!==this[t+d+1]&&(l=1),this[t+d]=255&(e/s>>0)-l;return t+n},o.prototype.writeInt8=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,1,127,-128),0>e&&(e=255+e+1),this[t]=255&e,t+1},o.prototype.writeInt16LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,32767,-32768),this[t]=255&e,this[t+1]=e>>>8,t+2},o.prototype.writeInt16BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,32767,-32768),this[t]=e>>>8,this[t+1]=255&e,t+2},o.prototype.writeInt32LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,2147483647,-2147483648),this[t]=255&e,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24,t+4},o.prototype.writeInt32BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,2147483647,-2147483648),0>e&&(e=4294967295+e+1),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},o.prototype.writeFloatLE=function(e,t,n){return F(this,e,t,!0,n)},o.prototype.writeFloatBE=function(e,t,n){return F(this,e,t,!1,n)},o.prototype.writeDoubleLE=function(e,t,n){return O(this,e,t,!0,n)},o.prototype.writeDoubleBE=function(e,t,n){return O(this,e,t,!1,n)},o.prototype.copy=function(e,t,n,r){if(!o.isBuffer(e))throw new TypeError("argument should be a Buffer");if(n||(n=0),r||0===r||(r=this.length),t>=e.length&&(t=e.length),t||(t=0),0<r&&r<n&&(r=n),r===n)return 0;if(0===e.length||0===this.length)return 0;if(0>t)throw new RangeError("targetStart out of bounds");if(0>n||n>=this.length)throw new RangeError("Index out of range");if(0>r)throw new RangeError("sourceEnd out of bounds");r>this.length&&(r=this.length),e.length-t<r-n&&(r=e.length-t+n);var a=r-n;if(this===e&&"function"==typeof Uint8Array.prototype.copyWithin)this.copyWithin(t,n,r);else if(this===e&&n<t&&t<r)for(var d=a-1;0<=d;--d)e[d+t]=this[d+n];else Uint8Array.prototype.set.call(e,this.subarray(n,r),t);return a},o.prototype.fill=function(e,t,n,r){if("string"==typeof e){if("string"==typeof t?(r=t,t=0,n=this.length):"string"==typeof n&&(r=n,n=this.length),void 0!==r&&"string"!=typeof r)throw new TypeError("encoding must be a string");if("string"==typeof r&&!o.isEncoding(r))throw new TypeError("Unknown encoding: "+r);if(1===e.length){var a=e.charCodeAt(0);("utf8"===r&&128>a||"latin1"===r)&&(e=a);}}else "number"==typeof e&&(e&=255);if(0>t||this.length<t||this.length<n)throw new RangeError("Out of range index");if(n<=t)return this;t>>>=0,n=n===void 0?this.length:n>>>0,e||(e=0);var d;if("number"==typeof e)for(d=t;d<n;++d)this[d]=e;else {var s=o.isBuffer(e)?e:o.from(e,r),l=s.length;if(0===l)throw new TypeError("The value \""+e+"\" is invalid for argument \"value\"");for(d=0;d<n-t;++d)this[d+t]=s[d%l];}return this};var J=/[^+/0-9A-Za-z-_]/g;}).call(this);}).call(this,e("buffer").Buffer);},{"base64-js":1,buffer:3,ieee754:9}],4:[function(e,t){function n(e){console&&console.warn&&console.warn(e);}function r(){r.init.call(this);}function a(e){if("function"!=typeof e)throw new TypeError("The \"listener\" argument must be of type Function. Received type "+typeof e)}function o(e){return void 0===e._maxListeners?r.defaultMaxListeners:e._maxListeners}function i(e,t,r,i){var d,s,l;if(a(r),s=e._events,void 0===s?(s=e._events=Object.create(null),e._eventsCount=0):(void 0!==s.newListener&&(e.emit("newListener",t,r.listener?r.listener:r),s=e._events),l=s[t]),void 0===l)l=s[t]=r,++e._eventsCount;else if("function"==typeof l?l=s[t]=i?[r,l]:[l,r]:i?l.unshift(r):l.push(r),d=o(e),0<d&&l.length>d&&!l.warned){l.warned=!0;var c=new Error("Possible EventEmitter memory leak detected. "+l.length+" "+(t+" listeners added. Use emitter.setMaxListeners() to increase limit"));c.name="MaxListenersExceededWarning",c.emitter=e,c.type=t,c.count=l.length,n(c);}return e}function d(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function s(e,t,n){var r={fired:!1,wrapFn:void 0,target:e,type:t,listener:n},a=d.bind(r);return a.listener=n,r.wrapFn=a,a}function l(e,t,n){var r=e._events;if(r===void 0)return [];var a=r[t];return void 0===a?[]:"function"==typeof a?n?[a.listener||a]:[a]:n?f(a):u(a,a.length)}function c(e){var t=this._events;if(t!==void 0){var n=t[e];if("function"==typeof n)return 1;if(void 0!==n)return n.length}return 0}function u(e,t){for(var n=Array(t),r=0;r<t;++r)n[r]=e[r];return n}function p(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop();}function f(e){for(var t=Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}var g,h="object"==typeof Reflect?Reflect:null,_=h&&"function"==typeof h.apply?h.apply:function(e,t,n){return Function.prototype.apply.call(e,t,n)};g=h&&"function"==typeof h.ownKeys?h.ownKeys:Object.getOwnPropertySymbols?function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:function(e){return Object.getOwnPropertyNames(e)};var m=Number.isNaN||function(e){return e!==e};t.exports=r,t.exports.once=function(e,t){return new Promise(function(n,r){function a(){o!==void 0&&e.removeListener("error",o),n([].slice.call(arguments));}var o;"error"!==t&&(o=function(n){e.removeListener(t,a),r(n);},e.once("error",o)),e.once(t,a);})},r.EventEmitter=r,r.prototype._events=void 0,r.prototype._eventsCount=0,r.prototype._maxListeners=void 0;var b=10;Object.defineProperty(r,"defaultMaxListeners",{enumerable:!0,get:function(){return b},set:function(e){if("number"!=typeof e||0>e||m(e))throw new RangeError("The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received "+e+".");b=e;}}),r.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0;},r.prototype.setMaxListeners=function(e){if("number"!=typeof e||0>e||m(e))throw new RangeError("The value of \"n\" is out of range. It must be a non-negative number. Received "+e+".");return this._maxListeners=e,this},r.prototype.getMaxListeners=function(){return o(this)},r.prototype.emit=function(e){for(var t=[],n=1;n<arguments.length;n++)t.push(arguments[n]);var r="error"===e,a=this._events;if(a!==void 0)r=r&&a.error===void 0;else if(!r)return !1;if(r){var o;if(0<t.length&&(o=t[0]),o instanceof Error)throw o;var d=new Error("Unhandled error."+(o?" ("+o.message+")":""));throw d.context=o,d}var s=a[e];if(s===void 0)return !1;if("function"==typeof s)_(s,this,t);else for(var l=s.length,c=u(s,l),n=0;n<l;++n)_(c[n],this,t);return !0},r.prototype.addListener=function(e,t){return i(this,e,t,!1)},r.prototype.on=r.prototype.addListener,r.prototype.prependListener=function(e,t){return i(this,e,t,!0)},r.prototype.once=function(e,t){return a(t),this.on(e,s(this,e,t)),this},r.prototype.prependOnceListener=function(e,t){return a(t),this.prependListener(e,s(this,e,t)),this},r.prototype.removeListener=function(e,t){var n,r,o,d,s;if(a(t),r=this._events,void 0===r)return this;if(n=r[e],void 0===n)return this;if(n===t||n.listener===t)0==--this._eventsCount?this._events=Object.create(null):(delete r[e],r.removeListener&&this.emit("removeListener",e,n.listener||t));else if("function"!=typeof n){for(o=-1,d=n.length-1;0<=d;d--)if(n[d]===t||n[d].listener===t){s=n[d].listener,o=d;break}if(0>o)return this;0===o?n.shift():p(n,o),1===n.length&&(r[e]=n[0]),void 0!==r.removeListener&&this.emit("removeListener",e,s||t);}return this},r.prototype.off=r.prototype.removeListener,r.prototype.removeAllListeners=function(e){var t,n,r;if(n=this._events,void 0===n)return this;if(void 0===n.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==n[e]&&(0==--this._eventsCount?this._events=Object.create(null):delete n[e]),this;if(0===arguments.length){var a,o=Object.keys(n);for(r=0;r<o.length;++r)a=o[r],"removeListener"===a||this.removeAllListeners(a);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(t=n[e],"function"==typeof t)this.removeListener(e,t);else if(void 0!==t)for(r=t.length-1;0<=r;r--)this.removeListener(e,t[r]);return this},r.prototype.listeners=function(e){return l(this,e,!0)},r.prototype.rawListeners=function(e){return l(this,e,!1)},r.listenerCount=function(e,t){return "function"==typeof e.listenerCount?e.listenerCount(t):c.call(e,t)},r.prototype.listenerCount=c,r.prototype.eventNames=function(){return 0<this._eventsCount?g(this._events):[]};},{}],5:[function(e,t,n){(function(a){(function(){function r(){let e;try{e=n.storage.getItem("debug");}catch(e){}return !e&&"undefined"!=typeof a&&"env"in a&&(e=a.env.DEBUG),e}n.formatArgs=function(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+t.exports.humanize(this.diff),!this.useColors)return;const n="color: "+this.color;e.splice(1,0,n,"color: inherit");let r=0,a=0;e[0].replace(/%[a-zA-Z%]/g,e=>{"%%"===e||(r++,"%c"===e&&(a=r));}),e.splice(a,0,n);},n.save=function(e){try{e?n.storage.setItem("debug",e):n.storage.removeItem("debug");}catch(e){}},n.load=r,n.useColors=function(){return !!("undefined"!=typeof window&&window.process&&("renderer"===window.process.type||window.process.__nwjs))||!("undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))&&("undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&31<=parseInt(RegExp.$1,10)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))},n.storage=function(){try{return localStorage}catch(e){}}(),n.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],n.log=console.debug||console.log||(()=>{}),t.exports=e("./common")(n);const{formatters:o}=t.exports;o.j=function(e){try{return JSON.stringify(e)}catch(e){return "[UnexpectedJSONParseError]: "+e.message}};}).call(this);}).call(this,e("_process"));},{"./common":6,_process:12}],6:[function(e,t){t.exports=function(t){function r(e){function t(...e){if(!t.enabled)return;const a=t,o=+new Date,i=o-(n||o);a.diff=i,a.prev=n,a.curr=o,n=o,e[0]=r.coerce(e[0]),"string"!=typeof e[0]&&e.unshift("%O");let d=0;e[0]=e[0].replace(/%([a-zA-Z%])/g,(t,n)=>{if("%%"===t)return t;d++;const o=r.formatters[n];if("function"==typeof o){const n=e[d];t=o.call(a,n),e.splice(d,1),d--;}return t}),r.formatArgs.call(a,e);const s=a.log||r.log;s.apply(a,e);}let n;return t.namespace=e,t.enabled=r.enabled(e),t.useColors=r.useColors(),t.color=r.selectColor(e),t.destroy=a,t.extend=o,"function"==typeof r.init&&r.init(t),r.instances.push(t),t}function a(){const e=r.instances.indexOf(this);return -1!==e&&(r.instances.splice(e,1),!0)}function o(e,t){const n=r(this.namespace+("undefined"==typeof t?":":t)+e);return n.log=this.log,n}function i(e){return e.toString().substring(2,e.toString().length-2).replace(/\.\*\?$/,"*")}return r.debug=r,r.default=r,r.coerce=function(e){return e instanceof Error?e.stack||e.message:e},r.disable=function(){const e=[...r.names.map(i),...r.skips.map(i).map(e=>"-"+e)].join(",");return r.enable(""),e},r.enable=function(e){r.save(e),r.names=[],r.skips=[];let t;const n=("string"==typeof e?e:"").split(/[\s,]+/),a=n.length;for(t=0;t<a;t++)n[t]&&(e=n[t].replace(/\*/g,".*?"),"-"===e[0]?r.skips.push(new RegExp("^"+e.substr(1)+"$")):r.names.push(new RegExp("^"+e+"$")));for(t=0;t<r.instances.length;t++){const e=r.instances[t];e.enabled=r.enabled(e.namespace);}},r.enabled=function(e){if("*"===e[e.length-1])return !0;let t,n;for(t=0,n=r.skips.length;t<n;t++)if(r.skips[t].test(e))return !1;for(t=0,n=r.names.length;t<n;t++)if(r.names[t].test(e))return !0;return !1},r.humanize=e("ms"),Object.keys(t).forEach(e=>{r[e]=t[e];}),r.instances=[],r.names=[],r.skips=[],r.formatters={},r.selectColor=function(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t|=0;return r.colors[n(t)%r.colors.length]},r.enable(r.load()),r};},{ms:11}],7:[function(e,t){function n(e,t){for(const n in t)Object.defineProperty(e,n,{value:t[n],enumerable:!0,configurable:!0});return e}t.exports=function(e,t,r){if(!e||"string"==typeof e)throw new TypeError("Please pass an Error to err-code");r||(r={}),"object"==typeof t&&(r=t,t=void 0),null!=t&&(r.code=t);try{return n(e,r)}catch(t){r.message=e.message,r.stack=e.stack;const a=function(){};return a.prototype=Object.create(Object.getPrototypeOf(e)),n(new a,r)}};},{}],8:[function(e,t){t.exports=function(){if("undefined"==typeof window)return null;var e={RTCPeerConnection:window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection,RTCSessionDescription:window.RTCSessionDescription||window.mozRTCSessionDescription||window.webkitRTCSessionDescription,RTCIceCandidate:window.RTCIceCandidate||window.mozRTCIceCandidate||window.webkitRTCIceCandidate};return e.RTCPeerConnection?e:null};},{}],9:[function(e,a,o){/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */o.read=function(t,n,a,o,l){var c,u,p=8*l-o-1,f=(1<<p)-1,g=f>>1,h=-7,_=a?l-1:0,b=a?-1:1,d=t[n+_];for(_+=b,c=d&(1<<-h)-1,d>>=-h,h+=p;0<h;c=256*c+t[n+_],_+=b,h-=8);for(u=c&(1<<-h)-1,c>>=-h,h+=o;0<h;u=256*u+t[n+_],_+=b,h-=8);if(0===c)c=1-g;else {if(c===f)return u?NaN:(d?-1:1)*(1/0);u+=r(2,o),c-=g;}return (d?-1:1)*u*r(2,c-o)},o.write=function(a,o,l,u,p,f){var _,b,y,g=Math.LN2,h=Math.log,C=8*f-p-1,w=(1<<C)-1,R=w>>1,E=23===p?r(2,-24)-r(2,-77):0,S=u?0:f-1,k=u?1:-1,d=0>o||0===o&&0>1/o?1:0;for(o=n(o),isNaN(o)||o===1/0?(b=isNaN(o)?1:0,_=w):(_=t(h(o)/g),1>o*(y=r(2,-_))&&(_--,y*=2),o+=1<=_+R?E/y:E*r(2,1-R),2<=o*y&&(_++,y/=2),_+R>=w?(b=0,_=w):1<=_+R?(b=(o*y-1)*r(2,p),_+=R):(b=o*r(2,R-1)*r(2,p),_=0));8<=p;a[l+S]=255&b,S+=k,b/=256,p-=8);for(_=_<<p|b,C+=p;0<C;a[l+S]=255&_,S+=k,_/=256,C-=8);a[l+S-k]|=128*d;};},{}],10:[function(e,t){t.exports="function"==typeof Object.create?function(e,t){t&&(e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}));}:function(e,t){if(t){e.super_=t;var n=function(){};n.prototype=t.prototype,e.prototype=new n,e.prototype.constructor=e;}};},{}],11:[function(e,t){var s=Math.round;function r(e){if(e+="",!(100<e.length)){var t=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(t){var r=parseFloat(t[1]),n=(t[2]||"ms").toLowerCase();return "years"===n||"year"===n||"yrs"===n||"yr"===n||"y"===n?31557600000*r:"weeks"===n||"week"===n||"w"===n?604800000*r:"days"===n||"day"===n||"d"===n?86400000*r:"hours"===n||"hour"===n||"hrs"===n||"hr"===n||"h"===n?3600000*r:"minutes"===n||"minute"===n||"mins"===n||"min"===n||"m"===n?60000*r:"seconds"===n||"second"===n||"secs"===n||"sec"===n||"s"===n?1000*r:"milliseconds"===n||"millisecond"===n||"msecs"===n||"msec"===n||"ms"===n?r:void 0}}}function a(e){var t=n(e);return 86400000<=t?s(e/86400000)+"d":3600000<=t?s(e/3600000)+"h":60000<=t?s(e/60000)+"m":1000<=t?s(e/1000)+"s":e+"ms"}function o(e){var t=n(e);return 86400000<=t?i(e,t,86400000,"day"):3600000<=t?i(e,t,3600000,"hour"):60000<=t?i(e,t,60000,"minute"):1000<=t?i(e,t,1000,"second"):e+" ms"}function i(e,t,r,n){return s(e/r)+" "+n+(t>=1.5*r?"s":"")}t.exports=function(e,t){t=t||{};var n=typeof e;if("string"==n&&0<e.length)return r(e);if("number"===n&&isFinite(e))return t.long?o(e):a(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};},{}],12:[function(e,t){function n(){throw new Error("setTimeout has not been defined")}function r(){throw new Error("clearTimeout has not been defined")}function a(t){if(c===setTimeout)return setTimeout(t,0);if((c===n||!c)&&setTimeout)return c=setTimeout,setTimeout(t,0);try{return c(t,0)}catch(n){try{return c.call(null,t,0)}catch(n){return c.call(this,t,0)}}}function o(t){if(u===clearTimeout)return clearTimeout(t);if((u===r||!u)&&clearTimeout)return u=clearTimeout,clearTimeout(t);try{return u(t)}catch(n){try{return u.call(null,t)}catch(n){return u.call(this,t)}}}function i(){h&&f&&(h=!1,f.length?g=f.concat(g):_=-1,g.length&&d());}function d(){if(!h){var e=a(i);h=!0;for(var t=g.length;t;){for(f=g,g=[];++_<t;)f&&f[_].run();_=-1,t=g.length;}f=null,h=!1,o(e);}}function s(e,t){this.fun=e,this.array=t;}function l(){}var c,u,p=t.exports={};(function(){try{c="function"==typeof setTimeout?setTimeout:n;}catch(t){c=n;}try{u="function"==typeof clearTimeout?clearTimeout:r;}catch(t){u=r;}})();var f,g=[],h=!1,_=-1;p.nextTick=function(e){var t=Array(arguments.length-1);if(1<arguments.length)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];g.push(new s(e,t)),1!==g.length||h||a(d);},s.prototype.run=function(){this.fun.apply(null,this.array);},p.title="browser",p.browser=!0,p.env={},p.argv=[],p.version="",p.versions={},p.on=l,p.addListener=l,p.once=l,p.off=l,p.removeListener=l,p.removeAllListeners=l,p.emit=l,p.prependListener=l,p.prependOnceListener=l,p.listeners=function(){return []},p.binding=function(){throw new Error("process.binding is not supported")},p.cwd=function(){return "/"},p.chdir=function(){throw new Error("process.chdir is not supported")},p.umask=function(){return 0};},{}],13:[function(e,t){/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */let n;t.exports="function"==typeof queueMicrotask?queueMicrotask.bind(globalThis):e=>(n||(n=Promise.resolve())).then(e).catch(e=>setTimeout(()=>{throw e},0));},{}],14:[function(e,t){(function(n,r){(function(){var a=e("safe-buffer").Buffer,o=r.crypto||r.msCrypto;t.exports=o&&o.getRandomValues?function(e,t){if(e>4294967295)throw new RangeError("requested too many random bytes");var r=a.allocUnsafe(e);if(0<e)if(65536<e)for(var i=0;i<e;i+=65536)o.getRandomValues(r.slice(i,i+65536));else o.getRandomValues(r);return "function"==typeof t?n.nextTick(function(){t(null,r);}):r}:function(){throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11")};}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{_process:12,"safe-buffer":30}],15:[function(e,t){function n(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e.__proto__=t;}function r(e,t,r){function a(e,n,r){return "string"==typeof t?t:t(e,n,r)}r||(r=Error);var o=function(e){function t(t,n,r){return e.call(this,a(t,n,r))||this}return n(t,e),t}(r);o.prototype.name=r.name,o.prototype.code=e,s[e]=o;}function a(e,t){if(Array.isArray(e)){var n=e.length;return e=e.map(function(e){return e+""}),2<n?"one of ".concat(t," ").concat(e.slice(0,n-1).join(", "),", or ")+e[n-1]:2===n?"one of ".concat(t," ").concat(e[0]," or ").concat(e[1]):"of ".concat(t," ").concat(e[0])}return "of ".concat(t," ").concat(e+"")}function o(e,t,n){return e.substr(!n||0>n?0:+n,t.length)===t}function i(e,t,n){return (void 0===n||n>e.length)&&(n=e.length),e.substring(n-t.length,n)===t}function d(e,t,n){return "number"!=typeof n&&(n=0),!(n+t.length>e.length)&&-1!==e.indexOf(t,n)}var s={};r("ERR_INVALID_OPT_VALUE",function(e,t){return "The value \""+t+"\" is invalid for option \""+e+"\""},TypeError),r("ERR_INVALID_ARG_TYPE",function(e,t,n){var r;"string"==typeof t&&o(t,"not ")?(r="must not be",t=t.replace(/^not /,"")):r="must be";var s;if(i(e," argument"))s="The ".concat(e," ").concat(r," ").concat(a(t,"type"));else {var l=d(e,".")?"property":"argument";s="The \"".concat(e,"\" ").concat(l," ").concat(r," ").concat(a(t,"type"));}return s+=". Received type ".concat(typeof n),s},TypeError),r("ERR_STREAM_PUSH_AFTER_EOF","stream.push() after EOF"),r("ERR_METHOD_NOT_IMPLEMENTED",function(e){return "The "+e+" method is not implemented"}),r("ERR_STREAM_PREMATURE_CLOSE","Premature close"),r("ERR_STREAM_DESTROYED",function(e){return "Cannot call "+e+" after a stream was destroyed"}),r("ERR_MULTIPLE_CALLBACK","Callback called multiple times"),r("ERR_STREAM_CANNOT_PIPE","Cannot pipe, not readable"),r("ERR_STREAM_WRITE_AFTER_END","write after end"),r("ERR_STREAM_NULL_VALUES","May not write null values to stream",TypeError),r("ERR_UNKNOWN_ENCODING",function(e){return "Unknown encoding: "+e},TypeError),r("ERR_STREAM_UNSHIFT_AFTER_END_EVENT","stream.unshift() after end event"),t.exports.codes=s;},{}],16:[function(e,t){(function(n){(function(){function r(e){return this instanceof r?void(d.call(this,e),s.call(this,e),this.allowHalfOpen=!0,e&&(!1===e.readable&&(this.readable=!1),!1===e.writable&&(this.writable=!1),!1===e.allowHalfOpen&&(this.allowHalfOpen=!1,this.once("end",a)))):new r(e)}function a(){this._writableState.ended||n.nextTick(o,this);}function o(e){e.end();}var i=Object.keys||function(e){var t=[];for(var n in e)t.push(n);return t};t.exports=r;var d=e("./_stream_readable"),s=e("./_stream_writable");e("inherits")(r,d);for(var l,c=i(s.prototype),u=0;u<c.length;u++)l=c[u],r.prototype[l]||(r.prototype[l]=s.prototype[l]);Object.defineProperty(r.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}}),Object.defineProperty(r.prototype,"writableBuffer",{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}}),Object.defineProperty(r.prototype,"writableLength",{enumerable:!1,get:function(){return this._writableState.length}}),Object.defineProperty(r.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._readableState&&void 0!==this._writableState&&this._readableState.destroyed&&this._writableState.destroyed},set:function(e){void 0===this._readableState||void 0===this._writableState||(this._readableState.destroyed=e,this._writableState.destroyed=e);}});}).call(this);}).call(this,e("_process"));},{"./_stream_readable":18,"./_stream_writable":20,_process:12,inherits:10}],17:[function(e,t){function n(e){return this instanceof n?void r.call(this,e):new n(e)}t.exports=n;var r=e("./_stream_transform");e("inherits")(n,r),n.prototype._transform=function(e,t,n){n(null,e);};},{"./_stream_transform":19,inherits:10}],18:[function(e,t){(function(n,r){(function(){function a(e){return M.from(e)}function o(e){return M.isBuffer(e)||e instanceof D}function i(e,t,n){return "function"==typeof e.prependListener?e.prependListener(t,n):void(e._events&&e._events[t]?Array.isArray(e._events[t])?e._events[t].unshift(n):e._events[t]=[n,e._events[t]]:e.on(t,n))}function d(t,n,r){A=A||e("./_stream_duplex"),t=t||{},"boolean"!=typeof r&&(r=n instanceof A),this.objectMode=!!t.objectMode,r&&(this.objectMode=this.objectMode||!!t.readableObjectMode),this.highWaterMark=H(this,t,"readableHighWaterMark",r),this.buffer=new j,this.length=0,this.pipes=null,this.pipesCount=0,this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this.paused=!0,this.emitClose=!1!==t.emitClose,this.autoDestroy=!!t.autoDestroy,this.destroyed=!1,this.defaultEncoding=t.defaultEncoding||"utf8",this.awaitDrain=0,this.readingMore=!1,this.decoder=null,this.encoding=null,t.encoding&&(!O&&(O=e("string_decoder/").StringDecoder),this.decoder=new O(t.encoding),this.encoding=t.encoding);}function s(t){if(A=A||e("./_stream_duplex"),!(this instanceof s))return new s(t);var n=this instanceof A;this._readableState=new d(t,this,n),this.readable=!0,t&&("function"==typeof t.read&&(this._read=t.read),"function"==typeof t.destroy&&(this._destroy=t.destroy)),P.call(this);}function l(e,t,n,r,o){x("readableAddChunk",t);var i=e._readableState;if(null===t)i.reading=!1,g(e,i);else {var d;if(o||(d=u(i,t)),d)X(e,d);else if(!(i.objectMode||t&&0<t.length))r||(i.reading=!1,m(e,i));else if("string"==typeof t||i.objectMode||Object.getPrototypeOf(t)===M.prototype||(t=a(t)),r)i.endEmitted?X(e,new K):c(e,i,t,!0);else if(i.ended)X(e,new Y);else {if(i.destroyed)return !1;i.reading=!1,i.decoder&&!n?(t=i.decoder.write(t),i.objectMode||0!==t.length?c(e,i,t,!1):m(e,i)):c(e,i,t,!1);}}return !i.ended&&(i.length<i.highWaterMark||0===i.length)}function c(e,t,n,r){t.flowing&&0===t.length&&!t.sync?(t.awaitDrain=0,e.emit("data",n)):(t.length+=t.objectMode?1:n.length,r?t.buffer.unshift(n):t.buffer.push(n),t.needReadable&&h(e)),m(e,t);}function u(e,t){var n;return o(t)||"string"==typeof t||void 0===t||e.objectMode||(n=new G("chunk",["string","Buffer","Uint8Array"],t)),n}function p(e){return 1073741824<=e?e=1073741824:(e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++),e}function f(e,t){return 0>=e||0===t.length&&t.ended?0:t.objectMode?1:e===e?(e>t.highWaterMark&&(t.highWaterMark=p(e)),e<=t.length?e:t.ended?t.length:(t.needReadable=!0,0)):t.flowing&&t.length?t.buffer.head.data.length:t.length}function g(e,t){if(x("onEofChunk"),!t.ended){if(t.decoder){var n=t.decoder.end();n&&n.length&&(t.buffer.push(n),t.length+=t.objectMode?1:n.length);}t.ended=!0,t.sync?h(e):(t.needReadable=!1,!t.emittedReadable&&(t.emittedReadable=!0,_(e)));}}function h(e){var t=e._readableState;x("emitReadable",t.needReadable,t.emittedReadable),t.needReadable=!1,t.emittedReadable||(x("emitReadable",t.flowing),t.emittedReadable=!0,n.nextTick(_,e));}function _(e){var t=e._readableState;x("emitReadable_",t.destroyed,t.length,t.ended),!t.destroyed&&(t.length||t.ended)&&(e.emit("readable"),t.emittedReadable=!1),t.needReadable=!t.flowing&&!t.ended&&t.length<=t.highWaterMark,S(e);}function m(e,t){t.readingMore||(t.readingMore=!0,n.nextTick(b,e,t));}function b(e,t){for(;!t.reading&&!t.ended&&(t.length<t.highWaterMark||t.flowing&&0===t.length);){var n=t.length;if(x("maybeReadMore read 0"),e.read(0),n===t.length)break}t.readingMore=!1;}function y(e){return function(){var t=e._readableState;x("pipeOnDrain",t.awaitDrain),t.awaitDrain&&t.awaitDrain--,0===t.awaitDrain&&I(e,"data")&&(t.flowing=!0,S(e));}}function C(e){var t=e._readableState;t.readableListening=0<e.listenerCount("readable"),t.resumeScheduled&&!t.paused?t.flowing=!0:0<e.listenerCount("data")&&e.resume();}function w(e){x("readable nexttick read 0"),e.read(0);}function R(e,t){t.resumeScheduled||(t.resumeScheduled=!0,n.nextTick(E,e,t));}function E(e,t){x("resume",t.reading),t.reading||e.read(0),t.resumeScheduled=!1,e.emit("resume"),S(e),t.flowing&&!t.reading&&e.read(0);}function S(e){var t=e._readableState;for(x("flow",t.flowing);t.flowing&&null!==e.read(););}function k(e,t){if(0===t.length)return null;var n;return t.objectMode?n=t.buffer.shift():!e||e>=t.length?(n=t.decoder?t.buffer.join(""):1===t.buffer.length?t.buffer.first():t.buffer.concat(t.length),t.buffer.clear()):n=t.buffer.consume(e,t.decoder),n}function T(e){var t=e._readableState;x("endReadable",t.endEmitted),t.endEmitted||(t.ended=!0,n.nextTick(v,t,e));}function v(e,t){if(x("endReadableNT",e.endEmitted,e.length),!e.endEmitted&&0===e.length&&(e.endEmitted=!0,t.readable=!1,t.emit("end"),e.autoDestroy)){var n=t._writableState;(!n||n.autoDestroy&&n.finished)&&t.destroy();}}function L(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return -1}t.exports=s;var A;s.ReadableState=d;var x,N=e("events").EventEmitter,I=function(e,t){return e.listeners(t).length},P=e("./internal/streams/stream"),M=e("buffer").Buffer,D=r.Uint8Array||function(){},F=e("util");x=F&&F.debuglog?F.debuglog("stream"):function(){};var O,B,U,j=e("./internal/streams/buffer_list"),q=e("./internal/streams/destroy"),W=e("./internal/streams/state"),H=W.getHighWaterMark,V=e("../errors").codes,G=V.ERR_INVALID_ARG_TYPE,Y=V.ERR_STREAM_PUSH_AFTER_EOF,z=V.ERR_METHOD_NOT_IMPLEMENTED,K=V.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;e("inherits")(s,P);var X=q.errorOrDestroy,$=["error","close","destroy","pause","resume"];Object.defineProperty(s.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._readableState&&this._readableState.destroyed},set:function(e){this._readableState&&(this._readableState.destroyed=e);}}),s.prototype.destroy=q.destroy,s.prototype._undestroy=q.undestroy,s.prototype._destroy=function(e,t){t(e);},s.prototype.push=function(e,t){var n,r=this._readableState;return r.objectMode?n=!0:"string"==typeof e&&(t=t||r.defaultEncoding,t!==r.encoding&&(e=M.from(e,t),t=""),n=!0),l(this,e,t,!1,n)},s.prototype.unshift=function(e){return l(this,e,null,!0,!1)},s.prototype.isPaused=function(){return !1===this._readableState.flowing},s.prototype.setEncoding=function(t){O||(O=e("string_decoder/").StringDecoder);var n=new O(t);this._readableState.decoder=n,this._readableState.encoding=this._readableState.decoder.encoding;for(var r=this._readableState.buffer.head,a="";null!==r;)a+=n.write(r.data),r=r.next;return this._readableState.buffer.clear(),""!==a&&this._readableState.buffer.push(a),this._readableState.length=a.length,this};s.prototype.read=function(e){x("read",e),e=parseInt(e,10);var t=this._readableState,r=e;if(0!==e&&(t.emittedReadable=!1),0===e&&t.needReadable&&((0===t.highWaterMark?0<t.length:t.length>=t.highWaterMark)||t.ended))return x("read: emitReadable",t.length,t.ended),0===t.length&&t.ended?T(this):h(this),null;if(e=f(e,t),0===e&&t.ended)return 0===t.length&&T(this),null;var a=t.needReadable;x("need readable",a),(0===t.length||t.length-e<t.highWaterMark)&&(a=!0,x("length less than watermark",a)),t.ended||t.reading?(a=!1,x("reading or ended",a)):a&&(x("do read"),t.reading=!0,t.sync=!0,0===t.length&&(t.needReadable=!0),this._read(t.highWaterMark),t.sync=!1,!t.reading&&(e=f(r,t)));var o;return o=0<e?k(e,t):null,null===o?(t.needReadable=t.length<=t.highWaterMark,e=0):(t.length-=e,t.awaitDrain=0),0===t.length&&(!t.ended&&(t.needReadable=!0),r!==e&&t.ended&&T(this)),null!==o&&this.emit("data",o),o},s.prototype._read=function(){X(this,new z("_read()"));},s.prototype.pipe=function(e,t){function r(e,t){x("onunpipe"),e===p&&t&&!1===t.hasUnpiped&&(t.hasUnpiped=!0,o());}function a(){x("onend"),e.end();}function o(){x("cleanup"),e.removeListener("close",l),e.removeListener("finish",c),e.removeListener("drain",_),e.removeListener("error",s),e.removeListener("unpipe",r),p.removeListener("end",a),p.removeListener("end",u),p.removeListener("data",d),m=!0,f.awaitDrain&&(!e._writableState||e._writableState.needDrain)&&_();}function d(t){x("ondata");var n=e.write(t);x("dest.write",n),!1===n&&((1===f.pipesCount&&f.pipes===e||1<f.pipesCount&&-1!==L(f.pipes,e))&&!m&&(x("false write response, pause",f.awaitDrain),f.awaitDrain++),p.pause());}function s(t){x("onerror",t),u(),e.removeListener("error",s),0===I(e,"error")&&X(e,t);}function l(){e.removeListener("finish",c),u();}function c(){x("onfinish"),e.removeListener("close",l),u();}function u(){x("unpipe"),p.unpipe(e);}var p=this,f=this._readableState;switch(f.pipesCount){case 0:f.pipes=e;break;case 1:f.pipes=[f.pipes,e];break;default:f.pipes.push(e);}f.pipesCount+=1,x("pipe count=%d opts=%j",f.pipesCount,t);var g=(!t||!1!==t.end)&&e!==n.stdout&&e!==n.stderr,h=g?a:u;f.endEmitted?n.nextTick(h):p.once("end",h),e.on("unpipe",r);var _=y(p);e.on("drain",_);var m=!1;return p.on("data",d),i(e,"error",s),e.once("close",l),e.once("finish",c),e.emit("pipe",p),f.flowing||(x("pipe resume"),p.resume()),e},s.prototype.unpipe=function(e){var t=this._readableState,n={hasUnpiped:!1};if(0===t.pipesCount)return this;if(1===t.pipesCount)return e&&e!==t.pipes?this:(e||(e=t.pipes),t.pipes=null,t.pipesCount=0,t.flowing=!1,e&&e.emit("unpipe",this,n),this);if(!e){var r=t.pipes,a=t.pipesCount;t.pipes=null,t.pipesCount=0,t.flowing=!1;for(var o=0;o<a;o++)r[o].emit("unpipe",this,{hasUnpiped:!1});return this}var d=L(t.pipes,e);return -1===d?this:(t.pipes.splice(d,1),t.pipesCount-=1,1===t.pipesCount&&(t.pipes=t.pipes[0]),e.emit("unpipe",this,n),this)},s.prototype.on=function(e,t){var r=P.prototype.on.call(this,e,t),a=this._readableState;return "data"===e?(a.readableListening=0<this.listenerCount("readable"),!1!==a.flowing&&this.resume()):"readable"==e&&!a.endEmitted&&!a.readableListening&&(a.readableListening=a.needReadable=!0,a.flowing=!1,a.emittedReadable=!1,x("on readable",a.length,a.reading),a.length?h(this):!a.reading&&n.nextTick(w,this)),r},s.prototype.addListener=s.prototype.on,s.prototype.removeListener=function(e,t){var r=P.prototype.removeListener.call(this,e,t);return "readable"===e&&n.nextTick(C,this),r},s.prototype.removeAllListeners=function(e){var t=P.prototype.removeAllListeners.apply(this,arguments);return ("readable"===e||void 0===e)&&n.nextTick(C,this),t},s.prototype.resume=function(){var e=this._readableState;return e.flowing||(x("resume"),e.flowing=!e.readableListening,R(this,e)),e.paused=!1,this},s.prototype.pause=function(){return x("call pause flowing=%j",this._readableState.flowing),!1!==this._readableState.flowing&&(x("pause"),this._readableState.flowing=!1,this.emit("pause")),this._readableState.paused=!0,this},s.prototype.wrap=function(e){var t=this,r=this._readableState,a=!1;for(var o in e.on("end",function(){if(x("wrapped end"),r.decoder&&!r.ended){var e=r.decoder.end();e&&e.length&&t.push(e);}t.push(null);}),e.on("data",function(n){if((x("wrapped data"),r.decoder&&(n=r.decoder.write(n)),!(r.objectMode&&(null===n||void 0===n)))&&(r.objectMode||n&&n.length)){var o=t.push(n);o||(a=!0,e.pause());}}),e)void 0===this[o]&&"function"==typeof e[o]&&(this[o]=function(t){return function(){return e[t].apply(e,arguments)}}(o));for(var i=0;i<$.length;i++)e.on($[i],this.emit.bind(this,$[i]));return this._read=function(t){x("wrapped _read",t),a&&(a=!1,e.resume());},this},"function"==typeof Symbol&&(s.prototype[Symbol.asyncIterator]=function(){return void 0===B&&(B=e("./internal/streams/async_iterator")),B(this)}),Object.defineProperty(s.prototype,"readableHighWaterMark",{enumerable:!1,get:function(){return this._readableState.highWaterMark}}),Object.defineProperty(s.prototype,"readableBuffer",{enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}}),Object.defineProperty(s.prototype,"readableFlowing",{enumerable:!1,get:function(){return this._readableState.flowing},set:function(e){this._readableState&&(this._readableState.flowing=e);}}),s._fromList=k,Object.defineProperty(s.prototype,"readableLength",{enumerable:!1,get:function(){return this._readableState.length}}),"function"==typeof Symbol&&(s.from=function(t,n){return void 0===U&&(U=e("./internal/streams/from")),U(s,t,n)});}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{"../errors":15,"./_stream_duplex":16,"./internal/streams/async_iterator":21,"./internal/streams/buffer_list":22,"./internal/streams/destroy":23,"./internal/streams/from":25,"./internal/streams/state":27,"./internal/streams/stream":28,_process:12,buffer:3,events:4,inherits:10,"string_decoder/":31,util:2}],19:[function(e,t){function n(e,t){var n=this._transformState;n.transforming=!1;var r=n.writecb;if(null===r)return this.emit("error",new s);n.writechunk=null,n.writecb=null,null!=t&&this.push(t),r(e);var a=this._readableState;a.reading=!1,(a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark);}function r(e){return this instanceof r?void(u.call(this,e),this._transformState={afterTransform:n.bind(this),needTransform:!1,transforming:!1,writecb:null,writechunk:null,writeencoding:null},this._readableState.needReadable=!0,this._readableState.sync=!1,e&&("function"==typeof e.transform&&(this._transform=e.transform),"function"==typeof e.flush&&(this._flush=e.flush)),this.on("prefinish",a)):new r(e)}function a(){var e=this;"function"!=typeof this._flush||this._readableState.destroyed?o(this,null,null):this._flush(function(t,n){o(e,t,n);});}function o(e,t,n){if(t)return e.emit("error",t);if(null!=n&&e.push(n),e._writableState.length)throw new c;if(e._transformState.transforming)throw new l;return e.push(null)}t.exports=r;var i=e("../errors").codes,d=i.ERR_METHOD_NOT_IMPLEMENTED,s=i.ERR_MULTIPLE_CALLBACK,l=i.ERR_TRANSFORM_ALREADY_TRANSFORMING,c=i.ERR_TRANSFORM_WITH_LENGTH_0,u=e("./_stream_duplex");e("inherits")(r,u),r.prototype.push=function(e,t){return this._transformState.needTransform=!1,u.prototype.push.call(this,e,t)},r.prototype._transform=function(e,t,n){n(new d("_transform()"));},r.prototype._write=function(e,t,n){var r=this._transformState;if(r.writecb=n,r.writechunk=e,r.writeencoding=t,!r.transforming){var a=this._readableState;(r.needTransform||a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark);}},r.prototype._read=function(){var e=this._transformState;null===e.writechunk||e.transforming?e.needTransform=!0:(e.transforming=!0,this._transform(e.writechunk,e.writeencoding,e.afterTransform));},r.prototype._destroy=function(e,t){u.prototype._destroy.call(this,e,function(e){t(e);});};},{"../errors":15,"./_stream_duplex":16,inherits:10}],20:[function(e,t){(function(n,r){(function(){function a(e){var t=this;this.next=null,this.entry=null,this.finish=function(){T(t,e);};}function o(e){return x.from(e)}function i(e){return x.isBuffer(e)||e instanceof N}function d(){}function s(t,n,r){v=v||e("./_stream_duplex"),t=t||{},"boolean"!=typeof r&&(r=n instanceof v),this.objectMode=!!t.objectMode,r&&(this.objectMode=this.objectMode||!!t.writableObjectMode),this.highWaterMark=M(this,t,"writableHighWaterMark",r),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;var o=!1===t.decodeStrings;this.decodeStrings=!o,this.defaultEncoding=t.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=function(e){m(n,e);},this.writecb=null,this.writelen=0,this.bufferedRequest=null,this.lastBufferedRequest=null,this.pendingcb=0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=!1!==t.emitClose,this.autoDestroy=!!t.autoDestroy,this.bufferedRequestCount=0,this.corkedRequestsFree=new a(this);}function l(t){v=v||e("./_stream_duplex");var n=this instanceof v;return n||G.call(l,this)?void(this._writableState=new s(t,this,n),this.writable=!0,t&&("function"==typeof t.write&&(this._write=t.write),"function"==typeof t.writev&&(this._writev=t.writev),"function"==typeof t.destroy&&(this._destroy=t.destroy),"function"==typeof t.final&&(this._final=t.final)),A.call(this)):new l(t)}function c(e,t){var r=new W;V(e,r),n.nextTick(t,r);}function u(e,t,r,a){var o;return null===r?o=new q:"string"!=typeof r&&!t.objectMode&&(o=new F("chunk",["string","Buffer"],r)),!o||(V(e,o),n.nextTick(a,o),!1)}function p(e,t,n){return e.objectMode||!1===e.decodeStrings||"string"!=typeof t||(t=x.from(t,n)),t}function f(e,t,n,r,a,o){if(!n){var i=p(t,r,a);r!==i&&(n=!0,a="buffer",r=i);}var d=t.objectMode?1:r.length;t.length+=d;var s=t.length<t.highWaterMark;if(s||(t.needDrain=!0),t.writing||t.corked){var l=t.lastBufferedRequest;t.lastBufferedRequest={chunk:r,encoding:a,isBuf:n,callback:o,next:null},l?l.next=t.lastBufferedRequest:t.bufferedRequest=t.lastBufferedRequest,t.bufferedRequestCount+=1;}else g(e,t,!1,d,r,a,o);return s}function g(e,t,n,r,a,o,i){t.writelen=r,t.writecb=i,t.writing=!0,t.sync=!0,t.destroyed?t.onwrite(new j("write")):n?e._writev(a,t.onwrite):e._write(a,o,t.onwrite),t.sync=!1;}function h(e,t,r,a,o){--t.pendingcb,r?(n.nextTick(o,a),n.nextTick(S,e,t),e._writableState.errorEmitted=!0,V(e,a)):(o(a),e._writableState.errorEmitted=!0,V(e,a),S(e,t));}function _(e){e.writing=!1,e.writecb=null,e.length-=e.writelen,e.writelen=0;}function m(e,t){var r=e._writableState,a=r.sync,o=r.writecb;if("function"!=typeof o)throw new B;if(_(r),t)h(e,r,a,t,o);else {var i=w(r)||e.destroyed;i||r.corked||r.bufferProcessing||!r.bufferedRequest||C(e,r),a?n.nextTick(b,e,r,i,o):b(e,r,i,o);}}function b(e,t,n,r){n||y(e,t),t.pendingcb--,r(),S(e,t);}function y(e,t){0===t.length&&t.needDrain&&(t.needDrain=!1,e.emit("drain"));}function C(e,t){t.bufferProcessing=!0;var n=t.bufferedRequest;if(e._writev&&n&&n.next){var r=t.bufferedRequestCount,o=Array(r),i=t.corkedRequestsFree;i.entry=n;for(var d=0,s=!0;n;)o[d]=n,n.isBuf||(s=!1),n=n.next,d+=1;o.allBuffers=s,g(e,t,!0,t.length,o,"",i.finish),t.pendingcb++,t.lastBufferedRequest=null,i.next?(t.corkedRequestsFree=i.next,i.next=null):t.corkedRequestsFree=new a(t),t.bufferedRequestCount=0;}else {for(;n;){var l=n.chunk,c=n.encoding,u=n.callback,p=t.objectMode?1:l.length;if(g(e,t,!1,p,l,c,u),n=n.next,t.bufferedRequestCount--,t.writing)break}null===n&&(t.lastBufferedRequest=null);}t.bufferedRequest=n,t.bufferProcessing=!1;}function w(e){return e.ending&&0===e.length&&null===e.bufferedRequest&&!e.finished&&!e.writing}function R(e,t){e._final(function(n){t.pendingcb--,n&&V(e,n),t.prefinished=!0,e.emit("prefinish"),S(e,t);});}function E(e,t){t.prefinished||t.finalCalled||("function"!=typeof e._final||t.destroyed?(t.prefinished=!0,e.emit("prefinish")):(t.pendingcb++,t.finalCalled=!0,n.nextTick(R,e,t)));}function S(e,t){var n=w(t);if(n&&(E(e,t),0===t.pendingcb&&(t.finished=!0,e.emit("finish"),t.autoDestroy))){var r=e._readableState;(!r||r.autoDestroy&&r.endEmitted)&&e.destroy();}return n}function k(e,t,r){t.ending=!0,S(e,t),r&&(t.finished?n.nextTick(r):e.once("finish",r)),t.ended=!0,e.writable=!1;}function T(e,t,n){var r=e.entry;for(e.entry=null;r;){var a=r.callback;t.pendingcb--,a(n),r=r.next;}t.corkedRequestsFree.next=e;}t.exports=l;var v;l.WritableState=s;var L={deprecate:e("util-deprecate")},A=e("./internal/streams/stream"),x=e("buffer").Buffer,N=r.Uint8Array||function(){},I=e("./internal/streams/destroy"),P=e("./internal/streams/state"),M=P.getHighWaterMark,D=e("../errors").codes,F=D.ERR_INVALID_ARG_TYPE,O=D.ERR_METHOD_NOT_IMPLEMENTED,B=D.ERR_MULTIPLE_CALLBACK,U=D.ERR_STREAM_CANNOT_PIPE,j=D.ERR_STREAM_DESTROYED,q=D.ERR_STREAM_NULL_VALUES,W=D.ERR_STREAM_WRITE_AFTER_END,H=D.ERR_UNKNOWN_ENCODING,V=I.errorOrDestroy;e("inherits")(l,A),s.prototype.getBuffer=function(){for(var e=this.bufferedRequest,t=[];e;)t.push(e),e=e.next;return t},function(){try{Object.defineProperty(s.prototype,"buffer",{get:L.deprecate(function(){return this.getBuffer()},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.","DEP0003")});}catch(e){}}();var G;"function"==typeof Symbol&&Symbol.hasInstance&&"function"==typeof Function.prototype[Symbol.hasInstance]?(G=Function.prototype[Symbol.hasInstance],Object.defineProperty(l,Symbol.hasInstance,{value:function(e){return !!G.call(this,e)||!(this!==l)&&e&&e._writableState instanceof s}})):G=function(e){return e instanceof this},l.prototype.pipe=function(){V(this,new U);},l.prototype.write=function(e,t,n){var r=this._writableState,a=!1,s=!r.objectMode&&i(e);return s&&!x.isBuffer(e)&&(e=o(e)),"function"==typeof t&&(n=t,t=null),s?t="buffer":!t&&(t=r.defaultEncoding),"function"!=typeof n&&(n=d),r.ending?c(this,n):(s||u(this,r,e,n))&&(r.pendingcb++,a=f(this,r,s,e,t,n)),a},l.prototype.cork=function(){this._writableState.corked++;},l.prototype.uncork=function(){var e=this._writableState;e.corked&&(e.corked--,!e.writing&&!e.corked&&!e.bufferProcessing&&e.bufferedRequest&&C(this,e));},l.prototype.setDefaultEncoding=function(e){if("string"==typeof e&&(e=e.toLowerCase()),!(-1<["hex","utf8","utf-8","ascii","binary","base64","ucs2","ucs-2","utf16le","utf-16le","raw"].indexOf((e+"").toLowerCase())))throw new H(e);return this._writableState.defaultEncoding=e,this},Object.defineProperty(l.prototype,"writableBuffer",{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}}),Object.defineProperty(l.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}}),l.prototype._write=function(e,t,n){n(new O("_write()"));},l.prototype._writev=null,l.prototype.end=function(e,t,n){var r=this._writableState;return "function"==typeof e?(n=e,e=null,t=null):"function"==typeof t&&(n=t,t=null),null!==e&&void 0!==e&&this.write(e,t),r.corked&&(r.corked=1,this.uncork()),r.ending||k(this,r,n),this},Object.defineProperty(l.prototype,"writableLength",{enumerable:!1,get:function(){return this._writableState.length}}),Object.defineProperty(l.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._writableState&&this._writableState.destroyed},set:function(e){this._writableState&&(this._writableState.destroyed=e);}}),l.prototype.destroy=I.destroy,l.prototype._undestroy=I.undestroy,l.prototype._destroy=function(e,t){t(e);};}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{"../errors":15,"./_stream_duplex":16,"./internal/streams/destroy":23,"./internal/streams/state":27,"./internal/streams/stream":28,_process:12,buffer:3,inherits:10,"util-deprecate":32}],21:[function(e,t){(function(n){(function(){function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){return {value:e,done:t}}function o(e){var t=e[c];if(null!==t){var n=e[_].read();null!==n&&(e[g]=null,e[c]=null,e[u]=null,t(a(n,!1)));}}function i(e){n.nextTick(o,e);}function d(e,t){return function(n,r){e.then(function(){return t[f]?void n(a(void 0,!0)):void t[h](n,r)},r);}}var s,l=e("./end-of-stream"),c=Symbol("lastResolve"),u=Symbol("lastReject"),p=Symbol("error"),f=Symbol("ended"),g=Symbol("lastPromise"),h=Symbol("handlePromise"),_=Symbol("stream"),m=Object.getPrototypeOf(function(){}),b=Object.setPrototypeOf((s={get stream(){return this[_]},next:function(){var e=this,t=this[p];if(null!==t)return Promise.reject(t);if(this[f])return Promise.resolve(a(void 0,!0));if(this[_].destroyed)return new Promise(function(t,r){n.nextTick(function(){e[p]?r(e[p]):t(a(void 0,!0));});});var r,o=this[g];if(o)r=new Promise(d(o,this));else {var i=this[_].read();if(null!==i)return Promise.resolve(a(i,!1));r=new Promise(this[h]);}return this[g]=r,r}},r(s,Symbol.asyncIterator,function(){return this}),r(s,"return",function(){var e=this;return new Promise(function(t,n){e[_].destroy(null,function(e){return e?void n(e):void t(a(void 0,!0))});})}),s),m);t.exports=function(e){var t,n=Object.create(b,(t={},r(t,_,{value:e,writable:!0}),r(t,c,{value:null,writable:!0}),r(t,u,{value:null,writable:!0}),r(t,p,{value:null,writable:!0}),r(t,f,{value:e._readableState.endEmitted,writable:!0}),r(t,h,{value:function(e,t){var r=n[_].read();r?(n[g]=null,n[c]=null,n[u]=null,e(a(r,!1))):(n[c]=e,n[u]=t);},writable:!0}),t));return n[g]=null,l(e,function(e){if(e&&"ERR_STREAM_PREMATURE_CLOSE"!==e.code){var t=n[u];return null!==t&&(n[g]=null,n[c]=null,n[u]=null,t(e)),void(n[p]=e)}var r=n[c];null!==r&&(n[g]=null,n[c]=null,n[u]=null,r(a(void 0,!0))),n[f]=!0;}),e.on("readable",i.bind(null,n)),n};}).call(this);}).call(this,e("_process"));},{"./end-of-stream":24,_process:12}],22:[function(e,t){function n(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r);}return n}function r(e){for(var t,r=1;r<arguments.length;r++)t=null==arguments[r]?{}:arguments[r],r%2?n(Object(t),!0).forEach(function(n){a(e,n,t[n]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):n(Object(t)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n));});return e}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n,r=0;r<t.length;r++)n=t[r],n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n);}function d(e,t,n){return t&&i(e.prototype,t),n&&i(e,n),e}function s(e,t,n){u.prototype.copy.call(e,t,n);}var l=e("buffer"),u=l.Buffer,p=e("util"),f=p.inspect,g=f&&f.custom||"inspect";t.exports=function(){function e(){o(this,e),this.head=null,this.tail=null,this.length=0;}return d(e,[{key:"push",value:function(e){var t={data:e,next:null};0<this.length?this.tail.next=t:this.head=t,this.tail=t,++this.length;}},{key:"unshift",value:function(e){var t={data:e,next:this.head};0===this.length&&(this.tail=t),this.head=t,++this.length;}},{key:"shift",value:function(){if(0!==this.length){var e=this.head.data;return this.head=1===this.length?this.tail=null:this.head.next,--this.length,e}}},{key:"clear",value:function(){this.head=this.tail=null,this.length=0;}},{key:"join",value:function(e){if(0===this.length)return "";for(var t=this.head,n=""+t.data;t=t.next;)n+=e+t.data;return n}},{key:"concat",value:function(e){if(0===this.length)return u.alloc(0);for(var t=u.allocUnsafe(e>>>0),n=this.head,r=0;n;)s(n.data,t,r),r+=n.data.length,n=n.next;return t}},{key:"consume",value:function(e,t){var n;return e<this.head.data.length?(n=this.head.data.slice(0,e),this.head.data=this.head.data.slice(e)):e===this.head.data.length?n=this.shift():n=t?this._getString(e):this._getBuffer(e),n}},{key:"first",value:function(){return this.head.data}},{key:"_getString",value:function(e){var t=this.head,r=1,a=t.data;for(e-=a.length;t=t.next;){var o=t.data,i=e>o.length?o.length:e;if(a+=i===o.length?o:o.slice(0,e),e-=i,0===e){i===o.length?(++r,this.head=t.next?t.next:this.tail=null):(this.head=t,t.data=o.slice(i));break}++r;}return this.length-=r,a}},{key:"_getBuffer",value:function(e){var t=u.allocUnsafe(e),r=this.head,a=1;for(r.data.copy(t),e-=r.data.length;r=r.next;){var o=r.data,i=e>o.length?o.length:e;if(o.copy(t,t.length-e,0,i),e-=i,0===e){i===o.length?(++a,this.head=r.next?r.next:this.tail=null):(this.head=r,r.data=o.slice(i));break}++a;}return this.length-=a,t}},{key:g,value:function(e,t){return f(this,r({},t,{depth:0,customInspect:!1}))}}]),e}();},{buffer:3,util:2}],23:[function(e,t){(function(e){(function(){function n(e,t){a(e,t),r(e);}function r(e){e._writableState&&!e._writableState.emitClose||e._readableState&&!e._readableState.emitClose||e.emit("close");}function a(e,t){e.emit("error",t);}t.exports={destroy:function(t,o){var i=this,d=this._readableState&&this._readableState.destroyed,s=this._writableState&&this._writableState.destroyed;return d||s?(o?o(t):t&&(this._writableState?!this._writableState.errorEmitted&&(this._writableState.errorEmitted=!0,e.nextTick(a,this,t)):e.nextTick(a,this,t)),this):(this._readableState&&(this._readableState.destroyed=!0),this._writableState&&(this._writableState.destroyed=!0),this._destroy(t||null,function(t){!o&&t?i._writableState?i._writableState.errorEmitted?e.nextTick(r,i):(i._writableState.errorEmitted=!0,e.nextTick(n,i,t)):e.nextTick(n,i,t):o?(e.nextTick(r,i),o(t)):e.nextTick(r,i);}),this)},undestroy:function(){this._readableState&&(this._readableState.destroyed=!1,this._readableState.reading=!1,this._readableState.ended=!1,this._readableState.endEmitted=!1),this._writableState&&(this._writableState.destroyed=!1,this._writableState.ended=!1,this._writableState.ending=!1,this._writableState.finalCalled=!1,this._writableState.prefinished=!1,this._writableState.finished=!1,this._writableState.errorEmitted=!1);},errorOrDestroy:function(e,t){var n=e._readableState,r=e._writableState;n&&n.autoDestroy||r&&r.autoDestroy?e.destroy(t):e.emit("error",t);}};}).call(this);}).call(this,e("_process"));},{_process:12}],24:[function(e,t){function n(e){var t=!1;return function(){if(!t){t=!0;for(var n=arguments.length,r=Array(n),a=0;a<n;a++)r[a]=arguments[a];e.apply(this,r);}}}function r(){}function a(e){return e.setHeader&&"function"==typeof e.abort}function o(e,t,d){if("function"==typeof t)return o(e,null,t);t||(t={}),d=n(d||r);var s=t.readable||!1!==t.readable&&e.readable,l=t.writable||!1!==t.writable&&e.writable,c=function(){e.writable||p();},u=e._writableState&&e._writableState.finished,p=function(){l=!1,u=!0,s||d.call(e);},f=e._readableState&&e._readableState.endEmitted,g=function(){s=!1,f=!0,l||d.call(e);},h=function(t){d.call(e,t);},_=function(){var t;return s&&!f?(e._readableState&&e._readableState.ended||(t=new i),d.call(e,t)):l&&!u?(e._writableState&&e._writableState.ended||(t=new i),d.call(e,t)):void 0},m=function(){e.req.on("finish",p);};return a(e)?(e.on("complete",p),e.on("abort",_),e.req?m():e.on("request",m)):l&&!e._writableState&&(e.on("end",c),e.on("close",c)),e.on("end",g),e.on("finish",p),!1!==t.error&&e.on("error",h),e.on("close",_),function(){e.removeListener("complete",p),e.removeListener("abort",_),e.removeListener("request",m),e.req&&e.req.removeListener("finish",p),e.removeListener("end",c),e.removeListener("close",c),e.removeListener("finish",p),e.removeListener("end",g),e.removeListener("error",h),e.removeListener("close",_);}}var i=e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;t.exports=o;},{"../../../errors":15}],25:[function(e,t){t.exports=function(){throw new Error("Readable.from is not available in the browser")};},{}],26:[function(e,t){function n(e){var t=!1;return function(){t||(t=!0,e.apply(void 0,arguments));}}function r(e){if(e)throw e}function a(e){return e.setHeader&&"function"==typeof e.abort}function o(t,r,o,i){i=n(i);var d=!1;t.on("close",function(){d=!0;}),l===void 0&&(l=e("./end-of-stream")),l(t,{readable:r,writable:o},function(e){return e?i(e):void(d=!0,i())});var s=!1;return function(e){if(!d)return s?void 0:(s=!0,a(t)?t.abort():"function"==typeof t.destroy?t.destroy():void i(e||new p("pipe")))}}function i(e){e();}function d(e,t){return e.pipe(t)}function s(e){return e.length?"function"==typeof e[e.length-1]?e.pop():r:r}var l,c=e("../../../errors").codes,u=c.ERR_MISSING_ARGS,p=c.ERR_STREAM_DESTROYED;t.exports=function(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];var r=s(t);if(Array.isArray(t[0])&&(t=t[0]),2>t.length)throw new u("streams");var a,l=t.map(function(e,n){var d=n<t.length-1;return o(e,d,0<n,function(e){a||(a=e),e&&l.forEach(i),d||(l.forEach(i),r(a));})});return t.reduce(d)};},{"../../../errors":15,"./end-of-stream":24}],27:[function(e,n){function r(e,t,n){return null==e.highWaterMark?t?e[n]:null:e.highWaterMark}var a=e("../../../errors").codes.ERR_INVALID_OPT_VALUE;n.exports={getHighWaterMark:function(e,n,o,i){var d=r(n,i,o);if(null!=d){if(!(isFinite(d)&&t(d)===d)||0>d){var s=i?o:"highWaterMark";throw new a(s,d)}return t(d)}return e.objectMode?16:16384}};},{"../../../errors":15}],28:[function(e,t){t.exports=e("events").EventEmitter;},{events:4}],29:[function(e,t,n){n=t.exports=e("./lib/_stream_readable.js"),n.Stream=n,n.Readable=n,n.Writable=e("./lib/_stream_writable.js"),n.Duplex=e("./lib/_stream_duplex.js"),n.Transform=e("./lib/_stream_transform.js"),n.PassThrough=e("./lib/_stream_passthrough.js"),n.finished=e("./lib/internal/streams/end-of-stream.js"),n.pipeline=e("./lib/internal/streams/pipeline.js");},{"./lib/_stream_duplex.js":16,"./lib/_stream_passthrough.js":17,"./lib/_stream_readable.js":18,"./lib/_stream_transform.js":19,"./lib/_stream_writable.js":20,"./lib/internal/streams/end-of-stream.js":24,"./lib/internal/streams/pipeline.js":26}],30:[function(e,t,n){function r(e,t){for(var n in e)t[n]=e[n];}function a(e,t,n){return i(e,t,n)}/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */var o=e("buffer"),i=o.Buffer;i.from&&i.alloc&&i.allocUnsafe&&i.allocUnsafeSlow?t.exports=o:(r(o,n),n.Buffer=a),a.prototype=Object.create(i.prototype),r(i,a),a.from=function(e,t,n){if("number"==typeof e)throw new TypeError("Argument must not be a number");return i(e,t,n)},a.alloc=function(e,t,n){if("number"!=typeof e)throw new TypeError("Argument must be a number");var r=i(e);return void 0===t?r.fill(0):"string"==typeof n?r.fill(t,n):r.fill(t),r},a.allocUnsafe=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return i(e)},a.allocUnsafeSlow=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return o.SlowBuffer(e)};},{buffer:3}],31:[function(e,t,n){function r(e){if(!e)return "utf8";for(var t;;)switch(e){case"utf8":case"utf-8":return "utf8";case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return "utf16le";case"latin1":case"binary":return "latin1";case"base64":case"ascii":case"hex":return e;default:if(t)return;e=(""+e).toLowerCase(),t=!0;}}function a(e){var t=r(e);if("string"!=typeof t&&(m.isEncoding===b||!b(e)))throw new Error("Unknown encoding: "+e);return t||e}function o(e){this.encoding=a(e);var t;switch(this.encoding){case"utf16le":this.text=u,this.end=p,t=4;break;case"utf8":this.fillLast=c,t=4;break;case"base64":this.text=f,this.end=g,t=3;break;default:return this.write=h,void(this.end=_);}this.lastNeed=0,this.lastTotal=0,this.lastChar=m.allocUnsafe(t);}function d(e){if(127>=e)return 0;return 6==e>>5?2:14==e>>4?3:30==e>>3?4:2==e>>6?-1:-2}function s(e,t,n){var r=t.length-1;if(r<n)return 0;var a=d(t[r]);return 0<=a?(0<a&&(e.lastNeed=a-1),a):--r<n||-2===a?0:(a=d(t[r]),0<=a)?(0<a&&(e.lastNeed=a-2),a):--r<n||-2===a?0:(a=d(t[r]),0<=a?(0<a&&(2===a?a=0:e.lastNeed=a-3),a):0)}function l(e,t){if(128!=(192&t[0]))return e.lastNeed=0,"\uFFFD";if(1<e.lastNeed&&1<t.length){if(128!=(192&t[1]))return e.lastNeed=1,"\uFFFD";if(2<e.lastNeed&&2<t.length&&128!=(192&t[2]))return e.lastNeed=2,"\uFFFD"}}function c(e){var t=this.lastTotal-this.lastNeed,n=l(this,e);return void 0===n?this.lastNeed<=e.length?(e.copy(this.lastChar,t,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):void(e.copy(this.lastChar,t,0,e.length),this.lastNeed-=e.length):n}function u(e,t){if(0==(e.length-t)%2){var n=e.toString("utf16le",t);if(n){var r=n.charCodeAt(n.length-1);if(55296<=r&&56319>=r)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1],n.slice(0,-1)}return n}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=e[e.length-1],e.toString("utf16le",t,e.length-1)}function p(e){var t=e&&e.length?this.write(e):"";if(this.lastNeed){var n=this.lastTotal-this.lastNeed;return t+this.lastChar.toString("utf16le",0,n)}return t}function f(e,t){var r=(e.length-t)%3;return 0==r?e.toString("base64",t):(this.lastNeed=3-r,this.lastTotal=3,1==r?this.lastChar[0]=e[e.length-1]:(this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1]),e.toString("base64",t,e.length-r))}function g(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+this.lastChar.toString("base64",0,3-this.lastNeed):t}function h(e){return e.toString(this.encoding)}function _(e){return e&&e.length?this.write(e):""}var m=e("safe-buffer").Buffer,b=m.isEncoding||function(e){switch(e=""+e,e&&e.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return !0;default:return !1;}};n.StringDecoder=o,o.prototype.write=function(e){if(0===e.length)return "";var t,n;if(this.lastNeed){if(t=this.fillLast(e),void 0===t)return "";n=this.lastNeed,this.lastNeed=0;}else n=0;return n<e.length?t?t+this.text(e,n):this.text(e,n):t||""},o.prototype.end=function(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+"\uFFFD":t},o.prototype.text=function(e,t){var n=s(this,e,t);if(!this.lastNeed)return e.toString("utf8",t);this.lastTotal=n;var r=e.length-(n-this.lastNeed);return e.copy(this.lastChar,0,r),e.toString("utf8",t,r)},o.prototype.fillLast=function(e){return this.lastNeed<=e.length?(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):void(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,e.length),this.lastNeed-=e.length)};},{"safe-buffer":30}],32:[function(e,t){(function(e){(function(){function n(t){try{if(!e.localStorage)return !1}catch(e){return !1}var n=e.localStorage[t];return null!=n&&"true"===(n+"").toLowerCase()}t.exports=function(e,t){function r(){if(!a){if(n("throwDeprecation"))throw new Error(t);else n("traceDeprecation")?console.trace(t):console.warn(t);a=!0;}return e.apply(this,arguments)}if(n("noDeprecation"))return e;var a=!1;return r};}).call(this);}).call(this,"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{}],"/":[function(e,t){function n(e){return e.replace(/a=ice-options:trickle\s\n/g,"")}function r(e){console.warn(e);}/*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */const a=e("debug")("simple-peer"),o=e("get-browser-rtc"),i=e("randombytes"),d=e("readable-stream"),s=e("queue-microtask"),l=e("err-code"),{Buffer:c}=e("buffer"),u=65536;class p extends d.Duplex{constructor(e){if(e=Object.assign({allowHalfOpen:!1},e),super(e),this._id=i(4).toString("hex").slice(0,7),this._debug("new peer %o",e),this.channelName=e.initiator?e.channelName||i(20).toString("hex"):null,this.initiator=e.initiator||!1,this.channelConfig=e.channelConfig||p.channelConfig,this.channelNegotiated=this.channelConfig.negotiated,this.config=Object.assign({},p.config,e.config),this.offerOptions=e.offerOptions||{},this.answerOptions=e.answerOptions||{},this.sdpTransform=e.sdpTransform||(e=>e),this.streams=e.streams||(e.stream?[e.stream]:[]),this.trickle=void 0===e.trickle||e.trickle,this.allowHalfTrickle=void 0!==e.allowHalfTrickle&&e.allowHalfTrickle,this.iceCompleteTimeout=e.iceCompleteTimeout||5000,this.destroyed=!1,this.destroying=!1,this._connected=!1,this.remoteAddress=void 0,this.remoteFamily=void 0,this.remotePort=void 0,this.localAddress=void 0,this.localFamily=void 0,this.localPort=void 0,this._wrtc=e.wrtc&&"object"==typeof e.wrtc?e.wrtc:o(),!this._wrtc)if("undefined"==typeof window)throw l(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"),"ERR_WEBRTC_SUPPORT");else throw l(new Error("No WebRTC support: Not a supported browser"),"ERR_WEBRTC_SUPPORT");this._pcReady=!1,this._channelReady=!1,this._iceComplete=!1,this._iceCompleteTimer=null,this._channel=null,this._pendingCandidates=[],this._isNegotiating=!1,this._firstNegotiation=!0,this._batchedNegotiation=!1,this._queuedNegotiation=!1,this._sendersAwaitingStable=[],this._senderMap=new Map,this._closingInterval=null,this._remoteTracks=[],this._remoteStreams=[],this._chunk=null,this._cb=null,this._interval=null;try{this._pc=new this._wrtc.RTCPeerConnection(this.config);}catch(e){return void s(()=>this.destroy(l(e,"ERR_PC_CONSTRUCTOR")))}this._isReactNativeWebrtc="number"==typeof this._pc._peerConnectionId,this._pc.oniceconnectionstatechange=()=>{this._onIceStateChange();},this._pc.onicegatheringstatechange=()=>{this._onIceStateChange();},this._pc.onconnectionstatechange=()=>{this._onConnectionStateChange();},this._pc.onsignalingstatechange=()=>{this._onSignalingStateChange();},this._pc.onicecandidate=e=>{this._onIceCandidate(e);},this.initiator||this.channelNegotiated?this._setupData({channel:this._pc.createDataChannel(this.channelName,this.channelConfig)}):this._pc.ondatachannel=e=>{this._setupData(e);},this.streams&&this.streams.forEach(e=>{this.addStream(e);}),this._pc.ontrack=e=>{this._onTrack(e);},this._debug("initial negotiation"),this._needsNegotiation(),this._onFinishBound=()=>{this._onFinish();},this.once("finish",this._onFinishBound);}get bufferSize(){return this._channel&&this._channel.bufferedAmount||0}get connected(){return this._connected&&"open"===this._channel.readyState}address(){return {port:this.localPort,family:this.localFamily,address:this.localAddress}}signal(e){if(this.destroyed)throw l(new Error("cannot signal after peer is destroyed"),"ERR_SIGNALING");if("string"==typeof e)try{e=JSON.parse(e);}catch(t){e={};}this._debug("signal()"),e.renegotiate&&this.initiator&&(this._debug("got request to renegotiate"),this._needsNegotiation()),e.transceiverRequest&&this.initiator&&(this._debug("got request for transceiver"),this.addTransceiver(e.transceiverRequest.kind,e.transceiverRequest.init)),e.candidate&&(this._pc.remoteDescription&&this._pc.remoteDescription.type?this._addIceCandidate(e.candidate):this._pendingCandidates.push(e.candidate)),e.sdp&&this._pc.setRemoteDescription(new this._wrtc.RTCSessionDescription(e)).then(()=>{this.destroyed||(this._pendingCandidates.forEach(e=>{this._addIceCandidate(e);}),this._pendingCandidates=[],"offer"===this._pc.remoteDescription.type&&this._createAnswer());}).catch(e=>{this.destroy(l(e,"ERR_SET_REMOTE_DESCRIPTION"));}),e.sdp||e.candidate||e.renegotiate||e.transceiverRequest||this.destroy(l(new Error("signal() called with invalid signal data"),"ERR_SIGNALING"));}_addIceCandidate(e){const t=new this._wrtc.RTCIceCandidate(e);this._pc.addIceCandidate(t).catch(e=>{!t.address||t.address.endsWith(".local")?r("Ignoring unsupported ICE candidate."):this.destroy(l(e,"ERR_ADD_ICE_CANDIDATE"));});}send(e){this._channel.send(e);}addTransceiver(e,t){if(this._debug("addTransceiver()"),this.initiator)try{this._pc.addTransceiver(e,t),this._needsNegotiation();}catch(e){this.destroy(l(e,"ERR_ADD_TRANSCEIVER"));}else this.emit("signal",{type:"transceiverRequest",transceiverRequest:{kind:e,init:t}});}addStream(e){this._debug("addStream()"),e.getTracks().forEach(t=>{this.addTrack(t,e);});}addTrack(e,t){this._debug("addTrack()");const n=this._senderMap.get(e)||new Map;let r=n.get(t);if(!r)r=this._pc.addTrack(e,t),n.set(t,r),this._senderMap.set(e,n),this._needsNegotiation();else if(r.removed)throw l(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."),"ERR_SENDER_REMOVED");else throw l(new Error("Track has already been added to that stream."),"ERR_SENDER_ALREADY_ADDED")}replaceTrack(e,t,n){this._debug("replaceTrack()");const r=this._senderMap.get(e),a=r?r.get(n):null;if(!a)throw l(new Error("Cannot replace track that was never added."),"ERR_TRACK_NOT_ADDED");t&&this._senderMap.set(t,r),null==a.replaceTrack?this.destroy(l(new Error("replaceTrack is not supported in this browser"),"ERR_UNSUPPORTED_REPLACETRACK")):a.replaceTrack(t);}removeTrack(e,t){this._debug("removeSender()");const n=this._senderMap.get(e),r=n?n.get(t):null;if(!r)throw l(new Error("Cannot remove track that was never added."),"ERR_TRACK_NOT_ADDED");try{r.removed=!0,this._pc.removeTrack(r);}catch(e){"NS_ERROR_UNEXPECTED"===e.name?this._sendersAwaitingStable.push(r):this.destroy(l(e,"ERR_REMOVE_TRACK"));}this._needsNegotiation();}removeStream(e){this._debug("removeSenders()"),e.getTracks().forEach(t=>{this.removeTrack(t,e);});}_needsNegotiation(){this._debug("_needsNegotiation"),this._batchedNegotiation||(this._batchedNegotiation=!0,s(()=>{this._batchedNegotiation=!1,this.initiator||!this._firstNegotiation?(this._debug("starting batched negotiation"),this.negotiate()):this._debug("non-initiator initial negotiation request discarded"),this._firstNegotiation=!1;}));}negotiate(){this.initiator?this._isNegotiating?(this._queuedNegotiation=!0,this._debug("already negotiating, queueing")):(this._debug("start negotiation"),setTimeout(()=>{this._createOffer();},0)):this._isNegotiating?(this._queuedNegotiation=!0,this._debug("already negotiating, queueing")):(this._debug("requesting negotiation from initiator"),this.emit("signal",{type:"renegotiate",renegotiate:!0})),this._isNegotiating=!0;}destroy(e){this._destroy(e,()=>{});}_destroy(e,t){this.destroyed||this.destroying||(this.destroying=!0,this._debug("destroying (error: %s)",e&&(e.message||e)),s(()=>{if(this.destroyed=!0,this.destroying=!1,this._debug("destroy (error: %s)",e&&(e.message||e)),this.readable=this.writable=!1,this._readableState.ended||this.push(null),this._writableState.finished||this.end(),this._connected=!1,this._pcReady=!1,this._channelReady=!1,this._remoteTracks=null,this._remoteStreams=null,this._senderMap=null,clearInterval(this._closingInterval),this._closingInterval=null,clearInterval(this._interval),this._interval=null,this._chunk=null,this._cb=null,this._onFinishBound&&this.removeListener("finish",this._onFinishBound),this._onFinishBound=null,this._channel){try{this._channel.close();}catch(e){}this._channel.onmessage=null,this._channel.onopen=null,this._channel.onclose=null,this._channel.onerror=null;}if(this._pc){try{this._pc.close();}catch(e){}this._pc.oniceconnectionstatechange=null,this._pc.onicegatheringstatechange=null,this._pc.onsignalingstatechange=null,this._pc.onicecandidate=null,this._pc.ontrack=null,this._pc.ondatachannel=null;}this._pc=null,this._channel=null,e&&this.emit("error",e),this.emit("close"),t();}));}_setupData(e){if(!e.channel)return this.destroy(l(new Error("Data channel event is missing `channel` property"),"ERR_DATA_CHANNEL"));this._channel=e.channel,this._channel.binaryType="arraybuffer","number"==typeof this._channel.bufferedAmountLowThreshold&&(this._channel.bufferedAmountLowThreshold=u),this.channelName=this._channel.label,this._channel.onmessage=e=>{this._onChannelMessage(e);},this._channel.onbufferedamountlow=()=>{this._onChannelBufferedAmountLow();},this._channel.onopen=()=>{this._onChannelOpen();},this._channel.onclose=()=>{this._onChannelClose();},this._channel.onerror=e=>{this.destroy(l(e,"ERR_DATA_CHANNEL"));};let t=!1;this._closingInterval=setInterval(()=>{this._channel&&"closing"===this._channel.readyState?(t&&this._onChannelClose(),t=!0):t=!1;},5000);}_read(){}_write(e,t,n){if(this.destroyed)return n(l(new Error("cannot write after peer is destroyed"),"ERR_DATA_CHANNEL"));if(this._connected){try{this.send(e);}catch(e){return this.destroy(l(e,"ERR_DATA_CHANNEL"))}this._channel.bufferedAmount>u?(this._debug("start backpressure: bufferedAmount %d",this._channel.bufferedAmount),this._cb=n):n(null);}else this._debug("write before connect"),this._chunk=e,this._cb=n;}_onFinish(){if(!this.destroyed){const e=()=>{setTimeout(()=>this.destroy(),1e3);};this._connected?e():this.once("connect",e);}}_startIceCompleteTimeout(){this.destroyed||this._iceCompleteTimer||(this._debug("started iceComplete timeout"),this._iceCompleteTimer=setTimeout(()=>{this._iceComplete||(this._iceComplete=!0,this._debug("iceComplete timeout completed"),this.emit("iceTimeout"),this.emit("_iceComplete"));},this.iceCompleteTimeout));}_createOffer(){this.destroyed||this._pc.createOffer(this.offerOptions).then(e=>{if(this.destroyed)return;this.trickle||this.allowHalfTrickle||(e.sdp=n(e.sdp)),e.sdp=this.sdpTransform(e.sdp);const t=()=>{if(!this.destroyed){const t=this._pc.localDescription||e;this._debug("signal"),this.emit("signal",{type:t.type,sdp:t.sdp});}};this._pc.setLocalDescription(e).then(()=>{this._debug("createOffer success"),this.destroyed||(this.trickle||this._iceComplete?t():this.once("_iceComplete",t));}).catch(e=>{this.destroy(l(e,"ERR_SET_LOCAL_DESCRIPTION"));});}).catch(e=>{this.destroy(l(e,"ERR_CREATE_OFFER"));});}_requestMissingTransceivers(){this._pc.getTransceivers&&this._pc.getTransceivers().forEach(e=>{e.mid||!e.sender.track||e.requested||(e.requested=!0,this.addTransceiver(e.sender.track.kind));});}_createAnswer(){this.destroyed||this._pc.createAnswer(this.answerOptions).then(e=>{if(this.destroyed)return;this.trickle||this.allowHalfTrickle||(e.sdp=n(e.sdp)),e.sdp=this.sdpTransform(e.sdp);const t=()=>{if(!this.destroyed){const t=this._pc.localDescription||e;this._debug("signal"),this.emit("signal",{type:t.type,sdp:t.sdp}),this.initiator||this._requestMissingTransceivers();}};this._pc.setLocalDescription(e).then(()=>{this.destroyed||(this.trickle||this._iceComplete?t():this.once("_iceComplete",t));}).catch(e=>{this.destroy(l(e,"ERR_SET_LOCAL_DESCRIPTION"));});}).catch(e=>{this.destroy(l(e,"ERR_CREATE_ANSWER"));});}_onConnectionStateChange(){this.destroyed||"failed"===this._pc.connectionState&&this.destroy(l(new Error("Connection failed."),"ERR_CONNECTION_FAILURE"));}_onIceStateChange(){if(this.destroyed)return;const e=this._pc.iceConnectionState,t=this._pc.iceGatheringState;this._debug("iceStateChange (connection: %s) (gathering: %s)",e,t),this.emit("iceStateChange",e,t),("connected"===e||"completed"===e)&&(this._pcReady=!0,this._maybeReady()),"failed"===e&&this.destroy(l(new Error("Ice connection failed."),"ERR_ICE_CONNECTION_FAILURE")),"closed"===e&&this.destroy(l(new Error("Ice connection closed."),"ERR_ICE_CONNECTION_CLOSED"));}getStats(e){const t=e=>("[object Array]"===Object.prototype.toString.call(e.values)&&e.values.forEach(t=>{Object.assign(e,t);}),e);0===this._pc.getStats.length||this._isReactNativeWebrtc?this._pc.getStats().then(n=>{const r=[];n.forEach(e=>{r.push(t(e));}),e(null,r);},t=>e(t)):0<this._pc.getStats.length?this._pc.getStats(n=>{if(this.destroyed)return;const r=[];n.result().forEach(e=>{const n={};e.names().forEach(t=>{n[t]=e.stat(t);}),n.id=e.id,n.type=e.type,n.timestamp=e.timestamp,r.push(t(n));}),e(null,r);},t=>e(t)):e(null,[]);}_maybeReady(){if(this._debug("maybeReady pc %s channel %s",this._pcReady,this._channelReady),this._connected||this._connecting||!this._pcReady||!this._channelReady)return;this._connecting=!0;const e=()=>{this.destroyed||this.getStats((t,n)=>{if(this.destroyed)return;t&&(n=[]);const r={},a={},o={};let i=!1;n.forEach(e=>{("remotecandidate"===e.type||"remote-candidate"===e.type)&&(r[e.id]=e),("localcandidate"===e.type||"local-candidate"===e.type)&&(a[e.id]=e),("candidatepair"===e.type||"candidate-pair"===e.type)&&(o[e.id]=e);});const d=e=>{i=!0;let t=a[e.localCandidateId];t&&(t.ip||t.address)?(this.localAddress=t.ip||t.address,this.localPort=+t.port):t&&t.ipAddress?(this.localAddress=t.ipAddress,this.localPort=+t.portNumber):"string"==typeof e.googLocalAddress&&(t=e.googLocalAddress.split(":"),this.localAddress=t[0],this.localPort=+t[1]),this.localAddress&&(this.localFamily=this.localAddress.includes(":")?"IPv6":"IPv4");let n=r[e.remoteCandidateId];n&&(n.ip||n.address)?(this.remoteAddress=n.ip||n.address,this.remotePort=+n.port):n&&n.ipAddress?(this.remoteAddress=n.ipAddress,this.remotePort=+n.portNumber):"string"==typeof e.googRemoteAddress&&(n=e.googRemoteAddress.split(":"),this.remoteAddress=n[0],this.remotePort=+n[1]),this.remoteAddress&&(this.remoteFamily=this.remoteAddress.includes(":")?"IPv6":"IPv4"),this._debug("connect local: %s:%s remote: %s:%s",this.localAddress,this.localPort,this.remoteAddress,this.remotePort);};if(n.forEach(e=>{"transport"===e.type&&e.selectedCandidatePairId&&d(o[e.selectedCandidatePairId]),("googCandidatePair"===e.type&&"true"===e.googActiveConnection||("candidatepair"===e.type||"candidate-pair"===e.type)&&e.selected)&&d(e);}),!i&&(!Object.keys(o).length||Object.keys(a).length))return void setTimeout(e,100);if(this._connecting=!1,this._connected=!0,this._chunk){try{this.send(this._chunk);}catch(e){return this.destroy(l(e,"ERR_DATA_CHANNEL"))}this._chunk=null,this._debug("sent chunk from \"write before connect\"");const e=this._cb;this._cb=null,e(null);}"number"!=typeof this._channel.bufferedAmountLowThreshold&&(this._interval=setInterval(()=>this._onInterval(),150),this._interval.unref&&this._interval.unref()),this._debug("connect"),this.emit("connect");});};e();}_onInterval(){this._cb&&this._channel&&!(this._channel.bufferedAmount>u)&&this._onChannelBufferedAmountLow();}_onSignalingStateChange(){this.destroyed||("stable"===this._pc.signalingState&&(this._isNegotiating=!1,this._debug("flushing sender queue",this._sendersAwaitingStable),this._sendersAwaitingStable.forEach(e=>{this._pc.removeTrack(e),this._queuedNegotiation=!0;}),this._sendersAwaitingStable=[],this._queuedNegotiation?(this._debug("flushing negotiation queue"),this._queuedNegotiation=!1,this._needsNegotiation()):(this._debug("negotiated"),this.emit("negotiated"))),this._debug("signalingStateChange %s",this._pc.signalingState),this.emit("signalingStateChange",this._pc.signalingState));}_onIceCandidate(e){this.destroyed||(e.candidate&&this.trickle?this.emit("signal",{type:"candidate",candidate:{candidate:e.candidate.candidate,sdpMLineIndex:e.candidate.sdpMLineIndex,sdpMid:e.candidate.sdpMid}}):!e.candidate&&!this._iceComplete&&(this._iceComplete=!0,this.emit("_iceComplete")),e.candidate&&this._startIceCompleteTimeout());}_onChannelMessage(e){if(this.destroyed)return;let t=e.data;t instanceof ArrayBuffer&&(t=c.from(t)),this.push(t);}_onChannelBufferedAmountLow(){if(!this.destroyed&&this._cb){this._debug("ending backpressure: bufferedAmount %d",this._channel.bufferedAmount);const e=this._cb;this._cb=null,e(null);}}_onChannelOpen(){this._connected||this.destroyed||(this._debug("on channel open"),this._channelReady=!0,this._maybeReady());}_onChannelClose(){this.destroyed||(this._debug("on channel close"),this.destroy());}_onTrack(e){this.destroyed||e.streams.forEach(t=>{this._debug("on track"),this.emit("track",e.track,t),this._remoteTracks.push({track:e.track,stream:t}),this._remoteStreams.some(e=>e.id===t.id)||(this._remoteStreams.push(t),s(()=>{this._debug("on stream"),this.emit("stream",t);}));});}_debug(){const e=[].slice.call(arguments);e[0]="["+this._id+"] "+e[0],a.apply(null,e);}}p.WEBRTC_SUPPORT=!!o(),p.config={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:global.stun.twilio.com:3478"]}],sdpSemantics:"unified-plan"},p.channelConfig={},t.exports=p;},{buffer:3,debug:5,"err-code":7,"get-browser-rtc":8,"queue-microtask":13,randombytes:14,"readable-stream":29}]},{},[])("/")});
    });

    /* eslint-env browser */

    /**
     * @param {string} secret
     * @param {string} roomName
     * @return {PromiseLike<CryptoKey>}
     */
    const deriveKey = (secret, roomName) => {
      const secretBuffer = encodeUtf8(secret).buffer;
      const salt = encodeUtf8(roomName).buffer;
      return crypto.subtle.importKey(
        'raw',
        secretBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
      ).then(keyMaterial =>
        crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          keyMaterial,
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        )
      )
    };

    /**
     * @param {Uint8Array} data data to be encrypted
     * @param {CryptoKey?} key
     * @return {PromiseLike<Uint8Array>} encrypted, base64 encoded message
     */
    const encrypt = (data, key) => {
      if (!key) {
        return /** @type {PromiseLike<Uint8Array>} */ (resolve(data))
      }
      const iv = crypto.getRandomValues(new Uint8Array(12));
      return crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      ).then(cipher => {
        const encryptedDataEncoder = createEncoder();
        writeVarString(encryptedDataEncoder, 'AES-GCM');
        writeVarUint8Array(encryptedDataEncoder, iv);
        writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher));
        return toUint8Array(encryptedDataEncoder)
      })
    };

    /**
     * @param {Object} data data to be encrypted
     * @param {CryptoKey?} key
     * @return {PromiseLike<Uint8Array>} encrypted data, if key is provided
     */
    const encryptJson = (data, key) => {
      const dataEncoder = createEncoder();
      writeAny(dataEncoder, data);
      return encrypt(toUint8Array(dataEncoder), key)
    };

    /**
     * @param {Uint8Array} data
     * @param {CryptoKey?} key
     * @return {PromiseLike<Uint8Array>} decrypted buffer
     */
    const decrypt = (data, key) => {
      if (!key) {
        return /** @type {PromiseLike<Uint8Array>} */ (resolve(data))
      }
      const dataDecoder = createDecoder(data);
      const algorithm = readVarString(dataDecoder);
      if (algorithm !== 'AES-GCM') {
        reject(create$2('Unknown encryption algorithm'));
      }
      const iv = readVarUint8Array(dataDecoder);
      const cipher = readVarUint8Array(dataDecoder);
      return crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        cipher
      ).then(data => new Uint8Array(data))
    };

    /**
     * @param {Uint8Array} data
     * @param {CryptoKey?} key
     * @return {PromiseLike<Object>} decrypted object
     */
    const decryptJson = (data, key) =>
      decrypt(data, key).then(decryptedValue =>
        readAny(createDecoder(new Uint8Array(decryptedValue)))
      );

    const log = createModuleLogger('y-webrtc');

    const messageSync$1 = 0;
    const messageQueryAwareness$1 = 3;
    const messageAwareness$1 = 1;
    const messageBcPeerId = 4;

    /**
     * @type {Map<string, SignalingConn>}
     */
    const signalingConns = new Map();

    /**
     * @type {Map<string,Room>}
     */
    const rooms = new Map();

    /**
     * @param {Room} room
     */
    const checkIsSynced = room => {
      let synced = true;
      room.webrtcConns.forEach(peer => {
        if (!peer.synced) {
          synced = false;
        }
      });
      if ((!synced && room.synced) || (synced && !room.synced)) {
        room.synced = synced;
        room.provider.emit('synced', [{ synced }]);
        log('synced ', BOLD, room.name, UNBOLD, ' with all peers');
      }
    };

    /**
     * @param {Room} room
     * @param {Uint8Array} buf
     * @param {function} syncedCallback
     * @return {encoding.Encoder?}
     */
    const readMessage$1 = (room, buf, syncedCallback) => {
      const decoder = createDecoder(buf);
      const encoder = createEncoder();
      const messageType = readVarUint(decoder);
      if (room === undefined) {
        return null
      }
      const awareness = room.awareness;
      const doc = room.doc;
      let sendReply = false;
      switch (messageType) {
        case messageSync$1: {
          writeVarUint(encoder, messageSync$1);
          const syncMessageType = readSyncMessage(decoder, encoder, doc, room);
          if (syncMessageType === messageYjsSyncStep2 && !room.synced) {
            syncedCallback();
          }
          if (syncMessageType === messageYjsSyncStep1) {
            sendReply = true;
          }
          break
        }
        case messageQueryAwareness$1:
          writeVarUint(encoder, messageAwareness$1);
          writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
          sendReply = true;
          break
        case messageAwareness$1:
          applyAwarenessUpdate(awareness, readVarUint8Array(decoder), room);
          break
        case messageBcPeerId: {
          const add = readUint8(decoder) === 1;
          const peerName = readVarString(decoder);
          if (peerName !== room.peerId && ((room.bcConns.has(peerName) && !add) || (!room.bcConns.has(peerName) && add))) {
            const removed = [];
            const added = [];
            if (add) {
              room.bcConns.add(peerName);
              added.push(peerName);
            } else {
              room.bcConns.delete(peerName);
              removed.push(peerName);
            }
            room.provider.emit('peers', [{
              added,
              removed,
              webrtcPeers: Array.from(room.webrtcConns.keys()),
              bcPeers: Array.from(room.bcConns)
            }]);
            broadcastBcPeerId(room);
          }
          break
        }
        default:
          console.error('Unable to compute message');
          return encoder
      }
      if (!sendReply) {
        // nothing has been written, no answer created
        return null
      }
      return encoder
    };

    /**
     * @param {WebrtcConn} peerConn
     * @param {Uint8Array} buf
     * @return {encoding.Encoder?}
     */
    const readPeerMessage = (peerConn, buf) => {
      const room = peerConn.room;
      log('received message from ', BOLD, peerConn.remotePeerId, GREY, ' (', room.name, ')', UNBOLD, UNCOLOR);
      return readMessage$1(room, buf, () => {
        peerConn.synced = true;
        log('synced ', BOLD, room.name, UNBOLD, ' with ', BOLD, peerConn.remotePeerId);
        checkIsSynced(room);
      })
    };

    /**
     * @param {WebrtcConn} webrtcConn
     * @param {encoding.Encoder} encoder
     */
    const sendWebrtcConn = (webrtcConn, encoder) => {
      log('send message to ', BOLD, webrtcConn.remotePeerId, UNBOLD, GREY, ' (', webrtcConn.room.name, ')', UNCOLOR);
      try {
        webrtcConn.peer.send(toUint8Array(encoder));
      } catch (e) {}
    };

    /**
     * @param {Room} room
     * @param {Uint8Array} m
     */
    const broadcastWebrtcConn = (room, m) => {
      log('broadcast message in ', BOLD, room.name, UNBOLD);
      room.webrtcConns.forEach(conn => {
        try {
          conn.peer.send(m);
        } catch (e) {}
      });
    };

    class WebrtcConn {
      /**
       * @param {SignalingConn} signalingConn
       * @param {boolean} initiator
       * @param {string} remotePeerId
       * @param {Room} room
       */
      constructor (signalingConn, initiator, remotePeerId, room) {
        log('establishing connection to ', BOLD, remotePeerId);
        this.room = room;
        this.remotePeerId = remotePeerId;
        this.closed = false;
        this.connected = false;
        this.synced = false;
        /**
         * @type {any}
         */
        this.peer = new simplepeer_min({ initiator, ...room.provider.peerOpts });
        this.peer.on('signal', signal => {
          publishSignalingMessage(signalingConn, room, { to: remotePeerId, from: room.peerId, type: 'signal', signal });
        });
        this.peer.on('connect', () => {
          log('connected to ', BOLD, remotePeerId);
          this.connected = true;
          // send sync step 1
          const provider = room.provider;
          const doc = provider.doc;
          const awareness = room.awareness;
          const encoder = createEncoder();
          writeVarUint(encoder, messageSync$1);
          writeSyncStep1(encoder, doc);
          sendWebrtcConn(this, encoder);
          const awarenessStates = awareness.getStates();
          if (awarenessStates.size > 0) {
            const encoder = createEncoder();
            writeVarUint(encoder, messageAwareness$1);
            writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
            sendWebrtcConn(this, encoder);
          }
        });
        this.peer.on('close', () => {
          this.connected = false;
          this.closed = true;
          if (room.webrtcConns.has(this.remotePeerId)) {
            room.webrtcConns.delete(this.remotePeerId);
            room.provider.emit('peers', [{
              removed: [this.remotePeerId],
              added: [],
              webrtcPeers: Array.from(room.webrtcConns.keys()),
              bcPeers: Array.from(room.bcConns)
            }]);
          }
          checkIsSynced(room);
          this.peer.destroy();
          log('closed connection to ', BOLD, remotePeerId);
        });
        this.peer.on('close', () => {
          log('Connection to remote peer ', BOLD, remotePeerId, UNBOLD, ' has been closed');
          announceSignalingInfo(room);
        });
        this.peer.on('error', err => {
          log('Error in connection to ', BOLD, remotePeerId, ': ', err);
          announceSignalingInfo(room);
        });
        this.peer.on('data', data => {
          const answer = readPeerMessage(this, data);
          if (answer !== null) {
            sendWebrtcConn(this, answer);
          }
        });
      }

      destroy () {
        this.peer.destroy();
      }
    }

    /**
     * @param {Room} room
     * @param {Uint8Array} m
     */
    const broadcastBcMessage = (room, m) => encrypt(m, room.key).then(data =>
      room.mux(() =>
        publish(room.name, data)
      )
    );

    /**
     * @param {Room} room
     * @param {Uint8Array} m
     */
    const broadcastRoomMessage = (room, m) => {
      if (room.bcconnected) {
        broadcastBcMessage(room, m);
      }
      broadcastWebrtcConn(room, m);
    };

    /**
     * @param {Room} room
     */
    const announceSignalingInfo = room => {
      signalingConns.forEach(conn => {
        // only subcribe if connection is established, otherwise the conn automatically subscribes to all rooms
        if (conn.connected) {
          conn.send({ type: 'subscribe', topics: [room.name] });
          if (room.webrtcConns.size < room.provider.maxConns) {
            publishSignalingMessage(conn, room, { type: 'announce', from: room.peerId });
          }
        }
      });
    };

    /**
     * @param {Room} room
     */
    const broadcastBcPeerId = room => {
      if (room.provider.filterBcConns) {
        // broadcast peerId via broadcastchannel
        const encoderPeerIdBc = createEncoder();
        writeVarUint(encoderPeerIdBc, messageBcPeerId);
        writeUint8(encoderPeerIdBc, 1);
        writeVarString(encoderPeerIdBc, room.peerId);
        broadcastBcMessage(room, toUint8Array(encoderPeerIdBc));
      }
    };

    class Room {
      /**
       * @param {Y.Doc} doc
       * @param {WebrtcProvider} provider
       * @param {string} name
       * @param {CryptoKey|null} key
       */
      constructor (doc, provider, name, key) {
        /**
         * Do not assume that peerId is unique. This is only meant for sending signaling messages.
         *
         * @type {string}
         */
        this.peerId = uuidv4();
        this.doc = doc;
        /**
         * @type {awarenessProtocol.Awareness}
         */
        this.awareness = provider.awareness;
        this.provider = provider;
        this.synced = false;
        this.name = name;
        // @todo make key secret by scoping
        this.key = key;
        /**
         * @type {Map<string, WebrtcConn>}
         */
        this.webrtcConns = new Map();
        /**
         * @type {Set<string>}
         */
        this.bcConns = new Set();
        this.mux = createMutex();
        this.bcconnected = false;
        /**
         * @param {ArrayBuffer} data
         */
        this._bcSubscriber = data =>
          decrypt(new Uint8Array(data), key).then(m =>
            this.mux(() => {
              const reply = readMessage$1(this, m, () => {});
              if (reply) {
                broadcastBcMessage(this, toUint8Array(reply));
              }
            })
          );
        /**
         * Listens to Yjs updates and sends them to remote peers
         *
         * @param {Uint8Array} update
         * @param {any} origin
         */
        this._docUpdateHandler = (update, origin) => {
          const encoder = createEncoder();
          writeVarUint(encoder, messageSync$1);
          writeUpdate(encoder, update);
          broadcastRoomMessage(this, toUint8Array(encoder));
        };
        /**
         * Listens to Awareness updates and sends them to remote peers
         *
         * @param {any} changed
         * @param {any} origin
         */
        this._awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
          const changedClients = added.concat(updated).concat(removed);
          const encoderAwareness = createEncoder();
          writeVarUint(encoderAwareness, messageAwareness$1);
          writeVarUint8Array(encoderAwareness, encodeAwarenessUpdate(this.awareness, changedClients));
          broadcastRoomMessage(this, toUint8Array(encoderAwareness));
        };
        this.doc.on('update', this._docUpdateHandler);
        this.awareness.on('update', this._awarenessUpdateHandler);
        window.addEventListener('beforeunload', () => {
          removeAwarenessStates(this.awareness, [doc.clientID], 'window unload');
          rooms.forEach(room => {
            room.disconnect();
          });
        });
      }

      connect () {
        // signal through all available signaling connections
        announceSignalingInfo(this);
        const roomName = this.name;
        subscribe$1(roomName, this._bcSubscriber);
        this.bcconnected = true;
        // broadcast peerId via broadcastchannel
        broadcastBcPeerId(this);
        // write sync step 1
        const encoderSync = createEncoder();
        writeVarUint(encoderSync, messageSync$1);
        writeSyncStep1(encoderSync, this.doc);
        broadcastBcMessage(this, toUint8Array(encoderSync));
        // broadcast local state
        const encoderState = createEncoder();
        writeVarUint(encoderState, messageSync$1);
        writeSyncStep2(encoderState, this.doc);
        broadcastBcMessage(this, toUint8Array(encoderState));
        // write queryAwareness
        const encoderAwarenessQuery = createEncoder();
        writeVarUint(encoderAwarenessQuery, messageQueryAwareness$1);
        broadcastBcMessage(this, toUint8Array(encoderAwarenessQuery));
        // broadcast local awareness state
        const encoderAwarenessState = createEncoder();
        writeVarUint(encoderAwarenessState, messageAwareness$1);
        writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
        broadcastBcMessage(this, toUint8Array(encoderAwarenessState));
      }

      disconnect () {
        // signal through all available signaling connections
        signalingConns.forEach(conn => {
          if (conn.connected) {
            conn.send({ type: 'unsubscribe', topics: [this.name] });
          }
        });
        removeAwarenessStates(this.awareness, [this.doc.clientID], 'disconnect');
        // broadcast peerId removal via broadcastchannel
        const encoderPeerIdBc = createEncoder();
        writeVarUint(encoderPeerIdBc, messageBcPeerId);
        writeUint8(encoderPeerIdBc, 0); // remove peerId from other bc peers
        writeVarString(encoderPeerIdBc, this.peerId);
        broadcastBcMessage(this, toUint8Array(encoderPeerIdBc));

        unsubscribe(this.name, this._bcSubscriber);
        this.bcconnected = false;
        this.doc.off('update', this._docUpdateHandler);
        this.awareness.off('update', this._awarenessUpdateHandler);
        this.webrtcConns.forEach(conn => conn.destroy());
      }

      destroy () {
        this.disconnect();
      }
    }

    /**
     * @param {Y.Doc} doc
     * @param {WebrtcProvider} provider
     * @param {string} name
     * @param {CryptoKey|null} key
     * @return {Room}
     */
    const openRoom = (doc, provider, name, key) => {
      // there must only be one room
      if (rooms.has(name)) {
        throw create$2(`A Yjs Doc connected to room "${name}" already exists!`)
      }
      const room = new Room(doc, provider, name, key);
      rooms.set(name, /** @type {Room} */ (room));
      return room
    };

    /**
     * @param {SignalingConn} conn
     * @param {Room} room
     * @param {any} data
     */
    const publishSignalingMessage = (conn, room, data) => {
      if (room.key) {
        encryptJson(data, room.key).then(data => {
          conn.send({ type: 'publish', topic: room.name, data: toBase64(data) });
        });
      } else {
        conn.send({ type: 'publish', topic: room.name, data });
      }
    };

    class SignalingConn extends WebsocketClient {
      constructor (url) {
        super(url);
        /**
         * @type {Set<WebrtcProvider>}
         */
        this.providers = new Set();
        this.on('connect', () => {
          log(`connected (${url})`);
          const topics = Array.from(rooms.keys());
          this.send({ type: 'subscribe', topics });
          rooms.forEach(room =>
            publishSignalingMessage(this, room, { type: 'announce', from: room.peerId })
          );
        });
        this.on('message', m => {
          switch (m.type) {
            case 'publish': {
              const roomName = m.topic;
              const room = rooms.get(roomName);
              if (room == null || typeof roomName !== 'string') {
                return
              }
              const execMessage = data => {
                const webrtcConns = room.webrtcConns;
                const peerId = room.peerId;
                if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId) || room.bcConns.has(data.from)) {
                  // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
                  return
                }
                const emitPeerChange = webrtcConns.has(data.from) ? () => {} : () =>
                  room.provider.emit('peers', [{
                    removed: [],
                    added: [data.from],
                    webrtcPeers: Array.from(room.webrtcConns.keys()),
                    bcPeers: Array.from(room.bcConns)
                  }]);
                switch (data.type) {
                  case 'announce':
                    if (webrtcConns.size < room.provider.maxConns) {
                      setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, true, data.from, room));
                      emitPeerChange();
                    }
                    break
                  case 'signal':
                    if (data.to === peerId) {
                      setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal);
                      emitPeerChange();
                    }
                    break
                }
              };
              if (room.key) {
                if (typeof m.data === 'string') {
                  decryptJson(fromBase64(m.data), room.key).then(execMessage);
                }
              } else {
                execMessage(m.data);
              }
            }
          }
        });
        this.on('disconnect', () => log(`disconnect (${url})`));
      }
    }

    /**
     * @extends Observable<string>
     */
    class WebrtcProvider extends Observable {
      /**
       * @param {string} roomName
       * @param {Y.Doc} doc
       * @param {Object} [opts]
       * @param {Array<string>} [opts.signaling]
       * @param {string?} [opts.password]
       * @param {awarenessProtocol.Awareness} [opts.awareness]
       * @param {number} [opts.maxConns]
       * @param {boolean} [opts.filterBcConns]
       * @param {any} [opts.peerOpts]
       */
      constructor (
        roomName,
        doc,
        {
          signaling = ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
          password = null,
          awareness = new Awareness(doc),
          maxConns = 20 + floor(rand() * 15), // the random factor reduces the chance that n clients form a cluster
          filterBcConns = true,
          peerOpts = {} // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
        } = {}
      ) {
        super();
        this.roomName = roomName;
        this.doc = doc;
        this.filterBcConns = filterBcConns;
        /**
         * @type {awarenessProtocol.Awareness}
         */
        this.awareness = awareness;
        this.shouldConnect = false;
        this.signalingUrls = signaling;
        this.signalingConns = [];
        this.maxConns = maxConns;
        this.peerOpts = peerOpts;
        /**
         * @type {PromiseLike<CryptoKey | null>}
         */
        this.key = password ? deriveKey(password, roomName) : /** @type {PromiseLike<null>} */ (resolve(null));
        /**
         * @type {Room|null}
         */
        this.room = null;
        this.key.then(key => {
          this.room = openRoom(doc, this, roomName, key);
          if (this.shouldConnect) {
            this.room.connect();
          } else {
            this.room.disconnect();
          }
        });
        this.connect();
        this.destroy = this.destroy.bind(this);
        doc.on('destroy', this.destroy);
      }

      /**
       * @type {boolean}
       */
      get connected () {
        return this.room !== null && this.shouldConnect
      }

      connect () {
        this.shouldConnect = true;
        this.signalingUrls.forEach(url => {
          const signalingConn = setIfUndefined(signalingConns, url, () => new SignalingConn(url));
          this.signalingConns.push(signalingConn);
          signalingConn.providers.add(this);
        });
        if (this.room) {
          this.room.connect();
        }
      }

      disconnect () {
        this.shouldConnect = false;
        this.signalingConns.forEach(conn => {
          conn.providers.delete(this);
          if (conn.providers.size === 0) {
            conn.destroy();
            signalingConns.delete(conn.url);
          }
        });
        if (this.room) {
          this.room.disconnect();
        }
      }

      destroy () {
        this.doc.off('destroy', this.destroy);
        // need to wait for key before deleting room
        this.key.then(() => {
          /** @type {Room} */ (this.room).destroy();
          rooms.delete(this.roomName);
        });
        super.destroy();
      }
    }

    var array = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readable = void 0;
    function readable(arr) {
        let value = arr.toArray();
        let subs = [];
        const setValue = (newValue) => {
            if (value === newValue)
                return;
            value = newValue;
            subs.forEach((sub) => sub(value));
        };
        const observer = (event, _transaction) => {
            const target = event.target;
            setValue(target.toArray());
        };
        const subscribe = (handler) => {
            subs = [...subs, handler];
            if (subs.length === 1) {
                arr.observe(observer);
            }
            handler(value);
            return () => {
                subs = subs.filter((sub) => sub !== handler);
                if (subs.length === 0) {
                    arr.unobserve(observer);
                }
            };
        };
        return { subscribe, y: arr };
    }
    exports.readable = readable;

    });

    var map$2 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readable = void 0;
    function readable(map) {
        let value = new Map(Object.entries(map.toJSON()));
        let subs = [];
        const setValue = (newValue) => {
            if (value === newValue)
                return;
            value = newValue;
            subs.forEach((sub) => sub(value));
        };
        const observer = (event, _transaction) => {
            const target = event.target;
            setValue(new Map(Object.entries(target.toJSON())));
        };
        const subscribe = (handler) => {
            subs = [...subs, handler];
            if (subs.length === 1) {
                map.observe(observer);
            }
            handler(value);
            return () => {
                subs = subs.filter((sub) => sub !== handler);
                if (subs.length === 0) {
                    map.unobserve(observer);
                }
            };
        };
        return { subscribe, y: map };
    }
    exports.readable = readable;

    });

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var store = /*#__PURE__*/Object.freeze({
        __proto__: null,
        derived: derived,
        readable: readable,
        writable: writable,
        get: get_store_value
    });

    var store_1 = /*@__PURE__*/getAugmentedNamespace(store);

    var undo = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readable = void 0;

    function readable(undoManager) {
        const stackCount = store_1.readable({ undoSize: 0, redoSize: 0 }, (set) => {
            let undoSize = 0;
            let redoSize = 0;
            const updateStackSizes = () => {
                undoSize = undoManager.undoStack.length;
                redoSize = undoManager.redoStack.length;
                set({ undoSize, redoSize });
            };
            const added = () => {
                updateStackSizes();
            };
            const popped = () => {
                updateStackSizes();
            };
            undoManager.on('stack-item-added', added);
            undoManager.on('stack-item-popped', popped);
            return () => {
                undoManager.off('stack-item-added', added);
                undoManager.off('stack-item-popped', popped);
            };
        });
        return stackCount;
    }
    exports.readable = readable;

    });

    var main = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.undo = exports.map = exports.array = void 0;
    exports.array = array;
    exports.map = map$2;
    exports.undo = undo;

    });

    /* src/components/Blob.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/components/Blob.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (91:2) {#if animate}
    function create_if_block(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*blobbers*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*index*/ ctx[14];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(91:2) {#if animate}",
    		ctx
    	});

    	return block;
    }

    // (92:4) {#each blobbers as blobber, index (index)}
    function create_each_block$1(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "blobber svelte-13digql");
    			add_location(div, file$1, 92, 6, 1997);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(92:4) {#each blobbers as blobber, index (index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_class_value;
    	let if_block = /*animate*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();

    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`
    blob
    ${/*color*/ ctx[0] == "white" ? "white" : "black"}
    ${/*size*/ ctx[1] == "small" ? "small" : ""}
    ${/*size*/ ctx[1] == "large" ? "large" : ""}
    ${/*animate*/ ctx[2] ? "animate" : ""}
  `) + " svelte-13digql"));

    			add_location(div, file$1, 80, 0, 1725);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[9](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*animate*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*color, size, animate*/ 7 && div_class_value !== (div_class_value = "" + (null_to_empty(`
    blob
    ${/*color*/ ctx[0] == "white" ? "white" : "black"}
    ${/*size*/ ctx[1] == "small" ? "small" : ""}
    ${/*size*/ ctx[1] == "large" ? "large" : ""}
    ${/*animate*/ ctx[2] ? "animate" : ""}
  `) + " svelte-13digql"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Blob", slots, []);
    	let { color = "black" } = $$props;
    	let { size = "medium" } = $$props;
    	let { animate = false } = $$props;
    	let { count = 8 } = $$props;
    	let { drift = 40 } = $$props;
    	let { deform = 80 } = $$props;
    	let { speed = 3000 } = $$props;
    	let blob;
    	const blobbers = new Array(count);
    	const getRando = () => Math.floor(Math.random() * (drift * 2)) - drift;

    	const animateBlobbers = blobbers => {
    		blobbers.forEach(blobber => {
    			blobber.style.transform = `translate3d(${getRando()}%, ${getRando()}%, 0)`;
    		});

    		setTimeout(
    			function () {
    				animateBlobbers(blobbers);
    			},
    			speed
    		);
    	};

    	onMount(() => {
    		if (animate) {
    			let blobbers = [...blob.querySelectorAll(".blobber")];

    			blobbers.forEach(blobber => {
    				blobber.style.height = `${deform}%`;
    				blobber.style.width = `${deform}%`;
    				blobber.style.top = `${(100 - deform) / 2}%`;
    				blobber.style.right = `${(100 - deform) / 2}%`;
    				blobber.style.transitionDuration = `${speed}ms`;
    			});

    			animateBlobbers(blobbers);
    		}
    	});

    	const writable_props = ["color", "size", "animate", "count", "drift", "deform", "speed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blob> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			blob = $$value;
    			$$invalidate(3, blob);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("animate" in $$props) $$invalidate(2, animate = $$props.animate);
    		if ("count" in $$props) $$invalidate(5, count = $$props.count);
    		if ("drift" in $$props) $$invalidate(6, drift = $$props.drift);
    		if ("deform" in $$props) $$invalidate(7, deform = $$props.deform);
    		if ("speed" in $$props) $$invalidate(8, speed = $$props.speed);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		color,
    		size,
    		animate,
    		count,
    		drift,
    		deform,
    		speed,
    		blob,
    		blobbers,
    		getRando,
    		animateBlobbers
    	});

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("animate" in $$props) $$invalidate(2, animate = $$props.animate);
    		if ("count" in $$props) $$invalidate(5, count = $$props.count);
    		if ("drift" in $$props) $$invalidate(6, drift = $$props.drift);
    		if ("deform" in $$props) $$invalidate(7, deform = $$props.deform);
    		if ("speed" in $$props) $$invalidate(8, speed = $$props.speed);
    		if ("blob" in $$props) $$invalidate(3, blob = $$props.blob);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, size, animate, blob, blobbers, count, drift, deform, speed, div_binding];
    }

    class Blob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			color: 0,
    			size: 1,
    			animate: 2,
    			count: 5,
    			drift: 6,
    			deform: 7,
    			speed: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blob",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get color() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drift() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drift(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deform() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deform(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<Blob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<Blob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Logo.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/components/Logo.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let blob0;
    	let t;
    	let div1;
    	let blob1;
    	let current;

    	blob0 = new Blob({
    			props: { animate: true, size: /*size*/ ctx[0] },
    			$$inline: true
    		});

    	blob1 = new Blob({
    			props: {
    				animate: true,
    				size: /*size*/ ctx[0],
    				color: "white"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(blob0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(blob1.$$.fragment);
    			attr_dev(div0, "class", "black svelte-1hmdx4j");
    			add_location(div0, file$2, 60, 2, 1016);
    			attr_dev(div1, "class", "white svelte-1hmdx4j");
    			add_location(div1, file$2, 63, 2, 1087);
    			attr_dev(div2, "class", "logo svelte-1hmdx4j");
    			add_location(div2, file$2, 59, 0, 995);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(blob0, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(blob1, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blob0.$$.fragment, local);
    			transition_in(blob1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blob0.$$.fragment, local);
    			transition_out(blob1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(blob0);
    			destroy_component(blob1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Logo", slots, []);
    	let { small = false } = $$props;
    	let size = small ? "small" : "large";
    	const writable_props = ["small"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("small" in $$props) $$invalidate(1, small = $$props.small);
    	};

    	$$self.$capture_state = () => ({ Blob, small, size });

    	$$self.$inject_state = $$props => {
    		if ("small" in $$props) $$invalidate(1, small = $$props.small);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, small];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { small: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get small() {
    		throw new Error("<Logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Lockup.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/components/Lockup.svelte";

    // (26:2) {#if stacked}
    function create_if_block_1(ctx) {
    	let logo;
    	let current;
    	logo = new Logo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logo, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(26:2) {#if stacked}",
    		ctx
    	});

    	return block;
    }

    // (30:11) {#if stacked}
    function create_if_block$1(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file$3, 29, 24, 489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(30:11) {#if stacked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let p_class_value;
    	let current;
    	let if_block0 = /*stacked*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*stacked*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			p = element("p");
    			t1 = text("Joseki ");
    			if (if_block1) if_block1.c();
    			t2 = text("Party");
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*small*/ ctx[0] ? "small" : "large") + " svelte-l3z4r3"));
    			add_location(p, file$3, 28, 2, 427);
    			attr_dev(div, "class", "lockup svelte-l3z4r3");
    			add_location(div, file$3, 24, 0, 367);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			if (if_block1) if_block1.m(p, null);
    			append_dev(p, t2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*stacked*/ ctx[1]) {
    				if (if_block0) {
    					if (dirty & /*stacked*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*stacked*/ ctx[1]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(p, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty & /*small*/ 1 && p_class_value !== (p_class_value = "" + (null_to_empty(/*small*/ ctx[0] ? "small" : "large") + " svelte-l3z4r3"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lockup", slots, []);
    	let { small } = $$props;
    	let { stacked } = $$props;
    	const writable_props = ["small", "stacked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lockup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    		if ("stacked" in $$props) $$invalidate(1, stacked = $$props.stacked);
    	};

    	$$self.$capture_state = () => ({ Logo, small, stacked });

    	$$self.$inject_state = $$props => {
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    		if ("stacked" in $$props) $$invalidate(1, stacked = $$props.stacked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [small, stacked];
    }

    class Lockup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { small: 0, stacked: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lockup",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*small*/ ctx[0] === undefined && !("small" in props)) {
    			console.warn("<Lockup> was created without expected prop 'small'");
    		}

    		if (/*stacked*/ ctx[1] === undefined && !("stacked" in props)) {
    			console.warn("<Lockup> was created without expected prop 'stacked'");
    		}
    	}

    	get small() {
    		throw new Error("<Lockup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Lockup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stacked() {
    		throw new Error("<Lockup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stacked(value) {
    		throw new Error("<Lockup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.31.0 */

    const file$4 = "src/components/Button.svelte";

    // (76:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*large*/ ctx[1] ? "large" : ""}`) + " svelte-d5vj8y"));
    			add_location(button, file$4, 76, 2, 1755);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*large*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*large*/ ctx[1] ? "large" : ""}`) + " svelte-d5vj8y"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(76:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if href}
    function create_if_block$2(ctx) {
    	let a;
    	let a_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "class", a_class_value = "" + (null_to_empty(`${/*large*/ ctx[1] ? "large" : ""}`) + " svelte-d5vj8y"));
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			add_location(a, file$4, 70, 2, 1662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*large*/ 2 && a_class_value !== (a_class_value = "" + (null_to_empty(`${/*large*/ ctx[1] ? "large" : ""}`) + " svelte-d5vj8y"))) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (!current || dirty & /*href*/ 1) {
    				attr_dev(a, "href", /*href*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(70:0) {#if href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { href = false } = $$props;
    	let { small = false } = $$props;
    	let { medium = true } = $$props;
    	let { large = false } = $$props;
    	const writable_props = ["href", "small", "medium", "large"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("medium" in $$props) $$invalidate(3, medium = $$props.medium);
    		if ("large" in $$props) $$invalidate(1, large = $$props.large);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ href, small, medium, large });

    	$$self.$inject_state = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("medium" in $$props) $$invalidate(3, medium = $$props.medium);
    		if ("large" in $$props) $$invalidate(1, large = $$props.large);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, large, small, medium, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { href: 0, small: 2, medium: 3, large: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get medium() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set medium(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get large() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set large(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/GameList.svelte generated by Svelte v3.31.0 */
    const file$5 = "src/components/GameList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (79:2) {#if title}
    function create_if_block_1$1(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*title*/ ctx[1]);
    			add_location(h2, file$5, 79, 4, 1535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t, /*title*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(79:2) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (114:2) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let p;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Turn";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Game Name";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Komi";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "Size";
    			t7 = space();
    			p = element("p");
    			p.textContent = "No games here yet!";
    			attr_dev(span0, "class", "turn svelte-johry");
    			add_location(span0, file$5, 116, 8, 2646);
    			attr_dev(span1, "class", "name");
    			add_location(span1, file$5, 117, 8, 2685);
    			attr_dev(span2, "class", "komi svelte-johry");
    			add_location(span2, file$5, 118, 8, 2729);
    			attr_dev(span3, "class", "size svelte-johry");
    			add_location(span3, file$5, 119, 8, 2768);
    			attr_dev(div0, "class", "thead svelte-johry");
    			add_location(div0, file$5, 115, 6, 2618);
    			attr_dev(div1, "class", "grid svelte-johry");
    			add_location(div1, file$5, 114, 4, 2593);
    			add_location(p, file$5, 122, 4, 2827);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div0, t3);
    			append_dev(div0, span2);
    			append_dev(div0, t5);
    			append_dev(div0, span3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(114:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:2) {#if games.length}
    function create_if_block$3(ctx) {
    	let div1;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let current;
    	let each_value = /*games*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Turn";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Game Name";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Komi";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "Size";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "turn svelte-johry");
    			add_location(span0, file$5, 84, 8, 1638);
    			attr_dev(span1, "class", "name");
    			add_location(span1, file$5, 85, 8, 1677);
    			attr_dev(span2, "class", "komi svelte-johry");
    			add_location(span2, file$5, 86, 8, 1721);
    			attr_dev(span3, "class", "size svelte-johry");
    			add_location(span3, file$5, 87, 8, 1760);
    			attr_dev(div0, "class", "thead svelte-johry");
    			add_location(div0, file$5, 83, 6, 1610);
    			attr_dev(div1, "class", "grid svelte-johry");
    			add_location(div1, file$5, 82, 4, 1585);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div0, t3);
    			append_dev(div0, span2);
    			append_dev(div0, t5);
    			append_dev(div0, span3);
    			append_dev(div1, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*games*/ 1) {
    				each_value = /*games*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(82:2) {#if games.length}",
    		ctx
    	});

    	return block;
    }

    // (90:8) {#each games as game}
    function create_each_block$2(ctx) {
    	let a;
    	let span0;
    	let blob;
    	let t0;
    	let span1;
    	let t2;
    	let span2;
    	let t3_value = /*game*/ ctx[2].history.length + "";
    	let t3;
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*game*/ ctx[2].name.substring(1) + "";
    	let t6;
    	let t7;
    	let span4;
    	let t8_value = /*game*/ ctx[2].komi + "";
    	let t8;
    	let t9;
    	let span5;
    	let t10_value = /*game*/ ctx[2].size + "";
    	let t10;
    	let t11;
    	let t12_value = /*game*/ ctx[2].size + "";
    	let t12;
    	let t13;
    	let a_href_value;
    	let a_intro;
    	let a_outro;
    	let current;

    	blob = new Blob({
    			props: {
    				count: 3,
    				drift: 30,
    				deform: 60,
    				size: "small",
    				animate: true,
    				color: /*game*/ ctx[2].turn
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a = element("a");
    			span0 = element("span");
    			create_component(blob.$$.fragment);
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "👀";
    			t2 = space();
    			span2 = element("span");
    			t3 = text(t3_value);
    			t4 = text(":");
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			span4 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			span5 = element("span");
    			t10 = text(t10_value);
    			t11 = text("x");
    			t12 = text(t12_value);
    			t13 = space();
    			attr_dev(span0, "class", "indicator svelte-johry");
    			add_location(span0, file$5, 94, 12, 1988);
    			attr_dev(span1, "class", "hover svelte-johry");
    			add_location(span1, file$5, 103, 12, 2242);
    			attr_dev(span2, "class", "turn svelte-johry");
    			add_location(span2, file$5, 106, 12, 2312);
    			attr_dev(span3, "class", "name");
    			add_location(span3, file$5, 107, 12, 2374);
    			attr_dev(span4, "class", "komi svelte-johry");
    			add_location(span4, file$5, 108, 12, 2437);
    			attr_dev(span5, "class", "size svelte-johry");
    			add_location(span5, file$5, 109, 12, 2487);
    			attr_dev(a, "href", a_href_value = /*game*/ ctx[2].name);
    			attr_dev(a, "class", "svelte-johry");
    			add_location(a, file$5, 90, 10, 1844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span0);
    			mount_component(blob, span0, null);
    			append_dev(a, t0);
    			append_dev(a, span1);
    			append_dev(a, t2);
    			append_dev(a, span2);
    			append_dev(span2, t3);
    			append_dev(span2, t4);
    			append_dev(a, t5);
    			append_dev(a, span3);
    			append_dev(span3, t6);
    			append_dev(a, t7);
    			append_dev(a, span4);
    			append_dev(span4, t8);
    			append_dev(a, t9);
    			append_dev(a, span5);
    			append_dev(span5, t10);
    			append_dev(span5, t11);
    			append_dev(span5, t12);
    			append_dev(a, t13);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const blob_changes = {};
    			if (dirty & /*games*/ 1) blob_changes.color = /*game*/ ctx[2].turn;
    			blob.$set(blob_changes);
    			if ((!current || dirty & /*games*/ 1) && t3_value !== (t3_value = /*game*/ ctx[2].history.length + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*games*/ 1) && t6_value !== (t6_value = /*game*/ ctx[2].name.substring(1) + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*games*/ 1) && t8_value !== (t8_value = /*game*/ ctx[2].komi + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*games*/ 1) && t10_value !== (t10_value = /*game*/ ctx[2].size + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty & /*games*/ 1) && t12_value !== (t12_value = /*game*/ ctx[2].size + "")) set_data_dev(t12, t12_value);

    			if (!current || dirty & /*games*/ 1 && a_href_value !== (a_href_value = /*game*/ ctx[2].name)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blob.$$.fragment, local);

    			add_render_callback(() => {
    				if (a_outro) a_outro.end(1);
    				if (!a_intro) a_intro = create_in_transition(a, fly, { y: 20, duration: 300 });
    				a_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blob.$$.fragment, local);
    			if (a_intro) a_intro.invalidate();
    			a_outro = create_out_transition(a, fly, { y: 20, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(blob);
    			if (detaching && a_outro) a_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(90:8) {#each games as game}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let div_intro;
    	let current;
    	let if_block0 = /*title*/ ctx[1] && create_if_block_1$1(ctx);
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*games*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "list svelte-johry");
    			add_location(div, file$5, 75, 0, 1458);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*title*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fly, { y: 20, duration: 300 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameList", slots, []);
    	let { games = [] } = $$props;
    	let { title = undefined } = $$props;
    	const writable_props = ["games", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("games" in $$props) $$invalidate(0, games = $$props.games);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({ fade, fly, Blob, games, title });

    	$$self.$inject_state = $$props => {
    		if ("games" in $$props) $$invalidate(0, games = $$props.games);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [games, title];
    }

    class GameList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { games: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameList",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get games() {
    		throw new Error("<GameList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set games(value) {
    		throw new Error("<GameList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<GameList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<GameList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var adjectives = ['black', 'white', 'gray', 'brown', 'red', 'pink', 'crimson', 'carnelian', 'orange', 'yellow', 'ivory', 'cream', 'green', 'viridian', 'aquamarine', 'cyan', 'blue', 'cerulean', 'azure', 'indigo', 'navy', 'violet', 'purple', 'lavender', 'magenta', 'rainbow', 'iridescent', 'spectrum', 'prism', 'bold', 'vivid', 'pale', 'clear', 'glass', 'translucent', 'misty', 'dark', 'light', 'gold', 'silver', 'copper', 'bronze', 'steel', 'iron', 'brass', 'mercury', 'zinc', 'chrome', 'platinum', 'titanium', 'nickel', 'lead', 'pewter', 'rust', 'metal', 'stone', 'quartz', 'granite', 'marble', 'alabaster', 'agate', 'jasper', 'pebble', 'pyrite', 'crystal', 'geode', 'obsidian', 'mica', 'flint', 'sand', 'gravel', 'boulder', 'basalt', 'ruby', 'beryl', 'scarlet', 'citrine', 'sulpher', 'topaz', 'amber', 'emerald', 'malachite', 'jade', 'abalone', 'lapis', 'sapphire', 'diamond', 'peridot', 'gem', 'jewel', 'bevel', 'coral', 'jet', 'ebony', 'wood', 'tree', 'cherry', 'maple', 'cedar', 'branch', 'bramble', 'rowan', 'ash', 'fir', 'pine', 'cactus', 'alder', 'grove', 'forest', 'jungle', 'palm', 'bush', 'mulberry', 'juniper', 'vine', 'ivy', 'rose', 'lily', 'tulip', 'daffodil', 'honeysuckle', 'fuschia', 'hazel', 'walnut', 'almond', 'lime', 'lemon', 'apple', 'blossom', 'bloom', 'crocus', 'rose', 'buttercup', 'dandelion', 'iris', 'carnation', 'fern', 'root', 'branch', 'leaf', 'seed', 'flower', 'petal', 'pollen', 'orchid', 'mangrove', 'cypress', 'sequoia', 'sage', 'heather', 'snapdragon', 'daisy', 'mountain', 'hill', 'alpine', 'chestnut', 'valley', 'glacier', 'forest', 'grove', 'glen', 'tree', 'thorn', 'stump', 'desert', 'canyon', 'dune', 'oasis', 'mirage', 'well', 'spring', 'meadow', 'field', 'prairie', 'grass', 'tundra', 'island', 'shore', 'sand', 'shell', 'surf', 'wave', 'foam', 'tide', 'lake', 'river', 'brook', 'stream', 'pool', 'pond', 'sun', 'sprinkle', 'shade', 'shadow', 'rain', 'cloud', 'storm', 'hail', 'snow', 'sleet', 'thunder', 'lightning', 'wind', 'hurricane', 'typhoon', 'dawn', 'sunrise', 'morning', 'noon', 'twilight', 'evening', 'sunset', 'midnight', 'night', 'sky', 'star', 'stellar', 'comet', 'nebula', 'quasar', 'solar', 'lunar', 'planet', 'meteor', 'sprout', 'pear', 'plum', 'kiwi', 'berry', 'apricot', 'peach', 'mango', 'pineapple', 'coconut', 'olive', 'ginger', 'root', 'plain', 'fancy', 'stripe', 'spot', 'speckle', 'spangle', 'ring', 'band', 'blaze', 'paint', 'pinto', 'shade', 'tabby', 'brindle', 'patch', 'calico', 'checker', 'dot', 'pattern', 'glitter', 'glimmer', 'shimmer', 'dull', 'dust', 'dirt', 'glaze', 'scratch', 'quick', 'swift', 'fast', 'slow', 'clever', 'fire', 'flicker', 'flash', 'spark', 'ember', 'coal', 'flame', 'chocolate', 'vanilla', 'sugar', 'spice', 'cake', 'pie', 'cookie', 'candy', 'caramel', 'spiral', 'round', 'jelly', 'square', 'narrow', 'long', 'short', 'small', 'tiny', 'big', 'giant', 'great', 'atom', 'peppermint', 'mint', 'butter', 'fringe', 'rag', 'quilt', 'truth', 'lie', 'holy', 'curse', 'noble', 'sly', 'brave', 'shy', 'lava', 'foul', 'leather', 'fantasy', 'keen', 'luminous', 'feather', 'sticky', 'gossamer', 'cotton', 'rattle', 'silk', 'satin', 'cord', 'denim', 'flannel', 'plaid', 'wool', 'linen', 'silent', 'flax', 'weak', 'valiant', 'fierce', 'gentle', 'rhinestone', 'splash', 'north', 'south', 'east', 'west', 'summer', 'winter', 'autumn', 'spring', 'season', 'equinox', 'solstice', 'paper', 'motley', 'torch', 'ballistic', 'rampant', 'shag', 'freckle', 'wild', 'free', 'chain', 'sheer', 'crazy', 'mad', 'candle', 'ribbon', 'lace', 'notch', 'wax', 'shine', 'shallow', 'deep', 'bubble', 'harvest', 'fluff', 'venom', 'boom', 'slash', 'rune', 'cold', 'quill', 'love', 'hate', 'garnet', 'zircon', 'power', 'bone', 'void', 'horn', 'glory', 'cyber', 'nova', 'hot', 'helix', 'cosmic', 'quark', 'quiver', 'holly', 'clover', 'polar', 'regal', 'ripple', 'ebony', 'wheat', 'phantom', 'dew', 'chisel', 'crack', 'chatter', 'laser', 'foil', 'tin', 'clever', 'treasure', 'maze', 'twisty', 'curly', 'fortune', 'fate', 'destiny', 'cute', 'slime', 'ink', 'disco', 'plume', 'time', 'psychadelic', 'relic', 'fossil', 'water', 'savage', 'ancient', 'rapid', 'road', 'trail', 'stitch', 'button', 'bow', 'nimble', 'zest', 'sour', 'bitter', 'phase', 'fan', 'frill', 'plump', 'pickle', 'mud', 'puddle', 'pond', 'river', 'spring', 'stream', 'battle', 'arrow', 'plume', 'roan', 'pitch', 'tar', 'cat', 'dog', 'horse', 'lizard', 'bird', 'fish', 'saber', 'scythe', 'sharp', 'soft', 'razor', 'neon', 'dandy', 'weed', 'swamp', 'marsh', 'bog', 'peat', 'moor', 'muck', 'mire', 'grave', 'fair', 'just', 'brick', 'puzzle', 'skitter', 'prong', 'fork', 'dent', 'dour', 'warp', 'luck', 'coffee', 'split', 'chip', 'hollow', 'heavy', 'legend', 'hickory', 'mesquite', 'nettle', 'rogue', 'charm', 'prickle', 'bead', 'sponge', 'whip', 'bald', 'frost', 'fog', 'oil', 'veil', 'cliff', 'volcano', 'rift', 'maze', 'proud', 'dew', 'mirror', 'shard', 'salt', 'pepper', 'honey', 'thread', 'bristle', 'ripple', 'glow', 'zenith'];
    var nouns = ['aji', 'atari', 'board', 'dame', 'eyes', 'ears', 'gote', 'hane', 'hayago', 'jigo', 'joseki', 'kami', 'kakari', 'keima', 'kiai', 'kikashi', 'ko', 'komi', 'korigatachi', 'kosumi', 'liberty', 'miai', 'monkey-jump', 'moyo', 'myoushu', 'nakade', 'nerai', 'ni-dan-bane', 'pincer', 'sabaki', 'seki', 'sente', 'shape', 'shoulder', 'tesuji', 'thickness', 'yose', 'yosu-miru', 'moose', 'heron', 'owl', 'stork', 'crane', 'sparrow', 'parrot', 'cockatoo', 'lizard', 'gecko', 'iguana', 'snake', 'python', 'viper', 'condor', 'vulture', 'spider', 'heron', 'toucan', 'bee', 'wasp', 'hornet', 'rabbit', 'hare', 'brow', 'mustang', 'ox', 'piper', 'mask', 'hero', 'antler', 'chiller', 'gem', 'ogre', 'myth', 'elf', 'fairy', 'pixie', 'dragon', 'griffin', 'unicorn', 'pegasus', 'chopper', 'slicer', 'skinner', 'butterfly', 'legend', 'wanderer', 'rover', 'loon', 'lancer', 'glass', 'glazer', 'flame', 'crystal', 'lantern', 'lighter', 'cloak', 'bell', 'ringer', 'keeper', 'bolt', 'catcher', 'rat', 'mouse', 'serpent', 'wyrm', 'gargoyle', 'thorn', 'whip', 'rider', 'spirit', 'sentry', 'bat', 'beetle', 'burn', 'stone', 'collar', 'mark', 'grin', 'scowl', 'spear', 'razor', 'edge', 'jay', 'ape', 'monkey', 'gorilla', 'koala', 'kangaroo', 'yak', 'sloth', 'ant', 'weed', 'seed', 'eater', 'razor', 'face', 'mind', 'shift', 'rider', 'face', 'mole', 'vole', 'stag', 'cap', 'boot', 'drop', 'hugger', 'carpet', 'curtain', 'head', 'crown', 'fang', 'frill', 'skull', 'tongue', 'throat', 'nose', 'sight', 'seer', 'song', 'jaw', 'bite', 'fin', 'lifter', 'hand', 'toe', 'thumb', 'palm', 'hoof', 'fly', 'flier', 'swoop', 'hiss', 'snarl', 'rib', 'chest', 'back', 'ridge', 'leg', 'tail', 'swisher', 'weaver', 'crafter', 'binder', 'scribe', 'muse', 'snap', 'friend', 'foe', 'guardian', 'belly', 'stealer', 'giver', 'dancer', 'twister', 'turner', 'dart', 'drifter'];

    function randomNoun (generator) {
      generator = generator || Math.random;
      return nouns[Math.floor(generator() * nouns.length)]
    }

    function randomAdjective (generator) {
      generator = generator || Math.random;
      return adjectives[Math.floor(generator() * adjectives.length)]
    }

    function generateName (generator) {
      var noun = randomNoun(generator);
      var adjective = randomAdjective(generator);
      return `${adjective}-${noun}`
    }

    const path = writable(window.location.pathname);

    let player = writable(
      new Map(JSON.parse(localStorage.getItem('joseki-party')))
      || new Map()
    );

    /* src/routes/index.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$6 = "src/routes/index.svelte";

    // (62:0) {:else}
    function create_else_block_1(ctx) {
    	let header;
    	let lockup;
    	let t;
    	let p;
    	let button;
    	let current;
    	lockup = new Lockup({ props: { stacked: true }, $$inline: true });

    	button = new Button({
    			props: {
    				large: true,
    				href: "/new",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(lockup.$$.fragment);
    			t = space();
    			p = element("p");
    			create_component(button.$$.fragment);
    			attr_dev(header, "class", "padded svelte-1qi6cji");
    			add_location(header, file$6, 62, 2, 1365);
    			attr_dev(p, "class", "svelte-1qi6cji");
    			add_location(p, file$6, 66, 2, 1433);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(lockup, header, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    			mount_component(button, p, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockup.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockup.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(lockup);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(62:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:0) {#if $games.size > 0}
    function create_if_block_4(ctx) {
    	let header;
    	let lockup;
    	let t;
    	let button;
    	let current;

    	lockup = new Lockup({
    			props: { stacked: false, small: true },
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				href: "/new",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(lockup.$$.fragment);
    			t = space();
    			create_component(button.$$.fragment);
    			attr_dev(header, "class", "small svelte-1qi6cji");
    			add_location(header, file$6, 51, 2, 1214);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(lockup, header, null);
    			append_dev(header, t);
    			mount_component(button, header, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockup.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockup.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(lockup);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(51:0) {#if $games.size > 0}",
    		ctx
    	});

    	return block;
    }

    // (68:4) <Button       large={true}       href="/new">
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(68:4) <Button       large={true}       href=\\\"/new\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:4) <Button       href="/new">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(55:4) <Button       href=\\\"/new\\\">",
    		ctx
    	});

    	return block;
    }

    // (89:0) {:else}
    function create_else_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(89:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (77:0) {#if userTurnGames || userWaitingGames}
    function create_if_block_1$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*userTurnGames*/ ctx[4].length + /*userWaitingGames*/ ctx[5].length > 0 && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*userTurnGames*/ ctx[4].length + /*userWaitingGames*/ ctx[5].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*userTurnGames, userWaitingGames*/ 48) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(77:0) {#if userTurnGames || userWaitingGames}",
    		ctx
    	});

    	return block;
    }

    // (78:2) {#if userTurnGames.length + userWaitingGames.length > 0 }
    function create_if_block_2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*userGames*/ ctx[2] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*userGames*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*userGames*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(78:2) {#if userTurnGames.length + userWaitingGames.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (79:4) {#if userGames}
    function create_if_block_3(ctx) {
    	let gamelist0;
    	let t;
    	let gamelist1;
    	let current;

    	gamelist0 = new GameList({
    			props: {
    				title: "Your Turn",
    				games: /*userTurnGames*/ ctx[4]
    			},
    			$$inline: true
    		});

    	gamelist1 = new GameList({
    			props: {
    				title: "Their Turn",
    				games: /*userWaitingGames*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gamelist0.$$.fragment);
    			t = space();
    			create_component(gamelist1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamelist0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(gamelist1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gamelist0_changes = {};
    			if (dirty & /*userTurnGames*/ 16) gamelist0_changes.games = /*userTurnGames*/ ctx[4];
    			gamelist0.$set(gamelist0_changes);
    			const gamelist1_changes = {};
    			if (dirty & /*userWaitingGames*/ 32) gamelist1_changes.games = /*userWaitingGames*/ ctx[5];
    			gamelist1.$set(gamelist1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamelist0.$$.fragment, local);
    			transition_in(gamelist1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamelist0.$$.fragment, local);
    			transition_out(gamelist1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamelist0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(gamelist1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(79:4) {#if userGames}",
    		ctx
    	});

    	return block;
    }

    // (93:0) {#if watchableGames}
    function create_if_block$4(ctx) {
    	let gamelist;
    	let current;

    	gamelist = new GameList({
    			props: {
    				title: "Watch Games",
    				games: /*watchableGames*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gamelist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamelist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gamelist_changes = {};
    			if (dirty & /*watchableGames*/ 2) gamelist_changes.games = /*watchableGames*/ ctx[1];
    			gamelist.$set(gamelist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamelist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(93:0) {#if watchableGames}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let current_block_type_index_1;
    	let if_block1;
    	let t1;
    	let if_block2_anchor;
    	let current;
    	const if_block_creators = [create_if_block_4, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$games*/ ctx[3].size > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_1$2, create_else_block$2];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*userTurnGames*/ ctx[4] || /*userWaitingGames*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	let if_block2 = /*watchableGames*/ ctx[1] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if_blocks_1[current_block_type_index_1].m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(t0.parentNode, t0);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(t1.parentNode, t1);
    			}

    			if (/*watchableGames*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*watchableGames*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t0);
    			if_blocks_1[current_block_type_index_1].d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $games,
    		$$unsubscribe_games = noop,
    		$$subscribe_games = () => ($$unsubscribe_games(), $$unsubscribe_games = subscribe(games, $$value => $$invalidate(3, $games = $$value)), games);

    	let $player;
    	validate_store(player, "player");
    	component_subscribe($$self, player, $$value => $$invalidate(6, $player = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_games());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Routes", slots, []);
    	let { games } = $$props;
    	validate_store(games, "games");
    	$$subscribe_games();

    	const newGame = () => {
    		games.y.set(generateName(), "cool-new-game");
    	};

    	let watchableGames;
    	let userGames;
    	let userTurnGames;
    	let userWaitingGames;
    	const writable_props = ["games"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Routes> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    	};

    	$$self.$capture_state = () => ({
    		Lockup,
    		Button,
    		GameList,
    		generateName,
    		player,
    		games,
    		newGame,
    		watchableGames,
    		userGames,
    		userTurnGames,
    		userWaitingGames,
    		$games,
    		$player
    	});

    	$$self.$inject_state = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    		if ("watchableGames" in $$props) $$invalidate(1, watchableGames = $$props.watchableGames);
    		if ("userGames" in $$props) $$invalidate(2, userGames = $$props.userGames);
    		if ("userTurnGames" in $$props) $$invalidate(4, userTurnGames = $$props.userTurnGames);
    		if ("userWaitingGames" in $$props) $$invalidate(5, userWaitingGames = $$props.userWaitingGames);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$games, $player, userGames, watchableGames*/ 78) {
    			 {
    				if ($games.size > 0) {
    					let gamesData = [...$games.values()].map(JSON.parse);
    					let playerData = [...$player.keys()];
    					$$invalidate(2, userGames = gamesData.filter(game => $player.get(game.name)));
    					$$invalidate(4, userTurnGames = userGames.filter(game => game.turn == $player.get(game.name)));
    					$$invalidate(5, userWaitingGames = userGames.filter(game => game.turn != $player.get(game.name)));
    					$$invalidate(1, watchableGames = gamesData.filter(game => !$player.get(game.name)));
    					console.log(watchableGames);
    				}
    			}
    		}
    	};

    	return [
    		games,
    		watchableGames,
    		userGames,
    		$games,
    		userTurnGames,
    		userWaitingGames,
    		$player
    	];
    }

    class Routes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { games: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Routes",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*games*/ ctx[0] === undefined && !("games" in props)) {
    			console_1.warn("<Routes> was created without expected prop 'games'");
    		}
    	}

    	get games() {
    		throw new Error("<Routes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set games(value) {
    		throw new Error("<Routes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/new.svelte generated by Svelte v3.31.0 */

    const { console: console_1$1 } = globals;
    const file$7 = "src/routes/new.svelte";

    // (125:4) <Button       large={true}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Create Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(125:4) <Button       large={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let lockup;
    	let t0;
    	let h2;
    	let t2;
    	let form;
    	let label0;
    	let t3;
    	let input;
    	let t4;
    	let label1;
    	let t5;
    	let select0;
    	let option0;
    	let option1;
    	let t8;
    	let label2;
    	let t9;
    	let select1;
    	let option2;
    	let option3;
    	let option4;
    	let t13;
    	let label3;
    	let t14;
    	let select2;
    	let option5;
    	let option6;
    	let t17;
    	let div;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	lockup = new Lockup({
    			props: { stacked: false, small: true },
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				large: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lockup.$$.fragment);
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "New Game";
    			t2 = space();
    			form = element("form");
    			label0 = element("label");
    			t3 = text("Room\n    ");
    			input = element("input");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Komi\n    ");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "No Komi\n      ";
    			option1 = element("option");
    			option1.textContent = "1/2";
    			t8 = space();
    			label2 = element("label");
    			t9 = text("Size\n    ");
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "9x9\n      ";
    			option3 = element("option");
    			option3.textContent = "13x13\n      ";
    			option4 = element("option");
    			option4.textContent = "19x19";
    			t13 = space();
    			label3 = element("label");
    			t14 = text("Color\n    ");
    			select2 = element("select");
    			option5 = element("option");
    			option5.textContent = "White\n      ";
    			option6 = element("option");
    			option6.textContent = "Black";
    			t17 = space();
    			div = element("div");
    			create_component(button.$$.fragment);
    			add_location(h2, file$7, 75, 0, 1512);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-9oqdn1");
    			add_location(input, file$7, 81, 4, 1586);
    			attr_dev(label0, "class", "svelte-9oqdn1");
    			add_location(label0, file$7, 79, 2, 1565);
    			option0.__value = "0";
    			option0.value = option0.__value;
    			add_location(option0, file$7, 87, 6, 1694);
    			option1.__value = "0.5";
    			option1.value = option1.__value;
    			add_location(option1, file$7, 90, 6, 1749);
    			attr_dev(select0, "class", "svelte-9oqdn1");
    			if (/*komi*/ ctx[2] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[7].call(select0));
    			add_location(select0, file$7, 86, 4, 1661);
    			attr_dev(label1, "class", "svelte-9oqdn1");
    			add_location(label1, file$7, 84, 2, 1640);
    			option2.__value = "9";
    			option2.value = option2.__value;
    			add_location(option2, file$7, 99, 6, 1876);
    			option3.__value = "13";
    			option3.value = option3.__value;
    			add_location(option3, file$7, 102, 6, 1929);
    			option4.selected = true;
    			option4.__value = "19";
    			option4.value = option4.__value;
    			add_location(option4, file$7, 105, 6, 1985);
    			attr_dev(select1, "class", "svelte-9oqdn1");
    			if (/*size*/ ctx[3] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[8].call(select1));
    			add_location(select1, file$7, 98, 4, 1843);
    			attr_dev(label2, "class", "svelte-9oqdn1");
    			add_location(label2, file$7, 96, 0, 1822);
    			option5.__value = "white";
    			option5.value = option5.__value;
    			add_location(option5, file$7, 114, 6, 2128);
    			option6.__value = "black";
    			option6.value = option6.__value;
    			add_location(option6, file$7, 117, 6, 2187);
    			attr_dev(select2, "class", "svelte-9oqdn1");
    			if (/*color*/ ctx[4] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[9].call(select2));
    			add_location(select2, file$7, 113, 4, 2094);
    			attr_dev(label3, "class", "svelte-9oqdn1");
    			add_location(label3, file$7, 111, 2, 2072);
    			attr_dev(div, "class", "submit svelte-9oqdn1");
    			add_location(div, file$7, 123, 2, 2268);
    			attr_dev(form, "class", "svelte-9oqdn1");
    			add_location(form, file$7, 77, 0, 1531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(lockup, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t3);
    			append_dev(label0, input);
    			set_input_value(input, /*name*/ ctx[1]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, t5);
    			append_dev(label1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			select_option(select0, /*komi*/ ctx[2]);
    			append_dev(form, t8);
    			append_dev(form, label2);
    			append_dev(label2, t9);
    			append_dev(label2, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*size*/ ctx[3]);
    			append_dev(form, t13);
    			append_dev(form, label3);
    			append_dev(label3, t14);
    			append_dev(label3, select2);
    			append_dev(select2, option5);
    			append_dev(select2, option6);
    			select_option(select2, /*color*/ ctx[4]);
    			append_dev(form, t17);
    			append_dev(form, div);
    			mount_component(button, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[7]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[8]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[9]),
    					listen_dev(form, "submit", /*createGame*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2 && input.value !== /*name*/ ctx[1]) {
    				set_input_value(input, /*name*/ ctx[1]);
    			}

    			if (dirty & /*komi*/ 4) {
    				select_option(select0, /*komi*/ ctx[2]);
    			}

    			if (dirty & /*size*/ 8) {
    				select_option(select1, /*size*/ ctx[3]);
    			}

    			if (dirty & /*color*/ 16) {
    				select_option(select2, /*color*/ ctx[4]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockup.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockup.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lockup, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(form);
    			destroy_component(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $player;

    	let $games,
    		$$unsubscribe_games = noop,
    		$$subscribe_games = () => ($$unsubscribe_games(), $$unsubscribe_games = subscribe(games, $$value => $$invalidate(11, $games = $$value)), games);

    	validate_store(player, "player");
    	component_subscribe($$self, player, $$value => $$invalidate(10, $player = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_games());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("New", slots, []);
    	let { games } = $$props;
    	validate_store(games, "games");
    	$$subscribe_games();
    	let name = generateName();
    	let komi = 0.5;
    	let size = 19;
    	let color = "white";

    	const createGame = e => {
    		e.preventDefault();

    		let gameData = {
    			name: `/${name}`,
    			komi,
    			size,
    			turn: "black",
    			winner: null,
    			resignation: false,
    			score: null,
    			consecutivePasses: 0,
    			players: 1,
    			accepted: { black: false, white: false },
    			history: [],
    			deadStones: []
    		};

    		games.y.set(gameData.name, JSON.stringify(gameData));
    		player.update(p => p.set(gameData.name, color));
    		let playerData = JSON.stringify([...$player.entries()]);
    		localStorage.setItem("joseki-party", playerData);
    		window.history.pushState({}, "", name);
    		path.set(gameData.name);
    		console.log($games);
    	};

    	const writable_props = ["games"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<New> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	function select0_change_handler() {
    		komi = select_value(this);
    		$$invalidate(2, komi);
    	}

    	function select1_change_handler() {
    		size = select_value(this);
    		$$invalidate(3, size);
    	}

    	function select2_change_handler() {
    		color = select_value(this);
    		$$invalidate(4, color);
    	}

    	$$self.$$set = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    	};

    	$$self.$capture_state = () => ({
    		Lockup,
    		Button,
    		path,
    		player,
    		generateName,
    		games,
    		name,
    		komi,
    		size,
    		color,
    		createGame,
    		$player,
    		$games
    	});

    	$$self.$inject_state = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("komi" in $$props) $$invalidate(2, komi = $$props.komi);
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		games,
    		name,
    		komi,
    		size,
    		color,
    		createGame,
    		input_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler
    	];
    }

    class New extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { games: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "New",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*games*/ ctx[0] === undefined && !("games" in props)) {
    			console_1$1.warn("<New> was created without expected prop 'games'");
    		}
    	}

    	get games() {
    		throw new Error("<New>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set games(value) {
    		throw new Error("<New>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/CopyToClipboard.svelte generated by Svelte v3.31.0 */
    const file$8 = "src/components/CopyToClipboard.svelte";

    function create_fragment$8(ctx) {
    	let button;
    	let t0_value = (/*$didCopy*/ ctx[0] ? "✅" : "📋") + "";
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" ");
    			if (default_slot) default_slot.c();
    			add_location(button, file$8, 21, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*copyToClipboard*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$didCopy*/ 1) && t0_value !== (t0_value = (/*$didCopy*/ ctx[0] ? "✅" : "📋") + "")) set_data_dev(t0, t0_value);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $didCopy;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CopyToClipboard", slots, ['default']);
    	let { input } = $$props;
    	const didCopy = writable(false);
    	validate_store(didCopy, "didCopy");
    	component_subscribe($$self, didCopy, value => $$invalidate(0, $didCopy = value));

    	const copyToClipboard = () => {
    		let text = input.value;

    		navigator.clipboard.writeText(text).then(r => {
    			set_store_value(didCopy, $didCopy = true, $didCopy);
    			input.focus();
    			input.select();
    		}).catch(err => {
    			input.focus();
    			input.select();
    		});
    	};

    	const writable_props = ["input"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CopyToClipboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		input,
    		didCopy,
    		copyToClipboard,
    		$didCopy
    	});

    	$$self.$inject_state = $$props => {
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$didCopy, didCopy, copyToClipboard, input, $$scope, slots];
    }

    class CopyToClipboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { input: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CopyToClipboard",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*input*/ ctx[3] === undefined && !("input" in props)) {
    			console.warn("<CopyToClipboard> was created without expected prop 'input'");
    		}
    	}

    	get input() {
    		throw new Error("<CopyToClipboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input(value) {
    		throw new Error("<CopyToClipboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/InviteModal.svelte generated by Svelte v3.31.0 */

    const { window: window_1 } = globals;
    const file$9 = "src/components/InviteModal.svelte";

    // (133:8) <CopyToClipboard {input}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Copy");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(133:8) <CopyToClipboard {input}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let h2;
    	let t1;
    	let span;
    	let input_1;
    	let input_1_value_value;
    	let t2;
    	let copytoclipboard;
    	let t3;
    	let p;
    	let current;
    	let mounted;
    	let dispose;

    	copytoclipboard = new CopyToClipboard({
    			props: {
    				input: /*input*/ ctx[2],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			h2 = element("h2");
    			h2.textContent = "Invite Opponent:";
    			t1 = space();
    			span = element("span");
    			input_1 = element("input");
    			t2 = space();
    			create_component(copytoclipboard.$$.fragment);
    			t3 = space();
    			p = element("p");
    			p.textContent = "Waiting for another player to joing. Once they do, the game will begin.";
    			attr_dev(h2, "class", "svelte-vgx9ez");
    			add_location(h2, file$9, 125, 6, 3173);
    			input_1.autofocus = true;
    			attr_dev(input_1, "type", "text");
    			input_1.value = input_1_value_value = `${window.location}?${/*invite*/ ctx[0]}`;
    			attr_dev(input_1, "class", "svelte-vgx9ez");
    			add_location(input_1, file$9, 127, 8, 3233);
    			attr_dev(span, "class", "flex svelte-vgx9ez");
    			add_location(span, file$9, 126, 6, 3205);
    			add_location(label, file$9, 124, 4, 3159);
    			attr_dev(p, "class", "svelte-vgx9ez");
    			add_location(p, file$9, 138, 4, 3468);
    			attr_dev(div0, "class", "modal-content svelte-vgx9ez");
    			add_location(div0, file$9, 123, 2, 3111);
    			attr_dev(div1, "class", "modal svelte-vgx9ez");
    			attr_dev(div1, "aria-modal", "true");
    			add_location(div1, file$9, 122, 0, 3071);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, h2);
    			append_dev(label, t1);
    			append_dev(label, span);
    			append_dev(span, input_1);
    			/*input_1_binding*/ ctx[6](input_1);
    			append_dev(span, t2);
    			mount_component(copytoclipboard, span, null);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			/*div0_binding*/ ctx[7](div0);
    			current = true;
    			input_1.focus();

    			if (!mounted) {
    				dispose = listen_dev(window_1, "keydown", /*handleKeydown*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*invite*/ 1 && input_1_value_value !== (input_1_value_value = `${window.location}?${/*invite*/ ctx[0]}`) && input_1.value !== input_1_value_value) {
    				prop_dev(input_1, "value", input_1_value_value);
    			}

    			const copytoclipboard_changes = {};
    			if (dirty & /*input*/ 4) copytoclipboard_changes.input = /*input*/ ctx[2];

    			if (dirty & /*$$scope*/ 4096) {
    				copytoclipboard_changes.$$scope = { dirty, ctx };
    			}

    			copytoclipboard.$set(copytoclipboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copytoclipboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copytoclipboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_1_binding*/ ctx[6](null);
    			destroy_component(copytoclipboard);
    			/*div0_binding*/ ctx[7](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InviteModal", slots, []);
    	let { invite } = $$props;
    	let { initialFocusElement } = $$props;
    	let { returnFocusElement } = $$props;
    	let ref;
    	let input;
    	let tabbableChildren;
    	let firstTabbableChild;
    	let lastTabbableChild;
    	let returnFocusElem;

    	onMount(async () => {
    		returnFocusElem = returnFocusElement || document.activeElement;
    		tabbableChildren = [...ref.querySelectorAll("*")].filter(node => node.tabIndex >= 0);
    		firstTabbableChild = tabbableChildren[0];
    		lastTabbableChild = tabbableChildren[tabbableChildren.length - 1];

    		// Wait for children to mount before trying to focus `initialFocusElement`
    		await tick();

    		if (initialFocusElement) {
    			initialFocusElement.focus();
    		} else {
    			const initialFocusElem = ref.querySelector("[autofocus]");
    			initialFocusElem.focus();
    		}

    		const { body, documentElement: html } = document;
    		const scrollBarWidth = window.innerWidth - html.clientWidth;
    		const bodyPaddingRight = parseInt(window.getComputedStyle(body).getPropertyValue("padding-right")) || 0;

    		// 1. Fixes a bug in iOS and desktop Safari whereby setting `overflow: hidden` on
    		//    the html/body does not prevent scrolling.
    		// 2. Fixes a bug in desktop Safari where `overflowY` does not prevent scroll if an
    		//   `overflow-x` style is also applied to the body.
    		html.style.position = "relative"; // [1]

    		html.style.overflow = "hidden"; // [2]
    		body.style.position = "relative"; // [1]
    		body.style.overflow = "hidden"; // [2]
    		body.style.paddingRight = `${bodyPaddingRight + scrollBarWidth}px`;

    		return () => {
    			html.style.position = "";
    			html.style.overflow = "";
    			body.style.position = "";
    			body.style.overflow = "";
    			body.style.paddingRight = "";
    		};
    	});

    	onDestroy(() => {
    		if (returnFocusElem) {
    			returnFocusElem.focus();
    		}
    	});

    	const handleKeydown = event => {
    		if (event.key !== "Tab") {
    			return;
    		}

    		if (tabbableChildren.length === 0) {
    			event.preventDefault();
    		}

    		if (event.shiftKey) {
    			// Handle shift + tab
    			if (document.activeElement === firstTabbableChild) {
    				event.preventDefault();
    				lastTabbableChild.focus();
    			}
    		} else {
    			if (document.activeElement === lastTabbableChild) {
    				event.preventDefault();
    				firstTabbableChild.focus();
    			}
    		}
    	};

    	const writable_props = ["invite", "initialFocusElement", "returnFocusElement"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InviteModal> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(2, input);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ref = $$value;
    			$$invalidate(1, ref);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("invite" in $$props) $$invalidate(0, invite = $$props.invite);
    		if ("initialFocusElement" in $$props) $$invalidate(4, initialFocusElement = $$props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(5, returnFocusElement = $$props.returnFocusElement);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		tick,
    		CopyToClipboard,
    		invite,
    		initialFocusElement,
    		returnFocusElement,
    		ref,
    		input,
    		tabbableChildren,
    		firstTabbableChild,
    		lastTabbableChild,
    		returnFocusElem,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ("invite" in $$props) $$invalidate(0, invite = $$props.invite);
    		if ("initialFocusElement" in $$props) $$invalidate(4, initialFocusElement = $$props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(5, returnFocusElement = $$props.returnFocusElement);
    		if ("ref" in $$props) $$invalidate(1, ref = $$props.ref);
    		if ("input" in $$props) $$invalidate(2, input = $$props.input);
    		if ("tabbableChildren" in $$props) tabbableChildren = $$props.tabbableChildren;
    		if ("firstTabbableChild" in $$props) firstTabbableChild = $$props.firstTabbableChild;
    		if ("lastTabbableChild" in $$props) lastTabbableChild = $$props.lastTabbableChild;
    		if ("returnFocusElem" in $$props) returnFocusElem = $$props.returnFocusElem;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		invite,
    		ref,
    		input,
    		handleKeydown,
    		initialFocusElement,
    		returnFocusElement,
    		input_1_binding,
    		div0_binding
    	];
    }

    class InviteModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			invite: 0,
    			initialFocusElement: 4,
    			returnFocusElement: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InviteModal",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*invite*/ ctx[0] === undefined && !("invite" in props)) {
    			console.warn("<InviteModal> was created without expected prop 'invite'");
    		}

    		if (/*initialFocusElement*/ ctx[4] === undefined && !("initialFocusElement" in props)) {
    			console.warn("<InviteModal> was created without expected prop 'initialFocusElement'");
    		}

    		if (/*returnFocusElement*/ ctx[5] === undefined && !("returnFocusElement" in props)) {
    			console.warn("<InviteModal> was created without expected prop 'returnFocusElement'");
    		}
    	}

    	get invite() {
    		throw new Error("<InviteModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invite(value) {
    		throw new Error("<InviteModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialFocusElement() {
    		throw new Error("<InviteModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialFocusElement(value) {
    		throw new Error("<InviteModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnFocusElement() {
    		throw new Error("<InviteModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnFocusElement(value) {
    		throw new Error("<InviteModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var immutable = createCommonjsModule(function (module, exports) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {var SLICE$0 = Array.prototype.slice;

      function createClass(ctor, superClass) {
        if (superClass) {
          ctor.prototype = Object.create(superClass.prototype);
        }
        ctor.prototype.constructor = ctor;
      }

      function Iterable(value) {
          return isIterable(value) ? value : Seq(value);
        }


      createClass(KeyedIterable, Iterable);
        function KeyedIterable(value) {
          return isKeyed(value) ? value : KeyedSeq(value);
        }


      createClass(IndexedIterable, Iterable);
        function IndexedIterable(value) {
          return isIndexed(value) ? value : IndexedSeq(value);
        }


      createClass(SetIterable, Iterable);
        function SetIterable(value) {
          return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
        }



      function isIterable(maybeIterable) {
        return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
      }

      function isKeyed(maybeKeyed) {
        return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
      }

      function isIndexed(maybeIndexed) {
        return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
      }

      function isAssociative(maybeAssociative) {
        return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
      }

      function isOrdered(maybeOrdered) {
        return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
      }

      Iterable.isIterable = isIterable;
      Iterable.isKeyed = isKeyed;
      Iterable.isIndexed = isIndexed;
      Iterable.isAssociative = isAssociative;
      Iterable.isOrdered = isOrdered;

      Iterable.Keyed = KeyedIterable;
      Iterable.Indexed = IndexedIterable;
      Iterable.Set = SetIterable;


      var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
      var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
      var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
      var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

      // Used for setting prototype methods that IE8 chokes on.
      var DELETE = 'delete';

      // Constants describing the size of trie nodes.
      var SHIFT = 5; // Resulted in best performance after ______?
      var SIZE = 1 << SHIFT;
      var MASK = SIZE - 1;

      // A consistent shared value representing "not set" which equals nothing other
      // than itself, and nothing that could be provided externally.
      var NOT_SET = {};

      // Boolean references, Rough equivalent of `bool &`.
      var CHANGE_LENGTH = { value: false };
      var DID_ALTER = { value: false };

      function MakeRef(ref) {
        ref.value = false;
        return ref;
      }

      function SetRef(ref) {
        ref && (ref.value = true);
      }

      // A function which returns a value representing an "owner" for transient writes
      // to tries. The return value will only ever equal itself, and will not equal
      // the return of any subsequent call of this function.
      function OwnerID() {}

      // http://jsperf.com/copy-array-inline
      function arrCopy(arr, offset) {
        offset = offset || 0;
        var len = Math.max(0, arr.length - offset);
        var newArr = new Array(len);
        for (var ii = 0; ii < len; ii++) {
          newArr[ii] = arr[ii + offset];
        }
        return newArr;
      }

      function ensureSize(iter) {
        if (iter.size === undefined) {
          iter.size = iter.__iterate(returnTrue);
        }
        return iter.size;
      }

      function wrapIndex(iter, index) {
        // This implements "is array index" which the ECMAString spec defines as:
        //
        //     A String property name P is an array index if and only if
        //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
        //     to 2^32−1.
        //
        // http://www.ecma-international.org/ecma-262/6.0/#sec-array-exotic-objects
        if (typeof index !== 'number') {
          var uint32Index = index >>> 0; // N >>> 0 is shorthand for ToUint32
          if ('' + uint32Index !== index || uint32Index === 4294967295) {
            return NaN;
          }
          index = uint32Index;
        }
        return index < 0 ? ensureSize(iter) + index : index;
      }

      function returnTrue() {
        return true;
      }

      function wholeSlice(begin, end, size) {
        return (begin === 0 || (size !== undefined && begin <= -size)) &&
          (end === undefined || (size !== undefined && end >= size));
      }

      function resolveBegin(begin, size) {
        return resolveIndex(begin, size, 0);
      }

      function resolveEnd(end, size) {
        return resolveIndex(end, size, size);
      }

      function resolveIndex(index, size, defaultIndex) {
        return index === undefined ?
          defaultIndex :
          index < 0 ?
            Math.max(0, size + index) :
            size === undefined ?
              index :
              Math.min(size, index);
      }

      /* global Symbol */

      var ITERATE_KEYS = 0;
      var ITERATE_VALUES = 1;
      var ITERATE_ENTRIES = 2;

      var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = '@@iterator';

      var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


      function Iterator(next) {
          this.next = next;
        }

        Iterator.prototype.toString = function() {
          return '[Iterator]';
        };


      Iterator.KEYS = ITERATE_KEYS;
      Iterator.VALUES = ITERATE_VALUES;
      Iterator.ENTRIES = ITERATE_ENTRIES;

      Iterator.prototype.inspect =
      Iterator.prototype.toSource = function () { return this.toString(); };
      Iterator.prototype[ITERATOR_SYMBOL] = function () {
        return this;
      };


      function iteratorValue(type, k, v, iteratorResult) {
        var value = type === 0 ? k : type === 1 ? v : [k, v];
        iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
          value: value, done: false
        });
        return iteratorResult;
      }

      function iteratorDone() {
        return { value: undefined, done: true };
      }

      function hasIterator(maybeIterable) {
        return !!getIteratorFn(maybeIterable);
      }

      function isIterator(maybeIterator) {
        return maybeIterator && typeof maybeIterator.next === 'function';
      }

      function getIterator(iterable) {
        var iteratorFn = getIteratorFn(iterable);
        return iteratorFn && iteratorFn.call(iterable);
      }

      function getIteratorFn(iterable) {
        var iteratorFn = iterable && (
          (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
          iterable[FAUX_ITERATOR_SYMBOL]
        );
        if (typeof iteratorFn === 'function') {
          return iteratorFn;
        }
      }

      function isArrayLike(value) {
        return value && typeof value.length === 'number';
      }

      createClass(Seq, Iterable);
        function Seq(value) {
          return value === null || value === undefined ? emptySequence() :
            isIterable(value) ? value.toSeq() : seqFromValue(value);
        }

        Seq.of = function(/*...values*/) {
          return Seq(arguments);
        };

        Seq.prototype.toSeq = function() {
          return this;
        };

        Seq.prototype.toString = function() {
          return this.__toString('Seq {', '}');
        };

        Seq.prototype.cacheResult = function() {
          if (!this._cache && this.__iterateUncached) {
            this._cache = this.entrySeq().toArray();
            this.size = this._cache.length;
          }
          return this;
        };

        // abstract __iterateUncached(fn, reverse)

        Seq.prototype.__iterate = function(fn, reverse) {
          return seqIterate(this, fn, reverse, true);
        };

        // abstract __iteratorUncached(type, reverse)

        Seq.prototype.__iterator = function(type, reverse) {
          return seqIterator(this, type, reverse, true);
        };



      createClass(KeyedSeq, Seq);
        function KeyedSeq(value) {
          return value === null || value === undefined ?
            emptySequence().toKeyedSeq() :
            isIterable(value) ?
              (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
              keyedSeqFromValue(value);
        }

        KeyedSeq.prototype.toKeyedSeq = function() {
          return this;
        };



      createClass(IndexedSeq, Seq);
        function IndexedSeq(value) {
          return value === null || value === undefined ? emptySequence() :
            !isIterable(value) ? indexedSeqFromValue(value) :
            isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
        }

        IndexedSeq.of = function(/*...values*/) {
          return IndexedSeq(arguments);
        };

        IndexedSeq.prototype.toIndexedSeq = function() {
          return this;
        };

        IndexedSeq.prototype.toString = function() {
          return this.__toString('Seq [', ']');
        };

        IndexedSeq.prototype.__iterate = function(fn, reverse) {
          return seqIterate(this, fn, reverse, false);
        };

        IndexedSeq.prototype.__iterator = function(type, reverse) {
          return seqIterator(this, type, reverse, false);
        };



      createClass(SetSeq, Seq);
        function SetSeq(value) {
          return (
            value === null || value === undefined ? emptySequence() :
            !isIterable(value) ? indexedSeqFromValue(value) :
            isKeyed(value) ? value.entrySeq() : value
          ).toSetSeq();
        }

        SetSeq.of = function(/*...values*/) {
          return SetSeq(arguments);
        };

        SetSeq.prototype.toSetSeq = function() {
          return this;
        };



      Seq.isSeq = isSeq;
      Seq.Keyed = KeyedSeq;
      Seq.Set = SetSeq;
      Seq.Indexed = IndexedSeq;

      var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

      Seq.prototype[IS_SEQ_SENTINEL] = true;



      createClass(ArraySeq, IndexedSeq);
        function ArraySeq(array) {
          this._array = array;
          this.size = array.length;
        }

        ArraySeq.prototype.get = function(index, notSetValue) {
          return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
        };

        ArraySeq.prototype.__iterate = function(fn, reverse) {
          var array = this._array;
          var maxIndex = array.length - 1;
          for (var ii = 0; ii <= maxIndex; ii++) {
            if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
              return ii + 1;
            }
          }
          return ii;
        };

        ArraySeq.prototype.__iterator = function(type, reverse) {
          var array = this._array;
          var maxIndex = array.length - 1;
          var ii = 0;
          return new Iterator(function() 
            {return ii > maxIndex ?
              iteratorDone() :
              iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
          );
        };



      createClass(ObjectSeq, KeyedSeq);
        function ObjectSeq(object) {
          var keys = Object.keys(object);
          this._object = object;
          this._keys = keys;
          this.size = keys.length;
        }

        ObjectSeq.prototype.get = function(key, notSetValue) {
          if (notSetValue !== undefined && !this.has(key)) {
            return notSetValue;
          }
          return this._object[key];
        };

        ObjectSeq.prototype.has = function(key) {
          return this._object.hasOwnProperty(key);
        };

        ObjectSeq.prototype.__iterate = function(fn, reverse) {
          var object = this._object;
          var keys = this._keys;
          var maxIndex = keys.length - 1;
          for (var ii = 0; ii <= maxIndex; ii++) {
            var key = keys[reverse ? maxIndex - ii : ii];
            if (fn(object[key], key, this) === false) {
              return ii + 1;
            }
          }
          return ii;
        };

        ObjectSeq.prototype.__iterator = function(type, reverse) {
          var object = this._object;
          var keys = this._keys;
          var maxIndex = keys.length - 1;
          var ii = 0;
          return new Iterator(function()  {
            var key = keys[reverse ? maxIndex - ii : ii];
            return ii++ > maxIndex ?
              iteratorDone() :
              iteratorValue(type, key, object[key]);
          });
        };

      ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


      createClass(IterableSeq, IndexedSeq);
        function IterableSeq(iterable) {
          this._iterable = iterable;
          this.size = iterable.length || iterable.size;
        }

        IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
          if (reverse) {
            return this.cacheResult().__iterate(fn, reverse);
          }
          var iterable = this._iterable;
          var iterator = getIterator(iterable);
          var iterations = 0;
          if (isIterator(iterator)) {
            var step;
            while (!(step = iterator.next()).done) {
              if (fn(step.value, iterations++, this) === false) {
                break;
              }
            }
          }
          return iterations;
        };

        IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
          if (reverse) {
            return this.cacheResult().__iterator(type, reverse);
          }
          var iterable = this._iterable;
          var iterator = getIterator(iterable);
          if (!isIterator(iterator)) {
            return new Iterator(iteratorDone);
          }
          var iterations = 0;
          return new Iterator(function()  {
            var step = iterator.next();
            return step.done ? step : iteratorValue(type, iterations++, step.value);
          });
        };



      createClass(IteratorSeq, IndexedSeq);
        function IteratorSeq(iterator) {
          this._iterator = iterator;
          this._iteratorCache = [];
        }

        IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
          if (reverse) {
            return this.cacheResult().__iterate(fn, reverse);
          }
          var iterator = this._iterator;
          var cache = this._iteratorCache;
          var iterations = 0;
          while (iterations < cache.length) {
            if (fn(cache[iterations], iterations++, this) === false) {
              return iterations;
            }
          }
          var step;
          while (!(step = iterator.next()).done) {
            var val = step.value;
            cache[iterations] = val;
            if (fn(val, iterations++, this) === false) {
              break;
            }
          }
          return iterations;
        };

        IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
          if (reverse) {
            return this.cacheResult().__iterator(type, reverse);
          }
          var iterator = this._iterator;
          var cache = this._iteratorCache;
          var iterations = 0;
          return new Iterator(function()  {
            if (iterations >= cache.length) {
              var step = iterator.next();
              if (step.done) {
                return step;
              }
              cache[iterations] = step.value;
            }
            return iteratorValue(type, iterations, cache[iterations++]);
          });
        };




      // # pragma Helper functions

      function isSeq(maybeSeq) {
        return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
      }

      var EMPTY_SEQ;

      function emptySequence() {
        return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
      }

      function keyedSeqFromValue(value) {
        var seq =
          Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
          isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
          hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
          typeof value === 'object' ? new ObjectSeq(value) :
          undefined;
        if (!seq) {
          throw new TypeError(
            'Expected Array or iterable object of [k, v] entries, '+
            'or keyed object: ' + value
          );
        }
        return seq;
      }

      function indexedSeqFromValue(value) {
        var seq = maybeIndexedSeqFromValue(value);
        if (!seq) {
          throw new TypeError(
            'Expected Array or iterable object of values: ' + value
          );
        }
        return seq;
      }

      function seqFromValue(value) {
        var seq = maybeIndexedSeqFromValue(value) ||
          (typeof value === 'object' && new ObjectSeq(value));
        if (!seq) {
          throw new TypeError(
            'Expected Array or iterable object of values, or keyed object: ' + value
          );
        }
        return seq;
      }

      function maybeIndexedSeqFromValue(value) {
        return (
          isArrayLike(value) ? new ArraySeq(value) :
          isIterator(value) ? new IteratorSeq(value) :
          hasIterator(value) ? new IterableSeq(value) :
          undefined
        );
      }

      function seqIterate(seq, fn, reverse, useKeys) {
        var cache = seq._cache;
        if (cache) {
          var maxIndex = cache.length - 1;
          for (var ii = 0; ii <= maxIndex; ii++) {
            var entry = cache[reverse ? maxIndex - ii : ii];
            if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
              return ii + 1;
            }
          }
          return ii;
        }
        return seq.__iterateUncached(fn, reverse);
      }

      function seqIterator(seq, type, reverse, useKeys) {
        var cache = seq._cache;
        if (cache) {
          var maxIndex = cache.length - 1;
          var ii = 0;
          return new Iterator(function()  {
            var entry = cache[reverse ? maxIndex - ii : ii];
            return ii++ > maxIndex ?
              iteratorDone() :
              iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
          });
        }
        return seq.__iteratorUncached(type, reverse);
      }

      function fromJS(json, converter) {
        return converter ?
          fromJSWith(converter, json, '', {'': json}) :
          fromJSDefault(json);
      }

      function fromJSWith(converter, json, key, parentJSON) {
        if (Array.isArray(json)) {
          return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
        }
        if (isPlainObj(json)) {
          return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
        }
        return json;
      }

      function fromJSDefault(json) {
        if (Array.isArray(json)) {
          return IndexedSeq(json).map(fromJSDefault).toList();
        }
        if (isPlainObj(json)) {
          return KeyedSeq(json).map(fromJSDefault).toMap();
        }
        return json;
      }

      function isPlainObj(value) {
        return value && (value.constructor === Object || value.constructor === undefined);
      }

      /**
       * An extension of the "same-value" algorithm as [described for use by ES6 Map
       * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
       *
       * NaN is considered the same as NaN, however -0 and 0 are considered the same
       * value, which is different from the algorithm described by
       * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
       *
       * This is extended further to allow Objects to describe the values they
       * represent, by way of `valueOf` or `equals` (and `hashCode`).
       *
       * Note: because of this extension, the key equality of Immutable.Map and the
       * value equality of Immutable.Set will differ from ES6 Map and Set.
       *
       * ### Defining custom values
       *
       * The easiest way to describe the value an object represents is by implementing
       * `valueOf`. For example, `Date` represents a value by returning a unix
       * timestamp for `valueOf`:
       *
       *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
       *     var date2 = new Date(1234567890000);
       *     date1.valueOf(); // 1234567890000
       *     assert( date1 !== date2 );
       *     assert( Immutable.is( date1, date2 ) );
       *
       * Note: overriding `valueOf` may have other implications if you use this object
       * where JavaScript expects a primitive, such as implicit string coercion.
       *
       * For more complex types, especially collections, implementing `valueOf` may
       * not be performant. An alternative is to implement `equals` and `hashCode`.
       *
       * `equals` takes another object, presumably of similar type, and returns true
       * if the it is equal. Equality is symmetrical, so the same result should be
       * returned if this and the argument are flipped.
       *
       *     assert( a.equals(b) === b.equals(a) );
       *
       * `hashCode` returns a 32bit integer number representing the object which will
       * be used to determine how to store the value object in a Map or Set. You must
       * provide both or neither methods, one must not exist without the other.
       *
       * Also, an important relationship between these methods must be upheld: if two
       * values are equal, they *must* return the same hashCode. If the values are not
       * equal, they might have the same hashCode; this is called a hash collision,
       * and while undesirable for performance reasons, it is acceptable.
       *
       *     if (a.equals(b)) {
       *       assert( a.hashCode() === b.hashCode() );
       *     }
       *
       * All Immutable collections implement `equals` and `hashCode`.
       *
       */
      function is(valueA, valueB) {
        if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
          return true;
        }
        if (!valueA || !valueB) {
          return false;
        }
        if (typeof valueA.valueOf === 'function' &&
            typeof valueB.valueOf === 'function') {
          valueA = valueA.valueOf();
          valueB = valueB.valueOf();
          if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
            return true;
          }
          if (!valueA || !valueB) {
            return false;
          }
        }
        if (typeof valueA.equals === 'function' &&
            typeof valueB.equals === 'function' &&
            valueA.equals(valueB)) {
          return true;
        }
        return false;
      }

      function deepEqual(a, b) {
        if (a === b) {
          return true;
        }

        if (
          !isIterable(b) ||
          a.size !== undefined && b.size !== undefined && a.size !== b.size ||
          a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
          isKeyed(a) !== isKeyed(b) ||
          isIndexed(a) !== isIndexed(b) ||
          isOrdered(a) !== isOrdered(b)
        ) {
          return false;
        }

        if (a.size === 0 && b.size === 0) {
          return true;
        }

        var notAssociative = !isAssociative(a);

        if (isOrdered(a)) {
          var entries = a.entries();
          return b.every(function(v, k)  {
            var entry = entries.next().value;
            return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
          }) && entries.next().done;
        }

        var flipped = false;

        if (a.size === undefined) {
          if (b.size === undefined) {
            if (typeof a.cacheResult === 'function') {
              a.cacheResult();
            }
          } else {
            flipped = true;
            var _ = a;
            a = b;
            b = _;
          }
        }

        var allEqual = true;
        var bSize = b.__iterate(function(v, k)  {
          if (notAssociative ? !a.has(v) :
              flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
            allEqual = false;
            return false;
          }
        });

        return allEqual && a.size === bSize;
      }

      createClass(Repeat, IndexedSeq);

        function Repeat(value, times) {
          if (!(this instanceof Repeat)) {
            return new Repeat(value, times);
          }
          this._value = value;
          this.size = times === undefined ? Infinity : Math.max(0, times);
          if (this.size === 0) {
            if (EMPTY_REPEAT) {
              return EMPTY_REPEAT;
            }
            EMPTY_REPEAT = this;
          }
        }

        Repeat.prototype.toString = function() {
          if (this.size === 0) {
            return 'Repeat []';
          }
          return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
        };

        Repeat.prototype.get = function(index, notSetValue) {
          return this.has(index) ? this._value : notSetValue;
        };

        Repeat.prototype.includes = function(searchValue) {
          return is(this._value, searchValue);
        };

        Repeat.prototype.slice = function(begin, end) {
          var size = this.size;
          return wholeSlice(begin, end, size) ? this :
            new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
        };

        Repeat.prototype.reverse = function() {
          return this;
        };

        Repeat.prototype.indexOf = function(searchValue) {
          if (is(this._value, searchValue)) {
            return 0;
          }
          return -1;
        };

        Repeat.prototype.lastIndexOf = function(searchValue) {
          if (is(this._value, searchValue)) {
            return this.size;
          }
          return -1;
        };

        Repeat.prototype.__iterate = function(fn, reverse) {
          for (var ii = 0; ii < this.size; ii++) {
            if (fn(this._value, ii, this) === false) {
              return ii + 1;
            }
          }
          return ii;
        };

        Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
          var ii = 0;
          return new Iterator(function() 
            {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
          );
        };

        Repeat.prototype.equals = function(other) {
          return other instanceof Repeat ?
            is(this._value, other._value) :
            deepEqual(other);
        };


      var EMPTY_REPEAT;

      function invariant(condition, error) {
        if (!condition) throw new Error(error);
      }

      createClass(Range, IndexedSeq);

        function Range(start, end, step) {
          if (!(this instanceof Range)) {
            return new Range(start, end, step);
          }
          invariant(step !== 0, 'Cannot step a Range by 0');
          start = start || 0;
          if (end === undefined) {
            end = Infinity;
          }
          step = step === undefined ? 1 : Math.abs(step);
          if (end < start) {
            step = -step;
          }
          this._start = start;
          this._end = end;
          this._step = step;
          this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
          if (this.size === 0) {
            if (EMPTY_RANGE) {
              return EMPTY_RANGE;
            }
            EMPTY_RANGE = this;
          }
        }

        Range.prototype.toString = function() {
          if (this.size === 0) {
            return 'Range []';
          }
          return 'Range [ ' +
            this._start + '...' + this._end +
            (this._step !== 1 ? ' by ' + this._step : '') +
          ' ]';
        };

        Range.prototype.get = function(index, notSetValue) {
          return this.has(index) ?
            this._start + wrapIndex(this, index) * this._step :
            notSetValue;
        };

        Range.prototype.includes = function(searchValue) {
          var possibleIndex = (searchValue - this._start) / this._step;
          return possibleIndex >= 0 &&
            possibleIndex < this.size &&
            possibleIndex === Math.floor(possibleIndex);
        };

        Range.prototype.slice = function(begin, end) {
          if (wholeSlice(begin, end, this.size)) {
            return this;
          }
          begin = resolveBegin(begin, this.size);
          end = resolveEnd(end, this.size);
          if (end <= begin) {
            return new Range(0, 0);
          }
          return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
        };

        Range.prototype.indexOf = function(searchValue) {
          var offsetValue = searchValue - this._start;
          if (offsetValue % this._step === 0) {
            var index = offsetValue / this._step;
            if (index >= 0 && index < this.size) {
              return index
            }
          }
          return -1;
        };

        Range.prototype.lastIndexOf = function(searchValue) {
          return this.indexOf(searchValue);
        };

        Range.prototype.__iterate = function(fn, reverse) {
          var maxIndex = this.size - 1;
          var step = this._step;
          var value = reverse ? this._start + maxIndex * step : this._start;
          for (var ii = 0; ii <= maxIndex; ii++) {
            if (fn(value, ii, this) === false) {
              return ii + 1;
            }
            value += reverse ? -step : step;
          }
          return ii;
        };

        Range.prototype.__iterator = function(type, reverse) {
          var maxIndex = this.size - 1;
          var step = this._step;
          var value = reverse ? this._start + maxIndex * step : this._start;
          var ii = 0;
          return new Iterator(function()  {
            var v = value;
            value += reverse ? -step : step;
            return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
          });
        };

        Range.prototype.equals = function(other) {
          return other instanceof Range ?
            this._start === other._start &&
            this._end === other._end &&
            this._step === other._step :
            deepEqual(this, other);
        };


      var EMPTY_RANGE;

      createClass(Collection, Iterable);
        function Collection() {
          throw TypeError('Abstract');
        }


      createClass(KeyedCollection, Collection);function KeyedCollection() {}

      createClass(IndexedCollection, Collection);function IndexedCollection() {}

      createClass(SetCollection, Collection);function SetCollection() {}


      Collection.Keyed = KeyedCollection;
      Collection.Indexed = IndexedCollection;
      Collection.Set = SetCollection;

      var imul =
        typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
        Math.imul :
        function imul(a, b) {
          a = a | 0; // int
          b = b | 0; // int
          var c = a & 0xffff;
          var d = b & 0xffff;
          // Shift by 0 fixes the sign on the high part.
          return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
        };

      // v8 has an optimization for storing 31-bit signed numbers.
      // Values which have either 00 or 11 as the high order bits qualify.
      // This function drops the highest order bit in a signed number, maintaining
      // the sign bit.
      function smi(i32) {
        return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
      }

      function hash(o) {
        if (o === false || o === null || o === undefined) {
          return 0;
        }
        if (typeof o.valueOf === 'function') {
          o = o.valueOf();
          if (o === false || o === null || o === undefined) {
            return 0;
          }
        }
        if (o === true) {
          return 1;
        }
        var type = typeof o;
        if (type === 'number') {
          if (o !== o || o === Infinity) {
            return 0;
          }
          var h = o | 0;
          if (h !== o) {
            h ^= o * 0xFFFFFFFF;
          }
          while (o > 0xFFFFFFFF) {
            o /= 0xFFFFFFFF;
            h ^= o;
          }
          return smi(h);
        }
        if (type === 'string') {
          return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
        }
        if (typeof o.hashCode === 'function') {
          return o.hashCode();
        }
        if (type === 'object') {
          return hashJSObj(o);
        }
        if (typeof o.toString === 'function') {
          return hashString(o.toString());
        }
        throw new Error('Value type ' + type + ' cannot be hashed.');
      }

      function cachedHashString(string) {
        var hash = stringHashCache[string];
        if (hash === undefined) {
          hash = hashString(string);
          if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
            STRING_HASH_CACHE_SIZE = 0;
            stringHashCache = {};
          }
          STRING_HASH_CACHE_SIZE++;
          stringHashCache[string] = hash;
        }
        return hash;
      }

      // http://jsperf.com/hashing-strings
      function hashString(string) {
        // This is the hash from JVM
        // The hash code for a string is computed as
        // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
        // where s[i] is the ith character of the string and n is the length of
        // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
        // (exclusive) by dropping high bits.
        var hash = 0;
        for (var ii = 0; ii < string.length; ii++) {
          hash = 31 * hash + string.charCodeAt(ii) | 0;
        }
        return smi(hash);
      }

      function hashJSObj(obj) {
        var hash;
        if (usingWeakMap) {
          hash = weakMap.get(obj);
          if (hash !== undefined) {
            return hash;
          }
        }

        hash = obj[UID_HASH_KEY];
        if (hash !== undefined) {
          return hash;
        }

        if (!canDefineProperty) {
          hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
          if (hash !== undefined) {
            return hash;
          }

          hash = getIENodeHash(obj);
          if (hash !== undefined) {
            return hash;
          }
        }

        hash = ++objHashUID;
        if (objHashUID & 0x40000000) {
          objHashUID = 0;
        }

        if (usingWeakMap) {
          weakMap.set(obj, hash);
        } else if (isExtensible !== undefined && isExtensible(obj) === false) {
          throw new Error('Non-extensible objects are not allowed as keys.');
        } else if (canDefineProperty) {
          Object.defineProperty(obj, UID_HASH_KEY, {
            'enumerable': false,
            'configurable': false,
            'writable': false,
            'value': hash
          });
        } else if (obj.propertyIsEnumerable !== undefined &&
                   obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
          // Since we can't define a non-enumerable property on the object
          // we'll hijack one of the less-used non-enumerable properties to
          // save our hash on it. Since this is a function it will not show up in
          // `JSON.stringify` which is what we want.
          obj.propertyIsEnumerable = function() {
            return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
          };
          obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
        } else if (obj.nodeType !== undefined) {
          // At this point we couldn't get the IE `uniqueID` to use as a hash
          // and we couldn't use a non-enumerable property to exploit the
          // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
          // itself.
          obj[UID_HASH_KEY] = hash;
        } else {
          throw new Error('Unable to set a non-enumerable property on object.');
        }

        return hash;
      }

      // Get references to ES5 object methods.
      var isExtensible = Object.isExtensible;

      // True if Object.defineProperty works as expected. IE8 fails this test.
      var canDefineProperty = (function() {
        try {
          Object.defineProperty({}, '@', {});
          return true;
        } catch (e) {
          return false;
        }
      }());

      // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
      // and avoid memory leaks from the IE cloneNode bug.
      function getIENodeHash(node) {
        if (node && node.nodeType > 0) {
          switch (node.nodeType) {
            case 1: // Element
              return node.uniqueID;
            case 9: // Document
              return node.documentElement && node.documentElement.uniqueID;
          }
        }
      }

      // If possible, use a WeakMap.
      var usingWeakMap = typeof WeakMap === 'function';
      var weakMap;
      if (usingWeakMap) {
        weakMap = new WeakMap();
      }

      var objHashUID = 0;

      var UID_HASH_KEY = '__immutablehash__';
      if (typeof Symbol === 'function') {
        UID_HASH_KEY = Symbol(UID_HASH_KEY);
      }

      var STRING_HASH_CACHE_MIN_STRLEN = 16;
      var STRING_HASH_CACHE_MAX_SIZE = 255;
      var STRING_HASH_CACHE_SIZE = 0;
      var stringHashCache = {};

      function assertNotInfinite(size) {
        invariant(
          size !== Infinity,
          'Cannot perform this action with an infinite size.'
        );
      }

      createClass(Map, KeyedCollection);

        // @pragma Construction

        function Map(value) {
          return value === null || value === undefined ? emptyMap() :
            isMap(value) && !isOrdered(value) ? value :
            emptyMap().withMutations(function(map ) {
              var iter = KeyedIterable(value);
              assertNotInfinite(iter.size);
              iter.forEach(function(v, k)  {return map.set(k, v)});
            });
        }

        Map.of = function() {var keyValues = SLICE$0.call(arguments, 0);
          return emptyMap().withMutations(function(map ) {
            for (var i = 0; i < keyValues.length; i += 2) {
              if (i + 1 >= keyValues.length) {
                throw new Error('Missing value for key: ' + keyValues[i]);
              }
              map.set(keyValues[i], keyValues[i + 1]);
            }
          });
        };

        Map.prototype.toString = function() {
          return this.__toString('Map {', '}');
        };

        // @pragma Access

        Map.prototype.get = function(k, notSetValue) {
          return this._root ?
            this._root.get(0, undefined, k, notSetValue) :
            notSetValue;
        };

        // @pragma Modification

        Map.prototype.set = function(k, v) {
          return updateMap(this, k, v);
        };

        Map.prototype.setIn = function(keyPath, v) {
          return this.updateIn(keyPath, NOT_SET, function()  {return v});
        };

        Map.prototype.remove = function(k) {
          return updateMap(this, k, NOT_SET);
        };

        Map.prototype.deleteIn = function(keyPath) {
          return this.updateIn(keyPath, function()  {return NOT_SET});
        };

        Map.prototype.update = function(k, notSetValue, updater) {
          return arguments.length === 1 ?
            k(this) :
            this.updateIn([k], notSetValue, updater);
        };

        Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
          if (!updater) {
            updater = notSetValue;
            notSetValue = undefined;
          }
          var updatedValue = updateInDeepMap(
            this,
            forceIterator(keyPath),
            notSetValue,
            updater
          );
          return updatedValue === NOT_SET ? undefined : updatedValue;
        };

        Map.prototype.clear = function() {
          if (this.size === 0) {
            return this;
          }
          if (this.__ownerID) {
            this.size = 0;
            this._root = null;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return emptyMap();
        };

        // @pragma Composition

        Map.prototype.merge = function(/*...iters*/) {
          return mergeIntoMapWith(this, undefined, arguments);
        };

        Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
          return mergeIntoMapWith(this, merger, iters);
        };

        Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
          return this.updateIn(
            keyPath,
            emptyMap(),
            function(m ) {return typeof m.merge === 'function' ?
              m.merge.apply(m, iters) :
              iters[iters.length - 1]}
          );
        };

        Map.prototype.mergeDeep = function(/*...iters*/) {
          return mergeIntoMapWith(this, deepMerger, arguments);
        };

        Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
          return mergeIntoMapWith(this, deepMergerWith(merger), iters);
        };

        Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
          return this.updateIn(
            keyPath,
            emptyMap(),
            function(m ) {return typeof m.mergeDeep === 'function' ?
              m.mergeDeep.apply(m, iters) :
              iters[iters.length - 1]}
          );
        };

        Map.prototype.sort = function(comparator) {
          // Late binding
          return OrderedMap(sortFactory(this, comparator));
        };

        Map.prototype.sortBy = function(mapper, comparator) {
          // Late binding
          return OrderedMap(sortFactory(this, comparator, mapper));
        };

        // @pragma Mutability

        Map.prototype.withMutations = function(fn) {
          var mutable = this.asMutable();
          fn(mutable);
          return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
        };

        Map.prototype.asMutable = function() {
          return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
        };

        Map.prototype.asImmutable = function() {
          return this.__ensureOwner();
        };

        Map.prototype.wasAltered = function() {
          return this.__altered;
        };

        Map.prototype.__iterator = function(type, reverse) {
          return new MapIterator(this, type, reverse);
        };

        Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          var iterations = 0;
          this._root && this._root.iterate(function(entry ) {
            iterations++;
            return fn(entry[1], entry[0], this$0);
          }, reverse);
          return iterations;
        };

        Map.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          if (!ownerID) {
            this.__ownerID = ownerID;
            this.__altered = false;
            return this;
          }
          return makeMap(this.size, this._root, ownerID, this.__hash);
        };


      function isMap(maybeMap) {
        return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
      }

      Map.isMap = isMap;

      var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

      var MapPrototype = Map.prototype;
      MapPrototype[IS_MAP_SENTINEL] = true;
      MapPrototype[DELETE] = MapPrototype.remove;
      MapPrototype.removeIn = MapPrototype.deleteIn;


      // #pragma Trie Nodes



        function ArrayMapNode(ownerID, entries) {
          this.ownerID = ownerID;
          this.entries = entries;
        }

        ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
          var entries = this.entries;
          for (var ii = 0, len = entries.length; ii < len; ii++) {
            if (is(key, entries[ii][0])) {
              return entries[ii][1];
            }
          }
          return notSetValue;
        };

        ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
          var removed = value === NOT_SET;

          var entries = this.entries;
          var idx = 0;
          for (var len = entries.length; idx < len; idx++) {
            if (is(key, entries[idx][0])) {
              break;
            }
          }
          var exists = idx < len;

          if (exists ? entries[idx][1] === value : removed) {
            return this;
          }

          SetRef(didAlter);
          (removed || !exists) && SetRef(didChangeSize);

          if (removed && entries.length === 1) {
            return; // undefined
          }

          if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
            return createNodes(ownerID, entries, key, value);
          }

          var isEditable = ownerID && ownerID === this.ownerID;
          var newEntries = isEditable ? entries : arrCopy(entries);

          if (exists) {
            if (removed) {
              idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
            } else {
              newEntries[idx] = [key, value];
            }
          } else {
            newEntries.push([key, value]);
          }

          if (isEditable) {
            this.entries = newEntries;
            return this;
          }

          return new ArrayMapNode(ownerID, newEntries);
        };




        function BitmapIndexedNode(ownerID, bitmap, nodes) {
          this.ownerID = ownerID;
          this.bitmap = bitmap;
          this.nodes = nodes;
        }

        BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
          if (keyHash === undefined) {
            keyHash = hash(key);
          }
          var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
          var bitmap = this.bitmap;
          return (bitmap & bit) === 0 ? notSetValue :
            this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
        };

        BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
          if (keyHash === undefined) {
            keyHash = hash(key);
          }
          var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
          var bit = 1 << keyHashFrag;
          var bitmap = this.bitmap;
          var exists = (bitmap & bit) !== 0;

          if (!exists && value === NOT_SET) {
            return this;
          }

          var idx = popCount(bitmap & (bit - 1));
          var nodes = this.nodes;
          var node = exists ? nodes[idx] : undefined;
          var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

          if (newNode === node) {
            return this;
          }

          if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
            return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
          }

          if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
            return nodes[idx ^ 1];
          }

          if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
            return newNode;
          }

          var isEditable = ownerID && ownerID === this.ownerID;
          var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
          var newNodes = exists ? newNode ?
            setIn(nodes, idx, newNode, isEditable) :
            spliceOut(nodes, idx, isEditable) :
            spliceIn(nodes, idx, newNode, isEditable);

          if (isEditable) {
            this.bitmap = newBitmap;
            this.nodes = newNodes;
            return this;
          }

          return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
        };




        function HashArrayMapNode(ownerID, count, nodes) {
          this.ownerID = ownerID;
          this.count = count;
          this.nodes = nodes;
        }

        HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
          if (keyHash === undefined) {
            keyHash = hash(key);
          }
          var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
          var node = this.nodes[idx];
          return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
        };

        HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
          if (keyHash === undefined) {
            keyHash = hash(key);
          }
          var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
          var removed = value === NOT_SET;
          var nodes = this.nodes;
          var node = nodes[idx];

          if (removed && !node) {
            return this;
          }

          var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
          if (newNode === node) {
            return this;
          }

          var newCount = this.count;
          if (!node) {
            newCount++;
          } else if (!newNode) {
            newCount--;
            if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
              return packNodes(ownerID, nodes, newCount, idx);
            }
          }

          var isEditable = ownerID && ownerID === this.ownerID;
          var newNodes = setIn(nodes, idx, newNode, isEditable);

          if (isEditable) {
            this.count = newCount;
            this.nodes = newNodes;
            return this;
          }

          return new HashArrayMapNode(ownerID, newCount, newNodes);
        };




        function HashCollisionNode(ownerID, keyHash, entries) {
          this.ownerID = ownerID;
          this.keyHash = keyHash;
          this.entries = entries;
        }

        HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
          var entries = this.entries;
          for (var ii = 0, len = entries.length; ii < len; ii++) {
            if (is(key, entries[ii][0])) {
              return entries[ii][1];
            }
          }
          return notSetValue;
        };

        HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
          if (keyHash === undefined) {
            keyHash = hash(key);
          }

          var removed = value === NOT_SET;

          if (keyHash !== this.keyHash) {
            if (removed) {
              return this;
            }
            SetRef(didAlter);
            SetRef(didChangeSize);
            return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
          }

          var entries = this.entries;
          var idx = 0;
          for (var len = entries.length; idx < len; idx++) {
            if (is(key, entries[idx][0])) {
              break;
            }
          }
          var exists = idx < len;

          if (exists ? entries[idx][1] === value : removed) {
            return this;
          }

          SetRef(didAlter);
          (removed || !exists) && SetRef(didChangeSize);

          if (removed && len === 2) {
            return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
          }

          var isEditable = ownerID && ownerID === this.ownerID;
          var newEntries = isEditable ? entries : arrCopy(entries);

          if (exists) {
            if (removed) {
              idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
            } else {
              newEntries[idx] = [key, value];
            }
          } else {
            newEntries.push([key, value]);
          }

          if (isEditable) {
            this.entries = newEntries;
            return this;
          }

          return new HashCollisionNode(ownerID, this.keyHash, newEntries);
        };




        function ValueNode(ownerID, keyHash, entry) {
          this.ownerID = ownerID;
          this.keyHash = keyHash;
          this.entry = entry;
        }

        ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
          return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
        };

        ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
          var removed = value === NOT_SET;
          var keyMatch = is(key, this.entry[0]);
          if (keyMatch ? value === this.entry[1] : removed) {
            return this;
          }

          SetRef(didAlter);

          if (removed) {
            SetRef(didChangeSize);
            return; // undefined
          }

          if (keyMatch) {
            if (ownerID && ownerID === this.ownerID) {
              this.entry[1] = value;
              return this;
            }
            return new ValueNode(ownerID, this.keyHash, [key, value]);
          }

          SetRef(didChangeSize);
          return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
        };



      // #pragma Iterators

      ArrayMapNode.prototype.iterate =
      HashCollisionNode.prototype.iterate = function (fn, reverse) {
        var entries = this.entries;
        for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
          if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
            return false;
          }
        }
      };

      BitmapIndexedNode.prototype.iterate =
      HashArrayMapNode.prototype.iterate = function (fn, reverse) {
        var nodes = this.nodes;
        for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
          var node = nodes[reverse ? maxIndex - ii : ii];
          if (node && node.iterate(fn, reverse) === false) {
            return false;
          }
        }
      };

      ValueNode.prototype.iterate = function (fn, reverse) {
        return fn(this.entry);
      };

      createClass(MapIterator, Iterator);

        function MapIterator(map, type, reverse) {
          this._type = type;
          this._reverse = reverse;
          this._stack = map._root && mapIteratorFrame(map._root);
        }

        MapIterator.prototype.next = function() {
          var type = this._type;
          var stack = this._stack;
          while (stack) {
            var node = stack.node;
            var index = stack.index++;
            var maxIndex;
            if (node.entry) {
              if (index === 0) {
                return mapIteratorValue(type, node.entry);
              }
            } else if (node.entries) {
              maxIndex = node.entries.length - 1;
              if (index <= maxIndex) {
                return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
              }
            } else {
              maxIndex = node.nodes.length - 1;
              if (index <= maxIndex) {
                var subNode = node.nodes[this._reverse ? maxIndex - index : index];
                if (subNode) {
                  if (subNode.entry) {
                    return mapIteratorValue(type, subNode.entry);
                  }
                  stack = this._stack = mapIteratorFrame(subNode, stack);
                }
                continue;
              }
            }
            stack = this._stack = this._stack.__prev;
          }
          return iteratorDone();
        };


      function mapIteratorValue(type, entry) {
        return iteratorValue(type, entry[0], entry[1]);
      }

      function mapIteratorFrame(node, prev) {
        return {
          node: node,
          index: 0,
          __prev: prev
        };
      }

      function makeMap(size, root, ownerID, hash) {
        var map = Object.create(MapPrototype);
        map.size = size;
        map._root = root;
        map.__ownerID = ownerID;
        map.__hash = hash;
        map.__altered = false;
        return map;
      }

      var EMPTY_MAP;
      function emptyMap() {
        return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
      }

      function updateMap(map, k, v) {
        var newRoot;
        var newSize;
        if (!map._root) {
          if (v === NOT_SET) {
            return map;
          }
          newSize = 1;
          newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
        } else {
          var didChangeSize = MakeRef(CHANGE_LENGTH);
          var didAlter = MakeRef(DID_ALTER);
          newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
          if (!didAlter.value) {
            return map;
          }
          newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
        }
        if (map.__ownerID) {
          map.size = newSize;
          map._root = newRoot;
          map.__hash = undefined;
          map.__altered = true;
          return map;
        }
        return newRoot ? makeMap(newSize, newRoot) : emptyMap();
      }

      function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
        if (!node) {
          if (value === NOT_SET) {
            return node;
          }
          SetRef(didAlter);
          SetRef(didChangeSize);
          return new ValueNode(ownerID, keyHash, [key, value]);
        }
        return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
      }

      function isLeafNode(node) {
        return node.constructor === ValueNode || node.constructor === HashCollisionNode;
      }

      function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
        if (node.keyHash === keyHash) {
          return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
        }

        var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
        var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

        var newNode;
        var nodes = idx1 === idx2 ?
          [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
          ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

        return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
      }

      function createNodes(ownerID, entries, key, value) {
        if (!ownerID) {
          ownerID = new OwnerID();
        }
        var node = new ValueNode(ownerID, hash(key), [key, value]);
        for (var ii = 0; ii < entries.length; ii++) {
          var entry = entries[ii];
          node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
        }
        return node;
      }

      function packNodes(ownerID, nodes, count, excluding) {
        var bitmap = 0;
        var packedII = 0;
        var packedNodes = new Array(count);
        for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
          var node = nodes[ii];
          if (node !== undefined && ii !== excluding) {
            bitmap |= bit;
            packedNodes[packedII++] = node;
          }
        }
        return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
      }

      function expandNodes(ownerID, nodes, bitmap, including, node) {
        var count = 0;
        var expandedNodes = new Array(SIZE);
        for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
          expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
        }
        expandedNodes[including] = node;
        return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
      }

      function mergeIntoMapWith(map, merger, iterables) {
        var iters = [];
        for (var ii = 0; ii < iterables.length; ii++) {
          var value = iterables[ii];
          var iter = KeyedIterable(value);
          if (!isIterable(value)) {
            iter = iter.map(function(v ) {return fromJS(v)});
          }
          iters.push(iter);
        }
        return mergeIntoCollectionWith(map, merger, iters);
      }

      function deepMerger(existing, value, key) {
        return existing && existing.mergeDeep && isIterable(value) ?
          existing.mergeDeep(value) :
          is(existing, value) ? existing : value;
      }

      function deepMergerWith(merger) {
        return function(existing, value, key)  {
          if (existing && existing.mergeDeepWith && isIterable(value)) {
            return existing.mergeDeepWith(merger, value);
          }
          var nextValue = merger(existing, value, key);
          return is(existing, nextValue) ? existing : nextValue;
        };
      }

      function mergeIntoCollectionWith(collection, merger, iters) {
        iters = iters.filter(function(x ) {return x.size !== 0});
        if (iters.length === 0) {
          return collection;
        }
        if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
          return collection.constructor(iters[0]);
        }
        return collection.withMutations(function(collection ) {
          var mergeIntoMap = merger ?
            function(value, key)  {
              collection.update(key, NOT_SET, function(existing )
                {return existing === NOT_SET ? value : merger(existing, value, key)}
              );
            } :
            function(value, key)  {
              collection.set(key, value);
            };
          for (var ii = 0; ii < iters.length; ii++) {
            iters[ii].forEach(mergeIntoMap);
          }
        });
      }

      function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
        var isNotSet = existing === NOT_SET;
        var step = keyPathIter.next();
        if (step.done) {
          var existingValue = isNotSet ? notSetValue : existing;
          var newValue = updater(existingValue);
          return newValue === existingValue ? existing : newValue;
        }
        invariant(
          isNotSet || (existing && existing.set),
          'invalid keyPath'
        );
        var key = step.value;
        var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
        var nextUpdated = updateInDeepMap(
          nextExisting,
          keyPathIter,
          notSetValue,
          updater
        );
        return nextUpdated === nextExisting ? existing :
          nextUpdated === NOT_SET ? existing.remove(key) :
          (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
      }

      function popCount(x) {
        x = x - ((x >> 1) & 0x55555555);
        x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
        x = (x + (x >> 4)) & 0x0f0f0f0f;
        x = x + (x >> 8);
        x = x + (x >> 16);
        return x & 0x7f;
      }

      function setIn(array, idx, val, canEdit) {
        var newArray = canEdit ? array : arrCopy(array);
        newArray[idx] = val;
        return newArray;
      }

      function spliceIn(array, idx, val, canEdit) {
        var newLen = array.length + 1;
        if (canEdit && idx + 1 === newLen) {
          array[idx] = val;
          return array;
        }
        var newArray = new Array(newLen);
        var after = 0;
        for (var ii = 0; ii < newLen; ii++) {
          if (ii === idx) {
            newArray[ii] = val;
            after = -1;
          } else {
            newArray[ii] = array[ii + after];
          }
        }
        return newArray;
      }

      function spliceOut(array, idx, canEdit) {
        var newLen = array.length - 1;
        if (canEdit && idx === newLen) {
          array.pop();
          return array;
        }
        var newArray = new Array(newLen);
        var after = 0;
        for (var ii = 0; ii < newLen; ii++) {
          if (ii === idx) {
            after = 1;
          }
          newArray[ii] = array[ii + after];
        }
        return newArray;
      }

      var MAX_ARRAY_MAP_SIZE = SIZE / 4;
      var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
      var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

      createClass(List, IndexedCollection);

        // @pragma Construction

        function List(value) {
          var empty = emptyList();
          if (value === null || value === undefined) {
            return empty;
          }
          if (isList(value)) {
            return value;
          }
          var iter = IndexedIterable(value);
          var size = iter.size;
          if (size === 0) {
            return empty;
          }
          assertNotInfinite(size);
          if (size > 0 && size < SIZE) {
            return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
          }
          return empty.withMutations(function(list ) {
            list.setSize(size);
            iter.forEach(function(v, i)  {return list.set(i, v)});
          });
        }

        List.of = function(/*...values*/) {
          return this(arguments);
        };

        List.prototype.toString = function() {
          return this.__toString('List [', ']');
        };

        // @pragma Access

        List.prototype.get = function(index, notSetValue) {
          index = wrapIndex(this, index);
          if (index >= 0 && index < this.size) {
            index += this._origin;
            var node = listNodeFor(this, index);
            return node && node.array[index & MASK];
          }
          return notSetValue;
        };

        // @pragma Modification

        List.prototype.set = function(index, value) {
          return updateList(this, index, value);
        };

        List.prototype.remove = function(index) {
          return !this.has(index) ? this :
            index === 0 ? this.shift() :
            index === this.size - 1 ? this.pop() :
            this.splice(index, 1);
        };

        List.prototype.insert = function(index, value) {
          return this.splice(index, 0, value);
        };

        List.prototype.clear = function() {
          if (this.size === 0) {
            return this;
          }
          if (this.__ownerID) {
            this.size = this._origin = this._capacity = 0;
            this._level = SHIFT;
            this._root = this._tail = null;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return emptyList();
        };

        List.prototype.push = function(/*...values*/) {
          var values = arguments;
          var oldSize = this.size;
          return this.withMutations(function(list ) {
            setListBounds(list, 0, oldSize + values.length);
            for (var ii = 0; ii < values.length; ii++) {
              list.set(oldSize + ii, values[ii]);
            }
          });
        };

        List.prototype.pop = function() {
          return setListBounds(this, 0, -1);
        };

        List.prototype.unshift = function(/*...values*/) {
          var values = arguments;
          return this.withMutations(function(list ) {
            setListBounds(list, -values.length);
            for (var ii = 0; ii < values.length; ii++) {
              list.set(ii, values[ii]);
            }
          });
        };

        List.prototype.shift = function() {
          return setListBounds(this, 1);
        };

        // @pragma Composition

        List.prototype.merge = function(/*...iters*/) {
          return mergeIntoListWith(this, undefined, arguments);
        };

        List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
          return mergeIntoListWith(this, merger, iters);
        };

        List.prototype.mergeDeep = function(/*...iters*/) {
          return mergeIntoListWith(this, deepMerger, arguments);
        };

        List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
          return mergeIntoListWith(this, deepMergerWith(merger), iters);
        };

        List.prototype.setSize = function(size) {
          return setListBounds(this, 0, size);
        };

        // @pragma Iteration

        List.prototype.slice = function(begin, end) {
          var size = this.size;
          if (wholeSlice(begin, end, size)) {
            return this;
          }
          return setListBounds(
            this,
            resolveBegin(begin, size),
            resolveEnd(end, size)
          );
        };

        List.prototype.__iterator = function(type, reverse) {
          var index = 0;
          var values = iterateList(this, reverse);
          return new Iterator(function()  {
            var value = values();
            return value === DONE ?
              iteratorDone() :
              iteratorValue(type, index++, value);
          });
        };

        List.prototype.__iterate = function(fn, reverse) {
          var index = 0;
          var values = iterateList(this, reverse);
          var value;
          while ((value = values()) !== DONE) {
            if (fn(value, index++, this) === false) {
              break;
            }
          }
          return index;
        };

        List.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          if (!ownerID) {
            this.__ownerID = ownerID;
            return this;
          }
          return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
        };


      function isList(maybeList) {
        return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
      }

      List.isList = isList;

      var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

      var ListPrototype = List.prototype;
      ListPrototype[IS_LIST_SENTINEL] = true;
      ListPrototype[DELETE] = ListPrototype.remove;
      ListPrototype.setIn = MapPrototype.setIn;
      ListPrototype.deleteIn =
      ListPrototype.removeIn = MapPrototype.removeIn;
      ListPrototype.update = MapPrototype.update;
      ListPrototype.updateIn = MapPrototype.updateIn;
      ListPrototype.mergeIn = MapPrototype.mergeIn;
      ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
      ListPrototype.withMutations = MapPrototype.withMutations;
      ListPrototype.asMutable = MapPrototype.asMutable;
      ListPrototype.asImmutable = MapPrototype.asImmutable;
      ListPrototype.wasAltered = MapPrototype.wasAltered;



        function VNode(array, ownerID) {
          this.array = array;
          this.ownerID = ownerID;
        }

        // TODO: seems like these methods are very similar

        VNode.prototype.removeBefore = function(ownerID, level, index) {
          if (index === level ? 1 << level :  this.array.length === 0) {
            return this;
          }
          var originIndex = (index >>> level) & MASK;
          if (originIndex >= this.array.length) {
            return new VNode([], ownerID);
          }
          var removingFirst = originIndex === 0;
          var newChild;
          if (level > 0) {
            var oldChild = this.array[originIndex];
            newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
            if (newChild === oldChild && removingFirst) {
              return this;
            }
          }
          if (removingFirst && !newChild) {
            return this;
          }
          var editable = editableVNode(this, ownerID);
          if (!removingFirst) {
            for (var ii = 0; ii < originIndex; ii++) {
              editable.array[ii] = undefined;
            }
          }
          if (newChild) {
            editable.array[originIndex] = newChild;
          }
          return editable;
        };

        VNode.prototype.removeAfter = function(ownerID, level, index) {
          if (index === (level ? 1 << level : 0) || this.array.length === 0) {
            return this;
          }
          var sizeIndex = ((index - 1) >>> level) & MASK;
          if (sizeIndex >= this.array.length) {
            return this;
          }

          var newChild;
          if (level > 0) {
            var oldChild = this.array[sizeIndex];
            newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
            if (newChild === oldChild && sizeIndex === this.array.length - 1) {
              return this;
            }
          }

          var editable = editableVNode(this, ownerID);
          editable.array.splice(sizeIndex + 1);
          if (newChild) {
            editable.array[sizeIndex] = newChild;
          }
          return editable;
        };



      var DONE = {};

      function iterateList(list, reverse) {
        var left = list._origin;
        var right = list._capacity;
        var tailPos = getTailOffset(right);
        var tail = list._tail;

        return iterateNodeOrLeaf(list._root, list._level, 0);

        function iterateNodeOrLeaf(node, level, offset) {
          return level === 0 ?
            iterateLeaf(node, offset) :
            iterateNode(node, level, offset);
        }

        function iterateLeaf(node, offset) {
          var array = offset === tailPos ? tail && tail.array : node && node.array;
          var from = offset > left ? 0 : left - offset;
          var to = right - offset;
          if (to > SIZE) {
            to = SIZE;
          }
          return function()  {
            if (from === to) {
              return DONE;
            }
            var idx = reverse ? --to : from++;
            return array && array[idx];
          };
        }

        function iterateNode(node, level, offset) {
          var values;
          var array = node && node.array;
          var from = offset > left ? 0 : (left - offset) >> level;
          var to = ((right - offset) >> level) + 1;
          if (to > SIZE) {
            to = SIZE;
          }
          return function()  {
            do {
              if (values) {
                var value = values();
                if (value !== DONE) {
                  return value;
                }
                values = null;
              }
              if (from === to) {
                return DONE;
              }
              var idx = reverse ? --to : from++;
              values = iterateNodeOrLeaf(
                array && array[idx], level - SHIFT, offset + (idx << level)
              );
            } while (true);
          };
        }
      }

      function makeList(origin, capacity, level, root, tail, ownerID, hash) {
        var list = Object.create(ListPrototype);
        list.size = capacity - origin;
        list._origin = origin;
        list._capacity = capacity;
        list._level = level;
        list._root = root;
        list._tail = tail;
        list.__ownerID = ownerID;
        list.__hash = hash;
        list.__altered = false;
        return list;
      }

      var EMPTY_LIST;
      function emptyList() {
        return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
      }

      function updateList(list, index, value) {
        index = wrapIndex(list, index);

        if (index !== index) {
          return list;
        }

        if (index >= list.size || index < 0) {
          return list.withMutations(function(list ) {
            index < 0 ?
              setListBounds(list, index).set(0, value) :
              setListBounds(list, 0, index + 1).set(index, value);
          });
        }

        index += list._origin;

        var newTail = list._tail;
        var newRoot = list._root;
        var didAlter = MakeRef(DID_ALTER);
        if (index >= getTailOffset(list._capacity)) {
          newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
        } else {
          newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
        }

        if (!didAlter.value) {
          return list;
        }

        if (list.__ownerID) {
          list._root = newRoot;
          list._tail = newTail;
          list.__hash = undefined;
          list.__altered = true;
          return list;
        }
        return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
      }

      function updateVNode(node, ownerID, level, index, value, didAlter) {
        var idx = (index >>> level) & MASK;
        var nodeHas = node && idx < node.array.length;
        if (!nodeHas && value === undefined) {
          return node;
        }

        var newNode;

        if (level > 0) {
          var lowerNode = node && node.array[idx];
          var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
          if (newLowerNode === lowerNode) {
            return node;
          }
          newNode = editableVNode(node, ownerID);
          newNode.array[idx] = newLowerNode;
          return newNode;
        }

        if (nodeHas && node.array[idx] === value) {
          return node;
        }

        SetRef(didAlter);

        newNode = editableVNode(node, ownerID);
        if (value === undefined && idx === newNode.array.length - 1) {
          newNode.array.pop();
        } else {
          newNode.array[idx] = value;
        }
        return newNode;
      }

      function editableVNode(node, ownerID) {
        if (ownerID && node && ownerID === node.ownerID) {
          return node;
        }
        return new VNode(node ? node.array.slice() : [], ownerID);
      }

      function listNodeFor(list, rawIndex) {
        if (rawIndex >= getTailOffset(list._capacity)) {
          return list._tail;
        }
        if (rawIndex < 1 << (list._level + SHIFT)) {
          var node = list._root;
          var level = list._level;
          while (node && level > 0) {
            node = node.array[(rawIndex >>> level) & MASK];
            level -= SHIFT;
          }
          return node;
        }
      }

      function setListBounds(list, begin, end) {
        // Sanitize begin & end using this shorthand for ToInt32(argument)
        // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
        if (begin !== undefined) {
          begin = begin | 0;
        }
        if (end !== undefined) {
          end = end | 0;
        }
        var owner = list.__ownerID || new OwnerID();
        var oldOrigin = list._origin;
        var oldCapacity = list._capacity;
        var newOrigin = oldOrigin + begin;
        var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
        if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
          return list;
        }

        // If it's going to end after it starts, it's empty.
        if (newOrigin >= newCapacity) {
          return list.clear();
        }

        var newLevel = list._level;
        var newRoot = list._root;

        // New origin might need creating a higher root.
        var offsetShift = 0;
        while (newOrigin + offsetShift < 0) {
          newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
          newLevel += SHIFT;
          offsetShift += 1 << newLevel;
        }
        if (offsetShift) {
          newOrigin += offsetShift;
          oldOrigin += offsetShift;
          newCapacity += offsetShift;
          oldCapacity += offsetShift;
        }

        var oldTailOffset = getTailOffset(oldCapacity);
        var newTailOffset = getTailOffset(newCapacity);

        // New size might need creating a higher root.
        while (newTailOffset >= 1 << (newLevel + SHIFT)) {
          newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
          newLevel += SHIFT;
        }

        // Locate or create the new tail.
        var oldTail = list._tail;
        var newTail = newTailOffset < oldTailOffset ?
          listNodeFor(list, newCapacity - 1) :
          newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

        // Merge Tail into tree.
        if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
          newRoot = editableVNode(newRoot, owner);
          var node = newRoot;
          for (var level = newLevel; level > SHIFT; level -= SHIFT) {
            var idx = (oldTailOffset >>> level) & MASK;
            node = node.array[idx] = editableVNode(node.array[idx], owner);
          }
          node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
        }

        // If the size has been reduced, there's a chance the tail needs to be trimmed.
        if (newCapacity < oldCapacity) {
          newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
        }

        // If the new origin is within the tail, then we do not need a root.
        if (newOrigin >= newTailOffset) {
          newOrigin -= newTailOffset;
          newCapacity -= newTailOffset;
          newLevel = SHIFT;
          newRoot = null;
          newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

        // Otherwise, if the root has been trimmed, garbage collect.
        } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
          offsetShift = 0;

          // Identify the new top root node of the subtree of the old root.
          while (newRoot) {
            var beginIndex = (newOrigin >>> newLevel) & MASK;
            if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
              break;
            }
            if (beginIndex) {
              offsetShift += (1 << newLevel) * beginIndex;
            }
            newLevel -= SHIFT;
            newRoot = newRoot.array[beginIndex];
          }

          // Trim the new sides of the new root.
          if (newRoot && newOrigin > oldOrigin) {
            newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
          }
          if (newRoot && newTailOffset < oldTailOffset) {
            newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
          }
          if (offsetShift) {
            newOrigin -= offsetShift;
            newCapacity -= offsetShift;
          }
        }

        if (list.__ownerID) {
          list.size = newCapacity - newOrigin;
          list._origin = newOrigin;
          list._capacity = newCapacity;
          list._level = newLevel;
          list._root = newRoot;
          list._tail = newTail;
          list.__hash = undefined;
          list.__altered = true;
          return list;
        }
        return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
      }

      function mergeIntoListWith(list, merger, iterables) {
        var iters = [];
        var maxSize = 0;
        for (var ii = 0; ii < iterables.length; ii++) {
          var value = iterables[ii];
          var iter = IndexedIterable(value);
          if (iter.size > maxSize) {
            maxSize = iter.size;
          }
          if (!isIterable(value)) {
            iter = iter.map(function(v ) {return fromJS(v)});
          }
          iters.push(iter);
        }
        if (maxSize > list.size) {
          list = list.setSize(maxSize);
        }
        return mergeIntoCollectionWith(list, merger, iters);
      }

      function getTailOffset(size) {
        return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
      }

      createClass(OrderedMap, Map);

        // @pragma Construction

        function OrderedMap(value) {
          return value === null || value === undefined ? emptyOrderedMap() :
            isOrderedMap(value) ? value :
            emptyOrderedMap().withMutations(function(map ) {
              var iter = KeyedIterable(value);
              assertNotInfinite(iter.size);
              iter.forEach(function(v, k)  {return map.set(k, v)});
            });
        }

        OrderedMap.of = function(/*...values*/) {
          return this(arguments);
        };

        OrderedMap.prototype.toString = function() {
          return this.__toString('OrderedMap {', '}');
        };

        // @pragma Access

        OrderedMap.prototype.get = function(k, notSetValue) {
          var index = this._map.get(k);
          return index !== undefined ? this._list.get(index)[1] : notSetValue;
        };

        // @pragma Modification

        OrderedMap.prototype.clear = function() {
          if (this.size === 0) {
            return this;
          }
          if (this.__ownerID) {
            this.size = 0;
            this._map.clear();
            this._list.clear();
            return this;
          }
          return emptyOrderedMap();
        };

        OrderedMap.prototype.set = function(k, v) {
          return updateOrderedMap(this, k, v);
        };

        OrderedMap.prototype.remove = function(k) {
          return updateOrderedMap(this, k, NOT_SET);
        };

        OrderedMap.prototype.wasAltered = function() {
          return this._map.wasAltered() || this._list.wasAltered();
        };

        OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          return this._list.__iterate(
            function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
            reverse
          );
        };

        OrderedMap.prototype.__iterator = function(type, reverse) {
          return this._list.fromEntrySeq().__iterator(type, reverse);
        };

        OrderedMap.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          var newMap = this._map.__ensureOwner(ownerID);
          var newList = this._list.__ensureOwner(ownerID);
          if (!ownerID) {
            this.__ownerID = ownerID;
            this._map = newMap;
            this._list = newList;
            return this;
          }
          return makeOrderedMap(newMap, newList, ownerID, this.__hash);
        };


      function isOrderedMap(maybeOrderedMap) {
        return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
      }

      OrderedMap.isOrderedMap = isOrderedMap;

      OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
      OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



      function makeOrderedMap(map, list, ownerID, hash) {
        var omap = Object.create(OrderedMap.prototype);
        omap.size = map ? map.size : 0;
        omap._map = map;
        omap._list = list;
        omap.__ownerID = ownerID;
        omap.__hash = hash;
        return omap;
      }

      var EMPTY_ORDERED_MAP;
      function emptyOrderedMap() {
        return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
      }

      function updateOrderedMap(omap, k, v) {
        var map = omap._map;
        var list = omap._list;
        var i = map.get(k);
        var has = i !== undefined;
        var newMap;
        var newList;
        if (v === NOT_SET) { // removed
          if (!has) {
            return omap;
          }
          if (list.size >= SIZE && list.size >= map.size * 2) {
            newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
            newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
            if (omap.__ownerID) {
              newMap.__ownerID = newList.__ownerID = omap.__ownerID;
            }
          } else {
            newMap = map.remove(k);
            newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
          }
        } else {
          if (has) {
            if (v === list.get(i)[1]) {
              return omap;
            }
            newMap = map;
            newList = list.set(i, [k, v]);
          } else {
            newMap = map.set(k, list.size);
            newList = list.set(list.size, [k, v]);
          }
        }
        if (omap.__ownerID) {
          omap.size = newMap.size;
          omap._map = newMap;
          omap._list = newList;
          omap.__hash = undefined;
          return omap;
        }
        return makeOrderedMap(newMap, newList);
      }

      createClass(ToKeyedSequence, KeyedSeq);
        function ToKeyedSequence(indexed, useKeys) {
          this._iter = indexed;
          this._useKeys = useKeys;
          this.size = indexed.size;
        }

        ToKeyedSequence.prototype.get = function(key, notSetValue) {
          return this._iter.get(key, notSetValue);
        };

        ToKeyedSequence.prototype.has = function(key) {
          return this._iter.has(key);
        };

        ToKeyedSequence.prototype.valueSeq = function() {
          return this._iter.valueSeq();
        };

        ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
          var reversedSequence = reverseFactory(this, true);
          if (!this._useKeys) {
            reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
          }
          return reversedSequence;
        };

        ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
          var mappedSequence = mapFactory(this, mapper, context);
          if (!this._useKeys) {
            mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
          }
          return mappedSequence;
        };

        ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          var ii;
          return this._iter.__iterate(
            this._useKeys ?
              function(v, k)  {return fn(v, k, this$0)} :
              ((ii = reverse ? resolveSize(this) : 0),
                function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
            reverse
          );
        };

        ToKeyedSequence.prototype.__iterator = function(type, reverse) {
          if (this._useKeys) {
            return this._iter.__iterator(type, reverse);
          }
          var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
          var ii = reverse ? resolveSize(this) : 0;
          return new Iterator(function()  {
            var step = iterator.next();
            return step.done ? step :
              iteratorValue(type, reverse ? --ii : ii++, step.value, step);
          });
        };

      ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


      createClass(ToIndexedSequence, IndexedSeq);
        function ToIndexedSequence(iter) {
          this._iter = iter;
          this.size = iter.size;
        }

        ToIndexedSequence.prototype.includes = function(value) {
          return this._iter.includes(value);
        };

        ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          var iterations = 0;
          return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
        };

        ToIndexedSequence.prototype.__iterator = function(type, reverse) {
          var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
          var iterations = 0;
          return new Iterator(function()  {
            var step = iterator.next();
            return step.done ? step :
              iteratorValue(type, iterations++, step.value, step)
          });
        };



      createClass(ToSetSequence, SetSeq);
        function ToSetSequence(iter) {
          this._iter = iter;
          this.size = iter.size;
        }

        ToSetSequence.prototype.has = function(key) {
          return this._iter.includes(key);
        };

        ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
        };

        ToSetSequence.prototype.__iterator = function(type, reverse) {
          var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
          return new Iterator(function()  {
            var step = iterator.next();
            return step.done ? step :
              iteratorValue(type, step.value, step.value, step);
          });
        };



      createClass(FromEntriesSequence, KeyedSeq);
        function FromEntriesSequence(entries) {
          this._iter = entries;
          this.size = entries.size;
        }

        FromEntriesSequence.prototype.entrySeq = function() {
          return this._iter.toSeq();
        };

        FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          return this._iter.__iterate(function(entry ) {
            // Check if entry exists first so array access doesn't throw for holes
            // in the parent iteration.
            if (entry) {
              validateEntry(entry);
              var indexedIterable = isIterable(entry);
              return fn(
                indexedIterable ? entry.get(1) : entry[1],
                indexedIterable ? entry.get(0) : entry[0],
                this$0
              );
            }
          }, reverse);
        };

        FromEntriesSequence.prototype.__iterator = function(type, reverse) {
          var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
          return new Iterator(function()  {
            while (true) {
              var step = iterator.next();
              if (step.done) {
                return step;
              }
              var entry = step.value;
              // Check if entry exists first so array access doesn't throw for holes
              // in the parent iteration.
              if (entry) {
                validateEntry(entry);
                var indexedIterable = isIterable(entry);
                return iteratorValue(
                  type,
                  indexedIterable ? entry.get(0) : entry[0],
                  indexedIterable ? entry.get(1) : entry[1],
                  step
                );
              }
            }
          });
        };


      ToIndexedSequence.prototype.cacheResult =
      ToKeyedSequence.prototype.cacheResult =
      ToSetSequence.prototype.cacheResult =
      FromEntriesSequence.prototype.cacheResult =
        cacheResultThrough;


      function flipFactory(iterable) {
        var flipSequence = makeSequence(iterable);
        flipSequence._iter = iterable;
        flipSequence.size = iterable.size;
        flipSequence.flip = function()  {return iterable};
        flipSequence.reverse = function () {
          var reversedSequence = iterable.reverse.apply(this); // super.reverse()
          reversedSequence.flip = function()  {return iterable.reverse()};
          return reversedSequence;
        };
        flipSequence.has = function(key ) {return iterable.includes(key)};
        flipSequence.includes = function(key ) {return iterable.has(key)};
        flipSequence.cacheResult = cacheResultThrough;
        flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
          return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
        };
        flipSequence.__iteratorUncached = function(type, reverse) {
          if (type === ITERATE_ENTRIES) {
            var iterator = iterable.__iterator(type, reverse);
            return new Iterator(function()  {
              var step = iterator.next();
              if (!step.done) {
                var k = step.value[0];
                step.value[0] = step.value[1];
                step.value[1] = k;
              }
              return step;
            });
          }
          return iterable.__iterator(
            type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
            reverse
          );
        };
        return flipSequence;
      }


      function mapFactory(iterable, mapper, context) {
        var mappedSequence = makeSequence(iterable);
        mappedSequence.size = iterable.size;
        mappedSequence.has = function(key ) {return iterable.has(key)};
        mappedSequence.get = function(key, notSetValue)  {
          var v = iterable.get(key, NOT_SET);
          return v === NOT_SET ?
            notSetValue :
            mapper.call(context, v, key, iterable);
        };
        mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
          return iterable.__iterate(
            function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
            reverse
          );
        };
        mappedSequence.__iteratorUncached = function (type, reverse) {
          var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
          return new Iterator(function()  {
            var step = iterator.next();
            if (step.done) {
              return step;
            }
            var entry = step.value;
            var key = entry[0];
            return iteratorValue(
              type,
              key,
              mapper.call(context, entry[1], key, iterable),
              step
            );
          });
        };
        return mappedSequence;
      }


      function reverseFactory(iterable, useKeys) {
        var reversedSequence = makeSequence(iterable);
        reversedSequence._iter = iterable;
        reversedSequence.size = iterable.size;
        reversedSequence.reverse = function()  {return iterable};
        if (iterable.flip) {
          reversedSequence.flip = function () {
            var flipSequence = flipFactory(iterable);
            flipSequence.reverse = function()  {return iterable.flip()};
            return flipSequence;
          };
        }
        reversedSequence.get = function(key, notSetValue) 
          {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
        reversedSequence.has = function(key )
          {return iterable.has(useKeys ? key : -1 - key)};
        reversedSequence.includes = function(value ) {return iterable.includes(value)};
        reversedSequence.cacheResult = cacheResultThrough;
        reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
          return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
        };
        reversedSequence.__iterator =
          function(type, reverse)  {return iterable.__iterator(type, !reverse)};
        return reversedSequence;
      }


      function filterFactory(iterable, predicate, context, useKeys) {
        var filterSequence = makeSequence(iterable);
        if (useKeys) {
          filterSequence.has = function(key ) {
            var v = iterable.get(key, NOT_SET);
            return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
          };
          filterSequence.get = function(key, notSetValue)  {
            var v = iterable.get(key, NOT_SET);
            return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
              v : notSetValue;
          };
        }
        filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
          var iterations = 0;
          iterable.__iterate(function(v, k, c)  {
            if (predicate.call(context, v, k, c)) {
              iterations++;
              return fn(v, useKeys ? k : iterations - 1, this$0);
            }
          }, reverse);
          return iterations;
        };
        filterSequence.__iteratorUncached = function (type, reverse) {
          var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
          var iterations = 0;
          return new Iterator(function()  {
            while (true) {
              var step = iterator.next();
              if (step.done) {
                return step;
              }
              var entry = step.value;
              var key = entry[0];
              var value = entry[1];
              if (predicate.call(context, value, key, iterable)) {
                return iteratorValue(type, useKeys ? key : iterations++, value, step);
              }
            }
          });
        };
        return filterSequence;
      }


      function countByFactory(iterable, grouper, context) {
        var groups = Map().asMutable();
        iterable.__iterate(function(v, k)  {
          groups.update(
            grouper.call(context, v, k, iterable),
            0,
            function(a ) {return a + 1}
          );
        });
        return groups.asImmutable();
      }


      function groupByFactory(iterable, grouper, context) {
        var isKeyedIter = isKeyed(iterable);
        var groups = (isOrdered(iterable) ? OrderedMap() : Map()).asMutable();
        iterable.__iterate(function(v, k)  {
          groups.update(
            grouper.call(context, v, k, iterable),
            function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
          );
        });
        var coerce = iterableClass(iterable);
        return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
      }


      function sliceFactory(iterable, begin, end, useKeys) {
        var originalSize = iterable.size;

        // Sanitize begin & end using this shorthand for ToInt32(argument)
        // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
        if (begin !== undefined) {
          begin = begin | 0;
        }
        if (end !== undefined) {
          if (end === Infinity) {
            end = originalSize;
          } else {
            end = end | 0;
          }
        }

        if (wholeSlice(begin, end, originalSize)) {
          return iterable;
        }

        var resolvedBegin = resolveBegin(begin, originalSize);
        var resolvedEnd = resolveEnd(end, originalSize);

        // begin or end will be NaN if they were provided as negative numbers and
        // this iterable's size is unknown. In that case, cache first so there is
        // a known size and these do not resolve to NaN.
        if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
          return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
        }

        // Note: resolvedEnd is undefined when the original sequence's length is
        // unknown and this slice did not supply an end and should contain all
        // elements after resolvedBegin.
        // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
        var resolvedSize = resolvedEnd - resolvedBegin;
        var sliceSize;
        if (resolvedSize === resolvedSize) {
          sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
        }

        var sliceSeq = makeSequence(iterable);

        // If iterable.size is undefined, the size of the realized sliceSeq is
        // unknown at this point unless the number of items to slice is 0
        sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

        if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
          sliceSeq.get = function (index, notSetValue) {
            index = wrapIndex(this, index);
            return index >= 0 && index < sliceSize ?
              iterable.get(index + resolvedBegin, notSetValue) :
              notSetValue;
          };
        }

        sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
          if (sliceSize === 0) {
            return 0;
          }
          if (reverse) {
            return this.cacheResult().__iterate(fn, reverse);
          }
          var skipped = 0;
          var isSkipping = true;
          var iterations = 0;
          iterable.__iterate(function(v, k)  {
            if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
              iterations++;
              return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
                     iterations !== sliceSize;
            }
          });
          return iterations;
        };

        sliceSeq.__iteratorUncached = function(type, reverse) {
          if (sliceSize !== 0 && reverse) {
            return this.cacheResult().__iterator(type, reverse);
          }
          // Don't bother instantiating parent iterator if taking 0.
          var iterator = sliceSize !== 0 && iterable.__iterator(type, reverse);
          var skipped = 0;
          var iterations = 0;
          return new Iterator(function()  {
            while (skipped++ < resolvedBegin) {
              iterator.next();
            }
            if (++iterations > sliceSize) {
              return iteratorDone();
            }
            var step = iterator.next();
            if (useKeys || type === ITERATE_VALUES) {
              return step;
            } else if (type === ITERATE_KEYS) {
              return iteratorValue(type, iterations - 1, undefined, step);
            } else {
              return iteratorValue(type, iterations - 1, step.value[1], step);
            }
          });
        };

        return sliceSeq;
      }


      function takeWhileFactory(iterable, predicate, context) {
        var takeSequence = makeSequence(iterable);
        takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
          if (reverse) {
            return this.cacheResult().__iterate(fn, reverse);
          }
          var iterations = 0;
          iterable.__iterate(function(v, k, c) 
            {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
          );
          return iterations;
        };
        takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
          if (reverse) {
            return this.cacheResult().__iterator(type, reverse);
          }
          var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
          var iterating = true;
          return new Iterator(function()  {
            if (!iterating) {
              return iteratorDone();
            }
            var step = iterator.next();
            if (step.done) {
              return step;
            }
            var entry = step.value;
            var k = entry[0];
            var v = entry[1];
            if (!predicate.call(context, v, k, this$0)) {
              iterating = false;
              return iteratorDone();
            }
            return type === ITERATE_ENTRIES ? step :
              iteratorValue(type, k, v, step);
          });
        };
        return takeSequence;
      }


      function skipWhileFactory(iterable, predicate, context, useKeys) {
        var skipSequence = makeSequence(iterable);
        skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
          if (reverse) {
            return this.cacheResult().__iterate(fn, reverse);
          }
          var isSkipping = true;
          var iterations = 0;
          iterable.__iterate(function(v, k, c)  {
            if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
              iterations++;
              return fn(v, useKeys ? k : iterations - 1, this$0);
            }
          });
          return iterations;
        };
        skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
          if (reverse) {
            return this.cacheResult().__iterator(type, reverse);
          }
          var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
          var skipping = true;
          var iterations = 0;
          return new Iterator(function()  {
            var step, k, v;
            do {
              step = iterator.next();
              if (step.done) {
                if (useKeys || type === ITERATE_VALUES) {
                  return step;
                } else if (type === ITERATE_KEYS) {
                  return iteratorValue(type, iterations++, undefined, step);
                } else {
                  return iteratorValue(type, iterations++, step.value[1], step);
                }
              }
              var entry = step.value;
              k = entry[0];
              v = entry[1];
              skipping && (skipping = predicate.call(context, v, k, this$0));
            } while (skipping);
            return type === ITERATE_ENTRIES ? step :
              iteratorValue(type, k, v, step);
          });
        };
        return skipSequence;
      }


      function concatFactory(iterable, values) {
        var isKeyedIterable = isKeyed(iterable);
        var iters = [iterable].concat(values).map(function(v ) {
          if (!isIterable(v)) {
            v = isKeyedIterable ?
              keyedSeqFromValue(v) :
              indexedSeqFromValue(Array.isArray(v) ? v : [v]);
          } else if (isKeyedIterable) {
            v = KeyedIterable(v);
          }
          return v;
        }).filter(function(v ) {return v.size !== 0});

        if (iters.length === 0) {
          return iterable;
        }

        if (iters.length === 1) {
          var singleton = iters[0];
          if (singleton === iterable ||
              isKeyedIterable && isKeyed(singleton) ||
              isIndexed(iterable) && isIndexed(singleton)) {
            return singleton;
          }
        }

        var concatSeq = new ArraySeq(iters);
        if (isKeyedIterable) {
          concatSeq = concatSeq.toKeyedSeq();
        } else if (!isIndexed(iterable)) {
          concatSeq = concatSeq.toSetSeq();
        }
        concatSeq = concatSeq.flatten(true);
        concatSeq.size = iters.reduce(
          function(sum, seq)  {
            if (sum !== undefined) {
              var size = seq.size;
              if (size !== undefined) {
                return sum + size;
              }
            }
          },
          0
        );
        return concatSeq;
      }


      function flattenFactory(iterable, depth, useKeys) {
        var flatSequence = makeSequence(iterable);
        flatSequence.__iterateUncached = function(fn, reverse) {
          var iterations = 0;
          var stopped = false;
          function flatDeep(iter, currentDepth) {var this$0 = this;
            iter.__iterate(function(v, k)  {
              if ((!depth || currentDepth < depth) && isIterable(v)) {
                flatDeep(v, currentDepth + 1);
              } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
                stopped = true;
              }
              return !stopped;
            }, reverse);
          }
          flatDeep(iterable, 0);
          return iterations;
        };
        flatSequence.__iteratorUncached = function(type, reverse) {
          var iterator = iterable.__iterator(type, reverse);
          var stack = [];
          var iterations = 0;
          return new Iterator(function()  {
            while (iterator) {
              var step = iterator.next();
              if (step.done !== false) {
                iterator = stack.pop();
                continue;
              }
              var v = step.value;
              if (type === ITERATE_ENTRIES) {
                v = v[1];
              }
              if ((!depth || stack.length < depth) && isIterable(v)) {
                stack.push(iterator);
                iterator = v.__iterator(type, reverse);
              } else {
                return useKeys ? step : iteratorValue(type, iterations++, v, step);
              }
            }
            return iteratorDone();
          });
        };
        return flatSequence;
      }


      function flatMapFactory(iterable, mapper, context) {
        var coerce = iterableClass(iterable);
        return iterable.toSeq().map(
          function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
        ).flatten(true);
      }


      function interposeFactory(iterable, separator) {
        var interposedSequence = makeSequence(iterable);
        interposedSequence.size = iterable.size && iterable.size * 2 -1;
        interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
          var iterations = 0;
          iterable.__iterate(function(v, k) 
            {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
            fn(v, iterations++, this$0) !== false},
            reverse
          );
          return iterations;
        };
        interposedSequence.__iteratorUncached = function(type, reverse) {
          var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
          var iterations = 0;
          var step;
          return new Iterator(function()  {
            if (!step || iterations % 2) {
              step = iterator.next();
              if (step.done) {
                return step;
              }
            }
            return iterations % 2 ?
              iteratorValue(type, iterations++, separator) :
              iteratorValue(type, iterations++, step.value, step);
          });
        };
        return interposedSequence;
      }


      function sortFactory(iterable, comparator, mapper) {
        if (!comparator) {
          comparator = defaultComparator;
        }
        var isKeyedIterable = isKeyed(iterable);
        var index = 0;
        var entries = iterable.toSeq().map(
          function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
        ).toArray();
        entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
          isKeyedIterable ?
          function(v, i)  { entries[i].length = 2; } :
          function(v, i)  { entries[i] = v[1]; }
        );
        return isKeyedIterable ? KeyedSeq(entries) :
          isIndexed(iterable) ? IndexedSeq(entries) :
          SetSeq(entries);
      }


      function maxFactory(iterable, comparator, mapper) {
        if (!comparator) {
          comparator = defaultComparator;
        }
        if (mapper) {
          var entry = iterable.toSeq()
            .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
            .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
          return entry && entry[0];
        } else {
          return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
        }
      }

      function maxCompare(comparator, a, b) {
        var comp = comparator(b, a);
        // b is considered the new max if the comparator declares them equal, but
        // they are not equal and b is in fact a nullish value.
        return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
      }


      function zipWithFactory(keyIter, zipper, iters) {
        var zipSequence = makeSequence(keyIter);
        zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
        // Note: this a generic base implementation of __iterate in terms of
        // __iterator which may be more generically useful in the future.
        zipSequence.__iterate = function(fn, reverse) {
          /* generic:
          var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
          var step;
          var iterations = 0;
          while (!(step = iterator.next()).done) {
            iterations++;
            if (fn(step.value[1], step.value[0], this) === false) {
              break;
            }
          }
          return iterations;
          */
          // indexed:
          var iterator = this.__iterator(ITERATE_VALUES, reverse);
          var step;
          var iterations = 0;
          while (!(step = iterator.next()).done) {
            if (fn(step.value, iterations++, this) === false) {
              break;
            }
          }
          return iterations;
        };
        zipSequence.__iteratorUncached = function(type, reverse) {
          var iterators = iters.map(function(i )
            {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
          );
          var iterations = 0;
          var isDone = false;
          return new Iterator(function()  {
            var steps;
            if (!isDone) {
              steps = iterators.map(function(i ) {return i.next()});
              isDone = steps.some(function(s ) {return s.done});
            }
            if (isDone) {
              return iteratorDone();
            }
            return iteratorValue(
              type,
              iterations++,
              zipper.apply(null, steps.map(function(s ) {return s.value}))
            );
          });
        };
        return zipSequence
      }


      // #pragma Helper Functions

      function reify(iter, seq) {
        return isSeq(iter) ? seq : iter.constructor(seq);
      }

      function validateEntry(entry) {
        if (entry !== Object(entry)) {
          throw new TypeError('Expected [K, V] tuple: ' + entry);
        }
      }

      function resolveSize(iter) {
        assertNotInfinite(iter.size);
        return ensureSize(iter);
      }

      function iterableClass(iterable) {
        return isKeyed(iterable) ? KeyedIterable :
          isIndexed(iterable) ? IndexedIterable :
          SetIterable;
      }

      function makeSequence(iterable) {
        return Object.create(
          (
            isKeyed(iterable) ? KeyedSeq :
            isIndexed(iterable) ? IndexedSeq :
            SetSeq
          ).prototype
        );
      }

      function cacheResultThrough() {
        if (this._iter.cacheResult) {
          this._iter.cacheResult();
          this.size = this._iter.size;
          return this;
        } else {
          return Seq.prototype.cacheResult.call(this);
        }
      }

      function defaultComparator(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
      }

      function forceIterator(keyPath) {
        var iter = getIterator(keyPath);
        if (!iter) {
          // Array might not be iterable in this environment, so we need a fallback
          // to our wrapped type.
          if (!isArrayLike(keyPath)) {
            throw new TypeError('Expected iterable or array-like: ' + keyPath);
          }
          iter = getIterator(Iterable(keyPath));
        }
        return iter;
      }

      createClass(Record, KeyedCollection);

        function Record(defaultValues, name) {
          var hasInitialized;

          var RecordType = function Record(values) {
            if (values instanceof RecordType) {
              return values;
            }
            if (!(this instanceof RecordType)) {
              return new RecordType(values);
            }
            if (!hasInitialized) {
              hasInitialized = true;
              var keys = Object.keys(defaultValues);
              setProps(RecordTypePrototype, keys);
              RecordTypePrototype.size = keys.length;
              RecordTypePrototype._name = name;
              RecordTypePrototype._keys = keys;
              RecordTypePrototype._defaultValues = defaultValues;
            }
            this._map = Map(values);
          };

          var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
          RecordTypePrototype.constructor = RecordType;

          return RecordType;
        }

        Record.prototype.toString = function() {
          return this.__toString(recordName(this) + ' {', '}');
        };

        // @pragma Access

        Record.prototype.has = function(k) {
          return this._defaultValues.hasOwnProperty(k);
        };

        Record.prototype.get = function(k, notSetValue) {
          if (!this.has(k)) {
            return notSetValue;
          }
          var defaultVal = this._defaultValues[k];
          return this._map ? this._map.get(k, defaultVal) : defaultVal;
        };

        // @pragma Modification

        Record.prototype.clear = function() {
          if (this.__ownerID) {
            this._map && this._map.clear();
            return this;
          }
          var RecordType = this.constructor;
          return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()));
        };

        Record.prototype.set = function(k, v) {
          if (!this.has(k)) {
            throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
          }
          if (this._map && !this._map.has(k)) {
            var defaultVal = this._defaultValues[k];
            if (v === defaultVal) {
              return this;
            }
          }
          var newMap = this._map && this._map.set(k, v);
          if (this.__ownerID || newMap === this._map) {
            return this;
          }
          return makeRecord(this, newMap);
        };

        Record.prototype.remove = function(k) {
          if (!this.has(k)) {
            return this;
          }
          var newMap = this._map && this._map.remove(k);
          if (this.__ownerID || newMap === this._map) {
            return this;
          }
          return makeRecord(this, newMap);
        };

        Record.prototype.wasAltered = function() {
          return this._map.wasAltered();
        };

        Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
          return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
        };

        Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
        };

        Record.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          var newMap = this._map && this._map.__ensureOwner(ownerID);
          if (!ownerID) {
            this.__ownerID = ownerID;
            this._map = newMap;
            return this;
          }
          return makeRecord(this, newMap, ownerID);
        };


      var RecordPrototype = Record.prototype;
      RecordPrototype[DELETE] = RecordPrototype.remove;
      RecordPrototype.deleteIn =
      RecordPrototype.removeIn = MapPrototype.removeIn;
      RecordPrototype.merge = MapPrototype.merge;
      RecordPrototype.mergeWith = MapPrototype.mergeWith;
      RecordPrototype.mergeIn = MapPrototype.mergeIn;
      RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
      RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
      RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
      RecordPrototype.setIn = MapPrototype.setIn;
      RecordPrototype.update = MapPrototype.update;
      RecordPrototype.updateIn = MapPrototype.updateIn;
      RecordPrototype.withMutations = MapPrototype.withMutations;
      RecordPrototype.asMutable = MapPrototype.asMutable;
      RecordPrototype.asImmutable = MapPrototype.asImmutable;


      function makeRecord(likeRecord, map, ownerID) {
        var record = Object.create(Object.getPrototypeOf(likeRecord));
        record._map = map;
        record.__ownerID = ownerID;
        return record;
      }

      function recordName(record) {
        return record._name || record.constructor.name || 'Record';
      }

      function setProps(prototype, names) {
        try {
          names.forEach(setProp.bind(undefined, prototype));
        } catch (error) {
          // Object.defineProperty failed. Probably IE8.
        }
      }

      function setProp(prototype, name) {
        Object.defineProperty(prototype, name, {
          get: function() {
            return this.get(name);
          },
          set: function(value) {
            invariant(this.__ownerID, 'Cannot set on an immutable record.');
            this.set(name, value);
          }
        });
      }

      createClass(Set, SetCollection);

        // @pragma Construction

        function Set(value) {
          return value === null || value === undefined ? emptySet() :
            isSet(value) && !isOrdered(value) ? value :
            emptySet().withMutations(function(set ) {
              var iter = SetIterable(value);
              assertNotInfinite(iter.size);
              iter.forEach(function(v ) {return set.add(v)});
            });
        }

        Set.of = function(/*...values*/) {
          return this(arguments);
        };

        Set.fromKeys = function(value) {
          return this(KeyedIterable(value).keySeq());
        };

        Set.prototype.toString = function() {
          return this.__toString('Set {', '}');
        };

        // @pragma Access

        Set.prototype.has = function(value) {
          return this._map.has(value);
        };

        // @pragma Modification

        Set.prototype.add = function(value) {
          return updateSet(this, this._map.set(value, true));
        };

        Set.prototype.remove = function(value) {
          return updateSet(this, this._map.remove(value));
        };

        Set.prototype.clear = function() {
          return updateSet(this, this._map.clear());
        };

        // @pragma Composition

        Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
          iters = iters.filter(function(x ) {return x.size !== 0});
          if (iters.length === 0) {
            return this;
          }
          if (this.size === 0 && !this.__ownerID && iters.length === 1) {
            return this.constructor(iters[0]);
          }
          return this.withMutations(function(set ) {
            for (var ii = 0; ii < iters.length; ii++) {
              SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
            }
          });
        };

        Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
          if (iters.length === 0) {
            return this;
          }
          iters = iters.map(function(iter ) {return SetIterable(iter)});
          var originalSet = this;
          return this.withMutations(function(set ) {
            originalSet.forEach(function(value ) {
              if (!iters.every(function(iter ) {return iter.includes(value)})) {
                set.remove(value);
              }
            });
          });
        };

        Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
          if (iters.length === 0) {
            return this;
          }
          iters = iters.map(function(iter ) {return SetIterable(iter)});
          var originalSet = this;
          return this.withMutations(function(set ) {
            originalSet.forEach(function(value ) {
              if (iters.some(function(iter ) {return iter.includes(value)})) {
                set.remove(value);
              }
            });
          });
        };

        Set.prototype.merge = function() {
          return this.union.apply(this, arguments);
        };

        Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
          return this.union.apply(this, iters);
        };

        Set.prototype.sort = function(comparator) {
          // Late binding
          return OrderedSet(sortFactory(this, comparator));
        };

        Set.prototype.sortBy = function(mapper, comparator) {
          // Late binding
          return OrderedSet(sortFactory(this, comparator, mapper));
        };

        Set.prototype.wasAltered = function() {
          return this._map.wasAltered();
        };

        Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
          return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
        };

        Set.prototype.__iterator = function(type, reverse) {
          return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
        };

        Set.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          var newMap = this._map.__ensureOwner(ownerID);
          if (!ownerID) {
            this.__ownerID = ownerID;
            this._map = newMap;
            return this;
          }
          return this.__make(newMap, ownerID);
        };


      function isSet(maybeSet) {
        return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
      }

      Set.isSet = isSet;

      var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

      var SetPrototype = Set.prototype;
      SetPrototype[IS_SET_SENTINEL] = true;
      SetPrototype[DELETE] = SetPrototype.remove;
      SetPrototype.mergeDeep = SetPrototype.merge;
      SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
      SetPrototype.withMutations = MapPrototype.withMutations;
      SetPrototype.asMutable = MapPrototype.asMutable;
      SetPrototype.asImmutable = MapPrototype.asImmutable;

      SetPrototype.__empty = emptySet;
      SetPrototype.__make = makeSet;

      function updateSet(set, newMap) {
        if (set.__ownerID) {
          set.size = newMap.size;
          set._map = newMap;
          return set;
        }
        return newMap === set._map ? set :
          newMap.size === 0 ? set.__empty() :
          set.__make(newMap);
      }

      function makeSet(map, ownerID) {
        var set = Object.create(SetPrototype);
        set.size = map ? map.size : 0;
        set._map = map;
        set.__ownerID = ownerID;
        return set;
      }

      var EMPTY_SET;
      function emptySet() {
        return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
      }

      createClass(OrderedSet, Set);

        // @pragma Construction

        function OrderedSet(value) {
          return value === null || value === undefined ? emptyOrderedSet() :
            isOrderedSet(value) ? value :
            emptyOrderedSet().withMutations(function(set ) {
              var iter = SetIterable(value);
              assertNotInfinite(iter.size);
              iter.forEach(function(v ) {return set.add(v)});
            });
        }

        OrderedSet.of = function(/*...values*/) {
          return this(arguments);
        };

        OrderedSet.fromKeys = function(value) {
          return this(KeyedIterable(value).keySeq());
        };

        OrderedSet.prototype.toString = function() {
          return this.__toString('OrderedSet {', '}');
        };


      function isOrderedSet(maybeOrderedSet) {
        return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
      }

      OrderedSet.isOrderedSet = isOrderedSet;

      var OrderedSetPrototype = OrderedSet.prototype;
      OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

      OrderedSetPrototype.__empty = emptyOrderedSet;
      OrderedSetPrototype.__make = makeOrderedSet;

      function makeOrderedSet(map, ownerID) {
        var set = Object.create(OrderedSetPrototype);
        set.size = map ? map.size : 0;
        set._map = map;
        set.__ownerID = ownerID;
        return set;
      }

      var EMPTY_ORDERED_SET;
      function emptyOrderedSet() {
        return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
      }

      createClass(Stack, IndexedCollection);

        // @pragma Construction

        function Stack(value) {
          return value === null || value === undefined ? emptyStack() :
            isStack(value) ? value :
            emptyStack().unshiftAll(value);
        }

        Stack.of = function(/*...values*/) {
          return this(arguments);
        };

        Stack.prototype.toString = function() {
          return this.__toString('Stack [', ']');
        };

        // @pragma Access

        Stack.prototype.get = function(index, notSetValue) {
          var head = this._head;
          index = wrapIndex(this, index);
          while (head && index--) {
            head = head.next;
          }
          return head ? head.value : notSetValue;
        };

        Stack.prototype.peek = function() {
          return this._head && this._head.value;
        };

        // @pragma Modification

        Stack.prototype.push = function(/*...values*/) {
          if (arguments.length === 0) {
            return this;
          }
          var newSize = this.size + arguments.length;
          var head = this._head;
          for (var ii = arguments.length - 1; ii >= 0; ii--) {
            head = {
              value: arguments[ii],
              next: head
            };
          }
          if (this.__ownerID) {
            this.size = newSize;
            this._head = head;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return makeStack(newSize, head);
        };

        Stack.prototype.pushAll = function(iter) {
          iter = IndexedIterable(iter);
          if (iter.size === 0) {
            return this;
          }
          assertNotInfinite(iter.size);
          var newSize = this.size;
          var head = this._head;
          iter.reverse().forEach(function(value ) {
            newSize++;
            head = {
              value: value,
              next: head
            };
          });
          if (this.__ownerID) {
            this.size = newSize;
            this._head = head;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return makeStack(newSize, head);
        };

        Stack.prototype.pop = function() {
          return this.slice(1);
        };

        Stack.prototype.unshift = function(/*...values*/) {
          return this.push.apply(this, arguments);
        };

        Stack.prototype.unshiftAll = function(iter) {
          return this.pushAll(iter);
        };

        Stack.prototype.shift = function() {
          return this.pop.apply(this, arguments);
        };

        Stack.prototype.clear = function() {
          if (this.size === 0) {
            return this;
          }
          if (this.__ownerID) {
            this.size = 0;
            this._head = undefined;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return emptyStack();
        };

        Stack.prototype.slice = function(begin, end) {
          if (wholeSlice(begin, end, this.size)) {
            return this;
          }
          var resolvedBegin = resolveBegin(begin, this.size);
          var resolvedEnd = resolveEnd(end, this.size);
          if (resolvedEnd !== this.size) {
            // super.slice(begin, end);
            return IndexedCollection.prototype.slice.call(this, begin, end);
          }
          var newSize = this.size - resolvedBegin;
          var head = this._head;
          while (resolvedBegin--) {
            head = head.next;
          }
          if (this.__ownerID) {
            this.size = newSize;
            this._head = head;
            this.__hash = undefined;
            this.__altered = true;
            return this;
          }
          return makeStack(newSize, head);
        };

        // @pragma Mutability

        Stack.prototype.__ensureOwner = function(ownerID) {
          if (ownerID === this.__ownerID) {
            return this;
          }
          if (!ownerID) {
            this.__ownerID = ownerID;
            this.__altered = false;
            return this;
          }
          return makeStack(this.size, this._head, ownerID, this.__hash);
        };

        // @pragma Iteration

        Stack.prototype.__iterate = function(fn, reverse) {
          if (reverse) {
            return this.reverse().__iterate(fn);
          }
          var iterations = 0;
          var node = this._head;
          while (node) {
            if (fn(node.value, iterations++, this) === false) {
              break;
            }
            node = node.next;
          }
          return iterations;
        };

        Stack.prototype.__iterator = function(type, reverse) {
          if (reverse) {
            return this.reverse().__iterator(type);
          }
          var iterations = 0;
          var node = this._head;
          return new Iterator(function()  {
            if (node) {
              var value = node.value;
              node = node.next;
              return iteratorValue(type, iterations++, value);
            }
            return iteratorDone();
          });
        };


      function isStack(maybeStack) {
        return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
      }

      Stack.isStack = isStack;

      var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

      var StackPrototype = Stack.prototype;
      StackPrototype[IS_STACK_SENTINEL] = true;
      StackPrototype.withMutations = MapPrototype.withMutations;
      StackPrototype.asMutable = MapPrototype.asMutable;
      StackPrototype.asImmutable = MapPrototype.asImmutable;
      StackPrototype.wasAltered = MapPrototype.wasAltered;


      function makeStack(size, head, ownerID, hash) {
        var map = Object.create(StackPrototype);
        map.size = size;
        map._head = head;
        map.__ownerID = ownerID;
        map.__hash = hash;
        map.__altered = false;
        return map;
      }

      var EMPTY_STACK;
      function emptyStack() {
        return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
      }

      /**
       * Contributes additional methods to a constructor
       */
      function mixin(ctor, methods) {
        var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
        Object.keys(methods).forEach(keyCopier);
        Object.getOwnPropertySymbols &&
          Object.getOwnPropertySymbols(methods).forEach(keyCopier);
        return ctor;
      }

      Iterable.Iterator = Iterator;

      mixin(Iterable, {

        // ### Conversion to other types

        toArray: function() {
          assertNotInfinite(this.size);
          var array = new Array(this.size || 0);
          this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
          return array;
        },

        toIndexedSeq: function() {
          return new ToIndexedSequence(this);
        },

        toJS: function() {
          return this.toSeq().map(
            function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
          ).__toJS();
        },

        toJSON: function() {
          return this.toSeq().map(
            function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
          ).__toJS();
        },

        toKeyedSeq: function() {
          return new ToKeyedSequence(this, true);
        },

        toMap: function() {
          // Use Late Binding here to solve the circular dependency.
          return Map(this.toKeyedSeq());
        },

        toObject: function() {
          assertNotInfinite(this.size);
          var object = {};
          this.__iterate(function(v, k)  { object[k] = v; });
          return object;
        },

        toOrderedMap: function() {
          // Use Late Binding here to solve the circular dependency.
          return OrderedMap(this.toKeyedSeq());
        },

        toOrderedSet: function() {
          // Use Late Binding here to solve the circular dependency.
          return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
        },

        toSet: function() {
          // Use Late Binding here to solve the circular dependency.
          return Set(isKeyed(this) ? this.valueSeq() : this);
        },

        toSetSeq: function() {
          return new ToSetSequence(this);
        },

        toSeq: function() {
          return isIndexed(this) ? this.toIndexedSeq() :
            isKeyed(this) ? this.toKeyedSeq() :
            this.toSetSeq();
        },

        toStack: function() {
          // Use Late Binding here to solve the circular dependency.
          return Stack(isKeyed(this) ? this.valueSeq() : this);
        },

        toList: function() {
          // Use Late Binding here to solve the circular dependency.
          return List(isKeyed(this) ? this.valueSeq() : this);
        },


        // ### Common JavaScript methods and properties

        toString: function() {
          return '[Iterable]';
        },

        __toString: function(head, tail) {
          if (this.size === 0) {
            return head + tail;
          }
          return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
        },


        // ### ES6 Collection methods (ES6 Array and Map)

        concat: function() {var values = SLICE$0.call(arguments, 0);
          return reify(this, concatFactory(this, values));
        },

        includes: function(searchValue) {
          return this.some(function(value ) {return is(value, searchValue)});
        },

        entries: function() {
          return this.__iterator(ITERATE_ENTRIES);
        },

        every: function(predicate, context) {
          assertNotInfinite(this.size);
          var returnValue = true;
          this.__iterate(function(v, k, c)  {
            if (!predicate.call(context, v, k, c)) {
              returnValue = false;
              return false;
            }
          });
          return returnValue;
        },

        filter: function(predicate, context) {
          return reify(this, filterFactory(this, predicate, context, true));
        },

        find: function(predicate, context, notSetValue) {
          var entry = this.findEntry(predicate, context);
          return entry ? entry[1] : notSetValue;
        },

        forEach: function(sideEffect, context) {
          assertNotInfinite(this.size);
          return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
        },

        join: function(separator) {
          assertNotInfinite(this.size);
          separator = separator !== undefined ? '' + separator : ',';
          var joined = '';
          var isFirst = true;
          this.__iterate(function(v ) {
            isFirst ? (isFirst = false) : (joined += separator);
            joined += v !== null && v !== undefined ? v.toString() : '';
          });
          return joined;
        },

        keys: function() {
          return this.__iterator(ITERATE_KEYS);
        },

        map: function(mapper, context) {
          return reify(this, mapFactory(this, mapper, context));
        },

        reduce: function(reducer, initialReduction, context) {
          assertNotInfinite(this.size);
          var reduction;
          var useFirst;
          if (arguments.length < 2) {
            useFirst = true;
          } else {
            reduction = initialReduction;
          }
          this.__iterate(function(v, k, c)  {
            if (useFirst) {
              useFirst = false;
              reduction = v;
            } else {
              reduction = reducer.call(context, reduction, v, k, c);
            }
          });
          return reduction;
        },

        reduceRight: function(reducer, initialReduction, context) {
          var reversed = this.toKeyedSeq().reverse();
          return reversed.reduce.apply(reversed, arguments);
        },

        reverse: function() {
          return reify(this, reverseFactory(this, true));
        },

        slice: function(begin, end) {
          return reify(this, sliceFactory(this, begin, end, true));
        },

        some: function(predicate, context) {
          return !this.every(not(predicate), context);
        },

        sort: function(comparator) {
          return reify(this, sortFactory(this, comparator));
        },

        values: function() {
          return this.__iterator(ITERATE_VALUES);
        },


        // ### More sequential methods

        butLast: function() {
          return this.slice(0, -1);
        },

        isEmpty: function() {
          return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
        },

        count: function(predicate, context) {
          return ensureSize(
            predicate ? this.toSeq().filter(predicate, context) : this
          );
        },

        countBy: function(grouper, context) {
          return countByFactory(this, grouper, context);
        },

        equals: function(other) {
          return deepEqual(this, other);
        },

        entrySeq: function() {
          var iterable = this;
          if (iterable._cache) {
            // We cache as an entries array, so we can just return the cache!
            return new ArraySeq(iterable._cache);
          }
          var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
          entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
          return entriesSequence;
        },

        filterNot: function(predicate, context) {
          return this.filter(not(predicate), context);
        },

        findEntry: function(predicate, context, notSetValue) {
          var found = notSetValue;
          this.__iterate(function(v, k, c)  {
            if (predicate.call(context, v, k, c)) {
              found = [k, v];
              return false;
            }
          });
          return found;
        },

        findKey: function(predicate, context) {
          var entry = this.findEntry(predicate, context);
          return entry && entry[0];
        },

        findLast: function(predicate, context, notSetValue) {
          return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
        },

        findLastEntry: function(predicate, context, notSetValue) {
          return this.toKeyedSeq().reverse().findEntry(predicate, context, notSetValue);
        },

        findLastKey: function(predicate, context) {
          return this.toKeyedSeq().reverse().findKey(predicate, context);
        },

        first: function() {
          return this.find(returnTrue);
        },

        flatMap: function(mapper, context) {
          return reify(this, flatMapFactory(this, mapper, context));
        },

        flatten: function(depth) {
          return reify(this, flattenFactory(this, depth, true));
        },

        fromEntrySeq: function() {
          return new FromEntriesSequence(this);
        },

        get: function(searchKey, notSetValue) {
          return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
        },

        getIn: function(searchKeyPath, notSetValue) {
          var nested = this;
          // Note: in an ES6 environment, we would prefer:
          // for (var key of searchKeyPath) {
          var iter = forceIterator(searchKeyPath);
          var step;
          while (!(step = iter.next()).done) {
            var key = step.value;
            nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
            if (nested === NOT_SET) {
              return notSetValue;
            }
          }
          return nested;
        },

        groupBy: function(grouper, context) {
          return groupByFactory(this, grouper, context);
        },

        has: function(searchKey) {
          return this.get(searchKey, NOT_SET) !== NOT_SET;
        },

        hasIn: function(searchKeyPath) {
          return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
        },

        isSubset: function(iter) {
          iter = typeof iter.includes === 'function' ? iter : Iterable(iter);
          return this.every(function(value ) {return iter.includes(value)});
        },

        isSuperset: function(iter) {
          iter = typeof iter.isSubset === 'function' ? iter : Iterable(iter);
          return iter.isSubset(this);
        },

        keyOf: function(searchValue) {
          return this.findKey(function(value ) {return is(value, searchValue)});
        },

        keySeq: function() {
          return this.toSeq().map(keyMapper).toIndexedSeq();
        },

        last: function() {
          return this.toSeq().reverse().first();
        },

        lastKeyOf: function(searchValue) {
          return this.toKeyedSeq().reverse().keyOf(searchValue);
        },

        max: function(comparator) {
          return maxFactory(this, comparator);
        },

        maxBy: function(mapper, comparator) {
          return maxFactory(this, comparator, mapper);
        },

        min: function(comparator) {
          return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
        },

        minBy: function(mapper, comparator) {
          return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
        },

        rest: function() {
          return this.slice(1);
        },

        skip: function(amount) {
          return this.slice(Math.max(0, amount));
        },

        skipLast: function(amount) {
          return reify(this, this.toSeq().reverse().skip(amount).reverse());
        },

        skipWhile: function(predicate, context) {
          return reify(this, skipWhileFactory(this, predicate, context, true));
        },

        skipUntil: function(predicate, context) {
          return this.skipWhile(not(predicate), context);
        },

        sortBy: function(mapper, comparator) {
          return reify(this, sortFactory(this, comparator, mapper));
        },

        take: function(amount) {
          return this.slice(0, Math.max(0, amount));
        },

        takeLast: function(amount) {
          return reify(this, this.toSeq().reverse().take(amount).reverse());
        },

        takeWhile: function(predicate, context) {
          return reify(this, takeWhileFactory(this, predicate, context));
        },

        takeUntil: function(predicate, context) {
          return this.takeWhile(not(predicate), context);
        },

        valueSeq: function() {
          return this.toIndexedSeq();
        },


        // ### Hashable Object

        hashCode: function() {
          return this.__hash || (this.__hash = hashIterable(this));
        }


        // ### Internal

        // abstract __iterate(fn, reverse)

        // abstract __iterator(type, reverse)
      });

      // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
      // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
      // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
      // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

      var IterablePrototype = Iterable.prototype;
      IterablePrototype[IS_ITERABLE_SENTINEL] = true;
      IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
      IterablePrototype.__toJS = IterablePrototype.toArray;
      IterablePrototype.__toStringMapper = quoteString;
      IterablePrototype.inspect =
      IterablePrototype.toSource = function() { return this.toString(); };
      IterablePrototype.chain = IterablePrototype.flatMap;
      IterablePrototype.contains = IterablePrototype.includes;

      mixin(KeyedIterable, {

        // ### More sequential methods

        flip: function() {
          return reify(this, flipFactory(this));
        },

        mapEntries: function(mapper, context) {var this$0 = this;
          var iterations = 0;
          return reify(this,
            this.toSeq().map(
              function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
            ).fromEntrySeq()
          );
        },

        mapKeys: function(mapper, context) {var this$0 = this;
          return reify(this,
            this.toSeq().flip().map(
              function(k, v)  {return mapper.call(context, k, v, this$0)}
            ).flip()
          );
        }

      });

      var KeyedIterablePrototype = KeyedIterable.prototype;
      KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
      KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
      KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
      KeyedIterablePrototype.__toStringMapper = function(v, k)  {return JSON.stringify(k) + ': ' + quoteString(v)};



      mixin(IndexedIterable, {

        // ### Conversion to other types

        toKeyedSeq: function() {
          return new ToKeyedSequence(this, false);
        },


        // ### ES6 Collection methods (ES6 Array and Map)

        filter: function(predicate, context) {
          return reify(this, filterFactory(this, predicate, context, false));
        },

        findIndex: function(predicate, context) {
          var entry = this.findEntry(predicate, context);
          return entry ? entry[0] : -1;
        },

        indexOf: function(searchValue) {
          var key = this.keyOf(searchValue);
          return key === undefined ? -1 : key;
        },

        lastIndexOf: function(searchValue) {
          var key = this.lastKeyOf(searchValue);
          return key === undefined ? -1 : key;
        },

        reverse: function() {
          return reify(this, reverseFactory(this, false));
        },

        slice: function(begin, end) {
          return reify(this, sliceFactory(this, begin, end, false));
        },

        splice: function(index, removeNum /*, ...values*/) {
          var numArgs = arguments.length;
          removeNum = Math.max(removeNum | 0, 0);
          if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
            return this;
          }
          // If index is negative, it should resolve relative to the size of the
          // collection. However size may be expensive to compute if not cached, so
          // only call count() if the number is in fact negative.
          index = resolveBegin(index, index < 0 ? this.count() : this.size);
          var spliced = this.slice(0, index);
          return reify(
            this,
            numArgs === 1 ?
              spliced :
              spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
          );
        },


        // ### More collection methods

        findLastIndex: function(predicate, context) {
          var entry = this.findLastEntry(predicate, context);
          return entry ? entry[0] : -1;
        },

        first: function() {
          return this.get(0);
        },

        flatten: function(depth) {
          return reify(this, flattenFactory(this, depth, false));
        },

        get: function(index, notSetValue) {
          index = wrapIndex(this, index);
          return (index < 0 || (this.size === Infinity ||
              (this.size !== undefined && index > this.size))) ?
            notSetValue :
            this.find(function(_, key)  {return key === index}, undefined, notSetValue);
        },

        has: function(index) {
          index = wrapIndex(this, index);
          return index >= 0 && (this.size !== undefined ?
            this.size === Infinity || index < this.size :
            this.indexOf(index) !== -1
          );
        },

        interpose: function(separator) {
          return reify(this, interposeFactory(this, separator));
        },

        interleave: function(/*...iterables*/) {
          var iterables = [this].concat(arrCopy(arguments));
          var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
          var interleaved = zipped.flatten(true);
          if (zipped.size) {
            interleaved.size = zipped.size * iterables.length;
          }
          return reify(this, interleaved);
        },

        keySeq: function() {
          return Range(0, this.size);
        },

        last: function() {
          return this.get(-1);
        },

        skipWhile: function(predicate, context) {
          return reify(this, skipWhileFactory(this, predicate, context, false));
        },

        zip: function(/*, ...iterables */) {
          var iterables = [this].concat(arrCopy(arguments));
          return reify(this, zipWithFactory(this, defaultZipper, iterables));
        },

        zipWith: function(zipper/*, ...iterables */) {
          var iterables = arrCopy(arguments);
          iterables[0] = this;
          return reify(this, zipWithFactory(this, zipper, iterables));
        }

      });

      IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
      IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



      mixin(SetIterable, {

        // ### ES6 Collection methods (ES6 Array and Map)

        get: function(value, notSetValue) {
          return this.has(value) ? value : notSetValue;
        },

        includes: function(value) {
          return this.has(value);
        },


        // ### More sequential methods

        keySeq: function() {
          return this.valueSeq();
        }

      });

      SetIterable.prototype.has = IterablePrototype.includes;
      SetIterable.prototype.contains = SetIterable.prototype.includes;


      // Mixin subclasses

      mixin(KeyedSeq, KeyedIterable.prototype);
      mixin(IndexedSeq, IndexedIterable.prototype);
      mixin(SetSeq, SetIterable.prototype);

      mixin(KeyedCollection, KeyedIterable.prototype);
      mixin(IndexedCollection, IndexedIterable.prototype);
      mixin(SetCollection, SetIterable.prototype);


      // #pragma Helper functions

      function keyMapper(v, k) {
        return k;
      }

      function entryMapper(v, k) {
        return [k, v];
      }

      function not(predicate) {
        return function() {
          return !predicate.apply(this, arguments);
        }
      }

      function neg(predicate) {
        return function() {
          return -predicate.apply(this, arguments);
        }
      }

      function quoteString(value) {
        return typeof value === 'string' ? JSON.stringify(value) : String(value);
      }

      function defaultZipper() {
        return arrCopy(arguments);
      }

      function defaultNegComparator(a, b) {
        return a < b ? 1 : a > b ? -1 : 0;
      }

      function hashIterable(iterable) {
        if (iterable.size === Infinity) {
          return 0;
        }
        var ordered = isOrdered(iterable);
        var keyed = isKeyed(iterable);
        var h = ordered ? 1 : 0;
        var size = iterable.__iterate(
          keyed ?
            ordered ?
              function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
              function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
            ordered ?
              function(v ) { h = 31 * h + hash(v) | 0; } :
              function(v ) { h = h + hash(v) | 0; }
        );
        return murmurHashOfSize(size, h);
      }

      function murmurHashOfSize(size, h) {
        h = imul(h, 0xCC9E2D51);
        h = imul(h << 15 | h >>> -15, 0x1B873593);
        h = imul(h << 13 | h >>> -13, 5);
        h = (h + 0xE6546B64 | 0) ^ size;
        h = imul(h ^ h >>> 16, 0x85EBCA6B);
        h = imul(h ^ h >>> 13, 0xC2B2AE35);
        h = smi(h ^ h >>> 16);
        return h;
      }

      function hashMerge(a, b) {
        return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
      }

      var Immutable = {

        Iterable: Iterable,

        Seq: Seq,
        Collection: Collection,
        Map: Map,
        OrderedMap: OrderedMap,
        List: List,
        Stack: Stack,
        Set: Set,
        OrderedSet: OrderedSet,

        Record: Record,
        Range: Range,
        Repeat: Repeat,

        is: is,
        fromJS: fromJS

      };

      return Immutable;

    }));
    });

    /*
     * Constants for intersection states
     */

    var constants = {
      EMPTY: ".",
      BLACK: "x",
      WHITE: "o"
    };

    var util = createCommonjsModule(function (module, exports) {

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var Constants = _interopRequire(constants);

    var opponentColor = function (color) {
      return color == Constants.BLACK ? Constants.WHITE : Constants.BLACK;
    };
    exports.opponentColor = opponentColor;
    });

    var board = createCommonjsModule(function (module, exports) {

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var Immutable = _interopRequire(immutable);

    var opponentColor = util.opponentColor;

    var Constants = _interopRequire(constants);

    var Point = (function (_Immutable$Record) {
      function Point(i, j) {
        _classCallCheck(this, Point);

        _get(Object.getPrototypeOf(Point.prototype), "constructor", this).call(this, { i: i, j: j });
      }

      _inherits(Point, _Immutable$Record);

      return Point;
    })(Immutable.Record({ i: 0, j: 0 }));

    var Group = (function (_Immutable$Record2) {
      function Group() {
        _classCallCheck(this, Group);

        if (_Immutable$Record2 != null) {
          _Immutable$Record2.apply(this, arguments);
        }
      }

      _inherits(Group, _Immutable$Record2);

      _createClass(Group, {
        isDead: {
          value: function isDead() {
            return this.getLiberties().isEmpty();
          }
        },
        getLiberties: {
          value: function getLiberties() {
            return this.surrounding.filter(function (color) {
              return color === Constants.EMPTY;
            });
          }
        }
      });

      return Group;
    })(Immutable.Record({ stones: null, surrounding: null }));

    var inBounds = function (size, point) {
      return point.i >= 0 && point.i < size && point.j >= 0 && point.j < size;
    };

    var getStone = function (stones, coords) {
      return stones.get(coords, Constants.EMPTY);
    };

    var replaceStone = function (stones, coords, value) {
      return stones.set(coords, value);
    };

    var removeStone = function (stones, coords) {
      return stones.remove(coords);
    };

    var deltas = Immutable.List.of(new Point(-1, 0), new Point(0, 1), new Point(1, 0), new Point(0, -1));

    /*
     * Given a board position, returns a list of [i,j] coordinates representing
     * orthagonally adjacent intersections
     */
    var getAdjacentIntersections = function (size, coords) {
      var addPair = function (vec) {
        return new Point(vec.i + coords.i, vec.j + coords.j);
      };
      return deltas.map(addPair).filter(function (coord) {
        return inBounds(size, coord);
      });
    };

    var allPositions = function (size) {
      var range = Immutable.Range(0, size);
      return range.flatMap(function (i) {
        return range.map(function (j) {
          return new Point(i, j);
        });
      });
    };

    /*
     * Performs a breadth-first search about an (i,j) position to find recursively
     * orthagonally adjacent stones of the same color (stones with which it shares
     * liberties).
     */
    var getGroup = function (stones, size, coords) {
      var color = getStone(stones, coords);

      var search = function (visited, queue, surrounding) {
        if (queue.isEmpty()) return { visited: visited, surrounding: surrounding };

        var stone = queue.first();
        queue = queue.shift();

        if (visited.has(stone)) return search(visited, queue, surrounding);

        var neighbors = getAdjacentIntersections(size, stone);
        neighbors.forEach(function (n) {
          var state = getStone(stones, n);
          if (state === color) queue = queue.push(n);else surrounding = surrounding.set(n, state);
        });

        visited = visited.add(stone);
        return search(visited, queue, surrounding);
      };

      var _search = search(Immutable.Set(), Immutable.List([coords]), Immutable.Map());

      var visited = _search.visited;
      var surrounding = _search.surrounding;

      return new Group({ stones: visited,
        surrounding: surrounding });
    };

    var createEmptyGrid = (function () {
      var createGrid = function (size) {
        return Immutable.Repeat(Immutable.Repeat(Constants.EMPTY, size).toList(), size).toList();
      };

      var cache = {};
      return function (size) {
        return cache[size] || (cache[size] = createGrid(size));
      };
    })();

    var Board = (function () {
      function Board(size, stones) {
        _classCallCheck(this, Board);

        // console.log(size, stones)
        if (typeof size === "undefined" || size < 0) throw "Size must be an integer greater than zero";

        if (typeof stones === "undefined") stones = Immutable.Map();

        this.size = size;
        this.stones = stones;
      }

      _createClass(Board, {
        getStone: {
          value: (function (_getStone) {
            var _getStoneWrapper = function getStone(_x) {
              return _getStone.apply(this, arguments);
            };

            _getStoneWrapper.toString = function () {
              return _getStone.toString();
            };

            return _getStoneWrapper;
          })(function (coords) {
            return getStone(this.stones, new Point(coords[0], coords[1]));
          })
        },
        getSize: {
          value: function getSize() {
            return this.size;
          }
        },
        toArray: {
          value: function toArray() {
            return this.getIntersections().toJS();
          }
        },
        getIntersections: {
          value: function getIntersections() {
            var _this = this;

            var mergeStones = function (map) {
              return _this.stones.reduce(function (board, color, point) {
                return board.setIn([point.i, point.j], color);
              }, map);
            };
            return createEmptyGrid(this.size).withMutations(mergeStones);
          }
        },
        removeStone: {
          value: function removeStone(coords) {
            coords = new Point(coords[0], coords[1]);

            if (!inBounds(this.size, coords)) throw "Intersection out of bounds";

            if (getStone(this.stones, coords) == Constants.EMPTY) throw "Intersection already empty";

            var newBoard = replaceStone(this.stones, coords, Constants.EMPTY);
            return createBoard(this.size, newBoard);
          }
        },
        play: {
          value: function play(color, coords) {
            var _this = this;

            coords = new Point(coords[0], coords[1]);

            if (!inBounds(this.size, coords)) throw "Intersection out of bounds";

            if (getStone(this.stones, coords) != Constants.EMPTY) throw "Intersection occupied by existing stone";

            var newBoard = replaceStone(this.stones, coords, color);
            var neighbors = getAdjacentIntersections(this.size, coords);

            var neighborColors = Immutable.Map(neighbors.zipWith(function (n) {
              return [n, getStone(newBoard, n)];
            }));

            var isOpponentColor = function (stoneColor, _) {
              return stoneColor === opponentColor(color);
            };

            var captured = neighborColors.filter(isOpponentColor).map(function (val, coord) {
              return getGroup(newBoard, _this.size, coord);
            }).valueSeq().filter(function (g) {
              return g.isDead();
            });
            // detect suicide
            var newGroup = getGroup(newBoard, this.size, coords);
            if (captured.isEmpty() && newGroup.isDead()) captured = Immutable.List([newGroup]);
            newBoard = captured.flatMap(function (g) {
              return g.get("stones");
            }).reduce(function (acc, stone) {
              return removeStone(acc, stone);
            }, newBoard);
            return createBoard(this.size, newBoard);
          }
        },
        areaScore: {
          value: function areaScore() {
            var _this = this;

            var positions = allPositions(this.size);
            var visited = Immutable.Set();
            var score = {};
            score[Constants.BLACK] = 0;
            score[Constants.WHITE] = 0;

            positions.forEach(function (coords) {
              if (visited.has(coords)) return;

              var state = getStone(_this.stones, coords);
              var group = getGroup(_this.stones, _this.size, coords);
              var groupStones = group.get("stones");
              var surroundingColors = group.get("surrounding").valueSeq().toSet();

              if (state === Constants.EMPTY && surroundingColors.size === 1) score[surroundingColors.first()] += groupStones.size;else score[state] += groupStones.size;

              visited = visited.union(groupStones);
            });
            // console.log('score ', score)
            return score;
          }
        }
      });

      return Board;
    })();

    var createBoard = function (size, stones) {
      return new Board(size, stones);
    };
    exports.createBoard = createBoard;
    });

    var game = createCommonjsModule(function (module, exports) {

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var Immutable = _interopRequire(immutable);

    var createBoard = board.createBoard;

    var opponentColor = util.opponentColor;

    var Constants = _interopRequire(constants);

    var Game = (function () {
      function Game(boardSize, values) {
        _classCallCheck(this, Game);

        if (typeof values !== "undefined") {
          this.currentColor = values.currentColor;
          this.consectutivePasses = values.consectutivePasses;
          this.history = values.history;
          this.board = values.board;
        } else {
          this.currentColor = Constants.BLACK;
          this.consectutivePasses = 0;
          this.board = createBoard(boardSize);
          this.history = Immutable.Set([this.board.stones]);
        }
      }

      _createClass(Game, {
        isOver: {
          value: function isOver() {
            return this.consectutivePasses >= 2;
          }
        },
        getCurrentPlayer: {
          value: function getCurrentPlayer() {
            return this.currentColor;
          }
        },
        getBoard: {
          value: function getBoard() {
            return this.board;
          }
        },
        play: {
          value: function play(player, coords) {
            var _this = this;

            var inHistory = function (otherBoard) {
              return _this.history.has(otherBoard.stones);
            };

            if (this.isOver()) throw "Game is already over";

            if (player != this.currentColor) throw "Not player's turn";

            var newBoard = this.board.play(this.currentColor, coords);
            if (inHistory(newBoard)) throw "Violation of Ko";

            return createGame(this.boardSize, {
              currentColor: opponentColor(this.currentColor),
              consectutivePasses: 0,
              board: newBoard,
              history: this.history.add(newBoard.stones)
            });
          }
        },
        pass: {
          value: function pass(player) {
            if (this.isOver()) throw "Game is already over";

            if (player != this.currentColor) throw "Not player's turn";

            return createGame(this.boardSize, {
              currentColor: opponentColor(this.currentColor),
              consectutivePasses: this.consectutivePasses + 1,
              board: this.board,
              history: this.history
            });
          }
        },
        removeStone: {
          value: function removeStone(coords) {
            if (!this.isOver()) throw "Game is not over";

            var newBoard = this.board.removeStone(coords);

            return createGame(this.boardSize, {
              currentColor: this.currentColor,
              consectutivePasses: 2,
              board: newBoard,
              history: this.history.add(newBoard.stones)
            });
          }
        },
        areaScore: {

          /*
           * Returns Black - White
           */

          value: function areaScore(komi) {
            if (typeof komi === "undefined") komi = 0;

            var boardScore = this.board.areaScore();
            return boardScore[Constants.BLACK] - (boardScore[Constants.WHITE] + komi);
          }
        }
      });

      return Game;
    })();

    var createGame = function (boardSize, values) {
      return new Game(boardSize, values);
    };
    exports.createGame = createGame;
    });

    var dist = createCommonjsModule(function (module) {

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var createGame = game.createGame;

    var createBoard = board.createBoard;

    var Constants = _interopRequire(constants);

    module.exports = {
      createGame: createGame,
      createBoard: createBoard,
      EMPTY: Constants.EMPTY,
      BLACK: Constants.BLACK,
      WHITE: Constants.WHITE
    };
    });

    var Weiqi = /*@__PURE__*/getDefaultExportFromCjs(dist);

    /* src/components/goban.svelte generated by Svelte v3.31.0 */
    const file$a = "src/components/goban.svelte";

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (200:2) {:else}
    function create_else_block_6(ctx) {
    	let each_1_anchor;
    	let each_value_4 = /*boardArr*/ ctx[5];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*boardArr, latestMove*/ 288) {
    				each_value_4 = /*boardArr*/ ctx[5];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_6.name,
    		type: "else",
    		source: "(200:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (169:21) 
    function create_if_block_5(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*boardArr*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*boardArr, size, markAlive, deadMap, markDead*/ 49314) {
    				each_value_2 = /*boardArr*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(169:21) ",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#if !rewatching && !cleaning}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*boardArr*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*boardArr, play, size, $staged, unstage, stage, color, game, latestMove*/ 15143) {
    				each_value = /*boardArr*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(128:2) {#if !rewatching && !cleaning}",
    		ctx
    	});

    	return block;
    }

    // (214:12) {:else}
    function create_else_block_7(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_7.name,
    		type: "else",
    		source: "(214:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (212:33) 
    function create_if_block_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⚪");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(212:33) ",
    		ctx
    	});

    	return block;
    }

    // (210:12) {#if col == 'x'}
    function create_if_block_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⚫");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(210:12) {#if col == 'x'}",
    		ctx
    	});

    	return block;
    }

    // (203:6) {#each row as col, y}
    function create_each_block_5(ctx) {
    	let button;
    	let t;
    	let button_class_value;

    	function select_block_type_7(ctx, dirty) {
    		if (/*col*/ ctx[25] == "x") return create_if_block_9;
    		if (/*col*/ ctx[25] == "o") return create_if_block_10;
    		return create_else_block_7;
    	}

    	let current_block_type = select_block_type_7(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			t = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*x*/ ctx[24] == /*latestMove*/ ctx[8][0] && /*y*/ ctx[27] == /*latestMove*/ ctx[8][1]
    			? "last-move"
    			: "") + " svelte-17xltlb"));

    			button.disabled = true;
    			add_location(button, file$a, 206, 10, 5391);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_7(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, t);
    				}
    			}

    			if (dirty[0] & /*latestMove*/ 256 && button_class_value !== (button_class_value = "" + (null_to_empty(/*x*/ ctx[24] == /*latestMove*/ ctx[8][0] && /*y*/ ctx[27] == /*latestMove*/ ctx[8][1]
    			? "last-move"
    			: "") + " svelte-17xltlb"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(203:6) {#each row as col, y}",
    		ctx
    	});

    	return block;
    }

    // (202:4) {#each boardArr as row, x}
    function create_each_block_4(ctx) {
    	let each_1_anchor;
    	let each_value_5 = /*row*/ ctx[22];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*latestMove, boardArr*/ 288) {
    				each_value_5 = /*row*/ ctx[22];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(202:4) {#each boardArr as row, x}",
    		ctx
    	});

    	return block;
    }

    // (184:10) {:else}
    function create_else_block_4(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let span;
    	let t2;
    	let mounted;
    	let dispose;

    	function select_block_type_6(ctx, dirty) {
    		if (/*col*/ ctx[25] == "x") return create_if_block_8;
    		return create_else_block_5;
    	}

    	let current_block_type = select_block_type_6(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();
    			span = element("span");
    			if_block.c();
    			t2 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 185, 14, 4769);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 186, 14, 4845);
    			attr_dev(span, "class", "svelte-17xltlb");
    			add_location(span, file$a, 187, 14, 4921);
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 184, 12, 4721);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);
    			append_dev(button, span);
    			if_block.m(span, null);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*markDead*/ ctx[14](/*x*/ ctx[24], /*y*/ ctx[27]), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_6(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(184:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (178:10) {#if deadMap.get(`${x}${y}`)}
    function create_if_block_7(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = text("\n              ☠️\n            ");

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 179, 14, 4514);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 180, 14, 4590);
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 178, 12, 4465);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*markAlive*/ ctx[15](/*x*/ ctx[24], /*y*/ ctx[27]), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(178:10) {#if deadMap.get(`${x}${y}`)}",
    		ctx
    	});

    	return block;
    }

    // (172:8) {#if col == '.'}
    function create_if_block_6(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 173, 12, 4241);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 174, 12, 4315);
    			button.disabled = true;
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 172, 10, 4211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(172:8) {#if col == '.'}",
    		ctx
    	});

    	return block;
    }

    // (191:16) {:else}
    function create_else_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⚪");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5.name,
    		type: "else",
    		source: "(191:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (189:16) {#if col == 'x'}
    function create_if_block_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⚫");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(189:16) {#if col == 'x'}",
    		ctx
    	});

    	return block;
    }

    // (171:6) {#each row as col, y}
    function create_each_block_3(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type_5(ctx, dirty) {
    		if (/*col*/ ctx[25] == ".") return create_if_block_6;
    		if (show_if == null || dirty[0] & /*deadMap*/ 128) show_if = !!/*deadMap*/ ctx[7].get(`${/*x*/ ctx[24]}${/*y*/ ctx[27]}`);
    		if (show_if) return create_if_block_7;
    		return create_else_block_4;
    	}

    	let current_block_type = select_block_type_5(ctx, [-1]);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_5(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(171:6) {#each row as col, y}",
    		ctx
    	});

    	return block;
    }

    // (170:4) {#each boardArr as row, x}
    function create_each_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_3 = /*row*/ ctx[22];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*size, boardArr, markAlive, deadMap, markDead*/ 49314) {
    				each_value_3 = /*row*/ ctx[22];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(170:4) {#each boardArr as row, x}",
    		ctx
    	});

    	return block;
    }

    // (158:8) {:else}
    function create_else_block_3(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let span;
    	let t2_value = (/*col*/ ctx[25] == "x" ? "⚫" : "⚪") + "";
    	let t2;
    	let t3;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 161, 12, 3849);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 162, 12, 3923);
    			attr_dev(span, "class", "svelte-17xltlb");
    			add_location(span, file$a, 163, 12, 3997);

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*x*/ ctx[24] == /*latestMove*/ ctx[8][0] && /*y*/ ctx[27] == /*latestMove*/ ctx[8][1]
    			? "last-move"
    			: "") + " svelte-17xltlb"));

    			button.disabled = true;
    			add_location(button, file$a, 158, 10, 3727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);
    			append_dev(button, span);
    			append_dev(span, t2);
    			append_dev(button, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}

    			if (dirty[0] & /*boardArr*/ 32 && t2_value !== (t2_value = (/*col*/ ctx[25] == "x" ? "⚫" : "⚪") + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*latestMove*/ 256 && button_class_value !== (button_class_value = "" + (null_to_empty(/*x*/ ctx[24] == /*latestMove*/ ctx[8][0] && /*y*/ ctx[27] == /*latestMove*/ ctx[8][1]
    			? "last-move"
    			: "") + " svelte-17xltlb"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(158:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:8) {#if col == '.'}
    function create_if_block_1$3(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*color*/ ctx[2] == /*game*/ ctx[0].turn) return create_if_block_2$1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(131:8) {#if col == '.'}",
    		ctx
    	});

    	return block;
    }

    // (152:10) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 153, 14, 3525);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 154, 14, 3601);
    			button.disabled = true;
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 152, 12, 3493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(152:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (132:10) {#if color == game.turn}
    function create_if_block_2$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*$staged*/ ctx[9].length > 0) return create_if_block_3$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(132:10) {#if color == game.turn}",
    		ctx
    	});

    	return block;
    }

    // (146:12) {:else}
    function create_else_block_1$1(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 147, 16, 3281);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 148, 16, 3359);
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 146, 14, 3234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*stage*/ ctx[12](/*x*/ ctx[24], /*y*/ ctx[27]), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(146:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (133:12) {#if $staged.length > 0}
    function create_if_block_3$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*x*/ ctx[24] == /*$staged*/ ctx[9][0] && /*y*/ ctx[27] == /*$staged*/ ctx[9][1]) return create_if_block_4$1;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(133:12) {#if $staged.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (140:14) {:else}
    function create_else_block$3(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 141, 18, 3012);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 142, 18, 3092);
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 140, 16, 2966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*unstage*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(140:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (134:14) {#if x == $staged[0] && y == $staged[1]}
    function create_if_block_4$1(ctx) {
    	let button;
    	let hr0;
    	let hr0_class_value;
    	let t0;
    	let hr1;
    	let hr1_class_value;
    	let t1;
    	let span;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			hr0 = element("hr");
    			t0 = space();
    			hr1 = element("hr");
    			t1 = space();
    			span = element("span");
    			span.textContent = "?";
    			t3 = space();

    			attr_dev(hr0, "class", hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"));

    			add_location(hr0, file$a, 135, 18, 2727);

    			attr_dev(hr1, "class", hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"));

    			add_location(hr1, file$a, 136, 18, 2807);
    			attr_dev(span, "class", "svelte-17xltlb");
    			add_location(span, file$a, 137, 18, 2887);
    			attr_dev(button, "class", "svelte-17xltlb");
    			add_location(button, file$a, 134, 16, 2679);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, hr0);
    			append_dev(button, t0);
    			append_dev(button, hr1);
    			append_dev(button, t1);
    			append_dev(button, span);
    			append_dev(button, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*play*/ ctx[11](/*x*/ ctx[24], /*y*/ ctx[27]), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*size*/ 2 && hr0_class_value !== (hr0_class_value = "" + (null_to_empty(/*y*/ ctx[27] === 0
    			? "x f"
    			: /*y*/ ctx[27] === /*size*/ ctx[1] - 1 ? "x l" : "x") + " svelte-17xltlb"))) {
    				attr_dev(hr0, "class", hr0_class_value);
    			}

    			if (dirty[0] & /*size*/ 2 && hr1_class_value !== (hr1_class_value = "" + (null_to_empty(/*x*/ ctx[24] === 0
    			? "y t"
    			: /*x*/ ctx[24] === /*size*/ ctx[1] - 1 ? "y b" : "y") + " svelte-17xltlb"))) {
    				attr_dev(hr1, "class", hr1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(134:14) {#if x == $staged[0] && y == $staged[1]}",
    		ctx
    	});

    	return block;
    }

    // (130:6) {#each row as col, y}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*col*/ ctx[25] == ".") return create_if_block_1$3;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(130:6) {#each row as col, y}",
    		ctx
    	});

    	return block;
    }

    // (129:4) {#each boardArr as row, x}
    function create_each_block$3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*row*/ ctx[22];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*play, size, $staged, unstage, stage, color, game, boardArr, latestMove*/ 15143) {
    				each_value_1 = /*row*/ ctx[22];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(129:4) {#each boardArr as row, x}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let h30;
    	let t0;

    	let t1_value = (/*rewatching*/ ctx[4]
    	? `: Replaying move ${/*viewMove*/ ctx[3]}`
    	: "") + "";

    	let t1;
    	let t2;
    	let div0;
    	let div0_class_value;
    	let t3;
    	let div1;
    	let h31;
    	let t4;
    	let input;
    	let input_max_value;
    	let input_value_value;
    	let div1_class_value;

    	function select_block_type(ctx, dirty) {
    		if (!/*rewatching*/ ctx[4] && !/*cleaning*/ ctx[6]) return create_if_block$5;
    		if (/*cleaning*/ ctx[6]) return create_if_block_5;
    		return create_else_block_6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			t0 = text("Board ");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			if_block.c();
    			t3 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			t4 = text("Turn\n      ");
    			input = element("input");
    			add_location(h30, file$a, 124, 0, 2321);
    			attr_dev(div0, "class", div0_class_value = "grid grid-" + /*size*/ ctx[1] + " svelte-17xltlb");
    			add_location(div0, file$a, 126, 0, 2388);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", input_max_value = /*game*/ ctx[0].history.length);

    			input.value = input_value_value = /*rewatching*/ ctx[4]
    			? /*viewMove*/ ctx[3]
    			: /*game*/ ctx[0].history.length;

    			add_location(input, file$a, 227, 6, 5865);
    			add_location(h31, file$a, 223, 2, 5742);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*viewMove*/ ctx[3] ? "" : "disabled") + " svelte-17xltlb"));
    			add_location(div1, file$a, 222, 0, 5697);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			if_block.m(div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h31);
    			append_dev(h31, t4);
    			append_dev(h31, input);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*rewatching, viewMove*/ 24 && t1_value !== (t1_value = (/*rewatching*/ ctx[4]
    			? `: Replaying move ${/*viewMove*/ ctx[3]}`
    			: "") + "")) set_data_dev(t1, t1_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty[0] & /*size*/ 2 && div0_class_value !== (div0_class_value = "grid grid-" + /*size*/ ctx[1] + " svelte-17xltlb")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty[0] & /*game*/ 1 && input_max_value !== (input_max_value = /*game*/ ctx[0].history.length)) {
    				attr_dev(input, "max", input_max_value);
    			}

    			if (dirty[0] & /*rewatching, viewMove, game*/ 25 && input_value_value !== (input_value_value = /*rewatching*/ ctx[4]
    			? /*viewMove*/ ctx[3]
    			: /*game*/ ctx[0].history.length)) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*viewMove*/ 8 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*viewMove*/ ctx[3] ? "" : "disabled") + " svelte-17xltlb"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if_block.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $staged;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Goban", slots, []);
    	let { game } = $$props;
    	let { size } = $$props;
    	let { color } = $$props;
    	const dispatch = createEventDispatcher();
    	let board;
    	let boardArr;
    	let viewMove = null;
    	let rewatching = false;
    	let cleaning = false;
    	let deadMap = new Map();
    	let latestMove = null;
    	const staged = writable([]);
    	validate_store(staged, "staged");
    	component_subscribe($$self, staged, value => $$invalidate(9, $staged = value));

    	const play = (x, y) => () => {
    		staged.set([]);
    		dispatch("move", { player: board.getCurrentPlayer(), x, y });
    	};

    	const stage = (x, y) => () => {
    		staged.set([x, y]);
    	};

    	const unstage = () => {
    		staged.set([]);
    	};

    	const markDead = (x, y) => () => {
    		dispatch("markDead", { x, y });
    	};

    	const markAlive = (x, y) => () => {
    		dispatch("markAlive", { x, y });
    	};

    	const firstMove = () => {
    		$$invalidate(4, rewatching = true);
    		$$invalidate(6, cleaning = false);
    		$$invalidate(3, viewMove = 1);
    	};

    	const previousMove = () => {
    		$$invalidate(4, rewatching = true);
    		$$invalidate(6, cleaning = false);

    		if (viewMove == 1) {
    			return;
    		}

    		$$invalidate(3, viewMove = viewMove - 1);
    	};

    	const nextMove = () => {
    		if (viewMove + 1 > game.history.length) {
    			return;
    		}

    		if (viewMove + 1 == game.history.length) {
    			$$invalidate(3, viewMove = null);
    			$$invalidate(4, rewatching = false);
    		} else {
    			$$invalidate(3, viewMove += 1);
    			$$invalidate(4, rewatching = true);
    			$$invalidate(6, cleaning = false);
    		}
    	};

    	const lastMove = () => {
    		$$invalidate(4, rewatching = false);
    		$$invalidate(6, cleaning = false);
    		$$invalidate(3, viewMove = null);
    	};

    	const writable_props = ["game", "size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Goban> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("game" in $$props) $$invalidate(0, game = $$props.game);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		Weiqi,
    		writable,
    		createEventDispatcher,
    		game,
    		size,
    		color,
    		dispatch,
    		board,
    		boardArr,
    		viewMove,
    		rewatching,
    		cleaning,
    		deadMap,
    		latestMove,
    		staged,
    		play,
    		stage,
    		unstage,
    		markDead,
    		markAlive,
    		firstMove,
    		previousMove,
    		nextMove,
    		lastMove,
    		$staged
    	});

    	$$self.$inject_state = $$props => {
    		if ("game" in $$props) $$invalidate(0, game = $$props.game);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("board" in $$props) $$invalidate(16, board = $$props.board);
    		if ("boardArr" in $$props) $$invalidate(5, boardArr = $$props.boardArr);
    		if ("viewMove" in $$props) $$invalidate(3, viewMove = $$props.viewMove);
    		if ("rewatching" in $$props) $$invalidate(4, rewatching = $$props.rewatching);
    		if ("cleaning" in $$props) $$invalidate(6, cleaning = $$props.cleaning);
    		if ("deadMap" in $$props) $$invalidate(7, deadMap = $$props.deadMap);
    		if ("latestMove" in $$props) $$invalidate(8, latestMove = $$props.latestMove);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*game, board, rewatching, viewMove*/ 65561) {
    			 {
    				$$invalidate(16, board = Weiqi.createGame(game.size));

    				game.history.some(([player, x, y, pass], i) => {
    					if (pass) {
    						$$invalidate(16, board = board.pass(player));
    						$$invalidate(8, latestMove = []);
    					} else {
    						$$invalidate(16, board = board.play(player, [x, y]));
    						$$invalidate(8, latestMove = [x, y]);
    					}

    					return rewatching && viewMove - 1 == i;
    				});

    				if (!rewatching) {
    					$$invalidate(3, viewMove = game.history.length);
    				}

    				if (!game.winner && game.consecutivePasses > 1) {
    					$$invalidate(6, cleaning = true);
    				}

    				if (game.accepted.white && game.accepted.black && !game.winner) {
    					game.deadStones.forEach(stone => {
    						board.removeStone([stone[1][0], stone[1][1]]);
    					});

    					let score = board.areaScore(game.komi);
    					dispatch("gameOver", score);
    				}

    				$$invalidate(7, deadMap = new Map(game.deadStones));
    				$$invalidate(5, boardArr = board.getBoard().toArray());
    			}
    		}
    	};

    	return [
    		game,
    		size,
    		color,
    		viewMove,
    		rewatching,
    		boardArr,
    		cleaning,
    		deadMap,
    		latestMove,
    		$staged,
    		staged,
    		play,
    		stage,
    		unstage,
    		markDead,
    		markAlive,
    		board
    	];
    }

    class Goban extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { game: 0, size: 1, color: 2 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Goban",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*game*/ ctx[0] === undefined && !("game" in props)) {
    			console.warn("<Goban> was created without expected prop 'game'");
    		}

    		if (/*size*/ ctx[1] === undefined && !("size" in props)) {
    			console.warn("<Goban> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[2] === undefined && !("color" in props)) {
    			console.warn("<Goban> was created without expected prop 'color'");
    		}
    	}

    	get game() {
    		throw new Error("<Goban>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set game(value) {
    		throw new Error("<Goban>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Goban>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Goban>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Goban>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Goban>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/slug.svelte generated by Svelte v3.31.0 */

    const { console: console_1$2 } = globals;
    const file$b = "src/routes/slug.svelte";

    // (130:18) {:else}
    function create_else_block_6$1(ctx) {
    	let h1;
    	let t0;
    	let code;
    	let t1_value = /*game*/ ctx[2].name.substring(1) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Playing ");
    			code = element("code");
    			t1 = text(t1_value);
    			add_location(code, file$b, 129, 38, 3056);
    			attr_dev(h1, "class", "svelte-z6y3r0");
    			add_location(h1, file$b, 129, 26, 3044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, code);
    			append_dev(code, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t1_value !== (t1_value = /*game*/ ctx[2].name.substring(1) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_6$1.name,
    		type: "else",
    		source: "(130:18) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:2) {#if loading}
    function create_if_block_10$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("…");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10$1.name,
    		type: "if",
    		source: "(130:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (174:2) {:else}
    function create_else_block_4$1(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1_value = /*game*/ ctx[2].name + "";
    	let t1;
    	let t2;

    	function select_block_type_6(ctx, dirty) {
    		if (!/*game*/ ctx[2].winner) return create_if_block_9$1;
    		return create_else_block_5$1;
    	}

    	let current_block_type = select_block_type_6(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text("Watching ");
    			t1 = text(t1_value);
    			t2 = space();
    			if_block.c();
    			add_location(h2, file$b, 175, 6, 4344);
    			attr_dev(div, "class", "meta svelte-z6y3r0");
    			add_location(div, file$b, 174, 4, 4319);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t1_value !== (t1_value = /*game*/ ctx[2].name + "")) set_data_dev(t1, t1_value);

    			if (current_block_type === (current_block_type = select_block_type_6(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4$1.name,
    		type: "else",
    		source: "(174:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (138:40) 
    function create_if_block_2$2(ctx) {
    	let div;
    	let t0;
    	let h3;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let if_block0 = /*game*/ ctx[2].players == 1 && create_if_block_8$1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*game*/ ctx[2].consecutivePasses == 2 && !/*game*/ ctx[2].winner) return create_if_block_6$1;
    		if (!/*game*/ ctx[2].winner) return create_if_block_7$1;
    		return create_else_block_3$1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block1 = current_block_type(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*game*/ ctx[2].consecutivePasses < 2) return create_if_block_3$2;
    		return create_else_block_1$2;
    	}

    	let current_block_type_1 = select_block_type_3(ctx);
    	let if_block2 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h3 = element("h3");
    			t1 = text("You are ");
    			t2 = text(/*color*/ ctx[1]);
    			t3 = space();
    			if_block1.c();
    			t4 = space();
    			if_block2.c();
    			add_location(h3, file$b, 143, 6, 3351);
    			attr_dev(div, "class", "meta svelte-z6y3r0");
    			add_location(div, file$b, 138, 4, 3250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, h3);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    			append_dev(div, t3);
    			if_block1.m(div, null);
    			append_dev(div, t4);
    			if_block2.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*game*/ ctx[2].players == 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*game*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_8$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*color*/ 2) set_data_dev(t2, /*color*/ ctx[1]);

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, t4);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_3(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(138:40) ",
    		ctx
    	});

    	return block;
    }

    // (134:2) {#if loading}
    function create_if_block_1$4(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "…";
    			add_location(p, file$b, 135, 6, 3185);
    			attr_dev(div, "class", "meta svelte-z6y3r0");
    			add_location(div, file$b, 134, 4, 3160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(134:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (179:6) {:else}
    function create_else_block_5$1(ctx) {
    	let h3;
    	let t0_value = /*game*/ ctx[2].winner + "";
    	let t0;
    	let t1;

    	let t2_value = (/*game*/ ctx[2].resignation
    	? "resignation"
    	: `${/*game*/ ctx[2].score} point${/*game*/ ctx[2].score > 1 ? "s" : ""}.`) + "";

    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text(" wins by ");
    			t2 = text(t2_value);
    			add_location(h3, file$b, 179, 8, 4464);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t0_value !== (t0_value = /*game*/ ctx[2].winner + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*game*/ 4 && t2_value !== (t2_value = (/*game*/ ctx[2].resignation
    			? "resignation"
    			: `${/*game*/ ctx[2].score} point${/*game*/ ctx[2].score > 1 ? "s" : ""}.`) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5$1.name,
    		type: "else",
    		source: "(179:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (177:6) {#if !game.winner }
    function create_if_block_9$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = /*game*/ ctx[2].turn + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("It is ");
    			t1 = text(t1_value);
    			t2 = text("'s turn");
    			add_location(h3, file$b, 177, 8, 4408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t1_value !== (t1_value = /*game*/ ctx[2].turn + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(177:6) {#if !game.winner }",
    		ctx
    	});

    	return block;
    }

    // (140:6) {#if game.players == 1}
    function create_if_block_8$1(ctx) {
    	let invitemodal;
    	let current;

    	invitemodal = new InviteModal({
    			props: { invite: /*invite*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(invitemodal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(invitemodal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const invitemodal_changes = {};
    			if (dirty & /*invite*/ 16) invitemodal_changes.invite = /*invite*/ ctx[4];
    			invitemodal.$set(invitemodal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(invitemodal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(invitemodal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(invitemodal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(140:6) {#if game.players == 1}",
    		ctx
    	});

    	return block;
    }

    // (150:6) {:else}
    function create_else_block_3$1(ctx) {
    	let h3;
    	let t0_value = /*game*/ ctx[2].winner + "";
    	let t0;
    	let t1;

    	let t2_value = (/*game*/ ctx[2].resignation
    	? "resignation"
    	: `${/*game*/ ctx[2].score} point${/*game*/ ctx[2].score > 1 ? "s" : ""}.`) + "";

    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text(" wins by ");
    			t2 = text(t2_value);
    			add_location(h3, file$b, 150, 8, 3565);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t0_value !== (t0_value = /*game*/ ctx[2].winner + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*game*/ 4 && t2_value !== (t2_value = (/*game*/ ctx[2].resignation
    			? "resignation"
    			: `${/*game*/ ctx[2].score} point${/*game*/ ctx[2].score > 1 ? "s" : ""}.`) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3$1.name,
    		type: "else",
    		source: "(150:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (148:30) 
    function create_if_block_7$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = /*game*/ ctx[2].turn + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("It is ");
    			t1 = text(t1_value);
    			t2 = text("'s turn");
    			add_location(h3, file$b, 148, 8, 3509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 4 && t1_value !== (t1_value = /*game*/ ctx[2].turn + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(148:30) ",
    		ctx
    	});

    	return block;
    }

    // (146:6) {#if game.consecutivePasses == 2 && !game.winner }
    function create_if_block_6$1(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Remove Dead Stones";
    			add_location(h3, file$b, 146, 8, 3442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(146:6) {#if game.consecutivePasses == 2 && !game.winner }",
    		ctx
    	});

    	return block;
    }

    // (164:6) {:else}
    function create_else_block_1$2(ctx) {
    	let div;

    	function select_block_type_5(ctx, dirty) {
    		if (!/*game*/ ctx[2].accepted[/*color*/ ctx[1]]) return create_if_block_5$1;
    		return create_else_block_2$1;
    	}

    	let current_block_type = select_block_type_5(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			add_location(div, file$b, 164, 8, 4067);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_5(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(164:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (154:6) {#if game.consecutivePasses < 2 }
    function create_if_block_3$2(ctx) {
    	let div;

    	function select_block_type_4(ctx, dirty) {
    		if (/*color*/ ctx[1] == /*game*/ ctx[2].turn && !/*game*/ ctx[2].winner) return create_if_block_4$2;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			add_location(div, file$b, 154, 8, 3747);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(154:6) {#if game.consecutivePasses < 2 }",
    		ctx
    	});

    	return block;
    }

    // (168:10) {:else}
    function create_else_block_2$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Reject Stones";
    			add_location(button, file$b, 168, 12, 4202);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reject*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(168:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (166:10) {#if !game.accepted[color]}
    function create_if_block_5$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Accept Stones";
    			add_location(button, file$b, 166, 12, 4123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*accept*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(166:10) {#if !game.accepted[color]}",
    		ctx
    	});

    	return block;
    }

    // (159:10) {:else}
    function create_else_block$4(ctx) {
    	let button0;
    	let t1;
    	let button1;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Pass";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Resign";
    			button0.disabled = true;
    			add_location(button0, file$b, 159, 12, 3938);
    			button1.disabled = true;
    			add_location(button1, file$b, 160, 12, 3981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(159:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (156:10) {#if color == game.turn && !game.winner}
    function create_if_block_4$2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Pass";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Resign";
    			add_location(button0, file$b, 156, 12, 3816);
    			add_location(button1, file$b, 157, 12, 3866);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*pass*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*resign*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(156:10) {#if color == game.turn && !game.winner}",
    		ctx
    	});

    	return block;
    }

    // (186:4) {#if !loading}
    function create_if_block$6(ctx) {
    	let goban;
    	let current;

    	goban = new Goban({
    			props: {
    				game: /*game*/ ctx[2],
    				color: /*color*/ ctx[1],
    				size: /*game*/ ctx[2].size
    			},
    			$$inline: true
    		});

    	goban.$on("markDead", /*markDead*/ ctx[9]);
    	goban.$on("markAlive", /*markAlive*/ ctx[10]);
    	goban.$on("pass", /*pass*/ ctx[6]);
    	goban.$on("gameOver", /*gameOver*/ ctx[8]);
    	goban.$on("resign", /*resign*/ ctx[7]);
    	goban.$on("move", /*play*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(goban.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(goban, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const goban_changes = {};
    			if (dirty & /*game*/ 4) goban_changes.game = /*game*/ ctx[2];
    			if (dirty & /*color*/ 2) goban_changes.color = /*color*/ ctx[1];
    			if (dirty & /*game*/ 4) goban_changes.size = /*game*/ ctx[2].size;
    			goban.$set(goban_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(goban.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(goban.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(goban, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(186:4) {#if !loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let header;
    	let lockup;
    	let t0;
    	let t1;
    	let div1;
    	let current_block_type_index;
    	let if_block1;
    	let t2;
    	let div0;
    	let current;

    	lockup = new Lockup({
    			props: { stacked: false, small: true },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return create_if_block_10$1;
    		return create_else_block_6$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block_1$4, create_if_block_2$2, create_else_block_4$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*loading*/ ctx[3]) return 0;
    		if (typeof /*color*/ ctx[1] != "undefined") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = !/*loading*/ ctx[3] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(lockup.$$.fragment);
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			div1 = element("div");
    			if_block1.c();
    			t2 = space();
    			div0 = element("div");
    			if (if_block2) if_block2.c();
    			attr_dev(header, "class", "svelte-z6y3r0");
    			add_location(header, file$b, 127, 0, 2968);
    			attr_dev(div0, "class", "board svelte-z6y3r0");
    			add_location(div0, file$b, 184, 2, 4619);
    			attr_dev(div1, "class", "container svelte-z6y3r0");
    			add_location(div1, file$b, 132, 0, 3116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(lockup, header, null);
    			append_dev(header, t0);
    			if_block0.m(header, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			if (if_block2) if_block2.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(header, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, t2);
    			}

    			if (!/*loading*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*loading*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$6(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockup.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockup.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(lockup);
    			if_block0.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $games,
    		$$unsubscribe_games = noop,
    		$$subscribe_games = () => ($$unsubscribe_games(), $$unsubscribe_games = subscribe(games, $$value => $$invalidate(13, $games = $$value)), games);

    	let $path;
    	let $player;
    	validate_store(path, "path");
    	component_subscribe($$self, path, $$value => $$invalidate(14, $path = $$value));
    	validate_store(player, "player");
    	component_subscribe($$self, player, $$value => $$invalidate(15, $player = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_games());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slug", slots, []);
    	let { games } = $$props;
    	validate_store(games, "games");
    	$$subscribe_games();
    	let color;
    	let game;
    	let loading = true;
    	let invite;

    	const play = event => {
    		game.history.push([event.detail.player, event.detail.x, event.detail.y]);
    		$$invalidate(2, game.consecutivePasses = 0, game);
    		$$invalidate(2, game.turn = game.turn == "white" ? "black" : "white", game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const pass = () => {
    		game.history.push([color == "white" ? "o" : "x", null, null, true]);
    		$$invalidate(2, game.consecutivePasses += 1, game);
    		$$invalidate(2, game.turn = game.turn == "white" ? "black" : "white", game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const resign = () => {
    		$$invalidate(2, game.winner = color == "white" ? "black" : "white", game);
    		$$invalidate(2, game.resignation = true, game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const gameOver = event => {
    		let score = Math.abs(event.detail);
    		let winner = event.detail > 0 ? "black" : "white";
    		$$invalidate(2, game.winner = winner, game);
    		$$invalidate(2, game.score = score, game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const markDead = event => {
    		let x = event.detail.x;
    		let y = event.detail.y;
    		let deadMap = new Map(game.deadStones);
    		deadMap.set(`${x}${y}`, [x, y]);
    		$$invalidate(2, game.deadStones = [...deadMap], game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const markAlive = event => {
    		let deadMap = new Map(game.deadStones);
    		deadMap.delete(`${event.detail.x}${event.detail.y}`);
    		$$invalidate(2, game.deadStones = [...deadMap], game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const accept = () => {
    		$$invalidate(2, game.accepted[color] = true, game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const reject = () => {
    		$$invalidate(2, game.accepted[color] = false, game);
    		games.y.set(game.name, JSON.stringify(game));
    	};

    	const writable_props = ["games"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Slug> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    	};

    	$$self.$capture_state = () => ({
    		path,
    		player,
    		Lockup,
    		InviteModal,
    		Goban,
    		games,
    		color,
    		game,
    		loading,
    		invite,
    		play,
    		pass,
    		resign,
    		gameOver,
    		markDead,
    		markAlive,
    		accept,
    		reject,
    		$games,
    		$path,
    		$player
    	});

    	$$self.$inject_state = $$props => {
    		if ("games" in $$props) $$subscribe_games($$invalidate(0, games = $$props.games));
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("game" in $$props) $$invalidate(2, game = $$props.game);
    		if ("loading" in $$props) $$invalidate(3, loading = $$props.loading);
    		if ("invite" in $$props) $$invalidate(4, invite = $$props.invite);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$games, $path, $player, color, game, games*/ 57351) {
    			 {
    				console.log($games);

    				if ($games.size > 0) {
    					$$invalidate(2, game = JSON.parse($games.get($path)));
    					$$invalidate(1, color = $player.get($path));
    					$$invalidate(4, invite = color == "white" ? "black" : "white");
    					$$invalidate(3, loading = false);

    					if (window.location.search == "?black" || window.location.search == "?white") {
    						$$invalidate(2, game.players = 2, game);

    						if (window.location.search == "?black") {
    							$$invalidate(1, color = "black");
    						}

    						if (window.location.search == "?white") {
    							$$invalidate(1, color = "white");
    						}

    						player.update(p => p.set(game.name, color));
    						let playerData = JSON.stringify([...$player.entries()]);
    						localStorage.setItem("joseki-party", playerData);
    						games.y.set(game.name, JSON.stringify(game));
    					}
    				}
    			}
    		}
    	};

    	return [
    		games,
    		color,
    		game,
    		loading,
    		invite,
    		play,
    		pass,
    		resign,
    		gameOver,
    		markDead,
    		markAlive,
    		accept,
    		reject,
    		$games,
    		$path,
    		$player
    	];
    }

    class Slug extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { games: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slug",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*games*/ ctx[0] === undefined && !("games" in props)) {
    			console_1$2.warn("<Slug> was created without expected prop 'games'");
    		}
    	}

    	get games() {
    		throw new Error("<Slug>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set games(value) {
    		throw new Error("<Slug>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/components.svelte generated by Svelte v3.31.0 */
    const file$c = "src/routes/components.svelte";

    // (143:4) <Button       href="/new">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(143:4) <Button       href=\\\"/new\\\">",
    		ctx
    	});

    	return block;
    }

    // (147:4) <Button       large={true}>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Button");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(147:4) <Button       large={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let h1;
    	let t1;
    	let section0;
    	let div0;
    	let themepicker;
    	let t2;
    	let div1;
    	let h20;
    	let t4;
    	let pre0;
    	let t6;
    	let section1;
    	let div2;
    	let blob;
    	let t7;
    	let div3;
    	let h21;
    	let t9;
    	let pre1;
    	let t11;
    	let section2;
    	let div4;
    	let lockup;
    	let t12;
    	let div5;
    	let h22;
    	let t14;
    	let pre2;
    	let t16;
    	let section3;
    	let div6;
    	let button0;
    	let t17;
    	let button1;
    	let t18;
    	let div7;
    	let h23;
    	let t20;
    	let pre3;
    	let t22;
    	let section4;
    	let div8;
    	let gamelist;
    	let t23;
    	let div9;
    	let h24;
    	let t25;
    	let pre4;
    	let current;
    	themepicker = new ThemePicker({ $$inline: true });

    	blob = new Blob({
    			props: {
    				count: 35,
    				speed: 1000,
    				drift: 30,
    				deform: 90,
    				animate: true,
    				size: "large",
    				color: "white"
    			},
    			$$inline: true
    		});

    	lockup = new Lockup({ props: { stacked: true }, $$inline: true });

    	button0 = new Button({
    			props: {
    				href: "/new",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				large: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	gamelist = new GameList({
    			props: {
    				title: "Watch Games",
    				games: /*dummyGames*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Joseki Party Components";
    			t1 = space();
    			section0 = element("section");
    			div0 = element("div");
    			create_component(themepicker.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Colors";
    			t4 = space();
    			pre0 = element("pre");
    			pre0.textContent = "| Theme               |\n| ------------------- |\n| Default             |";
    			t6 = space();
    			section1 = element("section");
    			div2 = element("div");
    			create_component(blob.$$.fragment);
    			t7 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Blob";
    			t9 = space();
    			pre1 = element("pre");
    			pre1.textContent = "| Property  | Default   | Description  |\n| --------- | --------- | ------------ |\n| color     | black     | or white!    |\n| animate   | false     | blobbin!     |\n| size      | medium    | big? small?  |\n| count     | 8         | sub-blobs    |\n| speed     | 2000      | ms           |\n| drift     | 35        | how much?    |\n| deform    | 80        | how blobbly? |";
    			t11 = space();
    			section2 = element("section");
    			div4 = element("div");
    			create_component(lockup.$$.fragment);
    			t12 = space();
    			div5 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Lockup";
    			t14 = space();
    			pre2 = element("pre");
    			pre2.textContent = "| Property  | Default   | Description          |\n| --------- | --------- | -------------------- |\n| small     | false     | small size           |\n| stacked   | false     | stacked layout       |";
    			t16 = space();
    			section3 = element("section");
    			div6 = element("div");
    			create_component(button0.$$.fragment);
    			t17 = space();
    			create_component(button1.$$.fragment);
    			t18 = space();
    			div7 = element("div");
    			h23 = element("h2");
    			h23.textContent = "Button";
    			t20 = space();
    			pre3 = element("pre");
    			pre3.textContent = "| Property  | Default   | Description          |\n| --------- | --------- | -------------------- |\n| small     | false     | small size           |\n| stacked   | false     | stacked layout       |";
    			t22 = space();
    			section4 = element("section");
    			div8 = element("div");
    			create_component(gamelist.$$.fragment);
    			t23 = space();
    			div9 = element("div");
    			h24 = element("h2");
    			h24.textContent = "Game List";
    			t25 = space();
    			pre4 = element("pre");
    			pre4.textContent = "| Property  | Default   | Description          |\n| --------- | --------- | -------------------- |\n| title     | none      | small size           |\n| games     | []        | stacked layout       |";
    			add_location(h1, file$c, 65, 0, 1358);
    			attr_dev(div0, "class", "sample svelte-1ry3gn3");
    			add_location(div0, file$c, 70, 2, 1408);
    			add_location(h20, file$c, 74, 4, 1483);
    			add_location(pre0, file$c, 75, 4, 1503);
    			attr_dev(div1, "class", "docs svelte-1ry3gn3");
    			add_location(div1, file$c, 73, 2, 1460);
    			attr_dev(section0, "class", "svelte-1ry3gn3");
    			add_location(section0, file$c, 69, 0, 1396);
    			attr_dev(div2, "class", "sample svelte-1ry3gn3");
    			add_location(div2, file$c, 84, 2, 1625);
    			add_location(h21, file$c, 95, 4, 1823);
    			add_location(pre1, file$c, 96, 4, 1841);
    			attr_dev(div3, "class", "docs svelte-1ry3gn3");
    			add_location(div3, file$c, 94, 2, 1800);
    			attr_dev(section1, "class", "svelte-1ry3gn3");
    			add_location(section1, file$c, 83, 0, 1613);
    			attr_dev(div4, "class", "sample svelte-1ry3gn3");
    			add_location(div4, file$c, 125, 2, 2566);
    			add_location(h22, file$c, 130, 4, 2686);
    			add_location(pre2, file$c, 131, 4, 2706);
    			attr_dev(div5, "class", "docs svelte-1ry3gn3");
    			add_location(div5, file$c, 129, 2, 2663);
    			attr_dev(section2, "class", "svelte-1ry3gn3");
    			add_location(section2, file$c, 124, 0, 2554);
    			attr_dev(div6, "class", "sample svelte-1ry3gn3");
    			add_location(div6, file$c, 141, 2, 2952);
    			add_location(h23, file$c, 152, 4, 3126);
    			add_location(pre3, file$c, 153, 4, 3146);
    			attr_dev(div7, "class", "docs svelte-1ry3gn3");
    			add_location(div7, file$c, 151, 2, 3103);
    			attr_dev(section3, "class", "svelte-1ry3gn3");
    			add_location(section3, file$c, 140, 0, 2940);
    			attr_dev(div8, "class", "sample svelte-1ry3gn3");
    			add_location(div8, file$c, 164, 2, 3393);
    			add_location(h24, file$c, 170, 4, 3516);
    			add_location(pre4, file$c, 171, 4, 3539);
    			attr_dev(div9, "class", "docs svelte-1ry3gn3");
    			add_location(div9, file$c, 169, 2, 3493);
    			attr_dev(section4, "class", "svelte-1ry3gn3");
    			add_location(section4, file$c, 163, 0, 3381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div0);
    			mount_component(themepicker, div0, null);
    			append_dev(section0, t2);
    			append_dev(section0, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t4);
    			append_dev(div1, pre0);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div2);
    			mount_component(blob, div2, null);
    			append_dev(section1, t7);
    			append_dev(section1, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t9);
    			append_dev(div3, pre1);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, div4);
    			mount_component(lockup, div4, null);
    			append_dev(section2, t12);
    			append_dev(section2, div5);
    			append_dev(div5, h22);
    			append_dev(div5, t14);
    			append_dev(div5, pre2);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, div6);
    			mount_component(button0, div6, null);
    			append_dev(div6, t17);
    			mount_component(button1, div6, null);
    			append_dev(section3, t18);
    			append_dev(section3, div7);
    			append_dev(div7, h23);
    			append_dev(div7, t20);
    			append_dev(div7, pre3);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, div8);
    			mount_component(gamelist, div8, null);
    			append_dev(section4, t23);
    			append_dev(section4, div9);
    			append_dev(div9, h24);
    			append_dev(div9, t25);
    			append_dev(div9, pre4);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(themepicker.$$.fragment, local);
    			transition_in(blob.$$.fragment, local);
    			transition_in(lockup.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(gamelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(themepicker.$$.fragment, local);
    			transition_out(blob.$$.fragment, local);
    			transition_out(lockup.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(gamelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			destroy_component(themepicker);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(section1);
    			destroy_component(blob);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(section2);
    			destroy_component(lockup);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(section3);
    			destroy_component(button0);
    			destroy_component(button1);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(section4);
    			destroy_component(gamelist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Components", slots, []);

    	const dummyGames = [
    		{
    			"name": "/honey-gem",
    			"komi": 0.5,
    			"size": 19,
    			"turn": "black",
    			"winner": null,
    			"resignation": false,
    			"score": null,
    			"consecutivePasses": 0,
    			"players": 2,
    			"accepted": { "black": false, "white": false },
    			"history": [],
    			"deadStones": []
    		},
    		{
    			"name": "/gem-honey",
    			"komi": 4.5,
    			"size": 13,
    			"turn": "white",
    			"winner": null,
    			"resignation": false,
    			"score": null,
    			"consecutivePasses": 0,
    			"players": 2,
    			"accepted": { "black": false, "white": false },
    			"history": [1, 2, 3],
    			"deadStones": []
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Components> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ThemePicker,
    		Lockup,
    		Logo,
    		Blob,
    		Button,
    		GameList,
    		dummyGames
    	});

    	return [dummyGames];
    }

    class Components extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Components",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$d = "src/App.svelte";

    // (30:2) {:else}
    function create_else_block$5(ctx) {
    	let slug;
    	let current;

    	slug = new Slug({
    			props: { games: /*dict*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(slug.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(slug, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slug.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slug.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(slug, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(30:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:35) 
    function create_if_block_2$3(ctx) {
    	let components;
    	let current;

    	components = new Components({
    			props: { games: /*dict*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(components.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(components, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(components.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(components.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(components, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(28:35) ",
    		ctx
    	});

    	return block;
    }

    // (26:28) 
    function create_if_block_1$5(ctx) {
    	let new_1;
    	let current;

    	new_1 = new New({
    			props: { games: /*dict*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(new_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(new_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(new_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(new_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(new_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(26:28) ",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#if $path == '/'}
    function create_if_block$7(ctx) {
    	let index;
    	let current;

    	index = new Routes({
    			props: { games: /*dict*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(index.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(index, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(index.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(index.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(index, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(24:2) {#if $path == '/'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let footer;
    	let themepicker;
    	let t1;
    	let p;
    	let t3;
    	let svg;
    	let defs;
    	let filter;
    	let feGaussianBlur;
    	let feColorMatrix;
    	let feComposite;
    	let current;
    	const if_block_creators = [create_if_block$7, create_if_block_1$5, create_if_block_2$3, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$path*/ ctx[0] == "/") return 0;
    		if (/*$path*/ ctx[0] == "/new") return 1;
    		if (/*$path*/ ctx[0] == "/components") return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	themepicker = new ThemePicker({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			footer = element("footer");
    			create_component(themepicker.$$.fragment);
    			t1 = space();
    			p = element("p");
    			p.textContent = "Play Go online with friends, party time 🎉";
    			t3 = space();
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			filter = svg_element("filter");
    			feGaussianBlur = svg_element("feGaussianBlur");
    			feColorMatrix = svg_element("feColorMatrix");
    			feComposite = svg_element("feComposite");
    			add_location(p, file$d, 35, 4, 890);
    			attr_dev(footer, "class", "svelte-1r2uj73");
    			add_location(footer, file$d, 33, 2, 857);
    			attr_dev(main, "class", "svelte-1r2uj73");
    			add_location(main, file$d, 22, 0, 637);
    			attr_dev(feGaussianBlur, "in", "SourceGraphic");
    			attr_dev(feGaussianBlur, "stdDeviation", "10");
    			attr_dev(feGaussianBlur, "result", "blur");
    			add_location(feGaussianBlur, file$d, 44, 6, 1070);
    			attr_dev(feColorMatrix, "in", "blur");
    			attr_dev(feColorMatrix, "mode", "matrix");
    			attr_dev(feColorMatrix, "values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7");
    			attr_dev(feColorMatrix, "result", "goo");
    			add_location(feColorMatrix, file$d, 45, 6, 1146);
    			attr_dev(feComposite, "in", "SourceGraphic");
    			attr_dev(feComposite, "in2", "goo");
    			attr_dev(feComposite, "operator", "mix");
    			add_location(feComposite, file$d, 46, 6, 1261);
    			attr_dev(filter, "id", "goo");
    			add_location(filter, file$d, 43, 4, 1046);
    			add_location(defs, file$d, 42, 2, 1035);
    			attr_dev(svg, "class", "defs svelte-1r2uj73");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "version", "1.1");
    			add_location(svg, file$d, 39, 0, 961);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t0);
    			append_dev(main, footer);
    			mount_component(themepicker, footer, null);
    			append_dev(footer, t1);
    			append_dev(footer, p);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(defs, filter);
    			append_dev(filter, feGaussianBlur);
    			append_dev(filter, feColorMatrix);
    			append_dev(filter, feComposite);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, t0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(themepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(themepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			destroy_component(themepicker);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $path;
    	validate_store(path, "path");
    	component_subscribe($$self, path, $$value => $$invalidate(0, $path = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	const ydoc = new Doc();
    	const provider = new WebrtcProvider("joseki-party", ydoc);
    	const ymap = ydoc.getMap("dict");
    	const dict = main.map.readable(ymap);
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		ThemePicker,
    		Y,
    		WebsocketProvider,
    		WebrtcProvider,
    		map: main.map,
    		Index: Routes,
    		New,
    		Slug,
    		Components,
    		path,
    		name,
    		ydoc,
    		provider,
    		ymap,
    		dict,
    		$path
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$path, dict, name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Joseki Party'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
