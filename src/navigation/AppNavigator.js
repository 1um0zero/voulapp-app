import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../lib/theme'

import LoginScreen     from '../screens/LoginScreen'
import RegistarScreen  from '../screens/RegistarScreen'
import WelcomeScreen   from '../screens/WelcomeScreen'
import HorariosScreen  from '../screens/HorariosScreen'
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOpts,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Aulas:     focused ? 'calendar' : 'calendar-outline',
            Marcações: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            Planos:    focused ? 'layers' : 'layers-outline',
            Perfil:    focused ? 'person-circle' : 'person-circle-outline',
          }
          return <Ionicons name={icons[route.name]} size={24} color={color} />
        },
      })}
    >
      <Tab.Screen name="Aulas"     component={HorariosScreen} />
      <Tab.Screen name="Marcações" component={MarcacoesScreen} />
      <Tab.Screen name="Planos"    component={PlanosScreen} />
      <Tab.Screen name="Perfil"    component={PerfilScreen} />
    </Tab.Navigator>
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
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <NavigationContainer>
      {session ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  )
}
