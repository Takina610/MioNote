<script setup>
import { artAddChannelService, artEditChannelService } from '@/api/article';
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const dialogVisible = ref(false)
const formRef = ref()
const formModel = ref({
  id: '',
  cate_name: '',
  cate_alias: ''
})
const rules = {
  cate_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { pattern: /^\S{1,10}$/, message: '分类名称长度在1-10个字符之间', trigger: 'blur' }
  ],
  cate_alias: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{1,15}$/, message: '分类别名必须是1-15位的字母或数字', trigger: 'blur' }
  ]
}

const emit = defineEmits(['success'])
const onSubmit = async () => {
  await formRef.value.validate()
  formModel.value.id
    ? await artEditChannelService(formModel.value)
    : await artAddChannelService(formModel.value)
  ElMessage({
    type: 'success',
    message: formModel.value.id ? '编辑成功' : '添加成功'
  })
  dialogVisible.value = false
  emit('success')
}
// 组件对外暴露一个方法 open，基于 open传来的参数，区分添加还是编辑
// open({}) => 表单无需渲染，说明是添加
// open({id, cate_name, ...}) => 表单需要渲染，说明是编辑
// open 调用后，可以打开弹窗 
const open = (params) => {
  dialogVisible.value = true
  // 如果是编辑，需要将传来的参数赋值给表单
  // 如果是添加，表单不需要赋值
  formModel.value = {...params}
}

// 向外暴露方法
defineExpose({
  open
})
</script>

<template>
  <el-dialog 
    v-model="dialogVisible"
    :title="formModel.id ? '编辑分类' : '添加分类'" width="30%">
      <el-form
        ref="formRef"
        :model="formModel" 
        :rules="rules" 
        label-width="80px" 
        style="padding-right: 30px;">
        <el-form-item 
          label="分类名称" 
          prop="cate_name">
          <el-input v-model="formModel.cate_name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item 
          label="分类别名" 
          prop="cate_alias">
          <el-input v-model="formModel.cate_alias" placeholder="请输入分类别名"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="onSubmit"> 确认 </el-button>
        </span>
      </template>
  </el-dialog>
</template>