<template>
  <div class="t2">
    t2
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

	/deep/ .abc {
		height: 30px;
	}
	.t2 {
		font-size: 15px;
		color: #aaa;
		.test1 {
			border: 1px solid #ddd;
			font-size: 16px;
			.test2 {
				color: #333;
			}
		}
	}
</style>
<style scoped lang="less">

	.t2 {
		/deep/ .def {
			height: 40px;
		}
		.test3 {
			position: relative;
			margin-top: 20px;
			line-height: 40px;
			.test4 {
				line-height: 30px;
				font-size: 50px;
				color: red;
			}
		}
	}
</style>