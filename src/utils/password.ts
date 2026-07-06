import JSEncrypt from 'jsencrypt'
import publicKey from '@/assets/public.pem?raw'

export const encryptPassword = (password: string): string => {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)

  const encryptedPassword = encryptor.encrypt(password)
  if (!encryptedPassword) {
    throw new Error('密码加密失败，请刷新页面后重试')
  }

  return encryptedPassword
}
