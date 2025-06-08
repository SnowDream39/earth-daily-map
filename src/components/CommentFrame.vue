<template>
  <div class="max-w-xl mx-auto p-4 bg-paper rounded shadow">
    <h2 class="text-xl font-semibold mb-4">评论区</h2>

    <!-- 新评论输入 -->
    <form @submit.prevent="submitComment" class="space-y-2 mb-4">
      <textarea v-model="newComment" placeholder="写下你的评论..." rows="4"
        class="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        required></textarea>

      <button type="submit"
        class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
        :disabled="loading">
        {{ loading ? '提交中...' : '发表评论' }}
      </button>
    </form>

    <!-- 评论列表 -->
    <div v-if="comments.length === 0" class="text-gray-500">暂无评论，快来抢沙发！</div>
    <ul class="space-y-4 mb-6">
      <li v-for="comment in comments" :key="comment.id" class="border rounded p-3 bg-gray/50">
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium text-gray-800">{{ comment.user || '匿名' }}</span>
          <span class="text-xs text-gray-400">{{ formatDate(comment.created_at) }}</span>
        </div>
        <p class="whitespace-pre-line text-gray-700">{{ comment.content }}</p>
        <div class="actions text-right text-xs text-gray-400 flex flex-row justify-between text-lg">
          <CommentAction v-bind="actionIcons.reply" />
          <div class="flex flex-row text-lg gap-1">
            <CommentAction v-bind="actionIcons.like" />
            <CommentAction v-bind="actionIcons.dislike" />
            <CommentAction v-bind="actionIcons.share" />
          </div>
        </div>
      </li>
    </ul>


    <p v-if="error" class="mt-2 text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CommentAction from './CommentAction.vue'

// 假数据演示，实际用接口请求替换
const comments = ref([])

const newComment = ref('')
const loading = ref(false)
const error = ref(null)

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleString()
}

async function loadComments() {
  try {
    error.value = null
    // 这里你写接口请求，比如 fetch('/api/comments')
    // 模拟异步请求：
    await new Promise(r => setTimeout(r, 300))
    comments.value = [
      { id: 1, user: '小明', content: '很棒的文章！', created_at: '2025-06-07T10:00:00Z' },
      { id: 2, user: '小红', content: '学习了，谢谢分享。', created_at: '2025-06-07T11:00:00Z' },
    ]
  } catch (e) {
    error.value = '加载评论失败'
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  loading.value = true
  error.value = null

  try {
    // 这里你写接口请求，把 newComment.value 发给后端
    // 模拟请求延迟：
    await new Promise(r => setTimeout(r, 500))

    // 成功后，把新评论追加到列表（真实情况应该重新拉取）
    comments.value.push({
      id: Date.now(),
      user: '当前用户',  // 这里改成你登录系统拿到的用户名
      content: newComment.value.trim(),
      created_at: new Date().toISOString(),
    })

    newComment.value = ''
  } catch {
    error.value = '提交失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

onMounted(loadComments)

// ================= 交互事件 ==================

const actionIcons = {
  like: {
    classBefore: 'i-material-symbols-thumb-up-outline',
    classAfter: 'i-material-symbols-thumb-up',
    action: () => { },
  },
  reply: {
    classBefore: 'i-material-symbols-reply',
    classAfter: 'i-material-symbols-reply',
    action: () => { },
  },
  dislike: {
    classBefore: 'i-material-symbols-thumb-down-outline',
    classAfter: 'i-material-symbols-thumb-down',
    action: () => { },
  },
  share: {
    classBefore: 'i-material-symbols-share',
    classAfter: 'i-material-symbols-share',
    action: () => { },
  },
}


</script>

<style scoped>
/* 你也可以用全局Tailwind，这里无额外样式 */
</style>
