import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Evento, MESES } from '@/lib/types';
import { colors, fontSize, spacing } from '@/lib/theme';
import { MonthCalendar } from '@/components/calendario/MonthCalendar';
import { EventCard } from '@/components/calendario/EventCard';
import { EventModal } from '@/components/calendario/EventModal';

export default function CalendarioScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0);
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .lte('fecha_inicio', lastDayStr)
      .gte('fecha_fin', firstDay)
      .order('hora_inicio', { ascending: true });

    if (!error && data) setEventos(data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  useEffect(() => {
    const channel = supabase
      .channel('eventos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
        fetchEventos();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEventos]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const selectedEvents = eventos.filter(
    (e) => selectedDate >= e.fecha_inicio && selectedDate <= e.fecha_fin
  );

  async function handleSave(data: Omit<Evento, 'id' | 'created_at' | 'updated_at'>) {
    if (editingEvento) {
      await supabase.from('eventos').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingEvento.id);
    } else {
      await supabase.from('eventos').insert(data);
    }
    await fetchEventos();
  }

  async function handleDelete() {
    if (!editingEvento) return;
    await supabase.from('eventos').delete().eq('id', editingEvento.id);
    await fetchEventos();
  }

  function openNew() {
    setEditingEvento(null);
    setModalVisible(true);
  }

  function openEdit(ev: Evento) {
    setEditingEvento(ev);
    setModalVisible(true);
  }

  function handleDeleteCard(ev: Evento) {
    Alert.alert('Borrar evento', `¿Borrar "${ev.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('eventos').delete().eq('id', ev.id);
          await fetchEventos();
        },
      },
    ]);
  }

  function formatSelectedDate() {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Calendario</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNew} activeOpacity={0.8}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <MonthCalendar
          year={year}
          month={month}
          eventos={eventos}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{formatSelectedDate()}</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : selectedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Sin eventos para este día</Text>
              <TouchableOpacity onPress={openNew} activeOpacity={0.8}>
                <Text style={styles.emptyLink}>+ Añadir evento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedEvents.map((ev) => (
              <EventCard
                key={ev.id}
                evento={ev}
                onEdit={() => openEdit(ev)}
                onDelete={() => handleDeleteCard(ev)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <EventModal
        visible={modalVisible}
        evento={editingEvento}
        defaultDate={selectedDate}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={editingEvento ? handleDelete : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  emptyLink: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
