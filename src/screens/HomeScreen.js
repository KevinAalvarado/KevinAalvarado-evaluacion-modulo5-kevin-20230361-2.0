import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  RefreshControl 
} from 'react-native';
import { auth } from '../config/firebase';
import { getUserData, logoutUser } from '../utils/auth';

export default function HomeScreen({ navigation }) {
  console.log('HomeScreen mounted with navigation:', navigation);
  
  // Estados
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('HomeScreen useEffect triggered');
    loadUserData();
  }, []);

  // Función para cargar datos del usuario
  const loadUserData = async () => {
    console.log('Loading user data...');
    if (auth.currentUser) {
      try {
        const result = await getUserData(auth.currentUser.uid);
        if (result.success) {
          setUserData(result.data);
          console.log('User data loaded:', result.data.name);
        } else {
          Alert.alert('Error', 'No se pudieron cargar los datos');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Ocurrió un error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Función para navegar a editar perfil
  const navigateToEditProfile = () => {
    console.log('Navigate to EditProfile called');
    console.log('Navigation object:', navigation);
    console.log('Navigate function type:', typeof navigation?.navigate);
    
    if (navigation && navigation.navigate) {
      console.log('Calling navigation.navigate');
      navigation.navigate('EditProfile');
    } else {
      console.error('Navigation or navigate function not available');
      Alert.alert('Error', 'No se puede navegar');
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            try {
              const result = await logoutUser();
              if (result.success) {
                Alert.alert('Sesión cerrada', 'Hasta pronto');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Algo salió mal');
            }
          },
        },
      ]
    );
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  // Render principal
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#000000"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>
            Hola, {userData?.name?.split(' ')[0] || 'Usuario'}
          </Text>
        </View>

        {/* Información del perfil */}
        {userData && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Información</Text>
            
            <View style={styles.profileCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>{userData.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Título universitario</Text>
                <Text style={styles.infoValue}>{userData.university_title}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Año de graduación</Text>
                <Text style={styles.infoValue}>{userData.graduation_year}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          {/* Botón Editar perfil */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={navigateToEditProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Editar perfil</Text>
          </TouchableOpacity>
          
          {/* Botón Cerrar sesión */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 120,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '300',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 0.5,
  },
  // Secciones
  sectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  profileSection: {
    marginBottom: 50,
  },
  // Tarjeta de perfil
  profileCard: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '300',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  // Acciones
  actionsSection: {
    marginBottom: 40,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  actionButtonDanger: {
    borderColor: '#ff4444',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 1,
  },
  actionButtonTextDanger: {
    color: '#ff4444',
  },
});