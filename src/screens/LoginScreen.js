import React, { useState } from 'react';
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
import { loginUser } from '../utils/auth';

// Componente de input minimalista con toggle de contraseña
const MinimalInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  error,
  showPasswordToggle = false,
  onTogglePassword
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputWrapper}>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          showPasswordToggle && styles.inputWithToggle
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {showPasswordToggle && (
        <TouchableOpacity 
          style={styles.passwordToggle}
          onPress={onTogglePassword}
          activeOpacity={0.7}
        >
          <Text style={styles.passwordToggleText}>
            {secureTextEntry ? 'Ver' : 'Ocultar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
      {loading ? 'Cargando...' : title}
    </Text>
  </TouchableOpacity>
);

export default function LoginScreen({ navigation }) {
  // Verificar que navigation esté definido
  console.log('LoginScreen navigation prop:', navigation);
  
  // Estados simples del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Función para actualizar campos
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Función segura para navegar
  const handleNavigateToRegister = () => {
    console.log('Navigating to Register, navigation:', navigation);
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Register');
    } else {
      console.error('Navigation not available in LoginScreen');
    }
  };

  // Validaciones básicas
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Contraseña requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar inicio de sesión
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = await loginUser(formData.email.trim(), formData.password);
      
      if (result.success) {
        Alert.alert('Éxito', 'Sesión iniciada correctamente');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Algo salió mal');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password && Object.keys(errors).length === 0;

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
          {/* Header minimalista */}
          <View style={styles.header}>
            <View style={styles.logoMini} />
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Accede a tu cuenta</Text>
          </View>

          {/* Formulario limpio */}
          <View style={styles.form}>
            <MinimalInput
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              error={errors.email}
            />

            <MinimalInput
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={!showPassword}
              error={errors.password}
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <MinimalButton
              title="Entrar"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!isFormValid}
            />

            {/* Link simple */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={handleNavigateToRegister}>
                <Text style={styles.link}>Regístrate</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  // Header minimalista
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    marginBottom: 30,
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
  // Formulario
  form: {
    width: '100%',
  },
  // Inputs minimalistas
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    fontWeight: '300',
  },
  inputWithToggle: {
    paddingRight: 60, // Espacio para el botón
  },
  inputError: {
    borderBottomColor: '#ff4444',
  },
  // Toggle de contraseña
  passwordToggle: {
    position: 'absolute',
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 8,
    fontWeight: '300',
  },
  // Botones minimalistas
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 0,
    marginTop: 20,
    marginBottom: 30,
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
  // Link simple
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '300',
  },
  link: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});