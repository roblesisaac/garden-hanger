<template>
  <div class="flex flex-col min-h-screen">
    <TopNav :State="State" />
    <LoadingBar />

    <main class="flex-grow">
      <router-view v-if="userStore.status !== 'NOT_VERIFIED'" />
      <VerifyForm v-else />
    </main>

    <Notifications />
    <OffCanvas v-if="State.showingMenu" :State="State" />
    <Footer v-if="!State.showingMenu" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

// Components
import TopNav from './components/TopNav.vue';
import OffCanvas from './components/OffCanvas.vue';
import Footer from './components/Footer.vue';
import VerifyForm from './components/VerifyForm.vue';
import LoadingBar from './components/LoadingBar.vue';
import Notifications from './components/Notifications.vue';

// Stores + Composables
import { useUserStore } from './stores/userStore';
import { useCartStore } from './stores/cartStore';
import useDb from './composables/useDb';

const productsDb = useDb('products');
const listingsDb = useDb('listings');
const boxes = useDb('boxes');

const userStore = useUserStore();
const cartStore = useCartStore();

const State = ref({
  showingMenu: false
});

onMounted(async () => {
    try {
        await userStore.checkAuth();
        await productsDb.init();
        await listingsDb.init();
        await cartStore.init();
        await boxes.init();
    } catch (err) {
        console.error(err);
    }
});
</script>