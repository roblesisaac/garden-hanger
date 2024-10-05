import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from './stores/userStore'
import { computed } from 'vue';
import Home from './pages/Home.vue';
import Listings from './pages/ListingsPage.vue';

// Use dynamic imports to lazy-load components
const Cart = () => import('./pages/CartPage.vue');
const InventoryPage = () => import('./pages/InventoryPage.vue');
const ListingPage = () => import('./pages/ListingsManagementPage.vue');
const Login = () => import('./pages/Login.vue');
const MyAccount = () => import('./pages/MyAccount.vue');
const ListingDetails = () => import('./pages/ListingDetailsPage.vue');
const Privacy = () => import('./pages/Privacy.vue');
const Terms = () => import('./pages/Terms.vue');
const ThankYou = () => import('./pages/ThankYou.vue');
const Boxes = () => import('./pages/BoxesPage.vue');
const Auth0 = () => import('./pages/Auth0.vue');
const CustomBracketBuilder = () => import('./pages/CustomBracketPage.vue');

const routes = [
  { 
    path: '/',
    name: 'Home',
    component: Home 
  },
  { 
    path: '/cart',
    name: 'Cart',
    component: Cart 
  },
  {
    path: '/my-account',
    name: 'My Account',
    component: MyAccount
  },
  {
    path: '/products',
    name: 'Products',
    component: Listings 
  },
  {
    path: '/products/:title',
    name: 'Product',
    component: ListingDetails 
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { hide: true } 
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy,
    meta: { hide: true } 
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms,
    meta: { hide: true } 
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryPage,
    meta: { requires: 'admin' },
    beforeEnter: handleAuthentication 
  },
  {
    path: '/listings',
    name: 'Listings',
    component: ListingPage,
    meta: { requires: 'admin' },
    beforeEnter: handleAuthentication 
  },
  {
    path: '/boxes',
    name: 'Boxes',
    component: Boxes,
    meta: { requires: 'admin' },
    beforeEnter: handleAuthentication 
  },
  {
    path: '/thank-you',
    name: 'thank you',
    component: ThankYou,
    meta: { hide: true } 
  },
  {
    path: '/auth0',
    name: 'auth0',
    component: Auth0,
    meta: { hide: true } 
  },
  {
    path: '/custom',
    name: 'Custom Bracket Builder',
    component: CustomBracketBuilder,
    meta: { hide: true }  
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

async function handleAuthentication(to, from, next) {
  if (import.meta.env.DEV) {
    return next();
  }
  
  const userStore = useUserStore();
  
  if (await userStore.checkAuth()) {
    return next();
  }
  
  next({ name: 'login' });
}

export const userRoutes = computed(() => {
  return router.getRoutes().filter(route => !route.path.includes(':') && userHasAccess(route) && !routeIsHidden(route)); 
});

export function useFilteredRoutes(arrayOfRoutesToExclude) {
  return computed(() => {
    if (!Array.isArray(arrayOfRoutesToExclude)) {
      arrayOfRoutesToExclude = [arrayOfRoutesToExclude];
    }

    return userRoutes.value.filter(route => {
      const routeName = route.name || '';
      
      return !arrayOfRoutesToExclude.some(
        excludedRoute => excludedRoute.toLowerCase() === routeName.toLowerCase()
      );
    });
  });
}

function userHasAccess(route) {
  const userStore = useUserStore();
  const { requires } = route.meta;
  
  if (route.name === 'login') {
    if (userStore.isLoggedIn) return false;
  }
  
  if (!requires || import.meta.env.DEV) {
    return true;
  }
  
  if (!userStore.isLoggedIn) {
    return false;
  }
  
  const { userData } = userStore;
  const roleHierarchy = ['member', 'admin'];
  const requiresRole = roleHierarchy.indexOf(requires);
  const userRole = roleHierarchy.indexOf(userData.role);
  
  return userRole >= requiresRole;
}

function routeIsHidden(route) {
  return route?.meta?.hide;
}

export default router;