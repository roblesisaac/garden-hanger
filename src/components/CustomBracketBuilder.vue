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

const sideAStartLeft = 100;
const sideAWidth = 20;
const sideBStartLeft = computed(() => sideAStartLeft + sideAWidth);
const sideBWidth = computed(() => (dimensions.value.B * 20));
const sideCStartLeft = computed(() => sideAStartLeft + sideAWidth + sideBWidth.value);
const sideCHeight = computed(() => (dimensions.value.C * 20) )
const sideDStartLeft = computed(() => sideCStartLeft.value + 20);
const sideDBottom = computed(() => sideCHeight.value - 20);
const sideELeft = computed(() => sideDStartLeft.value + dimensions.value.D * 20);
const sideEBottom = computed(() => sideCHeight.value - dimensions.value.E * 20)
</script>

<template>
    <div class="flex gap-8 p-8">
        <div class="relative w-[600px] h-[600px]">
            <!-- Side A - Vertical, bottom left -->
            <div class="absolute bottom-0" :style="`left: ${sideAStartLeft}px`">
                <div class="relative flex flex-col">
                    <div v-for="(block, i) in createBlocks(dimensions.A)" :key="i"
                    class="w-5 bg-black"
                    :class="block === 1 ? 'h-5' : ''"
                    :style="block !== 1 ? `height: ${block * 20}px` : ''">
                </div>
                <span class="absolute -left-16 top-1/2 transform -translate-y-1/2 text-sm font-medium">
                    Side A
                </span>
            </div>
        </div>
        
        <!-- Side B - Horizontal, bottom -->
        <div class="absolute" :style="`bottom: 0; left: ${sideBStartLeft}px`">
            <div class="relative flex flex-row">
                <div v-for="(block, i) in createBlocks(dimensions.B)" :key="i"
                class="h-5 bg-black"
                :class="block === 1 ? 'w-5' : ''"
                :style="block !== 1 ? `width: ${block * 20}px` : ''">
            </div>
            <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                Side B
            </span>
        </div>
    </div>
    
    <!-- Side C - Vertical, middle -->
    <div class="absolute" :style="`bottom: 0; left: ${sideCStartLeft}px`">
        <div class="relative flex flex-col">
            <div v-for="(block, i) in createBlocks(dimensions.C)" :key="i"
            class="w-5 bg-black"
            :class="block === 1 ? 'h-5' : ''"
            :style="block !== 1 ? `height: ${block * 20}px` : ''">
            </div>
            <span class="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm font-medium text-center">
            C <br/><span class="text-xs text-blue-500">{{ dimensions.C }}"</span>
            </span>
        </div>
    </div>

    <!-- Side D - Horizontal, top -->
    <div class="absolute" :style="`bottom: ${sideDBottom}px; left: ${sideDStartLeft}px`">
        <div class="relative flex flex-row">
            <div v-for="(block, i) in createBlocks(dimensions.D)" :key="i"
            class="h-5 bg-black"
            :class="block === 1 ? 'w-5' : ''"
            :style="block !== 1 ? `width: ${block * 20}px` : ''">
        </div>
        <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
            Side D
        </span>
    </div>

</div>

<!-- Side E - Vertical, top right -->
<div class="absolute" :style="`bottom: ${sideEBottom}px; left: ${sideELeft}px`">
    <div class="relative flex flex-col">
        <div v-for="(block, i) in createBlocks(dimensions.E)" :key="i"
        class="w-5 bg-black"
        :class="block === 1 ? 'h-5' : ''"
        :style="block !== 1 ? `height: ${block * 20}px` : ''">
    </div>
    <span class="absolute -right-16 top-1/2 transform -translate-y-1/2 text-sm font-medium">
        Side E
    </span>
</div>
</div>
</div>

<div class="flex flex-col gap-4">
    <div v-for="(length, side) in dimensions" :key="side" class="flex flex-col">
        <label class="text-sm font-medium">Side {{ side }} (inches):</label>
        <input 
        type="number" 
        :value="length" 
        step="0.25"
        class="w-24 px-2 py-1 border rounded"
        @input="e => updateDimension(side, e.target.value)"
        >
    </div>
</div>
</div>
</template>