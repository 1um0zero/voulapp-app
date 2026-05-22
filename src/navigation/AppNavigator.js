import { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../lib/theme'
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

  const tabBarH = 54 + Math.max(insets.bottom, 8)

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...headerOpts,
          headerShown: true,
          headerTitle: () => null,
          headerLeft:  () => null,
          headerRight: () => (
            <TouchableOpacity onPress={() => setVozVisivel(true)} style={s.headerMic}>
              <Ionicons name="mic" size={20} color={colors.accent} />
            </TouchableOpacity>
          ),
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            height: tabBarH,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Aulas:     focused ? 'calendar' : 'calendar-outline',
              Marcações: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
              Equipa:    focused ? 'people' : 'people-outline',
              Planos:    focused ? 'layers' : 'layers-outline',
              Perfil:    focused ? 'person-circle' : 'person-circle-outline',
              '':        'log-out-outline',
            }
            return <Ionicons name={icons[route.name] || 'log-out-outline'} size={22} color={color} />
          },
        })}
      >
        <Tab.Screen name="Aulas"     component={HorariosScreen} />
        <Tab.Screen name="Marcações" component={MarcacoesScreen} />
        <Tab.Screen name="Equipa"    component={EquipaScreen} />
        <Tab.Screen name="Planos"    component={PlanosScreen} />
        <Tab.Screen name="Perfil"    component={PerfilScreen} />
        {/* Sair — último item no rodapé, à direita do Perfil */}
        <Tab.Screen
          name="Sair"
          component={() => null}
          listeners={{ tabPress: e => { e.preventDefault(); confirmarSair() } }}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="log-out-outline" size={22} color={colors.red} />,
            tabBarLabel: 'Sair',
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600', color: colors.red },
            headerShown: false,
          }}
        />
      </Tab.Navigator>

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
  headerMic: { marginRight: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
})
