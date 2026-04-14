import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Receta } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing, radius } from '@/lib/theme';

export default function RecetasScreen() {
  const router = useRouter();
  const { categoriasRecetas } = useLookups();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);

  const fetchRecetas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data) setRecetas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecetas();
  }, [fetchRecetas]);

  useEffect(() => {
    const channel = supabase
      .channel('recetas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recetas' }, () => {
        fetchRecetas();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecetas]);

  const filteredRecetas = selectedCategorias.length === 0
    ? recetas
    : recetas.filter((r) =>
        r.categorias.some((c) => selectedCategorias.includes(c))
      );

  const toggleCategoria = (cat: string) => {
    setSelectedCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const renderReceta = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      style={styles.recetaCard}
      onPress={() => router.push(`/recetas/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.recetaHeader}>
        <Text style={styles.recetaNombre} numberOfLines={2}>
          {item.nombre}
        </Text>
        {item.foto && <Image source={{ uri: item.foto }} style={styles.fotoThumb} />}
      </View>
      <View style={styles.recetaMeta}>
        <Text style={styles.metaText}>{item.numero_personas} personas</Text>
        {item.video_valor && <Text style={styles.metaText}>● Video</Text>}
      </View>
      {item.categorias.length > 0 && (
        <View style={styles.categoriasRow}>
          {item.categorias.slice(0, 2).map((cat, idx) => (
            <Text key={idx} style={styles.categoriaTag}>
              {cat}
            </Text>
          ))}
          {item.categorias.length > 2 && (
            <Text style={styles.categoriaTag}>+{item.categorias.length - 2}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Recetas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/recetas/nueva')}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categoriasRecetas.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterBtn,
              selectedCategorias.includes(cat) && styles.filterBtnActive,
            ]}
            onPress={() => toggleCategoria(cat)}
            activeOpacity={0.8}
          >
            {selectedCategorias.includes(cat) && (
              <Check size={14} color="#fff" strokeWidth={3} style={{ marginRight: 4 }} />
            )}
            <Text
              style={[
                styles.filterText,
                selectedCategorias.includes(cat) && styles.filterTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} size="large" />
      ) : filteredRecetas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {selectedCategorias.length > 0 ? 'Sin recetas en esta categoría' : 'Sin recetas'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/recetas/nueva')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyLink}>+ Añadir receta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRecetas}
          renderItem={renderReceta}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  filterScroll: {
    flexGrow: 0,
    maxHeight: 36,
    paddingLeft: spacing.xl,
  },
  filterContent: {
    paddingRight: spacing.xl,
    paddingVertical: 2,
    gap: 6,
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  recetaCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  recetaNombre: {
    flex: 1,
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  fotoThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  recetaMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  categoriasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoriaTag: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
