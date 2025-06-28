<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useDbUser } from '../composables/useDbUser'

const { isAuthenticated } = useCurrentUser()
const { dbUser, fetchDbUser } = useDbUser()

const achievements = ref<any[]>([])
const loading = ref(true)
const selectedCategory = ref('all')
const showOnlyUnlocked = ref(false)
const error = ref<string | null>(null)

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'scoring', label: '🎯 Scoring' },
  { value: 'games', label: '🎮 Games' },
  { value: 'social', label: '👥 Social' },
  { value: 'milestones', label: '🏆 Milestones' }
]

const filteredAchievements = computed(() => {
  let filtered = achievements.value
  
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter((a: any) => a.category === selectedCategory.value)
  }
  
  if (showOnlyUnlocked.value) {
    filtered = filtered.filter((a: any) => a.unlocked)
  }
  
  // Group by category
  const grouped = filtered.reduce((acc: Record<string, any[]>, achievement: any) => {
    const category = achievement.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(achievement)
    return acc
  }, {} as Record<string, any[]>)
  
  return grouped
})

const userStats = computed(() => {
  const total = achievements.value.length
  const unlocked = achievements.value.filter((a: any) => a.unlocked).length
  const totalPoints = achievements.value
    .filter((a: any) => a.unlocked)
    .reduce((sum: number, a: any) => sum + a.points, 0)
  
  return {
    total,
    unlocked,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    totalPoints
  }
})

async function loadUserAchievements() {
  loading.value = true
  error.value = null
  
  try {
    await fetchDbUser()
    if (!dbUser.value?.id) {
      error.value = 'Unable to load user profile. Please try logging in again.'
      return
    }
    
    const response = await fetch(`/api/users/${dbUser.value.id}/achievements`)
    if (!response.ok) {
      if (response.status === 404) {
        // User has no achievements yet, which is fine
        achievements.value = []
        return
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    achievements.value = data.achievements || []
  } catch (e) {
    // Handle different types of errors gracefully
    if (e instanceof TypeError && e.message.includes('fetch')) {
      error.value = 'Unable to connect to server. Please check your connection.'
    } else {
      error.value = 'Achievement data is temporarily unavailable.'
    }
    console.warn('Achievements temporarily unavailable:', e instanceof Error ? e.message : 'Unknown error')
  } finally {
    loading.value = false
  }
}

function getIconClass(icon: string): string {
  const iconMap: Record<string, string> = {
    trophy: 'fas fa-trophy',
    fire: 'fas fa-fire',
    lightning: 'fas fa-bolt',
    target: 'fas fa-bullseye',
    eye: 'fas fa-eye',
    bird: 'fas fa-dove',
    'arrow-down': 'fas fa-arrow-down',
    users: 'fas fa-users',
    'dollar-sign': 'fas fa-dollar-sign',
    grid: 'fas fa-th',
    calendar: 'fas fa-calendar',
    handshake: 'fas fa-handshake',
    heart: 'fas fa-heart',
    crown: 'fas fa-crown',
    'play-circle': 'fas fa-play-circle',
    'calendar-check': 'fas fa-calendar-check',
    'calendar-x': 'fas fa-calendar-times',
    clover: 'fas fa-leaf',
    'refresh-ccw': 'fas fa-redo'
  }
  return iconMap[icon] || 'fas fa-trophy'
}

function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    scoring: '🎯',
    games: '🎮',
    social: '👥',
    milestones: '🏆'
  }
  return categoryIcons[category] || '🏆'
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  if (isAuthenticated.value) {
    loadUserAchievements()
  }
})
</script>

<template>
  <div class="achievements">
    <div class="container">
      <h1 class="page-title">🏆 Achievements</h1>
      
      <!-- User Stats -->
      <div v-if="!loading && !error" class="stats-overview mb-4">
        <div class="row">
          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.unlocked }}</div>
              <div class="stat-label">Unlocked</div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.percentage }}%</div>
              <div class="stat-label">Complete</div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.totalPoints }}</div>
              <div class="stat-label">Points</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters mb-4">
        <div class="row align-items-end">
          <div class="col-md-6">
            <label class="form-label">Category</label>
            <select v-model="selectedCategory" class="form-select">
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <div class="form-check">
              <input 
                v-model="showOnlyUnlocked" 
                class="form-check-input" 
                type="checkbox" 
                id="showUnlocked"
              >
              <label class="form-check-label" for="showUnlocked">
                Show only unlocked achievements
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading achievements...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-warning d-flex align-items-center">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <div>
          <strong>Heads up!</strong> {{ error }}
          <br>
          <small class="text-muted">Try refreshing the page or check back later.</small>
        </div>
      </div>

      <!-- Achievements by Category -->
      <div v-else class="achievements-container">
        <div 
          v-for="(categoryAchievements, category) in filteredAchievements" 
          :key="category"
          class="category-section mb-4"
        >
          <h3 class="category-title">
            {{ getCategoryIcon(category) }} 
            {{ categories.find(c => c.value === category)?.label || category.charAt(0).toUpperCase() + category.slice(1) }}
            <span class="achievement-count">
              ({{ categoryAchievements.filter((a: any) => a.unlocked).length }}/{{ categoryAchievements.length }})
            </span>
          </h3>
          
          <div class="row">
            <div 
              v-for="achievement in categoryAchievements" 
              :key="achievement.id"
              class="col-lg-6 col-xl-4 mb-3"
            >
              <div class="achievement-card" :class="{ 
                'unlocked': achievement.unlocked,
                'secret': achievement.is_secret && !achievement.unlocked 
              }">
                <div class="achievement-icon">
                  <i :class="getIconClass(achievement.icon)"></i>
                </div>
                <div class="achievement-content">
                  <h5 class="achievement-name">{{ achievement.name }}</h5>
                  <p class="achievement-description">
                    {{ achievement.is_secret && !achievement.unlocked ? '???' : achievement.description }}
                  </p>
                  <div class="achievement-meta">
                    <span class="points">{{ achievement.points }} pts</span>
                    <span v-if="achievement.unlocked" class="unlock-date">
                      Unlocked {{ formatDate(achievement.unlocked_at) }}
                    </span>
                    <span v-else-if="achievement.is_secret" class="secret-badge">Secret</span>
                  </div>
                </div>
                <div v-if="achievement.unlocked" class="unlock-checkmark">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="Object.keys(filteredAchievements).length === 0" class="no-achievements">
          <p>No achievements found matching your filters.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievements {
  min-height: 100vh;
  background: var(--bg-primary, #f8f9fa);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary, #2c3e50);
  font-weight: 700;
}

.stats-overview {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.stat-card {
  text-align: center;
  padding: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #42b983;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.filters {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.filters .form-label {
  color: var(--text-primary);
  font-weight: 600;
}

.category-title {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-weight: 600;
}

.achievement-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: normal;
}

.achievement-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  position: relative;
  height: 100%;
  border: 2px solid var(--border-color);
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.achievement-card.unlocked {
  border-color: #42b983;
}

/* Dark mode specific achievement card styles */
.dark-mode .achievement-card.unlocked {
  background: linear-gradient(135deg, rgba(66, 185, 131, 0.1) 0%, rgba(66, 185, 131, 0.05) 100%);
}

/* Light mode specific achievement card styles */
:not(.dark-mode) .achievement-card.unlocked {
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
}

.achievement-card.secret {
  opacity: 0.7;
  border-color: var(--text-secondary);
}

.achievement-icon {
  text-align: center;
  margin-bottom: 1rem;
}

.achievement-icon i {
  font-size: 2.5rem;
  color: #42b983;
}

.achievement-card.secret .achievement-icon i {
  color: var(--text-secondary);
}

.achievement-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.achievement-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.achievement-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.points {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.unlock-date {
  color: #28a745;
  font-size: 0.8rem;
  font-weight: 500;
}

.secret-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.unlock-checkmark {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #42b983;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.no-achievements {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .achievements {
    padding: 1rem 0;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .achievement-card {
    padding: 1rem;
  }
  
  .achievement-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
