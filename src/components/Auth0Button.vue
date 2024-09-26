<template>
  <button 
  @click="loginHandler">
    <h2 class="text-lg font-semibold">{{ isAuthenticated ? 'Log out' : 'Log in' }}</h2>
  </button>
</template>

<script setup>
import { useAuth0 } from '@auth0/auth0-vue';

const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

const loginHandler = () => isAuthenticated.value
  ? logout({ returnTo: window.location.origin })
  : loginWithRedirect();

</script>
