<script>
export default {
  name: "group-button",
  props: {
    // 目前仅支持全局注册的组件或原生html标签
    wrapComponent: { type: String, default: "div" },
    actions: { type: Array, default: () => [] },
    maxCount: { type: Number, default: 2 },
    size: { type: String, default: "small" },
    type: { type: String, default: "default" }
  },
  methods: {
    // 权限校验
    checkPermission({ action }, permission) {
      // 存在权限信息则校验
      if (permission && action)
        return this.$checkPermission(`${permission[0]}.${action}`);
      return true;
    },
    // 断言校验
    checkAssert({ assert }, __props) {
      if (assert) return assert(__props);
      return true;
    }
  },
  computed: {
    buttons() {
      const __props = this.$attrs;
      const { actions } = this;
      const { permission } = this.$route.meta;
      // 查找符合条件数据
      return actions.reduce((arr, item) => {
        // 校验权限&断言规则（符合条件则展示）
        if (
          this.checkPermission(item, permission) &&
          this.checkAssert(item, __props)
        )
          arr.push(item);
        return arr;
      }, []);
    }
  },
  render(h) {
    // 未申明的props
    const __props = this.$attrs;
    // 父级event
    const __events = this.$listeners;
    // 默认展示按钮个数
    const { wrapComponent, maxCount, buttons, size, type } = this;
    // 默认展示按钮
    const before = buttons.slice(0, maxCount);
    // 更多下拉菜单按钮
    const after = buttons.slice(maxCount);
    return h(wrapComponent, [
      // 默认展示按钮
      before.map(({ component, props }) =>
        h(component, { props: Object.assign({}, __props, props), on: __events })
      ),
      // 更多按钮
      after.length > 0 &&
        h("el-dropdown", [
          // 更多按钮
          h("el-button", { props: { size, type } }, ["更多"]),
          // 下拉菜单
          h("el-dropdown-menu", { slot: "dropdown" }, [
            after.map(({ component, props }) =>
              h("el-dropdown-item", [
                h(component, {
                  props: Object.assign(__props, props, { type: "text" }),
                  on: __events
                })
              ])
            )
          ])
        ])
    ]);
  }
};
</script>
