import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen() {
  // Animaciones sutiles y esenciales
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in suave
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animación sutil de los puntos (continua hasta que el componente se desmonte)
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sin timeout aquí - el AppNavigator controlará cuándo desaparece
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        {/* Logo minimalista */}
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
        </View>
        
        {/* Texto limpio */}
        <Text style={styles.appName}>Profile</Text>
        <Text style={styles.tagline}>Simple & Clean</Text>
        
        {/* Indicador de carga minimalista */}
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.dot,
              { opacity: dotsAnim }
            ]} 
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  // Logo ultraminimalista
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
  },
  // Tipografía limpia
  appName: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 60,
  },
  // Indicador minimalista
  loadingContainer: {
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});