<template>
    <div>
      <!-- Off-canvas menu -->
      <nav class="fixed inset-y-0 right-0 w-64 bg-gray-800 text-white p-6 overflow-y-auto shadow-lg z-50">
        <div class="space-y-6">
          <button 
            v-for="route in userRoutes" 
            :key="route.path"
            @click="changeRoute(route)" 
            class="w-full text-left px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <h2 class="text-lg font-semibold">{{ route.name }}</h2>
          </button>

          <Auth0Button class="w-full text-left px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
  
          <a 
            href="https://www.etsy.com/shop/gardenhanger/?etsrc=sdt" 
            target="_blank"
            class="block px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <h2 class="text-lg font-semibold text-center">Shop On Etsy »</h2>
          </a>
          
          <a 
            v-if="userStore.isLoggedIn" 
            href="/api/auth/logout"
            class="block px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <h2 class="text-lg font-semibold text-center">Logout</h2>
          </a>
        </div>
      </nav>
  
      <!-- Overlay for click-outside functionality -->
      <div 
        v-if="props.State.showingMenu"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 cursor-pointer"
        @click="closeMenu"
      ></div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted } from 'vue';
  import router, { userRoutes } from '../router';
  import Auth0Button from './Auth0Button.vue';
  import { useUserStore } from '../stores/userStore';
  
  const props = defineProps({
    State: Object
  });
  
  const userStore = useUserStore();
  
  function changeRoute(route) {
    router.push(route.path);
    closeMenu();
  }
  
  function closeMenu() {
    props.State.showingMenu = false;
  }
  
  function handleKeyDown(event) {
    if (event.key === 'Escape' && props.State.showingMenu) {
      closeMenu();
    }
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });
  </script>