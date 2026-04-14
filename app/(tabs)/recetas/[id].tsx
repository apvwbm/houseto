import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Receta } from '@/lib/types';
import { colors, fontSize, spacing, radius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

export default function RecetaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [receta, setReceta] = useState<Receta | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('recetas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) setReceta(data);
      setLoading(false);
    }
    fetch();
  }, [id]);

  async function handleDelete() {
    Alert.alert(
      'Borrar receta',
      '¿Seguro que quieres borrar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await supabase.from('recetas').delete().eq('id', id);
            router.back();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!receta) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Text style={styles.errorText}>Receta no encontrada</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {receta.foto && (
            <Image source={{ uri: receta.foto }} style={styles.fotoImage} resizeMode="cover" />
          )}
          <Text style={styles.nombre}>{receta.nombre}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Personas:</Text>
            <Text style={styles.value}>{receta.numero_personas}</Text>
          </View>

          {receta.categorias.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={styles.label}>Categorías:</Text>
              <View style={styles.categoriesRow}>
                {receta.categorias.map((cat, idx) => (
                  <View key={idx} style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {receta.descripcion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descripcion}>{receta.descripcion}</Text>
          </View>
        )}

        {receta.video_valor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video</Text>
            <TouchableOpacity
              style={styles.videoBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (receta.video_valor) {
                  Linking.openURL(receta.video_valor).catch(() => {
                    Alert.alert('Error', 'No se pudo abrir el video');
                  });
                }
              }}
            >
              <Text style={styles.videoBtnText}>
                {receta.video_tipo === 'url' ? 'Ver video' : 'Abrir video'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Editar"
            onPress={() => router.push(`/recetas/nueva?id=${id}`)}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <Button
            title="Borrar"
            onPress={handleDelete}
            variant="danger"
            loading={deleting}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  fotoImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  nombre: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoriesSection: {
    marginTop: spacing.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  categoryText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  descripcion: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  videoBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  videoBtnText: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
