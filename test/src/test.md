# Cases

## basic markdown

> **This is bold text** in a blockquote

- [x] Live vue/html code blocks
- [x] Use virtual file system to create vue component files
- [x] Cache same vue component
- [x] Hot reload
- [x] Built-in **syntax highlighter** with [highlightjs](https://highlightjs.org)
- [x] Configurable [markdown-it](https://github.com/markdown-it/markdown-it) parser

## html

``` html
This is a <a>link</a>.
<p>Just a <strong>html</strong> paragraph.</p>
<p>A root node is not necessary in <strong>html</strong> code block.</p>
```

## vue

``` vue
<template>
<div>
    <p>This is a vue component.</p>
    <button @click="number++">Click me!</button> {{ number }}
    <p class="vue">Component template should contain exactly one root element.</p>
</div>
</template>

<script>
export default {
    data() {
        return {
            number: 13333112,
        };
    },
}
</script>

<style scoped>
.vue {
    color: red;
}
</style>
```

## vue code copy

Same vue code will only be converted to one component. Make sure their contents are exactly equal.

``` vue
<template>
<div>
    <p>This is a vue component.</p>
    <button @click="number++">Click me!</button> {{ number }}
    <p class="vue">Component template should contain exactly one root element.</p>
</div>
</template>

<script>
export default {
    data() {
        return {
            number: 0,
        };
    },
}
</script>

<style scoped>
.vue {
    color: red;
}
</style>
```
