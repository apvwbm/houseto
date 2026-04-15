import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Check, Search, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Receta } from '@/lib/types';
import { useLookups } from '@/hooks/useLookups';
import { colors, fontSize, spacing, radius } from '@/lib/theme';

const PAGE_SIZE = 20;

export default function RecetasScreen() {
  const router = useRouter();
  const { categoriasRecetas } = useLookups();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');

  // Ref para saber el offset actual de la paginación
  const offsetRef = useRef(0);

  const fetchRecetas = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    const from = reset ? 0 : offsetRef.current;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .order('nombre', { ascending: true })
      .range(from, to);

    if (!error && data) {
      if (reset) {
        setRecetas(data);
      } else {
        setRecetas((prev) => {
          // Evitar duplicados por si Realtime disparó un refetch intermedio
          const existingIds = new Set(prev.map((r) => r.id));
          const newItems = data.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
      offsetRef.current = from + data.length;
      setHasMore(data.length === PAGE_SIZE);
    }

    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchRecetas(true);
  }, [fetchRecetas]);

  useEffect(() => {
    const channel = supabase
      .channel('recetas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recetas' }, () => {
        fetchRecetas(true);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecetas]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !busqueda.trim() && selectedCategorias.length === 0) {
      fetchRecetas(false);
    }
  }, [loadingMore, hasMore, busqueda, selectedCategorias, fetchRecetas]);

  const filteredRecetas = useMemo(() => {
    let resultado = recetas;

    if (selectedCategorias.length > 0) {
      resultado = resultado.filter((r) =>
        r.categorias.some((c) => selectedCategorias.includes(c))
      );
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q)
      );
    }

    return resultado;
  }, [recetas, selectedCategorias, busqueda]);

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

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar receta..."
          placeholderTextColor={colors.textMuted}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.7}>
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
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
            {busqueda.trim()
              ? `Sin resultados para "${busqueda}"`
              : selectedCategorias.length > 0
                ? 'Sin recetas en esta categoría'
                : 'Sin recetas'}
          </Text>
          {!busqueda.trim() && (
            <TouchableOpacity
              onPress={() => router.push('/recetas/nueva')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyLink}>+ Añadir receta</Text>
            </TouchableOpacity>
          )}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.lg }} />
            ) : null
          }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: 0,
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
    marginBottom: spacing.lg,
  },
  recetaCard: {
    flex: 1,
    maxWidth: '48%',
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
    lineHeight: fontSize.xs,
    maxHeight: fontSize.xs + 4,
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
