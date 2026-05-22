import { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { colors, gradients } from '../lib/theme'
import VozModal from '../components/VozModal'
import { useLocalStorage } from '../lib/useLocalStorage'

import LoginScreen     from '../screens/LoginScreen'
import RegistarScreen  from '../screens/RegistarScreen'
import WelcomeScreen   from '../screens/WelcomeScreen'
import BiometriaScreen from '../screens/BiometriaScreen'
import HorariosScreen  from '../screens/HorariosScreen'
import EquipaScreen    from '../screens/EquipaScreen'
import MarcacoesScreen from '../screens/MarcacoesScreen'
import PlanosScreen    from '../screens/PlanosScreen'
import PerfilScreen    from '../screens/PerfilScreen'

const Tab   = createBottomTabNavigator()
const Stack = createStackNavigator()

const headerOpts = {
  headerStyle: { backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0, shadowOpacity: 0 },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
  headerBackTitleVisible: false,
}

function TabNavigator() {
  const { sair } = useAuth()
  const insets = useSafeAreaInsets()
  const [vozVisivel, setVozVisivel] = useState(false)
  const [localId] = useLocalStorage('local_id', '')
  const [data] = useState(new Date().toISOString().split('T')[0])

  const confirmarSair = () => Alert.alert('Sair', 'Tens a certeza?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: sair }
  ])

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...headerOpts,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            height: 54 + Math.max(insets.bottom, 8),
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Aulas:     focused ? 'calendar' : 'calendar-outline',
              Marcações: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
              Equipa:    focused ? 'people' : 'people-outline',
              Planos:    focused ? 'layers' : 'layers-outline',
              Perfil:    focused ? 'person-circle' : 'person-circle-outline',
            }
            return <Ionicons name={icons[route.name]} size={24} color={color} />
          },
        })}
      >
        <Tab.Screen name="Aulas"     component={HorariosScreen} />
        <Tab.Screen name="Marcações" component={MarcacoesScreen} />
        <Tab.Screen name="Equipa"    component={EquipaScreen} />
        <Tab.Screen name="Planos"    component={PlanosScreen} />
        <Tab.Screen name="Perfil"    component={PerfilScreen} />
      </Tab.Navigator>

      {/* Botões persistentes — aparecem em todos os ecrãs */}
      <View style={[s.floatingBar, { bottom: 54 + Math.max(insets.bottom, 8) + 12 }]}>
        {/* Microfone global — inclui "fui" para sair */}
        <TouchableOpacity style={s.fabMic} onPress={() => setVozVisivel(true)} activeOpacity={0.85}>
          <Ionicons name="mic" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={s.fabSair} onPress={confirmarSair} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.red} />
        </TouchableOpacity>
      </View>

      <VozModal
        visivel={vozVisivel}
        onFechar={() => setVozVisivel(false)}
        localId={localId}
        data={data}
        onConfirmar={async (horario, dataAula) => {
          const { api } = require('../lib/api')
          await api.post('/marcacoes', { horario_id: horario.id, data: dataAula })
        }}
      />
    </View>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome"  component={WelcomeScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Registar" component={RegistarScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { session, loading, bloqueado } = useAuth()
  if (loading) return null

  return (
    <NavigationContainer>
      {session && bloqueado
        ? <BiometriaScreen />
        : session
          ? <TabNavigator />
          : <AuthStack />
      }
    </NavigationContainer>
  )
}

const s = StyleSheet.create({
  floatingBar: { position: 'absolute', right: 16, flexDirection: 'column', gap: 10, alignItems: 'center' },
  fabMic:      { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabSair:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.red + '40', alignItems: 'center', justifyContent: 'center' },
})
