import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserData } from '../utils/auth';

import SplashScreen from '../screens/SplashScreen';
import Navbar from '../components/Navbar';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

export default function AppNavigator() {
  // Estados principales
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Register');
  const [screenHistory, setScreenHistory] = useState(['Register']);

  useEffect(() => {
// En Navigator.js, modifica el onAuthStateChanged:
const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
  console.log('🔥 AUTH STATE CHANGED:');
  console.log('  - User:', authenticatedUser ? 'LOGGED IN' : 'LOGGED OUT');
  console.log('  - UID:', authenticatedUser?.uid);
  
  setUser(authenticatedUser);
  
  if (authenticatedUser) {
    console.log('📱 Loading user data for:', authenticatedUser.uid);
    
    // Retry lógico para nuevos usuarios
    const loadWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Attempt ${i + 1} to load user data...`);
          const result = await getUserData(authenticatedUser.uid);
          
          if (result.success) {
            console.log('📊 User data result: SUCCESS');
            console.log('✅ Navigating to Home...');
            setUserData(result.data);
            setUserDataLoaded(true);
            navigateToScreen('Home', true);
            return;
          } else if (i < retries - 1) {
            console.log(`Attempt ${i + 1} failed, retrying in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log(`Attempt ${i + 1} error:`, error);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Si todos los intentos fallan
      console.log('❌ All attempts failed');
      setUserDataLoaded(false);
      navigateToScreen('Login', true);
    };
    
    await loadWithRetry();
  } else {
    setUserData(null);
    setUserDataLoaded(false);
    navigateToScreen('Login', true);
  }
  
  setAuthChecked(true);
});

    // Cleanup del listener
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Solo ocultar loading después de que auth esté verificado Y después de 4 segundos mínimo
    if (authChecked) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 4000); // 4 segundos mínimo para splash
      
      return () => clearTimeout(timer);
    }
  }, [authChecked]);

  useEffect(() => {
    // Manejar botón de retroceso en Android
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [currentScreen, screenHistory]);

  // Función principal para navegar entre pantallas
  const navigate = (screenName) => {
    console.log('Navigate called with:', screenName);
    navigateToScreen(screenName, false);
  };

  // Función interna para manejar navegación
  const navigateToScreen = (screenName, resetHistory = false) => {
    console.log('Navigating to:', screenName, 'Reset history:', resetHistory);
    
    if (screenName === currentScreen && !resetHistory) {
      console.log('Already on screen:', screenName);
      return; // Evitar navegación redundante
    }

    if (resetHistory) {
      // Resetear historial (usado en cambios de auth)
      setScreenHistory([screenName]);
    } else {
      // Agregar al historial
      setScreenHistory(prev => [...prev, screenName]);
    }
    
    setCurrentScreen(screenName);
  };

  // Función para retroceder
  const goBack = () => {
    console.log('GoBack called, current history:', screenHistory);
    
    if (screenHistory.length > 1) {
      // Hay historial - retroceder
      const newHistory = [...screenHistory];
      newHistory.pop(); // Remover pantalla actual
      const previousScreen = newHistory[newHistory.length - 1];
      
      setScreenHistory(newHistory);
      setCurrentScreen(previousScreen);
      console.log('Going back to:', previousScreen);
    } else {
      // No hay historial - ir a pantalla principal
      const defaultScreen = user ? 'Home' : 'Login';
      navigateToScreen(defaultScreen, true);
      console.log('No history, going to default:', defaultScreen);
    }
  };

  // Manejar botón de retroceso de Android
  const handleBackPress = () => {
    console.log('Hardware back pressed on:', currentScreen);
    
    if (currentScreen === 'Home' || currentScreen === 'Login' || currentScreen === 'Register') {
      // Pantallas principales - mostrar confirmación de salida
      Alert.alert(
        'Salir de la aplicación',
        '¿Estás seguro que quieres salir?',
        [
          {
            text: 'Cancelar',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Salir',
            onPress: () => BackHandler.exitApp(),
          },
        ]
      );
      return true; // Prevenir comportamiento por defecto
    } else {
      // Otras pantallas - retroceder normalmente
      goBack();
      return true;
    }
  };

  // Función para refrescar datos del usuario (para usar desde las pantallas)
  const refreshUserData = async () => {
    if (user) {
      console.log('Refreshing user data...');
      try {
        const result = await getUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
          return result.data;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
    return null;
  };

  // Mostrar splash screen mientras carga
  if (loading) {
    return <SplashScreen />;
  }

  // Función para renderizar la pantalla actual
  const renderScreen = () => {
    // Props de navegación que se pasan a todas las pantallas
    const navigationProps = { 
      navigation: { 
        navigate: navigate,
        goBack: goBack,
        currentScreen: currentScreen,
        canGoBack: screenHistory.length > 1,
        user: user,
        userData: userData, // Pasar datos del usuario
        refreshUserData: refreshUserData // Función para refrescar datos
      } 
    };
    
    console.log('Rendering screen:', currentScreen, 'User:', user ? 'logged in' : 'logged out', 'Data loaded:', userDataLoaded);
    
    // Renderizar pantalla según el estado actual
    switch (currentScreen) {
      case 'Register':
        return <RegisterScreen {...navigationProps} />;
      
      case 'Login':
        return <LoginScreen {...navigationProps} />;
      
      case 'Home':
        if (user) {
          // Si el usuario está autenticado pero los datos aún no cargan
          if (!userDataLoaded) {
            return (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                  <Text style={styles.loadingText}>Cargando perfil...</Text>
                  <Text style={styles.loadingSubtext}>Obteniendo tus datos</Text>
                </View>
              </View>
            );
          }
          // Usuario y datos cargados - mostrar Home
          return <HomeScreen {...navigationProps} />;
        } else {
          // No hay usuario - volver al login
          return <LoginScreen {...navigationProps} />;
        }
      
      case 'EditProfile':
        if (user && userDataLoaded) {
          return <EditProfileScreen {...navigationProps} />;
        } else if (user && !userDataLoaded) {
          // Usuario autenticado pero datos no cargados
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <Text style={styles.loadingText}>Cargando datos...</Text>
              </View>
            </View>
          );
        } else {
          // No hay usuario - volver al login
          return <LoginScreen {...navigationProps} />;
        }
      
      default:
        // Pantalla por defecto
        console.log('Unknown screen, defaulting to Login');
        return <LoginScreen {...navigationProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Renderizar pantalla actual */}
      {renderScreen()}
      
      {/* Mostrar navbar solo si el usuario está autenticado Y los datos están cargados */}
      {user && userDataLoaded && (
        <Navbar 
          currentScreen={currentScreen} 
          navigate={navigate}
          user={user}
          userData={userData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  // Estilos para pantalla de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '300',
  },
});