import app from './test.md';
import app2 from './test2.md';
import Vue from 'vue';
new Vue(app).$mount('#preview1');
new Vue(app2).$mount('#preview2');
