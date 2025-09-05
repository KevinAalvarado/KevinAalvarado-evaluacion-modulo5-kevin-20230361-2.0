import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Navbar({ currentScreen, navigate, user }) {
  // Verificar que navigate esté definido
  const handleNavigate = (screenName) => {
    console.log('Navbar navigate called:', screenName, 'navigate function:', typeof navigate);
    if (typeof navigate === 'function') {
      navigate(screenName);
    } else {
      console.error('Navigate function is not defined in Navbar');
    }
  };

  // Componente para cada item del navbar
  const NavItem = ({ screenName, label, isActive }) => (
    <TouchableOpacity 
      style={[
        styles.navItem,
        isActive && styles.navItemActive
      ]}
      onPress={() => !isActive && handleNavigate(screenName)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.navText,
        isActive && styles.navTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.navbar}>
      {/* Línea sutil superior */}
      <View style={styles.topBorder} />
      
      {/* Items de navegación */}
      <View style={styles.navContainer}>
        <NavItem 
          screenName="Home"
          label="Inicio"
          isActive={currentScreen === 'Home'}
        />
        
        <View style={styles.separator} />
        
        <NavItem 
          screenName="EditProfile"
          label="Perfil"
          isActive={currentScreen === 'EditProfile'}
        />
      </View>
      
      {/* Indicador de usuario discreto */}
      {user && (
        <View style={styles.userIndicator}>
          <View style={styles.userDot} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  navbar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 34, // Safe area
    position: 'relative',
  },
  // Borde superior sutil
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  // Contenedor de navegación
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Items de navegación
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navItemActive: {
    // Sin estilos especiales, solo texto
  },
  navText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '300',
    letterSpacing: 1,
  },
  navTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  // Separador entre items
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  // Indicador de usuario
  userIndicator: {
    position: 'absolute',
    top: 15,
    right: 40,
  },
  userDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
});