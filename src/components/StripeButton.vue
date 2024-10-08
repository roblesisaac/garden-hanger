<template>
  <div class="secure-checkout-container max-w-md mx-auto mt-6 px-4">
    <button
      @click="handleCheckout"
      class="block w-full bg-blue-600 text-white text-center font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
      :disabled="isLoading"
      :aria-busy="isLoading"
      aria-label="Secure Checkout"
    >
      <span class="flex items-center justify-center">
        Secure Checkout
        <ArrowRight v-if="!isLoading" class="w-5 h-5 ml-2" />
        <LoadingDotsVue v-else />
      </span>
    </button>
    <div class="text-xs text-center mt-2">
      <a target="_blank" href="https://stripe.com" class="inline-flex items-center text-gray-500">
        Powered by <StripeLogo class="ml-1" fill="#333" />
      </a>
    </div>
  </div>
  
  <!-- Modal for Login Form, Guest Option, and Guest Email Form -->
  <Transition>
    <div v-if="showLoginOptions" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
  
        <!-- Connecting with Stripe message -->
        <div v-if="showProceedingToCheckout" class="text-center py-4">
          <p class="text-gray-600 flex items-center justify-center mb-4">
            Connecting with <StripeLogo class="mx-2 h-4" />
          </p>
          <div class="animate-pulse flex space-x-4 justify-center">
            <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
            <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
            <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
          </div>
        </div>
  
        <div v-if="!showLoginForm && !showGuestEmailForm && !showProceedingToCheckout" class="space-y-4">
          <h2 class="text-xl font-bold mb-4">Checkout Options</h2>
          <button @click="showLoginForm = true" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300">
            Login to Continue
          </button>
          <button @click="showGuestEmailForm = true" class="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300 transition duration-300">
            Continue as Guest
          </button>
        </div>
        
        <Transition>
          <LoginFormVue v-if="showLoginForm && !showProceedingToCheckout" @login-success="handleProceedToCheckout" />
        </Transition>
        
        <Transition>
          <form v-if="showGuestEmailForm && !showProceedingToCheckout" @submit.prevent="handleProceedToCheckout" class="space-y-4">
            <div class="text-center mb-4">
              <p class="text-lg font-semibold text-gray-800">Guest Checkout</p>
              <p class="text-sm text-gray-600">We use your email to send order updates.</p>
            </div>
            <div>
              <label for="guestEmail" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="guestEmail"
                v-model="guestEmail"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                placeholder="your@email.com"
              >
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300">
              Continue to Checkout <LoadingDotsVue v-if="isLoading" />
            </button>
            <p class="text-xs text-gray-500 text-center mt-2">
              We respect your privacy. You can unsubscribe from order updates at any time.
            </p>
          </form>
        </Transition>
        
        <button v-if="!showProceedingToCheckout" @click="cancelLoginOptions" class="mt-4 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
      </div>
    </div>
  </Transition>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue';
  import { loadStripe } from '@stripe/stripe-js';
  
  import LoginFormVue from './LoginForm.vue'
  import { ArrowRight } from 'lucide-vue-next';
  import LoadingDotsVue from './LoadingDots.vue';
  import StripeLogo from './StripeLogo.vue';
  
  import useApi from '../composables/useApi';
  import { useCartStore } from '../stores/cartStore';
  import { useUserStore } from '../stores/userStore';
  
  let stripePromise = null;
  let isStripeInitiating = false;
  
  const { post } = useApi();
  const cart = useCartStore();
  const userStore = useUserStore();
  
  const isLoading = ref(false);
  const showLoginOptions = ref(false);
  const showLoginForm = ref(false);
  const showGuestEmailForm = ref(false);
  const showProceedingToCheckout = ref(false);
  const guestEmail = ref('');
  
  const handleCheckout = async () => {
    if (isLoading.value) return;
  
    if (userStore.isLoggedOut) {
      showLoginOptions.value = true;
      return;
    }
  
    proceedToCheckout();
  };
  
  const proceedToCheckout = async () => {
    isLoading.value = true;
    showProceedingToCheckout.value = true;
  
    try {
      const stripe = await loadStripePromise();  
      const sessionId = await post('/stripe/create-checkout-session', {
        lineItems: cart.items,
        email: guestEmail.value || userStore.user?.email
      });
  
      const result = await stripe.redirectToCheckout({ sessionId });
  
      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      isLoading.value = false;
      showProceedingToCheckout.value = false;
    }
  };
  
  const handleProceedToCheckout = () => {
    console.log('should proceed to checkout...');
    showProceedingToCheckout.value = true;
    proceedToCheckout();
  };
  
  const cancelLoginOptions = () => {
    showLoginOptions.value = false;
    showLoginForm.value = false;
    showGuestEmailForm.value = false;
    showProceedingToCheckout.value = false;
    guestEmail.value = '';
  };
  
  const params = new URLSearchParams(window.location.search);
  const loginSuccess = params.get('loginSuccess');
  
  if(loginSuccess) {
    showLoginOptions.value = true;
    showProceedingToCheckout.value = true;
    proceedToCheckout();
  }
  
  async function loadStripePromise() {
    if (stripePromise) {
      return stripePromise;
    }
  
    if (isStripeInitiating) {
      while (isStripeInitiating) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return stripePromise;
    }
  
    isStripeInitiating = true;
    try {
      const publicKey = await post('/stripe/public-key');
      stripePromise = await loadStripe(publicKey);
      return stripePromise;
    } finally {
      isStripeInitiating = false;
    }
  }
  
  onMounted(async () => {
    await loadStripePromise();
  });
  </script>