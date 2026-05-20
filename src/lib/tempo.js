// Open-Meteo — gratuito, sem API key
const CODIGOS = {
  0:  'céu limpo',
  1:  'maioritariamente limpo', 2: 'parcialmente nublado', 3: 'nublado',
  45: 'nevoeiro', 48: 'nevoeiro com gelo',
  51: 'chuva fraca', 53: 'chuva moderada', 55: 'chuva forte',
  61: 'chuva', 63: 'chuva moderada', 65: 'chuva forte',
  71: 'neve fraca', 73: 'neve', 75: 'neve forte',
  80: 'aguaceiros', 81: 'aguaceiros moderados', 82: 'aguaceiros fortes',
  95: 'trovoada', 99: 'trovoada com granizo',
}

const ICONES = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 99: '⛈️',
}

export function iconeMeteo(codigo) {
  return ICONES[codigo] || '🌡️'
}

export async function buscarTempo(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`
    const r = await fetch(url)
    const d = await r.json()
    const temp      = Math.round(d.current.temperature_2m)
    const codigo    = d.current.weather_code
    const descricao = CODIGOS[codigo] || 'tempo variável'
    const icone     = iconeMeteo(codigo)
    return { temp, descricao, icone }
  } catch { return null }
}

// Busca previsão horária para manhã (9h) e tarde (15h) de datas futuras
export async function buscarPrevisaoDias(lat, lng, datas) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code&timezone=America%2FSao_Paulo&forecast_days=7`
    const r = await fetch(url)
    const d = await r.json()
    const horas   = d.hourly.time          // ["2026-05-20T00:00", ...]
    const temps   = d.hourly.temperature_2m
    const codigos = d.hourly.weather_code
    const previsao = {}
    for (const data of datas) {
      const idxManha  = horas.findIndex(h => h === `${data}T09:00`)
      const idxTarde  = horas.findIndex(h => h === `${data}T15:00`)
      previsao[data] = {
        manha: idxManha  >= 0 ? { temp: Math.round(temps[idxManha]),  icone: iconeMeteo(codigos[idxManha])  } : null,
        tarde: idxTarde  >= 0 ? { temp: Math.round(temps[idxTarde]),  icone: iconeMeteo(codigos[idxTarde])  } : null,
      }
    }
    return previsao
  } catch { return {} }
}
