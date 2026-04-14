import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Evento, Quien, MESES } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing, radius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface EventModalProps {
  visible: boolean;
  evento: Evento | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (data: Omit<Evento, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const emptyForm = {
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  hora_inicio: '',
  hora_fin: '',
  quien: 'Aitor' as Quien,
};

type PickerTarget = 'fecha_inicio' | 'fecha_fin' | 'hora_inicio' | 'hora_fin';

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseTimeStr(s: string): Date {
  const [h, min] = s.split(':').map(Number);
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateDisplay(s: string): string {
  if (!s) return 'Seleccionar';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MESES[m - 1]?.slice(0, 3)} ${y}`;
}

function formatTimeDisplay(s: string): string {
  if (!s) return 'Seleccionar';
  return s;
}

export function EventModal({
  visible,
  evento,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const { usuarios, usuarioColors } = useLookups();
  const quienOptions = useMemo(() => usuarios.map((u) => u.nombre), [usuarios]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  useEffect(() => {
    if (visible) {
      if (evento) {
        setForm({
          nombre: evento.nombre,
          descripcion: evento.descripcion || '',
          fecha_inicio: evento.fecha_inicio,
          fecha_fin: evento.fecha_fin,
          hora_inicio: evento.hora_inicio?.slice(0, 5) || '',
          hora_fin: evento.hora_fin?.slice(0, 5) || '',
          quien: evento.quien,
        });
      } else {
        setForm({
          ...emptyForm,
          fecha_inicio: defaultDate,
          fecha_fin: defaultDate,
          quien: quienOptions[0] || 'Aitor',
        });
      }
      setError('');
      setPickerTarget(null);
    }
  }, [visible, evento, defaultDate, quienOptions]);

  function getPickerValue(): Date {
    if (!pickerTarget) return new Date();
    if (pickerTarget === 'fecha_inicio') {
      return form.fecha_inicio ? parseDateStr(form.fecha_inicio) : new Date();
    }
    if (pickerTarget === 'fecha_fin') {
      return form.fecha_fin ? parseDateStr(form.fecha_fin) : new Date();
    }
    if (pickerTarget === 'hora_inicio') {
      return form.hora_inicio ? parseTimeStr(form.hora_inicio) : new Date();
    }
    if (pickerTarget === 'hora_fin') {
      return form.hora_fin ? parseTimeStr(form.hora_fin) : new Date();
    }
    return new Date();
  }

  function handlePickerChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (_event.type === 'dismissed') {
      setPickerTarget(null);
      return;
    }
    if (!selectedDate || !pickerTarget) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === 'fecha_inicio') {
      const dateStr = formatDateStr(selectedDate);
      setForm((f) => {
        const updated = { ...f, fecha_inicio: dateStr };
        if (!f.fecha_fin || f.fecha_fin < dateStr) {
          updated.fecha_fin = dateStr;
        }
        return updated;
      });
    } else if (pickerTarget === 'fecha_fin') {
      setForm((f) => ({ ...f, fecha_fin: formatDateStr(selectedDate) }));
    } else if (pickerTarget === 'hora_inicio') {
      setForm((f) => ({ ...f, hora_inicio: formatTimeStr(selectedDate) }));
    } else if (pickerTarget === 'hora_fin') {
      setForm((f) => ({ ...f, hora_fin: formatTimeStr(selectedDate) }));
    }

    setPickerTarget(null);
  }

  async function handleSave() {
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!form.fecha_inicio) {
      setError('La fecha de inicio es obligatoria');
      return;
    }
    if (!form.fecha_fin) {
      setError('La fecha de fin es obligatoria');
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setError('La fecha fin no puede ser anterior a la fecha inicio');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        quien: form.quien,
      });
      onClose();
    } catch {
      setError('Error al guardar. Comprueba la conexión.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    Alert.alert('Borrar evento', '¿Seguro que quieres borrar este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await onDelete();
            onClose();
          } catch {
            setError('Error al borrar.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const isDatePicker = pickerTarget === 'fecha_inicio' || pickerTarget === 'fecha_fin';
  const isTimePicker = pickerTarget === 'hora_inicio' || pickerTarget === 'hora_fin';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {evento ? 'Editar evento' : 'Nuevo evento'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder="Nombre del evento"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.descripcion}
                onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fecha inicio *</Text>
                <TouchableOpacity
                  style={styles.pickerField}
                  onPress={() => setPickerTarget('fecha_inicio')}
                  activeOpacity={0.7}
                >
                  <Calendar size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.pickerFieldText}>
                    {formatDateDisplay(form.fecha_inicio)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: spacing.sm }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fecha fin *</Text>
                <TouchableOpacity
                  style={styles.pickerField}
                  onPress={() => setPickerTarget('fecha_fin')}
                  activeOpacity={0.7}
                >
                  <Calendar size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.pickerFieldText}>
                    {formatDateDisplay(form.fecha_fin)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Hora inicio</Text>
                <TouchableOpacity
                  style={styles.pickerField}
                  onPress={() => setPickerTarget('hora_inicio')}
                  activeOpacity={0.7}
                >
                  <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.pickerFieldText}>
                    {formatTimeDisplay(form.hora_inicio)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: spacing.sm }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Hora fin</Text>
                <TouchableOpacity
                  style={styles.pickerField}
                  onPress={() => setPickerTarget('hora_fin')}
                  activeOpacity={0.7}
                >
                  <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.pickerFieldText}>
                    {formatTimeDisplay(form.hora_fin)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {(form.hora_inicio || form.hora_fin) && (
              <TouchableOpacity
                style={styles.clearTimeBtn}
                onPress={() => setForm((f) => ({ ...f, hora_inicio: '', hora_fin: '' }))}
                activeOpacity={0.7}
              >
                <Text style={styles.clearTimeText}>Borrar horas</Text>
              </TouchableOpacity>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quién</Text>
              <View style={styles.quienRow}>
                {quienOptions.map((q) => {
                  const selected = form.quien === q;
                  const ac = usuarioColors[q] || colors.textSecondary;
                  return (
                    <TouchableOpacity
                      key={q}
                      style={[
                        styles.quienBtn,
                        selected && { backgroundColor: ac, borderColor: ac },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, quien: q }))}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.quienBtnText,
                          selected ? { color: '#fff' } : { color: ac },
                        ]}
                      >
                        {q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              {evento && onDelete ? (
                <Button
                  title="Borrar"
                  onPress={handleDelete}
                  variant="danger"
                  loading={deleting}
                  style={{ flex: 1 }}
                />
              ) : (
                <Button
                  title="Cancelar"
                  onPress={onClose}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title={evento ? 'Guardar' : 'Crear'}
                onPress={handleSave}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {(isDatePicker || isTimePicker) && (
        <DateTimePicker
          value={getPickerValue()}
          mode={isDatePicker ? 'date' : 'time'}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    height: 80,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pickerFieldText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  clearTimeBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  clearTimeText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.xs,
    color: colors.error,
  },
  quienRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quienBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  quienBtnText: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.sm,
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
