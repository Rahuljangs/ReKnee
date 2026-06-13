import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppColors } from '@/src/utils/useAppColorScheme';
import Colors from '@/constants/Colors';
import { sendMessage, loadMessageHistory } from '@/src/services/ChatService';
import { getDailyMotivation } from '@/src/utils/motivationalQuotes';
import { PHASE_NAMES } from '@/src/config/constants';
import TypingIndicator from '@/src/components/TypingIndicator';
import type { ChatMessage } from '@/src/types';

export default function ChatScreen() {
  const { profile } = useAuth();
  const colors = useAppColors();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const motivation = profile ? getDailyMotivation(profile.currentPhase) : null;
  const weeksPostOp = profile
    ? ((Date.now() - profile.surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)).toFixed(1)
    : '0';

  useEffect(() => {
    if (!profile) return;
    loadMessageHistory(profile.uid).then((history) => {
      if (history.length === 0) {
        const firstName = profile.displayName?.split(' ')[0] || 'there';
        const welcomeMsg: ChatMessage = {
          id: 'welcome_msg',
          role: 'assistant',
          content: `Hey ${firstName}! Welcome to ReKnee. I'm here with you every step of your ACL recovery.\n\nRight now you're in Phase ${profile.currentPhase} — ${PHASE_NAMES[profile.currentPhase]}. I'll help you stay on track with your exercises, answer questions about your recovery, and check in on how you're feeling.\n\nTell me — how's your knee right now?`,
          createdAt: new Date(),
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(history);
      }
      setLoadingHistory(false);
    });
  }, [profile]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending || !profile) return;

    const userText = inputText.trim();
    setInputText('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await sendMessage(userText, profile);

      if (response.dvtAlert.severity === 'critical') {
        const systemMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          role: 'system',
          content: response.message,
          dvtFlag: true,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, systemMsg]);
        router.push('/dvt-emergency');
        return;
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [inputText, sending, profile, router]);

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === 'user';
    const isDVT = item.dvtFlag;

    return (
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.userBubble }]
            : isDVT
              ? [styles.systemBubble, { backgroundColor: Colors.brand.danger }]
              : [styles.aiBubble, { backgroundColor: colors.aiBubble }],
        ]}
      >
        {!isUser && !isDVT && (
          <Text style={[styles.senderLabel, { color: Colors.brand.primary }]}>
            ReKnee
          </Text>
        )}
        {isDVT && (
          <Text style={[styles.senderLabel, { color: '#FFFFFF' }]}>
            MEDICAL ALERT
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            {
              color: isUser
                ? colors.userBubbleText
                : isDVT
                  ? '#FFFFFF'
                  : colors.aiBubbleText,
            },
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            {
              color: isUser ? 'rgba(255,255,255,0.6)' : colors.textSecondary,
            },
          ]}
        >
          {item.createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  }

  if (loadingHistory) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your conversation...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Phase context header */}
      {profile && (
        <View style={[styles.phaseHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.phaseHeaderLeft}>
            <View style={[styles.phaseDot, { backgroundColor: Colors.brand.primary }]} />
            <Text style={[styles.phaseHeaderText, { color: colors.text }]}>
              Phase {profile.currentPhase}
            </Text>
            <Text style={[styles.phaseHeaderSep, { color: colors.textSecondary }]}>·</Text>
            <Text style={[styles.phaseHeaderText, { color: colors.textSecondary }]}>
              Week {weeksPostOp}
            </Text>
          </View>
          <Text style={[styles.phaseHeaderPhase, { color: colors.textSecondary }]} numberOfLines={1}>
            {PHASE_NAMES[profile.currentPhase]}
          </Text>
        </View>
      )}

      {/* Daily motivation banner */}
      {motivation && messages.length <= 2 && (
        <View style={[styles.motivationBanner, { backgroundColor: Colors.brand.accentLight }]}>
          <Text style={[styles.motivationQuote, { color: Colors.brand.accent }]}>
            "{motivation.quote}"
          </Text>
          <Text style={[styles.motivationTip, { color: Colors.brand.accent }]}>
            💡 {motivation.tip}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.emptyList,
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListFooterComponent={sending ? <TypingIndicator /> : null}
      />

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
            },
          ]}
          placeholder="How's your knee today?"
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={!sending}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: inputText.trim()
                ? Colors.brand.primary
                : colors.inputBackground,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.sendIcon,
                { color: inputText.trim() ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              ↑
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 15 },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phaseHeaderSep: {
    fontSize: 14,
  },
  phaseHeaderPhase: {
    fontSize: 13,
    maxWidth: '50%',
  },
  motivationBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
  },
  motivationQuote: {
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  motivationTip: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
    opacity: 0.8,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    alignSelf: 'center',
    maxWidth: '95%',
    borderRadius: 12,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '800',
  },
});
