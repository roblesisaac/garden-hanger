import { defineStore } from 'pinia';

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
  }),
  getters: {
  },
  actions: {
    init: () => console.log('initiated...')
  }
});