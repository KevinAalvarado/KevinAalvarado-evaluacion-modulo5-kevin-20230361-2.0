import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import { auth } from '../config/firebase';
import { getUserData, updateUserData } from '../utils/auth';

// Componente de input minimalista
const MinimalInput = ({ 
  label,
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = 'default',
  error
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        error && styles.inputError
      ]}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={keyboardType === "numeric" ? "none" : "sentences"}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Componente de botón minimalista
const MinimalButton = ({ title, onPress, loading = false, disabled = false, variant = 'primary' }) => (
  <TouchableOpacity 
    style={[
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      disabled && styles.buttonDisabled
    ]} 
    onPress={onPress}
    disabled={loading || disabled}
    activeOpacity={0.8}
  >
    <Text style={[
      styles.buttonText,
      variant === 'secondary' && styles.buttonTextSecondary
    ]}>
      {loading ? 'Guardando...' : title}
    </Text>
  </TouchableOpacity>
);

export default function EditProfileScreen({ navigation }) {
  console.log('EditProfileScreen navigation prop:', navigation);
  
  // Estados del formulario con los campos correctos
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university_title: '',
    graduation_year: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Cargar datos del usuario - CORREGIDO PARA USAR DATOS DEL NAVIGATOR PRIMERO
  const loadUserData = async () => {
    console.log('Loading user data...');
    console.log('Navigation userData:', navigation?.userData);
    
    // Primero intenta usar los datos que ya tiene el Navigator
    if (navigation && navigation.userData) {
      console.log('Using data from Navigator');
      const userData = {
        name: navigation.userData.name || '',
        email: navigation.userData.email || '',
        university_title: navigation.userData.university_title || '',
        graduation_year: navigation.userData.graduation_year?.toString() || ''
      };
      setFormData(userData);
      setOriginalData(userData);
      setIsLoading(false);
      return;
    }

    // Si no hay datos en Navigator, cargar desde Firebase
    console.log('No data in Navigator, loading from Firebase...');
    if (auth.currentUser) {
      try {
        const result = await getUserData(auth.currentUser.uid);
        if (result.success) {
          const userData = {
            name: result.data.name || '',
            email: result.data.email || '',
            university_title: result.data.university_title || '',
            graduation_year: result.data.graduation_year?.toString() || ''
          };
          setFormData(userData);
          setOriginalData(userData);
        } else {
          Alert.alert('Error', 'No se pudieron cargar los datos');
        }
      } catch (error) {
        Alert.alert('Error', 'Ocurrió un error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Actualizar campos
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Verificar cambios
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  // Función segura para navegar hacia atrás
  const handleGoBack = () => {
    console.log('Going back, navigation:', navigation);
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    } else {
      console.error('Navigation goBack not available in EditProfileScreen');
    }
  };

  // Validaciones básicas
  const validateForm = () => {
    const newErrors = {};
    
    // Nombre
    if (!formData.name.trim()) {
      newErrors.name = 'Nombre requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nombre muy corto';
    }
    
    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Título universitario
    if (!formData.university_title.trim()) {
      newErrors.university_title = 'Título universitario requerido';
    } else if (formData.university_title.trim().length < 3) {
      newErrors.university_title = 'Título universitario muy corto';
    }
    
    // Año de graduación
    if (!formData.graduation_year.trim()) {
      newErrors.graduation_year = 'Año de graduación requerido';
    } else {
      const year = parseInt(formData.graduation_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear + 10) {
        newErrors.graduation_year = `Año debe estar entre 1950 y ${currentYear + 10}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar actualización
  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert('Errores en el formulario', 'Corrige los errores antes de continuar');
      return;
    }

    if (!hasChanges()) {
      Alert.alert('Sin cambios', 'No se detectaron cambios');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        university_title: formData.university_title.trim(),
        graduation_year: parseInt(formData.graduation_year)
      };

      const result = await updateUserData(auth.currentUser.uid, updateData);
      
      if (result.success) {
        Alert.alert(
          'Perfil actualizado', 
          'Cambios guardados correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                setOriginalData(formData);
                handleGoBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Algo salió mal');
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            onPress: handleGoBack,
          },
        ]
      );
    } else {
      handleGoBack();
    }
  };

  const isFormValid = Object.values(formData).every(value => value.toString().trim()) && 
                     Object.keys(errors).length === 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header con navegación */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>Editar perfil</Text>
            <Text style={styles.subtitle}>Actualiza tu información</Text>
          </View>

          {/* Indicador de cambios simple */}
          {hasChanges() && (
            <View style={styles.changesIndicator}>
              <Text style={styles.changesText}>Hay cambios sin guardar</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.form}>
            <MinimalInput
              label="Nombre"
              placeholder="Tu nombre completo"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              error={errors.name}
            />

            <MinimalInput
              label="Email"
              placeholder="Tu email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              error={errors.email}
            />

            <MinimalInput
              label="Título universitario"
              placeholder="Tu título universitario"
              value={formData.university_title}
              onChangeText={(text) => updateField('university_title', text)}
              error={errors.university_title}
            />

            <MinimalInput
              label="Año de graduación"
              placeholder="Tu año de graduación"
              value={formData.graduation_year}
              onChangeText={(text) => updateField('graduation_year', text)}
              keyboardType="numeric"
              error={errors.graduation_year}
            />

            {/* Botones */}
            <View style={styles.buttonGroup}>
              <MinimalButton
                title="Guardar cambios"
                onPress={handleUpdate}
                loading={isSaving}
                disabled={!isFormValid || !hasChanges()}
              />

              <MinimalButton
                title="Cancelar"
                onPress={handleCancel}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
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
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 30,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '300',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '300',
  },
  // Indicador de cambios
  changesIndicator: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
  },
  changesText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '300',
  },
  // Formulario
  form: {
    width: '100%',
  },
  // Inputs
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    fontWeight: '300',
  },
  inputError: {
    borderBottomColor: '#ff4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 8,
    fontWeight: '300',
  },
  // Botones
  buttonGroup: {
    marginTop: 40,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 0,
    marginBottom: 16,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000000',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 1,
  },
  buttonTextSecondary: {
    color: '#000000',
  },
});