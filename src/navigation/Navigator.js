import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

import SplashScreen from '../screens/SplashScreen';
import Navbar from '../components/Navbar';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

export default function AppNavigator() {
  // Estados principales
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); // Nuevo estado
  const [currentScreen, setCurrentScreen] = useState('Register');
  const [screenHistory, setScreenHistory] = useState(['Register']);

  useEffect(() => {
    // Listener para cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      console.log('Auth state changed:', authenticatedUser ? 'User logged in' : 'User logged out');
      setUser(authenticatedUser);
      setAuthChecked(true); // Marcar que ya verificamos la auth
      
      if (authenticatedUser) {
        // Usuario autenticado - ir a Home
        navigateToScreen('Home', true);
      } else {
        // Usuario no autenticado - ir a Login por defecto
        navigateToScreen('Login', true);
      }
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

  // Mostrar splash screen mientras carga
  if (loading) {
    return <SplashScreen />;
  }

  // Función para renderizar la pantalla actual
  const renderScreen = () => {
    // Props de navegación que se pasan a todas las pantallas
    const navigationProps = { 
      navigation: { 
        navigate: navigate, // Asegurar que navigate esté definido
        goBack: goBack,
        currentScreen: currentScreen,
        canGoBack: screenHistory.length > 1,
        user: user 
      } 
    };
    
    console.log('Rendering screen:', currentScreen, 'User:', user ? 'logged in' : 'logged out');
    console.log('Navigation props being passed:', Object.keys(navigationProps.navigation));
    
    // Renderizar pantalla según el estado actual
    switch (currentScreen) {
      case 'Register':
        return <RegisterScreen {...navigationProps} />;
      
      case 'Login':
        return <LoginScreen {...navigationProps} />;
      
      case 'Home':
        return user ? (
          <HomeScreen {...navigationProps} />
        ) : (
          <LoginScreen {...navigationProps} />
        );
      
      case 'EditProfile':
        return user ? (
          <EditProfileScreen {...navigationProps} />
        ) : (
          <LoginScreen {...navigationProps} />
        );
      
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
      
      {/* Mostrar navbar solo si el usuario está autenticado */}
      {user && (
        <Navbar 
          currentScreen={currentScreen} 
          navigate={navigate} // Asegurar que navigate esté pasado
          user={user}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  }
});