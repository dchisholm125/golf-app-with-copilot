<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'

const { loginWithRedirect } = useAuth0()
</script>

<template>
  <div class="login-container">
    <h2>Login</h2>
    <button @click="() => loginWithRedirect()">Log In with Auth0</button>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4rem;
}
button {
  padding: 0.5rem 1.5rem;
  font-size: 1.1rem;
  border-radius: 6px;
  background: #635dff;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
}
button:hover {
  background: #4b47c3;
}
</style>
