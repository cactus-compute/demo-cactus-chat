import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useChatStore } from '../../store/chatStore';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;

function DrawerContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { chatSessions, loadSession, deleteSession, currentSessionId, clearCurrentSession } =
    useChatStore();

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId);
    router.push('/(drawer)');
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSession(sessionId),
      },
    ]);
  };

  const handleNewChat = () => {
    clearCurrentSession();
    router.push('/(drawer)');
  };

  const filteredSessions = chatSessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={80}
      style={styles.drawerContainer}
    >
      <View style={[styles.searchWrapper, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {chatSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No chats yet</Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No chats found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chatItem,
                currentSessionId === item.id && styles.chatItemActive,
              ]}
              onPress={() => handleLoadSession(item.id)}
              onLongPress={() => handleDeleteSession(item.id)}
            >
              <Text style={styles.chatTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={[
            styles.chatList,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        />
      )}
    </KeyboardAvoidingView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: colors.background,
          width: DRAWER_WIDTH,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          ...typography.headingSmall,
        },
        headerShadowVisible: true,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Cactus Chat',
          headerShown: true,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  newChatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    padding: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  chatList: {
    paddingTop: spacing.sm,
  },
  chatItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chatItemActive: {
    backgroundColor: colors.surface,
  },
  chatTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
});
