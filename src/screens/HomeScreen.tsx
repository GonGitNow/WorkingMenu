import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authService } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import type { User } from '../services/authService';

export const HomeScreen = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            if (currentUser && !currentUser.isVerified) {
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email to access all features'
                );
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Menu App</Text>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile' as never)}
                >
                    <Text style={styles.profileButtonText}>
                        {user?.firstName || 'Profile'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, !user?.isVerified && styles.buttonDisabled]}
                    disabled={!user?.isVerified}
                >
                    <Text style={styles.buttonText}>Process Invoice</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, !user?.isVerified && styles.buttonDisabled]}
                    disabled={!user?.isVerified}
                >
                    <Text style={styles.buttonText}>View Inventory</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, !user?.isVerified && styles.buttonDisabled]}
                    disabled={!user?.isVerified}
                >
                    <Text style={styles.buttonText}>Manage Recipes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, !user?.isVerified && styles.buttonDisabled]}
                    disabled={!user?.isVerified}
                >
                    <Text style={styles.buttonText}>Menu Items</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
    },
    profileButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    profileButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: colors.error,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logoutButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
}); 