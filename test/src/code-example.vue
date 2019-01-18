<template>
<div class="root">
    <div class="live"><slot></slot></div>
    <div class="code"><slot name="code"></slot></div>
</div>
</template>

<script>
export default {
    name: 'code-example',
};
</script>

<style scoped>
.root {

}

.code {

}
</style>
