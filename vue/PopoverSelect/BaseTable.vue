<template>
  <a-row :gutter="[12, 12]" style="width: 460px">
    <!-- 搜索框 -->
    <a-col :span="24">
      <a-space>
        <a-input
          v-model="keyword"
          placeholder="多个以英文逗号或空格间隔"
          :allowClear="true"
          :style="{ width: '220px' }"
          @pressEnter="handleSearch"
        >
          <a-icon type="search" slot="prefix" />
        </a-input>
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button type="primary" @click="handleSubmit">确认</a-button>
      </a-space>
    </a-col>
    <!-- 数据列表 -->
    <a-col :span="24">
      <vxe-grid
        ref="xtable"
        row-id="id"
        height="280px"
        :empty-render="{ name: 'NotData' }"
        :highlight-current-row="true"
        :highlight-hover-row="true"
        :show-overflow="true"
        :columns="__columns"
        :bordered="true"
        :rowKey="true"
        :data="list"
      />
    </a-col>
  </a-row>
</template>
<script>
import { isTypeOf } from "@/utils/util";
export default {
  props: {
    type: {
      validator: (val) => ["checkbox", "radio"].includes(val),
      default: "radio"
    },
    // 已选数据
    selected: {
      type: [String, Number, Array]
    },
    // 数据源
    dataSource: {
      type: Array,
      default: () => []
    },
    // 参与查询字段
    filterKeys: {
      type: Array
    },
    // 列配置
    columns: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      list: [],
      keyword: ""
    };
  },
  computed: {
    __columns() {
      const { type = "radio", columns = [] } = this;
      return [{ width: 40, type }, ...columns];
    }
  },
  mounted() {
    const $xtable = this.$refs.xtable;
    const { selected, dataSource = [], type } = this;
    if (selected) {
      const km = {};
      // 数组处理
      if (isTypeOf(selected, "array")) selected.forEach((k) => (km[k] = 1));
      // 非数组处理
      else km[selected] = 1;
      // 查找对应行
      const rows = dataSource.filter((item) => km[item.id]);

      // 设置多选框选中
      if (type === "checkbox")
        rows.forEach((row) => $xtable.setCheckboxRow(row, true));
      // 设置单选框选中
      else $xtable.setRadioRow(rows[0]);
    }
    this.handleSearch();
  },
  methods: {
    // 查询
    handleSearch() {
      const { dataSource = [], keyword, filterKeys = [] } = this;
      // 未配置查询字段或未输入则不处理
      if (filterKeys.length <= 0 || !keyword) this.list = dataSource;
      else {
        const arr = keyword.split(/[\s,]/).filter((key) => !!key);
        this.list = dataSource.filter((item) => {
          // 将参与查询的字段拼接成一个字符串
          let str = filterKeys.map((key) => item[key]).join("__");
          // 查找是否存在匹配项
          let idx = arr.findIndex((kw) => str.includes(kw));
          return idx >= 0;
        });
      }
    },
    // 确认
    handleSubmit() {
      let val;
      const { type } = this;
      const $xtable = this.$refs.xtable;
      // 多选获取选中值
      if (type == "checkbox") {
        const list = $xtable.getCheckboxRecords();
        if (list && list.length > 0) val = list.map((item) => item.id);
      }
      // 单选获取选中值
      else {
        const item = $xtable.getRadioRecord();
        if (item) val = item.id;
      }
      this.$emit("change", val);
    }
  }
};
</script>
