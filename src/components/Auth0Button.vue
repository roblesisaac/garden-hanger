<template>
    <button @click="login" v-if="!isAuthenticated">Log in</button>
    <button @click="logoutHandler" v-else>Log out</button>
  </template>
  
  <script setup>
  import { useAuth0 } from '@auth0/auth0-vue';
  
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  
  const login = () => loginWithRedirect();
  const logoutHandler = () => logout({ returnTo: window.location.origin });
  </script>
  