import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Configuración de Firebase para usar con Fetch API
const FIREBASE_CONFIG = {
  projectId: 'evaluacion-modulo5-kev20230361',
  apiKey: 'AIzaSyBawJxlcs4H70EmR3-gWTj7lgAUHkWnwQk'
};

// URL base para Firestore REST API
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Función para manejar errores de Firebase
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Correo electrónico inválido';
    case 'auth/user-not-found':
      return 'Usuario no encontrado';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    default:
      return error.message || 'Ha ocurrido un error';
  }
};

// Función para convertir datos a formato Firestore
const toFirestoreFormat = (data) => {
  const firestoreData = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (typeof value === 'string') {
      firestoreData[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      firestoreData[key] = { integerValue: value.toString() };
    } else if (value instanceof Date) {
      firestoreData[key] = { timestampValue: value.toISOString() };
    } else if (value === null) {
      firestoreData[key] = { nullValue: null };
    }
  });
  
  return { fields: firestoreData };
};

// Función para convertir datos desde formato Firestore
const fromFirestoreFormat = (firestoreDoc) => {
  const data = {};
  
  if (firestoreDoc.fields) {
    Object.keys(firestoreDoc.fields).forEach(key => {
      const field = firestoreDoc.fields[key];
      
      if (field.stringValue !== undefined) {
        data[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        data[key] = parseInt(field.integerValue);
      } else if (field.timestampValue !== undefined) {
        data[key] = new Date(field.timestampValue);
      } else if (field.nullValue !== undefined) {
        data[key] = null;
      }
    });
  }
  
  return data;
};

// Función para obtener token de autenticación
const getAuthToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return null;
};

// Registrar nuevo usuario usando Fetch API
export const registerUser = async (userData) => {
  try {
    // Validar datos según los campos REALES que usan las pantallas
    const requiredFields = ['name', 'email', 'password', 'university_title', 'graduation_year'];
    const missingFields = requiredFields.filter(field => !userData[field] || !userData[field].toString().trim());
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
      };
    }

    console.log('Registering user with Fetch API:', {
      name: userData.name,
      email: userData.email,
      university_title: userData.university_title,
      graduation_year: userData.graduation_year
    });

    // Preparar datos para Firestore ANTES de crear el usuario
    const userDocData = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      university_title: userData.university_title.trim(),
      graduation_year: parseInt(userData.graduation_year),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email.trim().toLowerCase(), 
      userData.password
    );
    const user = userCredential.user;
    
    console.log('User created in Auth, now saving to Firestore...');

    // Obtener token de autenticación
    const token = await getAuthToken();
    
    // Guardar datos en Firestore usando Fetch API - INMEDIATAMENTE después del Auth
    const response = await fetch(`${FIRESTORE_BASE_URL}/users/${user.uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(toFirestoreFormat(userDocData))
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firestore save failed:', errorData);
      
      // Si falla guardar en Firestore, eliminar el usuario de Auth
      await user.delete();
      throw new Error(`Error de Firestore: ${errorData.error?.message || 'Error desconocido'}`);
    }

    console.log('User registered successfully using Fetch API');
    
    // Pequeño delay para asegurar que Firestore esté sincronizado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // CERRAR SESIÓN AUTOMÁTICAMENTE DESPUÉS DEL REGISTRO
    try {
      await signOut(auth);
      console.log('User logged out after registration');
    } catch (logoutError) {
      console.log('Logout after registration failed, but continuing...');
    }
    
    return { success: true, user, userData: userDocData };
  } catch (error) {
    console.error('Error en registerUser con Fetch API:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Iniciar sesión (solo Firebase Auth, sin cambios)
export const loginUser = async (email, password) => {
  try {
    // Validar parámetros
    if (!email || !password) {
      return { success: false, error: 'Correo electrónico y contraseña son requeridos' };
    }

    console.log('Login user with Firebase Auth');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email.trim().toLowerCase(), 
      password
    );
    
    console.log('User logged in successfully');
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error en loginUser:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Cerrar sesión (solo Firebase Auth, sin cambios)
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('Error en logoutUser:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Obtener datos del usuario usando Fetch API
export const getUserData = async (uid) => {
  try {
    if (!uid) {
      return { success: false, error: 'UID de usuario requerido' };
    }

    console.log('Getting user data with Fetch API for UID:', uid);
    
    // Obtener token de autenticación
    const token = await getAuthToken();
    
    // Hacer petición a Firestore usando Fetch API
    const response = await fetch(`${FIRESTORE_BASE_URL}/users/${uid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Usuario no encontrado en la base de datos' };
      }
      const errorData = await response.json();
      throw new Error(`Error de Firestore: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const firestoreDoc = await response.json();
    const userData = fromFirestoreFormat(firestoreDoc);
    
    console.log('User data retrieved with Fetch API:', {
      name: userData.name,
      email: userData.email,
      university_title: userData.university_title,
      graduation_year: userData.graduation_year
    });
    
    // Asegurar que todos los campos requeridos existan
    const completeUserData = {
      name: userData.name || '',
      email: userData.email || '',
      university_title: userData.university_title || '',
      graduation_year: userData.graduation_year || '',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    return { success: true, data: completeUserData };
  } catch (error) {
    console.error('Error en getUserData con Fetch API:', error);
    return { success: false, error: error.message || 'Error al obtener datos del usuario' };
  }
};

// Actualizar datos del usuario usando Fetch API
export const updateUserData = async (uid, userData) => {
  try {
    if (!uid) {
      return { success: false, error: 'UID de usuario requerido' };
    }

    if (!userData || Object.keys(userData).length === 0) {
      return { success: false, error: 'Datos para actualizar requeridos' };
    }

    console.log('Updating user data with Fetch API for UID:', uid, 'with data:', userData);

    // Preparar datos para actualización
    const updateData = {
      updatedAt: new Date()
    };

    // Validar y limpiar datos según los campos REALES
    if (userData.name !== undefined) {
      if (!userData.name || typeof userData.name !== 'string') {
        return { success: false, error: 'Nombre debe ser un texto válido' };
      }
      updateData.name = userData.name.toString().trim();
    }

    if (userData.email !== undefined) {
      if (!userData.email || typeof userData.email !== 'string') {
        return { success: false, error: 'Email debe ser un texto válido' };
      }
      updateData.email = userData.email.toString().trim().toLowerCase();
    }

    if (userData.university_title !== undefined) {
      if (!userData.university_title || typeof userData.university_title !== 'string') {
        return { success: false, error: 'Título universitario debe ser un texto válido' };
      }
      updateData.university_title = userData.university_title.toString().trim();
    }

    if (userData.graduation_year !== undefined) {
      const year = parseInt(userData.graduation_year);
      if (isNaN(year)) {
        return { success: false, error: 'Año de graduación debe ser un número válido' };
      }
      updateData.graduation_year = year;
    }

    // Obtener token de autenticación
    const token = await getAuthToken();
    
    // Actualizar en Firestore usando Fetch API
    const response = await fetch(`${FIRESTORE_BASE_URL}/users/${uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(toFirestoreFormat(updateData))
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Firestore: ${errorData.error?.message || 'Error desconocido'}`);
    }

    console.log('User data updated successfully with Fetch API');
    return { success: true };
  } catch (error) {
    console.error('Error en updateUserData con Fetch API:', error);
    return { success: false, error: error.message || 'Error al actualizar datos del usuario' };
  }
};