import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/views/layouts/MainLayout.vue'
import HomeView from '@/views/pages/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import SpaceView from '@/views/space/SpaceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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
