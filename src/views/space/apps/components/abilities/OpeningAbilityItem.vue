<script setup lang="ts">
  import { computed, nextTick, type PropType } from 'vue'
  import { useUpdateDraftAppConfig } from '@/hooks/use-app'

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    opening_statement: { type: String, default: '', required: true },
    opening_questions: { type: Array as PropType<string[]>, default: () => [], required: true },
  })
  const emits = defineEmits(['update:opening_statement', 'update:opening_questions'])
  const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()

  // 计算属性：末尾自动补一个空输入框，最多3个
  const computed_opening_questions = computed<string[]>({
    get() {
      const newValue = [...props.opening_questions]
      if (newValue.length < 3 && newValue[newValue.length - 1] !== '') {
        newValue.push('')
      }
      return newValue
    },
    set(newValue: string[]) {
      emits('update:opening_questions', newValue)
    },
  })

  const handleUpdateOpeningQuestions = async () => {
    await handleUpdateDraftAppConfig(props.app_id, {
      opening_questions: computed_opening_questions.value.filter((item) => item.trim() !== ''),
    })
  }
</script>

<template>
  <a-collapse-item key="opening">
    <template #header>
      <div class="text-gray-700 font-bold">对话开场白</div>
    </template>
    <div class="text-xs text-gray-500">
      <!-- 开场白文案 -->
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex items-center gap-2">
          <div class="text-gray-700">开场白文案</div>
          <a-tooltip content="开场白是与Agent应用对话时，Agent默认展示的对话。">
            <icon-exclamation-circle />
          </a-tooltip>
        </div>
        <a-textarea
          class="rounded-lg bg-white"
          placeholder="在此处填写 AI 应用的开场白"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          :max-length="2000"
          :model-value="props.opening_statement"
          @update:model-value="(value: string) => emits('update:opening_statement', value)"
          @blur="
            async () => {
              await handleUpdateDraftAppConfig(props.app_id, {
                opening_statement: props.opening_statement,
              })
            }
          "
        />
      </div>
      <!-- 开场白预设问题 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="text-gray-700">开场白预设问题</div>
          <a-tooltip content="与Agent对话时初始化提供的建议问题，最多不超过3个。">
            <icon-exclamation-circle />
          </a-tooltip>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(opening_question, idx) in computed_opening_questions"
            :key="idx"
            class="flex items-center gap-2"
          >
            <a-input
              :model-value="opening_question"
              class="rounded-lg bg-white"
              placeholder="输入开场白引导问题"
              @update:model-value="
                (value: string) => {
                  const newQuestions = [...computed_opening_questions]
                  newQuestions[idx] = value
                  computed_opening_questions = newQuestions
                }
              "
              @blur="async () => await handleUpdateOpeningQuestions()"
            />
            <a-button
              class="rounded-lg"
              @click="
                async () => {
                  const newQuestions = [...computed_opening_questions]
                  newQuestions.splice(idx, 1)
                  emits('update:opening_questions', newQuestions)
                  await nextTick()
                  await handleUpdateOpeningQuestions()
                }
              "
            >
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </a-collapse-item>
</template>
