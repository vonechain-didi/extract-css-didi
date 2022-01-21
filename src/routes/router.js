import Vue from 'vue';
import Router from 'vue-router';
import test from './test';
Vue.use(Router);

const routes = [...test];
const router = new Router({
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

export default router;

