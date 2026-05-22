import * as Location from 'expo-location'

// Geocodificação inversa — coordenadas → endereço
export async function gpsParaEndereco() {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') throw new Error('Permissão de localização negada')

  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
  const { latitude, longitude } = loc.coords

  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=pt-BR`,
    { headers: { 'User-Agent': 'voulapp/1.0' } }
  )
  const d = await r.json()
  const a = d.address || {}

  return {
    lat:         latitude,
    lng:         longitude,
    endereco:    a.road || a.pedestrian || a.path || '',
    numero:      a.house_number || '',
    bairro:      a.suburb || a.neighbourhood || a.quarter || '',
    cidade:      a.city || a.town || a.municipality || '',
    estado:      estadoParaUF(a.state || ''),
    cep:         (a.postcode || '').replace(/\D/g, ''),
    descricao:   d.display_name || '',
  }
}

// Pesquisa de lugares por texto
export async function pesquisarLugares(query) {
  if (!query || query.length < 3) return []
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=br&accept-language=pt-BR`,
    { headers: { 'User-Agent': 'voulapp/1.0' } }
  )
  const resultados = await r.json()
  return resultados.map(res => {
    const a = res.address || {}
    return {
      descricao:   res.display_name,
      endereco:    a.road || a.pedestrian || '',
      numero:      a.house_number || '',
      bairro:      a.suburb || a.neighbourhood || '',
      cidade:      a.city || a.town || a.municipality || '',
      estado:      estadoParaUF(a.state || ''),
      cep:         (a.postcode || '').replace(/\D/g, ''),
      lat:         parseFloat(res.lat),
      lng:         parseFloat(res.lon),
    }
  })
}

function estadoParaUF(estado) {
  const mapa = {
    'Rio de Janeiro': 'RJ', 'São Paulo': 'SP', 'Minas Gerais': 'MG',
    'Bahia': 'BA', 'Paraná': 'PR', 'Rio Grande do Sul': 'RS',
    'Pernambuco': 'PE', 'Ceará': 'CE', 'Pará': 'PA', 'Maranhão': 'MA',
    'Santa Catarina': 'SC', 'Goiás': 'GO', 'Amazonas': 'AM',
    'Espírito Santo': 'ES', 'Mato Grosso': 'MT', 'Rio Grande do Norte': 'RN',
    'Alagoas': 'AL', 'Piauí': 'PI', 'Distrito Federal': 'DF', 'Mato Grosso do Sul': 'MS',
    'Sergipe': 'SE', 'Rondônia': 'RO', 'Tocantins': 'TO', 'Acre': 'AC',
    'Amapá': 'AP', 'Roraima': 'RR', 'Paraíba': 'PB',
  }
  return mapa[estado] || estado.slice(0,2).toUpperCase()
}
