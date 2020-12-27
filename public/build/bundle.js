
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    const outroing = new Set();
    let outros;
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const 𝝿 = Math.PI;

    class Clock {
      constructor(second) {
        this.start = -0.5 * 𝝿;
        this.end = 1.5 * 𝝿;
        this.time = second * 1000;
        const now = new Date().getTime();
        this.startTime = now;
        this.endTime = now + second * 1000;
      }

      update() {
        const now = new Date().getTime();

        if (now >= this.endTime) {
          this.end = -0.5 * 𝝿;
          const event = new Event("timeOut");
          window.dispatchEvent(event);
          return;
        }
        this.end = 1.5 * 𝝿 - (2 * 𝝿 * (now - this.startTime)) / this.time;
      }

      draw(stageWidth, stageHeight, ctx) {
        this.update();
        ctx.beginPath();
        ctx.fillStyle = "#FF3300";
        ctx.arc(
          stageWidth / 2,
          stageHeight / 2,
          stageWidth / 3,
          this.start,
          this.end
        );
        ctx.lineTo(stageWidth / 2, stageHeight / 2);
        ctx.fill();
      }
    }

    class App {
      constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);
        window.addEventListener("resize", this.resize.bind(this));
        window.addEventListener("timeOut", this.endFrame.bind(this));
        this.resize();
      }

      resize() {
        try {
          this.stageWidth = document.body.clientWidth;
          this.stageHeight = document.body.clientHeight;
          this.canvas.width = this.stageWidth * 2;
          this.canvas.height = this.stageHeight * 2;
          this.ctx.scale(2, 2);
        } catch (e) {}
      }

      startFrame(second) {
        this.clock = new Clock(second);
        this.loop = setInterval(this.animate.bind(this), 20);
      }

      endFrame(e) {
        console.log("END", e);
        clearTimeout(this.loop);
      }

      animate(t) {
        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.clock.draw(this.stageWidth, this.stageHeight, this.ctx);
      }
    }

    const subscriber_queue = [];
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

    const hourStore = writable(0);

    const minuteStore = writable(0);

    const secondStore = writable(0);

    /* src/components/controler.svelte generated by Svelte v3.19.1 */
    const file = "src/components/controler.svelte";

    function create_fragment(ctx) {
    	let div6;
    	let div1;
    	let button0;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let button1;
    	let t5;
    	let div3;
    	let button2;
    	let t7;
    	let div2;
    	let t8;
    	let t9;
    	let button3;
    	let t11;
    	let div5;
    	let button4;
    	let t13;
    	let div4;
    	let t14;
    	let t15;
    	let button5;
    	let t17;
    	let button6;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "-";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(/*$hourStore*/ ctx[1]);
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			t5 = space();
    			div3 = element("div");
    			button2 = element("button");
    			button2.textContent = "-";
    			t7 = space();
    			div2 = element("div");
    			t8 = text(/*$minuteStore*/ ctx[2]);
    			t9 = space();
    			button3 = element("button");
    			button3.textContent = "+";
    			t11 = space();
    			div5 = element("div");
    			button4 = element("button");
    			button4.textContent = "-";
    			t13 = space();
    			div4 = element("div");
    			t14 = text(/*$secondStore*/ ctx[3]);
    			t15 = space();
    			button5 = element("button");
    			button5.textContent = "+";
    			t17 = space();
    			button6 = element("button");
    			button6.textContent = "START";
    			attr_dev(button0, "class", "svelte-ey11ue");
    			add_location(button0, file, 86, 8, 1781);
    			attr_dev(div0, "class", "display svelte-ey11ue");
    			add_location(div0, file, 87, 8, 1843);
    			attr_dev(button1, "class", "svelte-ey11ue");
    			add_location(button1, file, 88, 8, 1891);
    			attr_dev(div1, "class", "line svelte-ey11ue");
    			add_location(div1, file, 85, 4, 1754);
    			attr_dev(button2, "class", "svelte-ey11ue");
    			add_location(button2, file, 91, 8, 1985);
    			attr_dev(div2, "class", "display svelte-ey11ue");
    			add_location(div2, file, 92, 8, 2049);
    			attr_dev(button3, "class", "svelte-ey11ue");
    			add_location(button3, file, 93, 8, 2099);
    			attr_dev(div3, "class", "line svelte-ey11ue");
    			add_location(div3, file, 90, 4, 1958);
    			attr_dev(button4, "class", "svelte-ey11ue");
    			add_location(button4, file, 96, 8, 2195);
    			attr_dev(div4, "class", "display svelte-ey11ue");
    			add_location(div4, file, 97, 8, 2259);
    			attr_dev(button5, "class", "svelte-ey11ue");
    			add_location(button5, file, 98, 8, 2309);
    			attr_dev(div5, "class", "line svelte-ey11ue");
    			add_location(div5, file, 95, 4, 2168);
    			attr_dev(button6, "class", "start-btn svelte-ey11ue");
    			add_location(button6, file, 100, 4, 2378);
    			attr_dev(div6, "class", "controler svelte-ey11ue");
    			toggle_class(div6, "hide", /*inProgress*/ ctx[0]);
    			add_location(div6, file, 84, 0, 1702);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div3, button2);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, t8);
    			append_dev(div3, t9);
    			append_dev(div3, button3);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div5, button4);
    			append_dev(div5, t13);
    			append_dev(div5, div4);
    			append_dev(div4, t14);
    			append_dev(div5, t15);
    			append_dev(div5, button5);
    			append_dev(div6, t17);
    			append_dev(div6, button6);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[10], false, false, false),
    				listen_dev(button3, "click", /*click_handler_3*/ ctx[11], false, false, false),
    				listen_dev(button4, "click", /*click_handler_4*/ ctx[12], false, false, false),
    				listen_dev(button5, "click", /*click_handler_5*/ ctx[13], false, false, false),
    				listen_dev(button6, "click", /*start*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$hourStore*/ 2) set_data_dev(t2, /*$hourStore*/ ctx[1]);
    			if (dirty & /*$minuteStore*/ 4) set_data_dev(t8, /*$minuteStore*/ ctx[2]);
    			if (dirty & /*$secondStore*/ 8) set_data_dev(t14, /*$secondStore*/ ctx[3]);

    			if (dirty & /*inProgress*/ 1) {
    				toggle_class(div6, "hide", /*inProgress*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			run_all(dispose);
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
    	let $hourStore;
    	let $minuteStore;
    	let $secondStore;
    	validate_store(hourStore, "hourStore");
    	component_subscribe($$self, hourStore, $$value => $$invalidate(1, $hourStore = $$value));
    	validate_store(minuteStore, "minuteStore");
    	component_subscribe($$self, minuteStore, $$value => $$invalidate(2, $minuteStore = $$value));
    	validate_store(secondStore, "secondStore");
    	component_subscribe($$self, secondStore, $$value => $$invalidate(3, $secondStore = $$value));
    	let { app } = $$props;
    	let inProgress = false;

    	const up = store => {
    		store.update(value => {
    			if (value !== 59) {
    				return value + 1;
    			}

    			return 0;
    		});
    	};

    	const down = store => {
    		store.update(value => {
    			if (value !== 0) {
    				return value - 1;
    			}

    			return 59;
    		});
    	};

    	const start = () => {
    		$$invalidate(0, inProgress = true);
    		app.startFrame($hourStore * 3600 + $minuteStore * 60 + $secondStore);
    	};

    	window.addEventListener("timeOut", () => {
    		$$invalidate(0, inProgress = false);
    	});

    	const writable_props = ["app"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Controler> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		down(hourStore);
    	};

    	const click_handler_1 = () => {
    		up(hourStore);
    	};

    	const click_handler_2 = () => {
    		down(minuteStore);
    	};

    	const click_handler_3 = () => {
    		up(minuteStore);
    	};

    	const click_handler_4 = () => {
    		down(secondStore);
    	};

    	const click_handler_5 = () => {
    		up(secondStore);
    	};

    	$$self.$set = $$props => {
    		if ("app" in $$props) $$invalidate(7, app = $$props.app);
    	};

    	$$self.$capture_state = () => ({
    		hourStore,
    		minuteStore,
    		secondStore,
    		app,
    		inProgress,
    		up,
    		down,
    		start,
    		$hourStore,
    		$minuteStore,
    		$secondStore,
    		window
    	});

    	$$self.$inject_state = $$props => {
    		if ("app" in $$props) $$invalidate(7, app = $$props.app);
    		if ("inProgress" in $$props) $$invalidate(0, inProgress = $$props.inProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inProgress,
    		$hourStore,
    		$minuteStore,
    		$secondStore,
    		up,
    		down,
    		start,
    		app,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Controler extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { app: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controler",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*app*/ ctx[7] === undefined && !("app" in props)) {
    			console.warn("<Controler> was created without expected prop 'app'");
    		}
    	}

    	get app() {
    		throw new Error("<Controler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set app(value) {
    		throw new Error("<Controler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.1 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let current;

    	const controler = new Controler({
    			props: { app: /*app*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(controler.$$.fragment);
    			add_location(main, file$1, 11, 0, 233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(controler, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const controler_changes = {};
    			if (dirty & /*app*/ 1) controler_changes.app = /*app*/ ctx[0];
    			controler.$set(controler_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(controler.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(controler.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(controler);
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
    	let app;

    	onMount(() => {
    		$$invalidate(0, app = new App());
    		window.addEventListener("resize", app.resize);
    	});

    	$$self.$capture_state = () => ({ App, onMount, Controler, app, window });

    	$$self.$inject_state = $$props => {
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [app];
    }

    class App_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App_1",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App_1({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
