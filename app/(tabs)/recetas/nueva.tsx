import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Check, Camera, Film } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { uploadRecetaFoto, uploadRecetaVideo, isRemoteUrl } from '@/lib/storage';
import { Receta } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing, radius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

const emptyForm = {
  nombre: '',
  descripcion: '',
  categorias: [] as string[],
  numero_personas: '3',
  video_tipo: null as 'url' | 'file' | null,
  video_valor: '',
  foto: '',
};

export default function NuevaRecetaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { categoriasRecetas } = useLookups();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      async function fetch() {
        setLoading(true);
        const { data } = await supabase
          .from('recetas')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (data) {
          setForm({
            nombre: data.nombre,
            descripcion: data.descripcion,
            categorias: data.categorias,
            numero_personas: String(data.numero_personas),
            video_tipo: data.video_tipo,
            video_valor: data.video_valor || '',
            foto: data.foto || '',
          });
        }
        setLoading(false);
      }
      fetch();
    }
  }, [id]);

  async function handleSave() {
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    const personas = parseInt(form.numero_personas) || 0;
    if (personas <= 0) {
      setError('Número de personas debe ser mayor a 0');
      return;
    }

    setSaving(true);
    try {
      // Si hay foto local, subirla a Supabase Storage
      let fotoUrl: string | null = form.foto?.trim() || null;
      if (fotoUrl && !isRemoteUrl(fotoUrl)) {
        const uploaded = await uploadRecetaFoto(fotoUrl);
        if (!uploaded) {
          setError('Error al subir la foto. Inténtalo de nuevo.');
          setSaving(false);
          return;
        }
        fotoUrl = uploaded;
      }

      // Si hay video local (tipo file), subirlo a Supabase Storage
      let videoValor: string | null = form.video_valor?.trim() || null;
      let videoTipo = form.video_tipo;
      if (videoValor && videoTipo === 'file' && !isRemoteUrl(videoValor)) {
        const uploaded = await uploadRecetaVideo(videoValor);
        if (!uploaded) {
          setError('Error al subir el video. Inténtalo de nuevo.');
          setSaving(false);
          return;
        }
        videoValor = uploaded;
        // Una vez subido, el valor es una URL pública
        videoTipo = 'url';
      }

      const data: Partial<Receta> = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        categorias: form.categorias,
        numero_personas: personas,
        video_tipo: videoTipo,
        video_valor: videoValor,
        foto: fotoUrl,
      };

      if (id) {
        await supabase
          .from('recetas')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id);
      } else {
        await supabase.from('recetas').insert(data);
      }
      router.back();
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const toggleCategoria = (cat: string) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.includes(cat)
        ? f.categorias.filter((c) => c !== cat)
        : [...f.categorias, cat],
    }));
  };

  if (loading) {
    return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{id ? 'Editar receta' : 'Nueva receta'}</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder="Nombre de la receta"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Número de personas</Text>
              <TextInput
                style={styles.input}
                value={form.numero_personas}
                onChangeText={(v) => setForm((f) => ({ ...f, numero_personas: v }))}
                placeholder="3"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categorías</Text>
              <View style={styles.categoriasGrid}>
                {categoriasRecetas.map((cat) => {
                  const selected = form.categorias.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoriaBtn,
                        selected && styles.categoriaBtnActive,
                      ]}
                      onPress={() => toggleCategoria(cat)}
                      activeOpacity={0.8}
                    >
                      {selected && (
                        <Check size={14} color="#fff" strokeWidth={3} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.categoriaBtnText,
                          selected && styles.categoriaBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.descripcion}
                onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                placeholder="Ingredientes e instrucciones"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Foto</Text>
              {form.foto ? (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: form.foto }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.mediaRemoveBtn}
                    onPress={() => setForm((f) => ({ ...f, foto: '' }))}
                    activeOpacity={0.7}
                  >
                    <X size={16} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setForm((f) => ({ ...f, foto: result.assets[0].uri }));
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Camera size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.pickerBtnText}>Elegir foto</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Video</Text>
              {form.video_valor ? (
                <View style={styles.mediaPreview}>
                  <View style={styles.videoPlaceholder}>
                    <Film size={24} color={colors.textMuted} strokeWidth={2} />
                    <Text style={styles.videoFileName} numberOfLines={1}>
                      {form.video_tipo === 'url'
                        ? form.video_valor
                        : 'Video seleccionado'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mediaRemoveBtn}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        video_tipo: null,
                        video_valor: '',
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <X size={16} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : form.video_tipo === 'url' ? (
                /* Modo URL: mostrar input de texto */
                <View style={styles.videoUrlRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={form.video_valor}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, video_valor: v }))
                    }
                    placeholder="https://youtube.com/..."
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity
                    style={styles.videoUrlCancel}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        video_tipo: null,
                        video_valor: '',
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <X size={18} color={colors.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1 }]}
                    onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['videos'],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setForm((f) => ({
                          ...f,
                          video_tipo: 'file',
                          video_valor: result.assets[0].uri,
                        }));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Film size={20} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.pickerBtnText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1 }]}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        video_tipo: 'url',
                        video_valor: '',
                      }))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerBtnText}>Pegar URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <Button
            title={id ? 'Guardar' : 'Crear'}
            onPress={handleSave}
            loading={saving}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  form: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: 40,
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
    backgroundColor: colors.surface,
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
    height: 100,
    paddingTop: spacing.md,
  },
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoriaBtn: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  categoriaBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoriaBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.xs,
    color: colors.text,
  },
  categoriaBtnTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  pickerBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  videoUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  videoUrlCancel: {
    padding: spacing.sm,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  mediaRemoveBtn: {
    padding: spacing.sm,
    marginLeft: 'auto',
  },
  videoPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  videoFileName: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
