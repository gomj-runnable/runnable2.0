<script setup lang="ts">
// No props needed - Seoul elevation range is fixed
</script>

<template>
    <div class="flex items-center gap-1.5 px-2.5 py-1.5">
        <span class="text-xs text-meta whitespace-nowrap">5m</span>
        <div
            class="flex-1 h-3 rounded-lg border border-(--ui-border)"
            style="
                background: linear-gradient(
                    to right,
                    #0000ff 0%,
                    #0066ff 2.2%,
                    #00cc00 4%,
                    #66ff00 5.4%,
                    #ffff00 7%,
                    #ffaa00 8.4%,
                    #ff6600 10.2%,
                    #ff3300 12.8%,
                    #ff0000 100%
                );
            "
        />
        <span class="text-xs text-meta whitespace-nowrap">836m</span>
    </div>
</template>
