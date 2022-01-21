<template>
  <div class="t1">
    t1
    <div class="test1">
      样式test1
      <div class="test2">
        样式test2
      </div>
    </div>
    <div class="test3">
      样式test3
      <div class="test4">
        样式test4
      </div>
    </div>
  </div>
</template>

<script>
export default {
};
</script>

<style lang="less">
/deep/ .abc{
  height: 30px;
  .asz{
    color: #eee;
  }
}
.t1{
  color: #abc;
  font-size: 15px;
  .test1{
    font-size: 16px;
    border: 1px solid #ddd;
    color: #aaa;
    .test2{
      font-size: 16px;
      color: #333;
    }
  }
}
</style>
<style scoped lang="less">
  .t1{
    /deep/ .def{
      height: 40px;
      .dsfg{
        .sdf{
          color: #444;
        }
      }
    }
    .test3{
      position: relative;
      margin-top: 30px;
      line-height: 40px;
      .test4{
        line-height: 40px;
        font-size: 30px;
        color: red;
      }
    }
  }
</style>
