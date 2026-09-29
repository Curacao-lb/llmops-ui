import Recorder from 'js-audio-recorder'
import request from '@/utils/request'
import type { BaseResponse } from '@/models/base'

export type AudioToTextResponse = BaseResponse<{ text: string }>

export type AudioRecorderOptions = {
  sampleRate?: number
  numChannels?: number
  sampleBits?: number
}

/** 创建单声道 WAV 录音器，生成的文件可直接提交到语音转文字接口。 */
export const createAudioRecorder = (options: AudioRecorderOptions = {}) => {
  return new Recorder({
    sampleRate: options.sampleRate ?? 16000,
    numChannels: options.numChannels ?? 1,
    sampleBits: options.sampleBits ?? 16,
  })
}

/** 将录音器当前录音转换成 WAV 文件。 */
export const getAudioRecorderFile = (
  recorder: Recorder,
  filename = 'recording.wav',
): File => {
  const blob = recorder.getWAVBlob() as Blob
  return new File([blob], filename.endsWith('.wav') ? filename : `${filename}.wav`, {
    type: 'audio/wav',
  })
}

/** 将录音文件转换成文本。后端要求传入应用 ID 和 WAV/WebM 音频文件。 */
export const audioToText = (appId: string, file: File): Promise<AudioToTextResponse> => {
  const formData = new FormData()
  formData.append('app_id', appId)
  formData.append('file', file)

  return request.post<AudioToTextResponse>('/audio/audio-to-text', formData)
}

export type MessageToAudioEvent = {
  event: string
  data: {
    conversation_id: string
    message_id: string
    audio: string
  }
}

/** 将会话消息转换为流式音频，onData 会收到 tts_message / tts_end 事件。 */
export const messageToAudio = (
  messageId: string,
  onData: (event: MessageToAudioEvent) => void,
) => {
  return request.ssePost(
    '/audio/message-to-audio',
    { body: { message_id: messageId } },
    (event) => onData(event as MessageToAudioEvent),
  )
}
