import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Text } from 'react-native'
import { useAuth } from '../contexts/AuthContext'

import LoginScreen    from '../screens/LoginScreen'
import RegistarScreen from '../screens/RegistarScreen'
import HorariosScreen from '../screens/HorariosScreen'
import MarcacoesScreen from '../screens/MarcacoesScreen'
import PlanosScreen   from '../screens/PlanosScreen'
import PerfilScreen   from '../screens/PerfilScreen'

const Tab   = createBottomTabNavigator()
const Stack = createStackNavigator()

const headerOpts = {
  headerStyle: { backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTintColor: '#f1f5f9',
  headerTitleStyle: { fontWeight: '700' },
}

function Icon({ name, focused }) {
  const icons = { Horários: '🏃', Marcações: '📅', Planos: '📋', Perfil: '👤' }
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOpts,
        tabBarStyle: { backgroundColor: '#020617', borderTopColor: '#1e293b', borderTopWidth: 1 },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#475569',
        tabBarIcon: ({ focused }) => <Icon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Horários"  component={HorariosScreen} />
      <Tab.Screen name="Marcações" component={MarcacoesScreen} />
      <Tab.Screen name="Planos"    component={PlanosScreen} />
      <Tab.Screen name="Perfil"    component={PerfilScreen} />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Registar" component={RegistarScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <NavigationContainer>
      {session ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  )
}
