<template>
    <header class="bg-[#12291b] pl-5 py-4 sticky top-0 z-50 flex items-center justify-between">
        <div class="flex-1">
            <a href="#" @click="reload" class="inline-block">
                <img src="/images/logo.svg" class="h-8" alt="Logo" />
            </a>
        </div>
        <nav class="hidden md:flex space-x-4">
            <router-link v-for="link in userRoutes" :to="link.path" :class="linkClasses">
                <b>{{ formatProper(link.name) }}</b>
            </router-link>

            <a href="https://www.etsy.com/shop/gardenhanger/?etsrc=sdt" target="_blank" :class="linkClasses">
                <b>Shop On Etsy »</b>
            </a>
        
            <a v-if="userStore.isLoggedIn" href="/api/auth/logout" :class="linkClasses">
                <b>Logout</b>
            </a>
        </nav>
        <button @click="toggleMenu" class="md:hidden p-2 text-white focus:outline-none">
            <Menu v-if="!State.showingMenu" />
            <CircleX v-else />
        </button>
    </header>
</template>

<script setup>
import router, { useFilteredRoutes } from '../router';
import { useUserStore } from '../stores/userStore';
import { formatProper } from '../utils/formats';


import { Menu, CircleX } from 'lucide-vue-next';

const linkClasses = 'text-white hover:text-green-300 transition-colors duration-200 pr-5';

const props = defineProps({
    State: Object
});

const userStore = useUserStore();
const userRoutes = useFilteredRoutes('home');

function reload() {
    if (window.location.pathname === '/') {
        return window.location.reload();
    }
    props.State.showingMenu = false;
    router.push('/');
}

function toggleMenu() {
    props.State.showingMenu = !props.State.showingMenu;
}
</script>