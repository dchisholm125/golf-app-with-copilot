import { ref, watch } from 'vue'

// Create a reactive reference for dark mode state
const isDarkMode = ref(true) // Default to dark mode

// Flag to track if we've initialized
let isInitialized = false

// Function to apply dark mode to the document
function applyDarkMode(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark-mode')
    document.body.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
    document.body.classList.remove('dark-mode')
  }
}

// Function to toggle dark mode
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  applyDarkMode(isDarkMode.value)
}

// Function to set dark mode explicitly
function setDarkMode(dark: boolean) {
  isDarkMode.value = dark
  localStorage.setItem('darkMode', dark.toString())
  applyDarkMode(dark)
}

// Function to initialize dark mode (to be called from components)
function initializeDarkMode() {
  if (isInitialized) return
  
  // Check localStorage for saved preference, default to dark mode
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    isDarkMode.value = saved === 'true'
  } else {
    // No saved preference, default to dark mode
    isDarkMode.value = true
    localStorage.setItem('darkMode', 'true')
  }
  
  // Apply the initial theme
  applyDarkMode(isDarkMode.value)
  isInitialized = true
}

// Watch for changes and apply them
watch(isDarkMode, (newValue) => {
  applyDarkMode(newValue)
})

export function useDarkMode() {
  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    initializeDarkMode,
  }
} 