import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Evento, MESES, DIAS_SEMANA_CORTO } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing } from '@/lib/theme';

interface MonthCalendarProps {
  year: number;
  month: number;
  eventos: Evento[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthCalendar({
  year,
  month,
  eventos,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const { usuarioColors } = useLookups();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startWeekday = firstDay.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

  const eventsByDate: Record<string, Evento[]> = {};
  eventos.forEach((ev) => {
    // For multi-day events, add a dot for each day in the range
    const start = ev.fecha_inicio;
    const end = ev.fecha_fin;
    let current = start;
    while (current <= end) {
      if (!eventsByDate[current]) eventsByDate[current] = [];
      eventsByDate[current].push(ev);
      // Increment day
      const d = new Date(current + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      current = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function formatDate(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  while (rows[rows.length - 1]?.length < 7) {
    rows[rows.length - 1].push(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MESES[month]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronRight size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {DIAS_SEMANA_CORTO.map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={styles.dayCell} />;
            const dateStr = formatDate(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayEvents = eventsByDate[dateStr] || [];

            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => onSelectDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.dot,
                          { backgroundColor: usuarioColors[ev.quien] || colors.textSecondary },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  monthTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.lg,
    color: colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 40,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: colors.primaryLight,
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.text,
  },
  todayText: {
    color: colors.primary,
    fontFamily: 'Nunito-Bold',
  },
  selectedText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
  },
  dotRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
