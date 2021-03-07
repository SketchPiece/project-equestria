import ConfigManager from '../core/ConfigManager'

export class AuthService {
  static async login(username, password) {
    try {
      const { data } = await ConfigManager.api.post('/auth/login', {
        username,
        password
      })
      ConfigManager.setAuthToken(data.token)
      ConfigManager.save()
    } catch (e) {
      throw e
    }
  }
}
