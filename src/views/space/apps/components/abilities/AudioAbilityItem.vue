<script setup lang="ts">
  import { computed, ref, type PropType } from 'vue'
  import { Message } from '@arco-design/web-vue'
  import { useUpdateDraftAppConfig } from '@/hooks/use-app'

  type SpeechToTextConfig = { enable: boolean }
  type TextToSpeechConfig = { enable: boolean; voice: string; auto_play: boolean }
  type AudioConfig = {
    speech_to_text: SpeechToTextConfig
    text_to_speech: TextToSpeechConfig
  }

  const voices = ['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer']

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    audio_config: {
      type: Object as PropType<AudioConfig>,
      default: () => ({
        speech_to_text: { enable: false },
        text_to_speech: { enable: false, voice: 'echo', auto_play: false },
      }),
      required: true,
    },
  })
  const emits = defineEmits(['update:audio_config'])
  const { loading: saving, handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()

  const modalVisible = ref(false)
  const speechToTextEnabled = ref(false)
  const textToSpeechEnabled = ref(false)
  const voice = ref('echo')
  const autoPlay = ref(false)
  const enabled = computed(
    () =>
      Boolean(
        props.audio_config?.speech_to_text?.enable || props.audio_config?.text_to_speech?.enable,
      ),
  )

  const openModal = () => {
    speechToTextEnabled.value = Boolean(props.audio_config?.speech_to_text?.enable)
    textToSpeechEnabled.value = Boolean(props.audio_config?.text_to_speech?.enable)
    voice.value = props.audio_config?.text_to_speech?.voice || 'echo'
    autoPlay.value = Boolean(props.audio_config?.text_to_speech?.auto_play)
    modalVisible.value = true
  }

  const saveAudioConfig = async () => {
    const speechToText = { enable: speechToTextEnabled.value }
    const textToSpeech = {
      enable: textToSpeechEnabled.value,
      voice: voice.value,
      auto_play: autoPlay.value,
    }
    try {
      await handleUpdateDraftAppConfig(props.app_id, {
        speech_to_text: speechToText,
        text_to_speech: textToSpeech,
      })
      emits('update:audio_config', {
        speech_to_text: speechToText,
        text_to_speech: textToSpeech,
      })
      modalVisible.value = false
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '语音配置保存失败')
    }
  }
</script>

<template>
  <div>
    <a-collapse-item key="audio">
      <template #header>
        <div class="text-gray-700 font-bold">语音输入与输出</div>
      </template>
      <template #extra>
        <a-button size="mini" class="rounded-lg px-2" @click.stop="openModal">
          {{ enabled ? '已开启' : '配置' }}
          <icon-settings class="ml-1" />
        </a-button>
      </template>
      <div class="text-xs text-gray-500 leading-[22px]">
        配置语音转文字和 AI 回复语音播放。
      </div>
    </a-collapse-item>

    <a-modal
      :width="520"
      v-model:visible="modalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
    >
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">语音输入与输出</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          aria-label="关闭语音配置"
          @click="modalVisible = false"
        >
          <template #icon><icon-close /></template>
        </a-button>
      </div>

      <div class="pt-5 flex flex-col gap-4">
        <div class="rounded-lg border border-gray-100 p-3">
          <div class="flex items-center justify-between text-sm text-gray-700">
            <span>语音输入</span>
            <a-switch v-model:model-value="speechToTextEnabled" />
          </div>
          <div class="mt-2 text-xs text-gray-500">
            开启后可在调试区和已发布的 Web 聊天页录音，并将识别结果填入输入框。
          </div>
        </div>

        <div class="rounded-lg border border-gray-100 p-3">
          <div class="flex items-center justify-between text-sm text-gray-700">
            <span>语音输出</span>
            <a-switch v-model:model-value="textToSpeechEnabled" />
          </div>
          <template v-if="textToSpeechEnabled">
            <div class="mt-3 mb-2 text-sm text-gray-700">音色</div>
            <a-select v-model:model-value="voice" class="w-full">
              <a-option v-for="item in voices" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <div class="mt-3 flex items-center justify-between text-sm text-gray-700">
              <span>回答完成后自动播放</span>
              <a-switch v-model:model-value="autoPlay" />
            </div>
          </template>
        </div>

        <div class="flex items-center justify-end pt-1">
          <a-space :size="12">
            <a-button class="rounded-lg" :disabled="saving" @click="modalVisible = false">
              取消
            </a-button>
            <a-button
              type="primary"
              class="rounded-lg"
              :loading="saving"
              @click="saveAudioConfig"
            >
              保存
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>
