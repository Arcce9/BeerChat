import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

type Message = { id: string; sender_id: string; text: string; created_at: string };

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function ChatScreen({
  matchId,
  myId,
  theirName,
  venueName,
  matchCreatedAt,
  onClose,
}: {
  matchId: string;
  myId: string;
  theirName: string;
  venueName: string;
  matchCreatedAt?: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase
      .from('messages')
      .select('id, sender_id, text, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setMessages(data ?? []);
      });

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    setError('');
    const { error: err } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: myId, text: trimmed });
    if (err) setError(err.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={styles.initialSquare}>
            <Text style={styles.initialText}>{theirName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.theirName}>{theirName}</Text>
            <Text style={styles.subline}>
              {venueName} · disappears when either of you withdraws
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isOwn = item.sender_id === myId;
            return (
              <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowTheirs]}>
                <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleTheirs]}>
                  <Text style={isOwn ? styles.textOwn : styles.textTheirs}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            matchCreatedAt ? (
              <View style={styles.matchedPillWrap}>
                <View style={styles.matchedPill}>
                  <Text style={styles.matchedPillText}>
                    You matched at {formatTime(matchCreatedAt)}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 30,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backArrow: {
    color: colors.textSecondary,
    fontSize: 28,
    lineHeight: 32,
  },
  initialSquare: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  theirName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '74%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.elevated,
    borderBottomLeftRadius: 6,
  },
  textOwn: {
    color: colors.onAccent,
    fontSize: 15,
  },
  textTheirs: {
    color: colors.text,
    fontSize: 15,
  },
  matchedPillWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  matchedPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  matchedPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.onAccent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
