<template>
  <a-popover
    v-model="visible"
    trigger="click"
    placement="bottomLeft"
    :destroyTooltipOnHide="true"
  >
    <a-select
      v-model="val"
      v-bind="{ ...$props, open: false, options: list }"
    />
    <base-table
      slot="content"
      :type="type"
      :selected="val"
      :columns="columns"
      :dataSource="dataSource"
      :filterKeys="filterKeys"
      @change="handleChange"
    />
  </a-popover>
</template>
<script>
import { Select } from "ant-design-vue";
import BaseTable from "./BaseTable.vue";
export default {
  extends: Select,
  components: { BaseTable },
  data() {
    return {
      visible: false
    };
  },
  props: {
    mode: {
      validator: (val) => "multiple" == val
    }
  },
  computed: {
    list() {
      const { dataSource = [], valueKey = "id", labelKey = "label" } = this;
      return dataSource.map((item) => {
        return {
          label: item[labelKey],
          key: item[valueKey]
        };
      });
    },
    type() {
      return this.mode == "multiple" ? "checkbox" : "radio";
    },
    val: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("change", val);
      }
    }
  },
  methods: {
    handleChange(val) {
      this.val = val;
      this.visible = false;
    }
  }
};
</script>
