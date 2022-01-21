<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {},
  methods: {},
  created() {},
  mounted() {}
};
</script>

<style>
body {
  overflow-y: hidden;
}
#app {
  /* font-family: 'Source Han Sans'; */
  width: 100%;
}
body .el-container {
  height: 100vh !important;
}
</style>
