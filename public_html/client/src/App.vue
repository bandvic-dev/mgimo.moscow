<template>
  <div class="container">
    <h1>Messenger</h1>

    <!-- AUTH BLOCK -->
    <div v-if="!token">
      <h2>Register</h2>
      <input v-model="registerUsername" placeholder="Username" />
      <input v-model="registerPassword" type="password" placeholder="Password" />
      <button @click="register">Register</button>

      <h2>Login</h2>
      <input v-model="loginUsername" placeholder="Username" />
      <input v-model="loginPassword" type="password" placeholder="Password" />
      <button @click="login">Login</button>
    </div>

    <!-- CHAT BLOCK -->
    <div v-else>
      <p>Logged in as: {{ currentUser }}</p>
      <button @click="logout">Logout</button>

      <div class="chat">
        <div v-for="msg in messages" :key="msg.id" class="message">
          <b>{{ msg.username }}:</b> {{ msg.text }}
        </div>
      </div>

      <input v-model="newMessage" placeholder="Type message..." />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from './api.js'

// ===== STATE =====

const token = ref(localStorage.getItem('token'))
const currentUser = ref(localStorage.getItem('username'))

const registerUsername = ref('')
const registerPassword = ref('')

const loginUsername = ref('admin')
const loginPassword = ref('admin31')

const messages = ref([])
const newMessage = ref('')

let intervalId = null

// ===== METHODS =====

const register = async () => {
  try {    
    await api.post('/register', {
      username: registerUsername.value,
      password: registerPassword.value,
    })

    alert('Registered!')
    registerUsername.value = ''
    registerPassword.value = ''
  } catch (err) {
    console.error(err)
    alert('Error registering')
  }
}

const login = async () => {
  try {
    const res = await api.post('/login', {
      username: loginUsername.value,
      password: loginPassword.value,
    })

    token.value = res.data.token
    currentUser.value = loginUsername.value

    localStorage.setItem('token', token.value)
    localStorage.setItem('username', currentUser.value)

    await fetchMessages()
    startPolling()
  } catch (err) {
    alert('Login failed')
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')

  token.value = null
  currentUser.value = null

  stopPolling()
}

const fetchMessages = async () => {
  const token = localStorage.getItem("token")

  try {
    const res = await api.get("/messages", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    messages.value = res.data
    console.log("Messages fetched", res.data)
  } catch (err) {
    console.error("Error fetching messages", err)
  }
}

const sendMessage = async () => {
  if (!newMessage.value) return

  try {
    await api.post(
      '/messages',
      { text: newMessage.value },
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    )

    newMessage.value = ''
    await fetchMessages()
  } catch (err) {
    console.log('Error sending message')
  }
}

const startPolling = () => {
  stopPolling()
  intervalId = setInterval(fetchMessages, 3000)
}

const stopPolling = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// ===== LIFECYCLE =====

onMounted(() => {
  if (token.value) {
    fetchMessages()
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style>
.container {
  max-width: 600px;
  margin: 40px auto;
  font-family: Arial;
}

.chat {
  border: 1px solid #ccc;
  padding: 10px;
  height: 300px;
  overflow-y: scroll;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 5px;
}
</style>
