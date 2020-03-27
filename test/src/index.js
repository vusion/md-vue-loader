import Vue from 'vue';
import App from './test.md';
import App2 from './test2.md';
import CodeExample from './code-example.vue';

Vue.component('code-example', CodeExample);
new Vue(App).$mount('#app');
