import { reactive } from 'vue'

export const sessionState = reactive({
  user: null,
})

export const setUser = (user) => {
  sessionState.user = user
}

export const clearUser = () => {
  sessionState.user = null
}
