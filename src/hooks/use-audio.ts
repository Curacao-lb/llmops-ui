import { onUnmounted, ref } from 'vue'
import Recorder from 'js-audio-recorder'
import {
  audioToText,
  createAudioRecorder,
  getAudioRecorderFile,
  messageToAudio,
} from '@/services/audio'

/** 录制 WAV 音频并调用语音转文字接口。 */
export const useAudioToText = () => {
  const loading = ref(false)
  const recording = ref(false)
  let recorder: Recorder | null = null

  const startRecording = async () => {
    if (recorder) return
    const nextRecorder = createAudioRecorder()
    recorder = nextRecorder
    try {
      await nextRecorder.start()
      recording.value = true
    } catch (error) {
      recorder = null
      await nextRecorder.destroy()
      throw error
    }
  }

  const releaseRecorder = async () => {
    if (!recorder) return null
    const currentRecorder = recorder
    recorder = null
    recording.value = false
    currentRecorder.stop()
    return currentRecorder
  }

  const stopRecording = async (appId: string) => {
    const currentRecorder = await releaseRecorder()
    if (!currentRecorder) return ''

    try {
      const file = getAudioRecorderFile(currentRecorder)
      if (file.size === 0) throw new Error('没有录到音频，请重试')
      loading.value = true
      const response = await audioToText(appId, file)
      return response.data.text
    } finally {
      loading.value = false
      await currentRecorder.destroy()
    }
  }

  const cancelRecording = async () => {
    const currentRecorder = await releaseRecorder()
    if (currentRecorder) await currentRecorder.destroy()
  }

  onUnmounted(() => {
    void cancelRecording()
  })

  return { loading, recording, startRecording, stopRecording, cancelRecording }
}

/** 将消息语音流合并为 MP3 并播放，组件卸载时释放音频资源。 */
export const useMessageToAudio = () => {
  const loading = ref(false)
  const audioUrl = ref('')
  const audioElement = ref<HTMLAudioElement | null>(null)

  const playMessageAudio = async (messageId: string) => {
    if (!messageId || loading.value) return
    if (audioUrl.value) {
      await audioElement.value?.play()
      return
    }

    loading.value = true
    const chunks: BlobPart[] = []
    try {
      await messageToAudio(messageId, ({ event, data }) => {
        if (event !== 'tts_message' || !data.audio) return
        const binary = atob(data.audio)
        const chunk = new Uint8Array(new ArrayBuffer(binary.length))
        for (let index = 0; index < binary.length; index += 1) {
          chunk[index] = binary.charCodeAt(index)
        }
        chunks.push(chunk)
      })
      if (chunks.length === 0) throw new Error('没有收到语音数据')
      audioUrl.value = URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await audioElement.value?.play()
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    audioElement.value?.pause()
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  })

  return { loading, audioUrl, audioElement, playMessageAudio }
}

/** 使用浏览器内置语音合成朗读文本。 */
export const useBrowserSpeech = () => {
  const speaking = ref(false)
  let utterance: SpeechSynthesisUtterance | null = null

  const cancelSpeech = () => {
    if (utterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    utterance = null
    speaking.value = false
  }

  const speakText = (text: string, language = 'zh-CN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('当前浏览器不支持语音朗读')
    }
    const content = text.trim()
    if (!content) return

    cancelSpeech()
    const nextUtterance = new SpeechSynthesisUtterance(content)
    nextUtterance.lang = language
    nextUtterance.onstart = () => {
      speaking.value = true
    }
    nextUtterance.onend = () => {
      if (utterance === nextUtterance) {
        utterance = null
        speaking.value = false
      }
    }
    nextUtterance.onerror = () => {
      if (utterance === nextUtterance) {
        utterance = null
        speaking.value = false
      }
    }
    utterance = nextUtterance
    window.speechSynthesis.speak(nextUtterance)
  }

  onUnmounted(cancelSpeech)

  return { speaking, speakText, cancelSpeech }
}
