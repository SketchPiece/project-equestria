import Vue from 'vue'
import Router from 'vue-router'
import Main from '../layouts/Main'
import Loading from '../layouts/Loading'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'loading',
      component: Loading
    },
    {
      path: '/main',
      name: 'main',
      component: Main
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
