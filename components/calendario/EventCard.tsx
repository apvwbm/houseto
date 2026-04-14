import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Calendar, Pencil, Trash2 } from 'lucide-react-native';
import { Evento } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing, radius } from '@/lib/theme';

interface EventCardProps {
  evento: Evento;
  onEdit: () => void;
  onDelete: () => void;
}

function formatTime(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

function formatDateShort(date: string) {
  const [, m, d] = date.split('-');
  return `${parseInt(d)}/${parseInt(m)}`;
}

export function EventCard({ evento, onEdit, onDelete }: EventCardProps) {
  const { usuarioColors } = useLookups();
  const accentColor = usuarioColors[evento.quien] || colors.textSecondary;
  const isMultiDay = evento.fecha_inicio !== evento.fecha_fin;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.nombre}>{evento.nombre}</Text>
          <View style={[styles.quienBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.quienText, { color: accentColor }]}>{evento.quien}</Text>
          </View>
        </View>

        {evento.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>
            {evento.descripcion}
          </Text>
        ) : null}

        {isMultiDay && (
          <View style={styles.timeRow}>
            <Calendar size={13} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.timeText}>
              {formatDateShort(evento.fecha_inicio)} — {formatDateShort(evento.fecha_fin)}
            </Text>
          </View>
        )}

        {(evento.hora_inicio || evento.hora_fin) && (
          <View style={styles.timeRow}>
            <Clock size={13} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.timeText}>
              {formatTime(evento.hora_inicio)}
              {evento.hora_fin ? ` - ${formatTime(evento.hora_fin)}` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn} activeOpacity={0.7}>
          <Pencil size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn} activeOpacity={0.7}>
          <Trash2 size={16} color={colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  nombre: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  quienBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  quienText: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.xs,
  },
  descripcion: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
});
