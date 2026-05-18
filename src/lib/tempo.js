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

export async function buscarTempo(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`
    const r = await fetch(url)
    const d = await r.json()
    const temp   = Math.round(d.current.temperature_2m)
    const codigo = d.current.weather_code
    const descricao = CODIGOS[codigo] || 'tempo variável'
    return { temp, descricao }
  } catch {
    return null
  }
}
