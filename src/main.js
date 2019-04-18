// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import 'element-ui/lib/theme-chalk/index.css';
import ElementUi from 'element-ui'
Vue.use(ElementUi)
import echarts from 'echarts'
Vue.prototype.$echarts = echarts
// 引入样式
import 'vue-easytable/libs/themes-base/index.css'
import {VTable,VPagination} from 'vue-easytable'
Vue.component('v-table', VTable)
Vue.component('v-pagination', VPagination)
Vue.config.productionTip = false
import service from './api/util.js'
Vue.prototype.$http = service

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
