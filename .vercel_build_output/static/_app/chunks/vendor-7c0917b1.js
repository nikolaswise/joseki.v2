function t(){}function e(t,e){for(const n in e)t[n]=e[n];return t}function n(t){return t()}function r(){return Object.create(null)}function o(t){t.forEach(n)}function u(t){return"function"==typeof t}function c(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function a(e,...n){if(null==e)return t;const r=e.subscribe(...n);return r.unsubscribe?()=>r.unsubscribe():r}function i(t,e,n){t.$$.on_destroy.push(a(e,n))}function s(t,e,n,r){if(t){const o=f(t,e,n,r);return t[0](o)}}function f(t,n,r,o){return t[1]&&o?e(r.ctx.slice(),t[1](o(n))):r.ctx}function l(t,e,n,r,o,u,c){const a=function(t,e,n,r){if(t[2]&&r){const o=t[2](r(n));if(void 0===e.dirty)return o;if("object"==typeof o){const t=[],n=Math.max(e.dirty.length,o.length);for(let r=0;r<n;r+=1)t[r]=e.dirty[r]|o[r];return t}return e.dirty|o}return e.dirty}(e,r,o,u);if(a){const o=f(e,n,r,c);t.p(o,a)}}function d(t){return null==t?"":t}function p(t,e){t.appendChild(e)}function b(t,e,n){t.insertBefore(e,n||null)}function h(t){t.parentNode.removeChild(t)}function g(t){return document.createElement(t)}function y(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function m(t){return document.createTextNode(t)}function $(){return m(" ")}function _(){return m("")}function v(t,e,n,r){return t.addEventListener(e,n,r),()=>t.removeEventListener(e,n,r)}function x(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function O(t){return Array.from(t.childNodes)}function j(t,e,n,r){for(let o=0;o<t.length;o+=1){const r=t[o];if(r.nodeName===e){let e=0;const u=[];for(;e<r.attributes.length;){const t=r.attributes[e++];n[t.name]||u.push(t.name)}for(let t=0;t<u.length;t++)r.removeAttribute(u[t]);return t.splice(o,1)[0]}}return r?y(e):g(e)}function M(t,e){for(let n=0;n<t.length;n+=1){const r=t[n];if(3===r.nodeType)return r.data=""+e,t.splice(n,1)[0]}return m(e)}function k(t){return M(t," ")}function w(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function A(t,e){t.value=null==e?"":e}function S(t,e){for(let n=0;n<t.options.length;n+=1){const r=t.options[n];if(r.__value===e)return void(r.selected=!0)}}function E(t){const e=t.querySelector(":checked")||t.options[0];return e&&e.__value}let P;function N(t){P=t}function z(){if(!P)throw new Error("Function called outside component initialization");return P}function U(t){z().$$.on_mount.push(t)}function J(t){z().$$.after_update.push(t)}function T(t,e){z().$$.context.set(t,e)}function q(t){return z().$$.context.get(t)}const C=[],L=[],B=[],D=[],F=Promise.resolve();let G=!1;function H(t){B.push(t)}let I=!1;const K=new Set;function Q(){if(!I){I=!0;do{for(let t=0;t<C.length;t+=1){const e=C[t];N(e),R(e.$$)}for(N(null),C.length=0;L.length;)L.pop()();for(let t=0;t<B.length;t+=1){const e=B[t];K.has(e)||(K.add(e),e())}B.length=0}while(C.length);for(;D.length;)D.pop()();G=!1,I=!1,K.clear()}}function R(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(H)}}const V=new Set;let W;function X(){W={r:0,c:[],p:W}}function Y(){W.r||o(W.c),W=W.p}function Z(t,e){t&&t.i&&(V.delete(t),t.i(e))}function tt(t,e,n,r){if(t&&t.o){if(V.has(t))return;V.add(t),W.c.push((()=>{V.delete(t),r&&(n&&t.d(1),r())})),t.o(e)}}function et(t,e){const n={},r={},o={$$scope:1};let u=t.length;for(;u--;){const c=t[u],a=e[u];if(a){for(const t in c)t in a||(r[t]=1);for(const t in a)o[t]||(n[t]=a[t],o[t]=1);t[u]=a}else for(const t in c)o[t]=1}for(const c in r)c in n||(n[c]=void 0);return n}function nt(t){return"object"==typeof t&&null!==t?t:{}}function rt(t){t&&t.c()}function ot(t,e){t&&t.l(e)}function ut(t,e,r,c){const{fragment:a,on_mount:i,on_destroy:s,after_update:f}=t.$$;a&&a.m(e,r),c||H((()=>{const e=i.map(n).filter(u);s?s.push(...e):o(e),t.$$.on_mount=[]})),f.forEach(H)}function ct(t,e){const n=t.$$;null!==n.fragment&&(o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function at(t,e){-1===t.$$.dirty[0]&&(C.push(t),G||(G=!0,F.then(Q)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function it(e,n,u,c,a,i,s=[-1]){const f=P;N(e);const l=e.$$={fragment:null,ctx:null,props:i,update:t,not_equal:a,bound:r(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(f?f.$$.context:n.context||[]),callbacks:r(),dirty:s,skip_bound:!1};let d=!1;if(l.ctx=u?u(e,n.props||{},((t,n,...r)=>{const o=r.length?r[0]:n;return l.ctx&&a(l.ctx[t],l.ctx[t]=o)&&(!l.skip_bound&&l.bound[t]&&l.bound[t](o),d&&at(e,t)),n})):[],l.update(),d=!0,o(l.before_update),l.fragment=!!c&&c(l.ctx),n.target){if(n.hydrate){const t=O(n.target);l.fragment&&l.fragment.l(t),t.forEach(h)}else l.fragment&&l.fragment.c();n.intro&&Z(e.$$.fragment),ut(e,n.target,n.anchor,n.customElement),Q()}N(f)}class st{$destroy(){ct(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function ft(t){if(t.__esModule)return t;var e=Object.defineProperty({},"__esModule",{value:!0});return Object.keys(t).forEach((function(n){var r=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,r.get?r:{enumerable:!0,get:function(){return t[n]}})})),e}function lt(t){var e={exports:{}};return t(e,e.exports),e.exports}var dt=lt((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.readableMap=void 0,e.readableMap=function(t){let e=new Map(Object.entries(t.toJSON())),n=[];const r=(t,r)=>{const o=t.target;var u;u=new Map(Object.entries(o.toJSON())),e!==u&&(e=u,n.forEach((t=>t(e))))};return{subscribe:o=>(n=[...n,o],1===n.length&&(e=new Map(Object.entries(t.toJSON())),t.observe(r)),o(e),()=>{n=n.filter((t=>t!==o)),0===n.length&&t.unobserve(r)}),y:t}}})),pt=lt((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.readableArray=void 0,e.readableArray=function(t){let e=t.toArray(),n=[];const r=(t,r)=>{const o=t.target;var u;u=o.toArray(),e!==u&&(e=u,n.forEach((t=>t(e))))};return{subscribe:o=>(n=[...n,o],1===n.length&&(e=t.toArray(),t.observe(r)),o(e),()=>{n=n.filter((t=>t!==o)),0===n.length&&t.unobserve(r)}),y:t}}}));const bt=[];function ht(t,e){return{subscribe:gt(t,e).subscribe}}function gt(e,n=t){let r;const o=[];function u(t){if(c(e,t)&&(e=t,r)){const t=!bt.length;for(let n=0;n<o.length;n+=1){const t=o[n];t[1](),bt.push(t,e)}if(t){for(let t=0;t<bt.length;t+=2)bt[t][0](bt[t+1]);bt.length=0}}}return{set:u,update:function(t){u(t(e))},subscribe:function(c,a=t){const i=[c,a];return o.push(i),1===o.length&&(r=n(u)||t),c(e),()=>{const t=o.indexOf(i);-1!==t&&o.splice(t,1),0===o.length&&(r(),r=null)}}}}var yt=ft(Object.freeze({__proto__:null,[Symbol.toStringTag]:"Module",derived:function(e,n,r){const c=!Array.isArray(e),i=c?[e]:e,s=n.length<2;return ht(r,(e=>{let r=!1;const f=[];let l=0,d=t;const p=()=>{if(l)return;d();const r=n(c?f[0]:f,e);s?e(r):d=u(r)?r:t},b=i.map(((t,e)=>a(t,(t=>{f[e]=t,l&=~(1<<e),r&&p()}),(()=>{l|=1<<e}))));return r=!0,p(),function(){o(b),d()}}))},readable:ht,writable:gt,get:function(t){let e;return a(t,(t=>e=t))(),e}})),mt=lt((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.readableUndo=void 0,e.readableUndo=function(t){return yt.readable({undoSize:0,redoSize:0},(e=>{let n=0,r=0;const o=()=>{n=t.undoStack.length,r=t.redoStack.length,e({undoSize:n,redoSize:r})},u=()=>{o()},c=()=>{o()};return t.on("stack-item-added",u),t.on("stack-item-popped",c),()=>{t.off("stack-item-added",u),t.off("stack-item-popped",c)}}))}}));lt((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.readableUndo=e.readableArray=e.readableMap=void 0,Object.defineProperty(e,"readableMap",{enumerable:!0,get:function(){return dt.readableMap}}),Object.defineProperty(e,"readableArray",{enumerable:!0,get:function(){return pt.readableArray}}),Object.defineProperty(e,"readableUndo",{enumerable:!0,get:function(){return mt.readableUndo}})}));export{J as A,U as B,X as C,Y as D,q as E,y as F,d as G,L as H,i as I,s as J,l as K,gt as L,A as M,S as N,v as O,o as P,H as Q,E as R,st as S,O as a,M as b,j as c,h as d,g as e,b as f,p as g,w as h,it as i,$ as j,_ as k,k as l,e as m,t as n,x as o,rt as p,ot as q,ut as r,c as s,m as t,et as u,nt as v,Z as w,tt as x,ct as y,T as z};
