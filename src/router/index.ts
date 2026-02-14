import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/views/layouts/MainLayout.vue'
import BlankLayout from '@/views/layouts/BlankLayout.vue'
import HomeView from '@/views/pages/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import SpaceView from '@/views/space/SpaceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: BlankLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginView,
        },
      ],
    },
    {
      path: '/space/apps/:app_id',
      component: BlankLayout,
      children: [
        {
          path: '',
          name: 'space-apps-detail',
          component: () => import('@/views/space/apps/DetailView.vue'),
        },
      ],
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'space',
          name: 'space',
          component: SpaceView,
        },
      ],
    },
  ],
})

export default router
