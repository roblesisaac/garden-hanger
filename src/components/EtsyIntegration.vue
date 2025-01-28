<template>
  <div class="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-700">Etsy Integration</h2>
      <div class="flex items-center space-x-2">
        <span class="text-sm" :class="statusColor">{{ connectionStatus }}</span>
        <button 
          v-if="!isConnected" 
          @click="connectEtsy"
          class="bg-[#F56400] text-white px-4 py-2 rounded-md hover:bg-[#D55400] transition-colors"
        >
          Connect to Etsy
        </button>
        <button 
          v-else 
          @click="syncOrders"
          :disabled="isSyncing"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {{ isSyncing ? 'Syncing...' : 'Sync Orders' }}
        </button>
      </div>
    </div>

    <div v-if="isConnected" class="mt-4">
      <div class="text-sm text-gray-600">
        <p>Last synced: {{ lastSyncTime || 'Never' }}</p>
      </div>
    </div>

    <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../stores/userStore';

const userStore = useUserStore();
const isConnected = ref(false);
const isSyncing = ref(false);
const error = ref(null);
const lastSyncTime = ref(null);

const connectionStatus = computed(() => 
  isConnected.value ? 'Connected' : 'Not Connected'
);

const statusColor = computed(() => ({
  'text-green-600': isConnected.value,
  'text-gray-500': !isConnected.value
}));

async function checkConnection() {
  try {
    const response = await fetch('/api/etsy/auth/status');
    const data = await response.json();
    isConnected.value = data.isConnected;
    lastSyncTime.value = data.lastSyncTime;
  } catch (err) {
    error.value = 'Failed to check Etsy connection status';
  }
}

function connectEtsy() {
  // Redirect to Etsy auth endpoint
  window.location.href = '/api/etsy/auth/connect';
}

async function syncOrders() {
  try {
    isSyncing.value = true;
    error.value = null;
    
    const response = await fetch('/api/etsy/orders/sync');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }

    lastSyncTime.value = new Date().toLocaleString();
  } catch (err) {
    error.value = err.message || 'Failed to sync orders';
  } finally {
    isSyncing.value = false;
  }
}

// Check connection status when component mounts
checkConnection();
</script> 