<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'

export default defineComponent({
  name: 'SkinsGame',
  props: {
    players: { type: Array, required: true }, // [{ name, email }]
    holes: { type: Number, default: 18 },
    skinValue: { type: Number, default: 1 }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    // scores[playerIdx][holeIdx] = score
    const scores = ref(Array(props.players.length).fill(null).map(() => Array(props.holes).fill('')))
    const calculating = ref(false)
    const error = ref('')
    const results = ref<any>(null)

    function setScore(playerIdx: number, holeIdx: number, value: string) {
      scores.value[playerIdx][holeIdx] = value
    }

    function calculateSkins() {
      calculating.value = true
      error.value = ''
      try {
        // Calculate per-hole winners and carryovers
        const skins: any[] = []
        const winnings: Record<string, number> = {}
        let carryover = 0
        for (let h = 0; h < props.holes; h++) {
          let min = Infinity
          let winners: number[] = []
          for (let p = 0; p < props.players.length; p++) {
            const val = parseInt(scores.value[p][h])
            if (!isNaN(val)) {
              if (val < min) {
                min = val
                winners = [p]
              } else if (val === min) {
                winners.push(p)
              }
            }
          }
          let skin = {
            hole: h + 1,
            winner: null as string | null,
            carryover: false,
            value: props.skinValue + carryover
          }
          if (winners.length === 1) {
            const winnerEmail = props.players[winners[0]].email
            skin.winner = winnerEmail
            winnings[winnerEmail] = (winnings[winnerEmail] || 0) + skin.value
            carryover = 0
          } else {
            skin.carryover = true
            carryover += props.skinValue
          }
          skins.push(skin)
        }
        results.value = { skins, winnings }
        emit('submit', { scores: scores.value, skins, winnings })
      } catch (e: any) {
        error.value = e?.message || 'Calculation error'
      } finally {
        calculating.value = false
      }
    }

    return { scores, setScore, calculateSkins, calculating, error, results }
  }
})
</script>

<template>
  <div class="skins-game">
    <h2>Enter Scores for Skins Game</h2>
    <table class="skins-table">
      <thead>
        <tr>
          <th>Player</th>
          <th v-for="h in holes" :key="h">Hole {{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, pIdx) in players" :key="player.email">
          <td>{{ player.name }}</td>
          <td v-for="h in holes" :key="h">
            <input type="number" min="1" v-model="scores[pIdx][h-1]" @input="setScore(pIdx, h-1, scores[pIdx][h-1])" />
          </td>
        </tr>
      </tbody>
    </table>
    <button @click="calculateSkins" :disabled="calculating">Calculate Skins</button>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="results">
      <h3>Results</h3>
      <table class="skins-results-table">
        <thead>
          <tr>
            <th>Hole</th>
            <th>Winner</th>
            <th>Carryover</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="skin in results.skins" :key="skin.hole">
            <td>{{ skin.hole }}</td>
            <td>{{ skin.winner ? players.find(p => p.email === skin.winner)?.name : 'Carryover' }}</td>
            <td>{{ skin.carryover ? 'Yes' : 'No' }}</td>
            <td>{{ skin.value }}</td>
          </tr>
        </tbody>
      </table>
      <table class="skins-winnings-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Total Winnings</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.email">
            <td>{{ player.name }}</td>
            <td>{{ results.winnings[player.email] || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.skins-game {
  max-width: 1000px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 2rem;
}
.skins-table, .skins-results-table, .skins-winnings-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.skins-table th, .skins-table td, .skins-results-table th, .skins-results-table td, .skins-winnings-table th, .skins-winnings-table td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: center;
}
.error {
  color: #d9534f;
  margin-top: 1rem;
}
</style>
