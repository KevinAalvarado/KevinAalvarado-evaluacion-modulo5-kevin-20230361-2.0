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
  // Verificar que navigation esté definido
  console.log('EditProfileScreen navigation prop:', navigation);
  
  // Estados del formulario con los nuevos campos
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    group: '',
    section: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Cargar datos del usuario
  const loadUserData = async () => {
    if (auth.currentUser) {
      try {
        const result = await getUserData(auth.currentUser.uid);
        if (result.success) {
          const userData = {
            name: result.data.name || '',
            specialty: result.data.specialty || '',
            group: result.data.group || '',
            section: result.data.section || ''
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
    
    // Especialidad
    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Especialidad requerida';
    } else if (formData.specialty.trim().length < 3) {
      newErrors.specialty = 'Especialidad muy corta';
    }
    
    // Grupo
    if (!formData.group.trim()) {
      newErrors.group = 'Grupo requerido';
    }
    
    // Sección
    if (!formData.section.trim()) {
      newErrors.section = 'Sección requerida';
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
        specialty: formData.specialty.trim(),
        group: formData.group.trim(),
        section: formData.section.trim()
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

  const isFormValid = Object.values(formData).every(value => value.trim()) && 
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
              label="Especialidad"
              placeholder="Tu especialidad"
              value={formData.specialty}
              onChangeText={(text) => updateField('specialty', text)}
              error={errors.specialty}
            />

            <MinimalInput
              label="Grupo"
              placeholder="Tu grupo"
              value={formData.group}
              onChangeText={(text) => updateField('group', text)}
              error={errors.group}
            />

            <MinimalInput
              label="Sección"
              placeholder="Tu sección"
              value={formData.section}
              onChangeText={(text) => updateField('section', text)}
              error={errors.section}
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