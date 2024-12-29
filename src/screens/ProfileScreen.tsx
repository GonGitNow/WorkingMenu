import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import { colors } from '../constants/colors';
import type { User } from '../services/authService';

export const ProfileScreen = () => {
    const [user, setUser] = useState<User | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setFirstName(currentUser.firstName);
                setLastName(currentUser.lastName);
                setEmail(currentUser.email);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !email) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setSaving(true);
            const updatedUser = await authService.updateProfile({
                firstName,
                lastName,
                email,
            });
            setUser(updatedUser);
            Alert.alert('Success', 'Profile updated successfully');

            if (email !== user?.email) {
                Alert.alert(
                    'Email Verification Required',
                    'Please check your new email address for verification instructions'
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to logout');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Profile</Text>

                {!user?.isVerified && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            Please verify your email address to access all features
                        </Text>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!saving}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!saving}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!saving}
                />

                <TouchableOpacity
                    style={[styles.button, saving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.logoutButton, saving && styles.buttonDisabled]}
                    onPress={handleLogout}
                    disabled={saving}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    warningBox: {
        backgroundColor: colors.warning,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    warningText: {
        color: colors.white,
        textAlign: 'center',
        fontSize: 14,
    },
    input: {
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: colors.error,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 