<template>
    <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Bracket Visualizer
          </h1>
          <p class="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Adjust the dimensions to visualize your custom bracket
          </p>
        </div>
        
        <div class="flex flex-col lg:flex-row gap-12">
          <div class="flex-grow">
            <div 
              class="relative bg-white p-6"
              :style="`width: 100%; max-width: ${bracketOuterWidth}px; height: ${bracketOuterHeight + 40}px; margin: 0 auto;`"
            >
              <!-- Side A - Vertical, bottom left -->
              <div class="absolute" :style="{ left: `${sideAStartLeft}px`, bottom: `${bracketBottom}px` }">
                <div class="relative flex flex-col">
                  <div
                    v-for="(block, i) in createBlocks(dimensions.A)"
                    :key="i"
                    class="bg-black"
                    :style="{
                      width: `${blockSize}px`,
                      height: block === 1 ? `${blockSize}px` : `${block * blockSize}px`
                    }"
                  ></div>
                  <span class="absolute -left-16 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-600 text-center">
                    Side A 
                    <br/>
                    <span class="text-indigo-600 font-bold">{{ dimensions.A }}"</span>
                  </span>
                </div>
              </div>
              
              <!-- Side B - Horizontal, bottom -->
              <div class="absolute" :style="{ bottom: `${bracketBottom}px`, left: `${sideBStartLeft}px` }">
                <div class="relative flex flex-row">
                  <div
                    v-for="(block, i) in createBlocks(dimensions.B)"
                    :key="i"
                    class="bg-black"
                    :style="{
                      height: `${blockSize}px`,
                      width: block === 1 ? `${blockSize}px` : `${block * blockSize}px`
                    }"
                  ></div>
                  <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600 text-center">
                    Side B - <span class="text-indigo-600 font-bold">{{ dimensions.B }}"</span>
                  </span>
                </div>
              </div>
              
              <!-- Side C - Vertical, middle -->
              <div class="absolute" :style="{ bottom: `${bracketBottom}px`, left: `${sideCStartLeft}px` }">
                <div class="relative flex flex-col">
                  <div
                    v-for="(block, i) in createBlocks(dimensions.C)"
                    :key="i"
                    class="bg-black"
                    :style="{
                      width: `${blockSize}px`,
                      height: block === 1 ? `${blockSize}px` : `${block * blockSize}px`
                    }"
                  ></div>
                  <span class="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm font-medium text-center text-gray-600 text-center">
                    Side C
                    <br>
                    <span class="text-indigo-600 font-bold">{{ dimensions.C }}"</span>
                  </span>
                </div>
              </div>
              
              <!-- Side D - Horizontal, top -->
              <div class="absolute" :style="{ bottom: `${sideDBottom}px`, left: `${sideDStartLeft}px` }">
                <div class="relative flex flex-row">
                  <div
                    v-for="(block, i) in createBlocks(dimensions.D)"
                    :key="i"
                    class="bg-black"
                    :style="{
                      height: `${blockSize}px`,
                      width: block === 1 ? `${blockSize}px` : `${block * blockSize}px`
                    }"
                  ></div>
                  <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
                    Side D <span class="text-indigo-600 font-bold">{{ dimensions.D }}"</span>
                  </span>
                </div>
              </div>
              
              <!-- Side E - Vertical, top right -->
              <div class="absolute" :style="{ bottom: `${sideEBottom}px`, left: `${sideELeft}px` }">
                <div class="relative flex flex-col">
                  <div
                    v-for="(block, i) in createBlocks(dimensions.E)"
                    :key="i"
                    class="bg-black"
                    :style="{
                      width: `${blockSize}px`,
                      height: block === 1 ? `${blockSize}px` : `${block * blockSize}px`
                    }"
                  ></div>
                  <span class="absolute -right-16 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-600 text-center">
                    Side E
                    <br>
                    <span class="text-indigo-600 font-bold">{{ dimensions.E }}"</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="w-full lg:w-64 mt-8 lg:mt-0">
            <div class="bg-white shadow-lg rounded-lg p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Dimensions</h2>
              <div class="space-y-4">
                <div v-for="(length, side) in dimensions" :key="side" class="flex flex-col">
                  <label class="text-sm font-medium text-gray-700 mb-1">Side {{ side }} (inches):</label>
                  <input
                    type="number"
                    :value="length"
                    step="0.25"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    @input="e => updateDimension(side, e.target.value)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { ref, computed } from 'vue'

const dimensions = ref({
    A: 2,      // Vertical, bottom left
    B: 7,      // Horizontal, bottom
    C: 25.25,  // Vertical, middle
    D: 6.75,   // Horizontal, top
    E: 7,      // Vertical, top right
})

const createBlocks = (inches) => {
    const fullBlocks = Math.floor(inches)
    const partialBlock = inches % 1
    return Array(fullBlocks).fill(1).concat(partialBlock > 0 ? [partialBlock] : [])
}

const updateDimension = (side, value) => {
    dimensions.value[side] = parseFloat(value) || 0
}

const blockSize = 20;
const bracketBottom = 20;
const sideAStartLeft = 70;
const sideBStartLeft = computed(() => sideAStartLeft + blockSize);
const sideBWidth = computed(() => dimensions.value.B * blockSize);
const sideCStartLeft = computed(() => sideAStartLeft + blockSize + sideBWidth.value);
const sideCHeight = computed(() => dimensions.value.C * blockSize);
const sideDStartLeft = computed(() => sideCStartLeft.value + blockSize);
const sideDBottom = computed(() => sideCHeight.value - blockSize + bracketBottom);
const sideDWidth = computed(() => dimensions.value.D * blockSize);
const sideELeft = computed(() => sideDStartLeft.value + dimensions.value.D * blockSize);
const sideEBottom = computed(() => bracketBottom + sideCHeight.value - dimensions.value.E * blockSize);
const bracketOuterWidth = computed(() => 140 + sideBWidth.value + sideDWidth.value + (blockSize*3));
const bracketOuterHeight = computed(() => sideCHeight.value);

</script>