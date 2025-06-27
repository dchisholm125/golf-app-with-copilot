import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface ResponsiveBreakpoints {
  mobile: number
  tablet: number
  desktop: number
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 600,
  tablet: 768,
  desktop: 1024,
}

export function useResponsive(breakpoints: ResponsiveBreakpoints = defaultBreakpoints) {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const windowWidth = ref(0)
  
  function updateResponsiveState() {
    windowWidth.value = window.innerWidth
    isMobile.value = windowWidth.value <= breakpoints.mobile
    isTablet.value = windowWidth.value > breakpoints.mobile && windowWidth.value <= breakpoints.tablet
    isDesktop.value = windowWidth.value > breakpoints.tablet
  }
  
  function handleResize() {
    updateResponsiveState()
  }
  
  onMounted(() => {
    updateResponsiveState()
    window.addEventListener('resize', handleResize)
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    windowWidth,
    updateResponsiveState,
  }
} 