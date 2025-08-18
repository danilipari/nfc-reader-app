import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import ContinuousReaderPage from '../views/ContinuousReaderPage.vue'
import OperatorSearchPage from '../views/OperatorSearchPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/continuous-reader',
    name: 'ContinuousReader',
    component: ContinuousReaderPage
  },
  {
    path: '/operator-search',
    name: 'OperatorSearch',
    component: OperatorSearchPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
